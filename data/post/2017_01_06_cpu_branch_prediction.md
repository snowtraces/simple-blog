# CPU 分支预测

```meta
date: 2017-01-06
title: CPU 分支预测
title_en: cpu_branch_prediction
author: snowtraces
id: 00009
old_id: 65922
tags:
    - java
category: code
status: public
```
在JAVA数组遍历过程中，排序过后的数组处理起来更快，stackoverflow上有个问题——[为什么已排序数组比未排序数组处理起来更快？](https://stackoverflow.com/questions/11227809/why-is-it-faster-to-process-a-sorted-array-than-an-unsorted-array)，本文将对此问题和[mysticial](https://stackoverflow.com/users/922184/mysticial)的回答翻译，并以此为基础稍微补充展开。

## 问题：为什么排序后的数组处理起来更快

下面是原问题，仅保留Java的问题实现部分，关于C++的请自行查看原文。

```java
import java.util.Arrays;
import java.util.Random;

public class Main
{
    public static void main(String[] args)
    {
        // Generate data
        int arraySize = 32768;
        int data[] = new int[arraySize];

        Random rnd = new Random(0);
        for (int c = 0; c < arraySize; ++c)
            data[c] = rnd.nextInt() % 256;

        // !!!添加以下排序，程序会快很多
        Arrays.sort(data);

        // Test
        long start = System.nanoTime();
        long sum = 0;

        for (int i = 0; i < 100000; ++i)
        {
            // Primary loop
            for (int c = 0; c < arraySize; ++c)
            {
                if (data[c] >= 128)
                    sum += data[c];
            }
        }

        System.out.println((System.nanoTime() - start) / 1000000000.0);
        System.out.println("sum = " + sum);
    }
}
```

我自己用Eclipse跑一下结果，结果耗时：#1 排序：2.712352148；#2 未排序：14.459905408

## 答案：分支预测（Branch Prediction）

### 什么是分支预测

想象一下铁路分叉口：

![muxnt.jpg](./data/static/image/post_0009/muxnt.jpg)

Image by Mecanismo, via Wikimedia Commons. Used under the CC-By-SA 3.0 license.

现在为了方便讨论，假设这是回到19世纪 – 在远距离或无线电通信尚未普及之前。你是一个交汇处的扳道工，听到火车来，但你不知道它该走哪条路。你叫停火车，问清司机行驶方向，然后设置轨道。

火车很重，有很大的惯性，所以一路上一直加速和减速。

有更好的方法吗？ 你猜火车哪个方向去！

+ 如果猜到，继续。
+ 如果猜错，停下来并后退，然后重设轨道。 火车重新启动驶入路径。

对于一个if条件语句，在处理器级别，它是一个分支指令：

![if-statement-and-branch-instruction.png](./data/static/image/post_0009/if-statement-and-branch-instruction.png)

如果你是一个处理器，看到一个分支时并不知道选哪一个。 于是暂停执行并等待，直到前面的选择指令完成，然后继续执行正确的路径。

但是，现代处理器复杂且具有长流水线（pipelines），所以会一直“减速”“加速”，很浪费时间。分支预测器让使用指令流水线处理器的性能提高。

分支预测器猜测两路分支中哪一路最可能发生，然后投机执行这一路的指令，来避免流水线停顿造成的时间浪费。如果后来发现分支预测错误，那么流水线中投机执行的那些中间结果全部放弃，重新获取正确的分支路线上的指令开始执行，这招致了程序执行的延迟。

现代处理器的分支预测方法依赖于代码执行的动态历史信息。大多数应用程序具有良好的分支， 因此，分支预测器通常会实现> 90%的命中率。 但是当面对不可预知的分支，没有可识别的模式，分支预测器实际上是无用的。

更多参见维基百科[分支预测器](https://zh.wikipedia.org/wiki/%E5%88%86%E6%94%AF%E9%A0%90%E6%B8%AC%E5%99%A8)词条，介绍了多种分支预测的实现方法。

### 原因是if条件语句

综上所述，罪魁祸首是这个if条件语句：

```java
if (data[c] >= 128)
    sum += data[c];
```

注意，数据均匀分布在0和255之间。当数据排序后，大致上半个迭代将不会进入if语句； 之后，数据均将进入if语句。

这对分支预测器非常友好，因为分支连续地沿着相同的方向多次行进。除了在切换方向之后的几个迭代， 一个简单的饱和计数器都能正确地预测分支结果。

简要分析一下：

```markup
T = branch taken
N = branch not taken

data[] = 0, 1, 2, 3 ... 126, 127, 128, 129, 130, ... 250, 251, 252, ...
branch = N  N  N  N ...   N    N    T    T    T  ...   T    T    T  ...

       = NNNNNNNNN ... NNNNNNNTTTTTTTTT ... TTTTTTTTTT  (很容易预测)
```

然而，当数据完全随机时，分支预测器毫无用处，因为它不能预测随机数据。 结果是可能会有大约50%的误预测，不比随机猜测更好。

```
data[] = 226, 185, 125, 158, 198, 144, 217, 79, 202, 118,  14 ...
branch =   T,   T,   N,   T,   T,   T,   T,  N,   T,   N,   N ...

       = TTNTTTTNTNN ...   (完全随机，无法预测)
```

### 优化方案

通过位运算来避免分支预测，用下面代码来提换if条件语句：

```java
int t = (data[c] - 128) >> 31;
sum += ~t & data[c];
```

介绍相关的按位操作符和移位操作符，均在二进制中进行：

| 操作 | 说明 |
| ------ | -- |
| int二进制0 | 0000 0000 0000 0000 0000 0000 0000 0000 |
| int二进制-1 | 1111 1111 1111 1111 1111 1111 1111 1111 |
| 右移操作符>> | 正数右移一步高位补0，右移31补得到十进制0；负数右移一步高位补1，右移31补得到十进制-1 |
| 按位非操作符~ | 也叫取反操作符，为一元操作符，对自身每一位进行取反——为0取-1，为1取0。故二进制0取反为-1，-1取反为0 |
| 按位与操作符& | 二元操作符，对应位均为1取1，否者取0。故十进制0与位操作结果必为0，-1与位操作结果必为原数值 |

结果大家可以自行测试。

在大数据处理过程中，要尽量避免使用if条件语句产生分支。


