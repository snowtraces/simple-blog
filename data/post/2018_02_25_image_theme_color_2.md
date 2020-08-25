# 图像主题色提取简单实现（二）

```meta
date: 2018-02-25
title: 图像主题色提取简单实现（二）
title_en: image_theme_color_2
author: snowtraces
id: 00004
old_id: 66352
tags:
    - python
category: code
status: public
```

在文章[图像主题色提取简单实现](./)一文中，对颜色空间八等分，即r/g/b三个方向从128处切分，获取八个小的立方体，对每个立方体像素坐标值求平均数，得到八种颜色，效果还算理想，但限制也很明显。比如颜色数目固定，如果图片颜色单一，可能最后八个小立方体中出现没有值的情况。

## 解决方案

针对上一个实现，每次切分前对颜色空间进行排序，选择rank最前的进行切分，每次切分的位置也加入像素数量因素，其中：

```python
rank = pixelSum * (v)^vBalance
pixelSum ：像素数量，v：体积，vBalance：体积影响系数（非负）
```

很显然体积影响系数越大，提取出的颜色分布范围越大。切分点的位置与之类似，不再赘述。

## 代码实现

上次是js实现的，这次由于初学python，就用python来实现吧

```python
from PIL import Image
from queue import PriorityQueue
import re
import os
import urllib.request
import time
import copy


''' 提取图片主色调 '''


def colorExt(imageName, colorNum, vBalance, padding):
  # 读取图片，并对图片进行缩放
  match = re.match('^(.*)(/|\\\\)([^/\\\\]+)(\.[^./\\\\]+)$', imageName)
  path = match.group(1) + "/"
  name = match.group(3)
  suffix = match.group(4)
  image = Image.open(imageName)
  size = image.size
  sizeX = 1920
  sizeY = int(sizeX * size[1] / size[0])
  totalSize = sizeX * sizeY
  image.thumbnail((sizeX, sizeY))
  print((sizeX, sizeY))
  imageColors = image.getcolors(sizeX * sizeY)

  # 计算颜色范围
  rMax = imageColors[0][1][0]
  gMax = imageColors[0][1][1]
  bMax = imageColors[0][1][2]
  rMin = imageColors[0][1][0]
  gMin = imageColors[0][1][1]
  bMin = imageColors[0][1][2]
  for _, (r, g, b) in imageColors:
    if r > rMax:
      rMax = r
    elif r < rMin:
      rMin = r
    if g > gMax:
      gMax = g
    elif g < gMin:
      gMin = g
    if b > bMax:
      bMax = b
    elif b < bMin:
      bMin = b

  colorMin = [rMin, gMin, bMin]
  colorMax = [rMax, gMax, bMax]

  print(colorMin, colorMax)

  # colorRange ((rMin, rMax),(gMin, gMax), (bMin, bMax))颜色范围
  # pixelSum 像素总数
  # pixelSet 像素集合
  class ColorBox:
    def __init__(self, colorRange, pixelSum, pixelSet):
      self.colorRange = colorRange
      self.pixelSum = pixelSum
      self.pixelSet = pixelSet
      self.v = (colorRange[0][1] - colorRange[0][0]) * (colorRange[1][1] - colorRange[1][0]) * (colorRange[2][1] - colorRange[2][0]) >> 16
      self.rank = (-1) * pixelSum * (self.v)**vBalance
    def __lt__(self, other):
        return self.rank < other.rank

  def getCutSide(colorRange):  # 获取切割边:{r:0, g:1, b:2}
    vSize = [0] * 3
    for i in range(3):
      vSize[i] = colorRange[i][1] - colorRange[i][0]
    return vSize.index(max(vSize))

  def cutRange(colorRange, cutSide, cutValue):  # 将颜色范围一切为二
    ret0 = copy.deepcopy(colorRange)
    ret1 = copy.deepcopy(colorRange)
    ret0[cutSide][1] = cutValue
    ret1[cutSide][0] = cutValue
    return (ret0, ret1)

  def colorCut(colorBox):  # 颜色切分
    cutValue = 0
    colorRange = colorBox.colorRange
    cutSide = getCutSide(colorRange)  # 分割边
    pixelCount = 0  # 当前像素累加数
    sourceList = colorBox.pixelSet  # 像素集合
    pixelSum = colorBox.pixelSum
    cutPoint = 0  # 切分点
    sourceList.sort(key=lambda x: x[1][cutSide])
    for pixelPoint in sourceList:  # pixelPoint:(count, (r, g, b))
      pixelCount += pixelPoint[0]
      cutPoint += 1
      if pixelCount*((pixelPoint[1][cutSide] - colorRange[cutSide][0]))**vBalance > (pixelSum - pixelCount)*((colorRange[cutSide][1] - pixelPoint[1][cutSide]))**vBalance:  # 达到一半
        cutValue = pixelPoint[1][cutSide]
        break
    if cutPoint == len(sourceList): # 到最后一个才触发，丢掉最后一个元素
      newRange = cutRange(colorRange, cutSide, sourceList[cutPoint - 2][1][cutSide])
      box0 = ColorBox(newRange[0], pixelCount - sourceList[cutPoint - 1][0], sourceList[:(cutPoint-1)])
      return [box0]
    else:
      newRange = cutRange(colorRange, cutSide, cutValue)
      box0 = ColorBox(newRange[0], pixelCount, sourceList[0:cutPoint])
      box1 = ColorBox(newRange[1], colorBox.pixelSum -
                      pixelCount, sourceList[cutPoint:])
      return [box0, box1]

  def doCut(queue):  # 递归切分
    if queue.qsize() < colorNum:
      box = queue.get()[1]  # 获取rank第一的box
      c = colorCut(box)
      for vbox in c:
        # print("Rank:" + str(vbox.rank))
        queue.put((vbox.rank, vbox))
      return doCut(queue)
    else:
      return queue

  def sumColor(colorList):   # 颜色求和
    sumList = [0] * 4
    for count, (r, g, b) in colorList:
      sumList[0] += count
      sumList[1] += r * count
      sumList[2] += g * count
      sumList[3] += b * count
    if sumList[0] != 0:
      sumList[1] //= sumList[0]
      sumList[2] //= sumList[0]
      sumList[3] //= sumList[0]
    return sumList

  def getMainColor(queue, number):  # 根据box计算主色调
    colorList = []
    for i in range(number):
      box = queue.get()[1]
      colorList.append(sumColor(box.pixelSet))
    return colorList

  # 初始化
  initRange = [[rMin, rMax], [gMin, gMax], [bMin, bMax]]
  initBox = ColorBox(initRange, totalSize, imageColors)
  initQueue = PriorityQueue()
  initQueue.put((initBox.rank, initBox))
  resQueue = doCut(initQueue)
  mainColor = getMainColor(resQueue, colorNum)
  mainColor.sort(key=lambda x: x[0],reverse=True)
  print(mainColor)

  # 生成图片
  region = image.crop((0, 0, sizeX, sizeY))
  x = int(sizeX * 1.2)
  y = sizeY
  yEach = y // colorNum
  new = Image.new('RGB', (x, y), (255, 255, 255))
  new.paste(region, (0, 0))
  for i in range(0, colorNum):
    for n in range(i * yEach + padding, (i + 1) * yEach - padding):
      for m in range(sizeX + padding, x - padding):
        new.putpixel(
            (m, n), (mainColor[i][1], mainColor[i][2], mainColor[i][3]))
  new.save(path + 'color/' + name + '-' + str(vBalance) + '-color' + suffix)

# 读取文件夹
def listPath(path):  # 传入存储的list
  path_list = []
  for file in os.listdir(path):
    file_path = os.path.join(path, file)
    if os.path.isfile(file_path):
      path_list.append(file_path)
  return path_list


pathList = listPath("E:\python\壁纸")
for path in pathList:
  colorExt(path,8,8,5)

# for vBalance in range(0,20,2):
#   colorExt("E:/python/b.jpg", 8, vBalance, 5)
```

## 效果展示

![颜色提取二-1.png](./data/static/image/post_0004/颜色提取二-1.png)

上图依旧是提取8中颜色，颜色影响系数依次是0, 2, 4 … 14, 16，不难看出，本图片中体积影响系数到6以后结果就没有多大差别。

