# 拼音拆分算法

```meta
date: 2019-06-11
title: 拼音拆分算法
title_en: pinyin_split_algorithm
author: snowtraces
id: 00002
id_id: 66486
tags:
    - javascript
	- html
category: code
status: public
```
之前做一个诗词相关的网站时，本预想添加拼音，数据来源为hanlp或google翻译，但一直拖着没做。最近看到html对注音的支持，包括和标签，便写个demo看看效果。

数据来源使用google翻译，发现有些排版问题，有些拼音会进行分词并连接在一块，就算在汉字中间添加空格也不行，于是网上找找拼音拆分的算法，基本上都是根据声母和韵母回溯判断，例如：[拼音拆分算法](https://my.oschina.net/u/2541538/blog/610747)，我自己尝试用正则表达式直接拆分，发现效果不错。

```exec
<p class="codepen" data-height="408" data-theme-id="dark" data-default-tab="js,result" data-user="snowtraces" data-slug-hash="agbVmg" style="height: 408px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="拼音拆分">
  <span>See the Pen <a href="https://codepen.io/snowtraces/pen/agbVmg/">
  拼音拆分</a> by snowtraces (<a href="https://codepen.io/snowtraces">@snowtraces</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script src="https://static.codepen.io/assets/embed/ei.js"></script>
```