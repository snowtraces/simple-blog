# 9个简单的CSS图像滤镜

```meta
date: 2016-12-01
title: 9个简单的CSS图像滤镜
title_en: nine_simple_css_image_filters
author: snowtraces
id: 00010
old_id: 65870
tags:
    - css
category: code
status: public
```
相比Photoshop而言，CSS图像滤镜是一种快速的方式来调整浏览器中的图像。本文简要介绍这9个滤镜，均提供了很好的方式来保持网站的视觉内容的风格一致性，或者只是添加一点有趣的图片互动。CSS滤镜最常用于调整图像图像和背景的显示，但也可应用于其他视觉元素，如边框和按钮。

## CSS滤镜属性

这些CSS滤镜提供(CSS filter)了一些熟悉的效果，如模糊、翻转或色调更改，并且在所有主流的现代浏览器中都支持。 它有一个非常简单的语法，看起来像这样：

```css
filter: type(value);
```

```exec
<p class="codepen" data-height="489" data-theme-id="dark" data-default-tab="css,result" data-user="vailjoy" data-slug-hash="PbJovr" style="height: 489px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="Simple CSS Image Filters">
  <span>See the Pen <a href="https://codepen.io/vailjoy/pen/PbJovr">
  Simple CSS Image Filters</a> by Vail Joy (<a href="https://codepen.io/vailjoy">@vailjoy</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

<p class="btn preview left"><a href="https://codepen.io/vailjoy/debug/PbJovr" target="_blank">全屏 Demo</a></p>
<p class="btn download"><a title="Download source files" href="http://webdesignerwall.com/wp-content/uploads/2016/11/webdesignerwall-image-filters-css.zip" target="_blank">下载 Demo</a></p>

```

## 滤镜列表

下面分别介绍各种过滤器，关于其功能及如何编写它们：

### 模糊（blur）

```css
filter: blur( length );
```

该滤镜应用高斯模糊效果。 长度值是指多少个屏幕像素混合在一起，因此较大的值会更模糊，0为未使用模糊。

```css
.blur{
  filter: blur(5px);
   -webkit-filter: blur(5px);
}
```

### 亮度（brightness）

```css
filter: brightness( number or percent );
```

亮度滤镜会使图像变亮或变暗。 该值是所需的亮度百分比，格式为百分比值或小数，其中0%或0为黑色，1或100%为原始值。

让图像变暗：

```css
.darken {
    filter: brightness(.5);
    -webkit-filter: brightness(.5);
}
```

或让图像变亮：

```css
.lighten {
    filter: brightness(120%);
    -webkit-filter: brightness(120%);
}
```

### 对比度（contrast）

```css
filter: contrast( number or percent );
```

提高或降低图片对比度——非常适合修复图片褪色！ 该值为目标对比度的百分比，格式为百分比值或小数，其中0%或0是灰色，1或100%是原始的。

提高对比度：

```css
.contrast {
    filter: contrast(2);
      -webkit-filter: contrast(2);
}
```

降低对比度：

```css
.contrast {
    filter: contrast(50%);
      -webkit-filter: contrast(50%);
}
```

### 灰度（grayscale）

```css
filter: grayscale( number or percent );
```

作为使用最广泛的CSS滤镜，灰度只是从图像中删除颜色。 该值是目标灰度的百分比，格式为百分比值或小数，其中0%或0是无变化，1或100%将创建一个完全灰度图像。

```css
.greyscale{
  filter: grayscale(1);
    -webkit-filter: grayscale(1);    
}
```

### 色相旋转（hue-rotate）

```css
filter: hue-rotate( angle );
```

色相旋转滤镜的工作方式类似于Photoshop中的色相/饱和度调整。 想象一下你的图像放置在一个透明的色轮下。 `angle`的值定义了色轮周围的度数，其中0是没有变化，直到最大值360。

### 反色（invert）

```css
filter: invert( number or percent );
```

该滤镜对颜色进行反转，所以黑色变成白色，橙色变成蓝色等。 该值是目标效果强度，格式为百分比值或小数，其中0%或0是无变化，1或100%将创建颜色完全反转的图像。

```css
.invert {
    filter: invert(.8);
      -webkit-filter: invert(.8);
}
```

### 饱和度（saturate）

```css
filter: saturate( number or percent );
```

饱和度滤镜将增加暗淡图像的颜色值。 该值为目标效果强度，格式为百分比值或小数，其中0%或0是无变化，1或100%将适度调出颜色，并可以设置参数超过1或100%。 如需要淡化或降低图像的色调吗，使用前面的灰度滤镜。

```css
.saturate{
    filter: saturate(1.5);
      -webkit-filter: saturate(1.5);
}
```

### 褐色（sepia）

```css
filter: sepia( number or percent );
```

褐色滤镜应用怀旧或“铂金”效应。 该值为目标效果强度，格式为百分比值或小数，其中0%或0是无变化，1或100%完全是褐色化。

```css
.sepia{
  filter: sepia(100%);
    -webkit-filter: sepia(1);  
}
```

### 不透明度（opacity）

这个滤镜可能在设计中应用最广泛的，可以用于将图像与背景颜色或图案混合，创建简单的UI效果或使元素出现或消失。 其最基本的功能，不透明度使一个元素或多或少的透明或“不透明”。

该值是元素不透明度，格式为百分比值或小数，其中0%或0是完全透明的，1或100%没有变化。 此滤镜与更常见的`opacity`属性类似，不同之处在于此滤镜在某些浏览器中提供更好的性能。 在下面的示例中，看看它如何用于在按钮上创建微妙的悬停效果：

```css
button:hover{
   filter: opacity(.7);
      -webkit-filter: opacity(.7);
}
```

## 组合滤镜

可以在一个声明中使用多个滤镜来创建组合自定义效果。 以下示例创建微妙的复古效果，多个滤镜值只需用空格分隔：

```css
.all-the-things {
    filter: contrast(1.4) saturate(1.8) sepia(.6);
      -webkit-filter: contrast(1.4) saturate(1.8) sepia(.6);
}
```

要快速了解每个滤镜类型的值增加或减少的效果，请查看[Adobe的nifty滤镜滑块](https://codepen.io/adobe/full/KyEpe/)。

## 图像滤镜鼠标悬停效果

为了在悬停时滤镜效果过度平滑，添加·transition·属性：

```css
.grid li img{
  transition: all .2s ease-in-out;
  -webkit-transition: all .2s ease-in-out;
   -moz-transition: all .2s ease-in-out;
   -o-transition: all .2s ease-in-out;
  transform: translateX(0);
   -webkit-transform: translateX(0);
}
```

其中的`transform`声明有助于防止图像在应用效果时抖动或移位。现在使用`:hover`在选择器上将滤镜添加到元素：

```css
.grid li img:hover {
    filter: brightness(.5);
    -webkit-filter: brightness(.5);
}
```

如果要去掉演示中的滤镜效果，只需将`filter`设置为`none`：

```css
img:hover{
  filter: none;
  -webkit-filter: none;
}
```



