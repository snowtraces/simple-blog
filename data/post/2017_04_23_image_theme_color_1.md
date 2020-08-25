# 图像主题色提取简单实现

```meta
date: 2017-04-23
title: 图像主题色提取简单实现
title_en: image_theme_color_1
author: snowtraces
id: 00007
old_id: 66115
tags:
    - javascript
category: code
status: public
```

图像主题颜色的应用越来越多，如[google相册](https://photos.google.com/)可以按照颜色对图片进行检索，[design-seeds](https://www.design-seeds.com/)上的色彩设计。相关算法主要有中位切分法、八叉树提取法和KMean clustering 等算法。关于这些算法，推荐这两篇文章，写的非常好：[图像主题色提取算法](http://blog.rainy.im/2015/11/24/extract-color-themes-from-images/)和[图片主题色提取算法小结](http://blog.rainy.im/2015/11/24/extract-color-themes-from-images/)，本文只就中位切分法（Median cut）进行js的简单实现。

RGB色彩模式下，R/G/B的取值分别为0x00~0xff（0~255），将其想象成一个以RGB分别为维度的三维空间，在取值范围内构成一个立方体

![640px-RGB_color_solid_cube-300x225](./data/static/image/post_0007/640px-RGB_color_solid_cube-300x225.png)

此处我以空间均等八分为例（R/G/B各以128切分），取得八个空间的像素点分布，计算其平均值。

## HTML代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8" />
	<link rel="stylesheet" href="style.css">
	<script src="jquery-2.1.0.js"></script>
	<script src="octree.js"></script>
	<script src="color.js"></script>
</head>
<body>
<img src="image/044a.jpg" id="image"/>

<div id="colorx"></div>
<div id="colory"></div>

</body>
</html>
```

## JS代码
### color.js

```javascript
$(function() {
  function rgb(r, g, b, count) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.count = count;
  }

  $("#image").one("load",function() {
    var blockSize = 47, // 选取密度
    canvas = document.createElement('canvas'), // 画布
    context = canvas.getContext('2d'), data, width, height, i = -4, length, red, green, blue, count = 0, rgbArray = [];
    for (var j = 0; j < 8; j++) {
      rgbArray[j] = new rgb(0, 0, 0, 0);
    }
    if (!context) {
      // 未获取，设置默认值
      // rgb = { r: 51, g: 104, b: 172 }
    } else {
      height = canvas.height = this.naturalHeight;
      width = canvas.width = this.naturalWidth;
      context.drawImage(this, 0, 0);
      try {
        data = context.getImageData(0, 0, width, height);
        length = data.data.length;
        // 将颜色放入对应位置
        while ((i += blockSize * 4) < length) {
          var rIndex = (data.data[i] - 128) >> 31;
          var gIndex = (data.data[i + 1] - 128) >> 31;
          var bIndex = (data.data[i + 2] - 128) >> 31;
          var index = ((rIndex + 1) << 2) + ((gIndex + 1) << 1)
              + (bIndex + 1); // 计算二进制索引
          rgbArray[index].r += data.data[i];
          rgbArray[index].g += data.data[i + 1];
          rgbArray[index].b += data.data[i + 2];
          rgbArray[index].count++;
        }
  
        rgbArray.sort(function(a, b) {
          return a.count - b.count
        })
        // 计算最终颜色
        var html = "";
        for (var k = 0; k < 8; k++) {
          var r = ~~(rgbArray[k].r / rgbArray[k].count);
          var b = ~~(rgbArray[k].b / rgbArray[k].count);
          var g = ~~(rgbArray[k].g / rgbArray[k].count);
          var rStr = r.toString(16);
          var gStr = g.toString(16);
          var bStr = b.toString(16);
          if (rStr.length === 1)
            rStr = '0' + rStr;
          if (gStr.length === 1)
            gStr = '0' + gStr;
          if (bStr.length === 1)
            bStr = '0' + bStr;
  
          var colorStr = rStr + gStr + bStr;
          if ("000000" != colorStr)
            html += "<div class=\"color\" style=\"background:#"
                + colorStr + "\">#" + colorStr + "</div>";
        }
        $("#colory").append(html).append("<div class=\"clear\"></div>");
      } catch (e) {
        console.info(e)
        //rgb = { r: 51, g: 104, b: 172 }
      }
    }
  })
})
```

### octree.js

这段代码是抄别人的： [图片主题色提取算法小结](https://xcoder.in/2014/09/17/theme-color-extract/) ，作为上面实现的对照。原代码中有个节点的选择貌似又问题，我改了以后效果良好……

```javascript
$(function () {
  $("#image").load(function () {
    getColor();
  })

  var reducible = [];
  var leafNum = 0;
  var blockSize = 47; //取值密度
  var colorNum = 8;// 提取颜色数目
  for (var i = 0; i < 8; i++)
    reducible.push(null);
  // 八叉树节点
  var OctreeNode = function () {
    this.isLeaf = false;// 默认不是子节点
    this.pixelCount = 0;// 该节点插入颜色的次数
    this.red = 0;// 通道颜色值，逐步累加
    this.green = 0;
    this.blue = 0;

    // 兄弟节点初始化
    this.children = new Array(8);
    for (var i = 0; i < this.children.length; i++)
      this.children[i] = null;

    // 这里的 next 不是指兄弟链中的 next 指针
    // 而是在 reducible 链表中的下一个节点
    this.next = null;
  };
  var root = new OctreeNode();

  /**
   * 获取颜色并输出至页面
   * @returns
   */
  function getColor() {
    var pixels = getPixels("image");
    var data = pixels.data;
    var array = [];
    //像素点转换成rgb颜色信息
    for (var i = 0; i < data.length; i += 4 * blockSize) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      array.push({ r: r, g: g, b: b });
    }
    //传入颜色信息，开始建树
    buildOctree(array, colorNum);

    var colors = {};
    colorsStats(root, colors);

    var result = [];
    for (var key in colors) {
      result.push({ color: key, count: colors[key] });
    }

    result.sort(function (a, b) {
      return a.count - b.count;
    });
    var string = "";
    for (var i = 0; i < result.length; i++) {
      string += "<div class=\"color\" style=\"background:#" + result[i].color + "\">#" + result[i].color + "</div>";
    }
    $("#colorx").append(string).append("<div class=\"clear\"></div>");
    console.log("统计结果：" + result.length)
    console.log("done");
  }

  /**
   * 获取像素信息
   * 
   * @param {String}image
   *          图片名称
   * @returns
   */
  function getPixels(imageId) {
    var canvas = document.createElement('canvas'), // 创建画布
      context = canvas.getContext('2d'), data, width, height,
      imgEl = document.getElementById(imageId);
    if (!context) {
      console.log("未获取有效图像数据")
    } else {
      height = canvas.height = imgEl.naturalHeight;
      width = canvas.width = imgEl.naturalWidth;
      console.log("" + width + "  " + height)
      context.drawImage(imgEl, 0, 0);
      try {
        data = context.getImageData(0, 0, width, height);
        return data;
      } catch (e) {
        console.log("---无法读取图像---");
      }
    }
    return null;
  }

  /**
   * createNode
   * 
   * @param {OctreeNode}
   *          parent the parent node of the new node
   * @param {Number}
   *          idx child index in parent of this node
   * @param {Number}
   *          level node level
   * @return {OctreeNode} the new node
   */
  function createNode(level) {
    var node = new OctreeNode();
    if (level === 7) {
      node.isLeaf = true;
      leafNum++;
    } else {
      node.next = reducible[level + 1];
      reducible[level + 1] = node;
    }

    return node;
  }

  /**
   * addColor
   * 
   * @param {OctreeNode}
   *          node the octree node
   * @param {Object}
   *          color color object
   * @param {Number}
   *          level node level
   * @return {undefined}
   */
  function addColor(node, color, level) {
    if (node.isLeaf) {
      node.pixelCount++;
      node.red += color.r;
      node.green += color.g;
      node.blue += color.b;
    } else {
      // 由于 js 内部都是以浮点型存储数值，所以位运算并没有那么高效
      // 在此使用直接转换字符串的方式提取某一位的值
      //      var str = "";
      //      var r = color.r.toString(2);
      //      var g = color.g.toString(2);
      //      var b = color.b.toString(2);
      //      while (r.length < 8)
      //        r = '0' + r;
      //      while (g.length < 8)
      //        g = '0' + g;
      //      while (b.length < 8)
      //        b = '0' + b;
      //
      //      str += r[level];
      //      str += g[level];
      //      str += b[level];
      //      var idx = parseInt(str, 2);
      var r = (color.r >> (7 - level)) & 1;
      var g = (color.g >> (7 - level)) & 1;
      var b = (color.b >> (7 - level)) & 1;
      var idx = (r << 2) + (g << 1) + b;

      if (null === node.children[idx]) {
        node.children[idx] = createNode(level + 1);
      }

      if (undefined === node.children[idx]) {
        console.log(color)
        console.log(color.r.toString(2));
      }

      addColor(node.children[idx], color, level + 1);
    }
  }

  /**
   * reduceTree
   * 
   * @return {undefined}
   */
  function reduceTree() {
    // find the deepest level of node
    var level = 7;
    while (null === reducible[level])
      level--;
    // get the node and remove it from reducible link
    var node = reducible[level];
    reducible[level] = node.next;
    // merge children
    var r = 0;
    var g = 0;
    var b = 0;
    var count = 0;
    for (var i = 0; i < 8; i++) {
      if (null === node.children[i])
        continue;
      r += node.children[i].red;
      g += node.children[i].green;
      b += node.children[i].blue;
      count += node.children[i].pixelCount;
      leafNum--;
    }

    node.isLeaf = true;
    node.red = r;
    node.green = g;
    node.blue = b;
    node.pixelCount = count;
    leafNum++;
  }

  /**
   * buildOctree
   * 
   * @param {Array}
   *          pixels The pixels array
   * @param {Number}
   *          maxColors The max count for colors
   * @return {undefined}
   */
  function buildOctree(pixels, maxColors) {
    for (var i = 0; i < pixels.length; i++) {
      // 添加颜色
      addColor(root, pixels[i], 0);

      // 合并叶子节点
      while (leafNum > maxColors)
        reduceTree();
    }
  }

  /**
   * colorsStats
   * 
   * @param {OctreeNode}
   *          node the node will be stats
   * @param {Object}
   *          object color stats
   * @return {undefined}
   */
  function colorsStats(node, object) {
    if (node.isLeaf) {
      var r = parseInt(node.red / node.pixelCount).toString(16);
      var g = parseInt(node.green / node.pixelCount).toString(16);
      var b = parseInt(node.blue / node.pixelCount).toString(16);
      if (r.length === 1)
        r = '0' + r;
      if (g.length === 1)
        g = '0' + g;
      if (b.length === 1)
        b = '0' + b;

      var color = r + g + b;
      if (object[color])
        object[color] += node.pixelCount;
      else
        object[color] = node.pixelCount;

      return;
    }

    for (var i = 0; i < 8; i++) {
      if (null !== node.children[i]) {
        colorsStats(node.children[i], object);
      }
    }
  }
})
```

## 结果展示

![color](./data/static/image/post_0007/color.jpg)

其中第一排颜色是根据[图片主题色提取算法小结](https://xcoder.in/2014/09/17/theme-color-extract/)中的八叉树算法提取的，这张图片色域比较大，两种结果较非常接近，下面更换图片看看结果

![color2](./data/static/image/post_0007/color2.jpg)

结果依旧相近，但中位切分法获取了一个`#000000`结果被过滤了。

## 执行效率
在效率上，如本文中八均分的中位切分效率还算可观，但是一旦目标颜色数目上升后，效率会大大降低。对于八叉树算法，先进行颜色遍历建树，然后根据目标颜色树进行合并，目标颜色数目越多，合并的次数会越少，计算效率不降反升。


