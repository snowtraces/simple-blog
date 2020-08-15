# FastJsonHttpMessageConverter转义字符串问题处理

```meta
date: 2019-08-30
title: FastJsonHttpMessageConverter转义字符串问题处
title_en: fastjson_http_message_converter
author: snowtraces
id: 00001
id_id: 66512
tags:
    - java
    - fastJson
category: code
status: public
```

最近进行几个api项目进行合并，发现rest接口原有的`Date`类型被转成时间戳，与期望的`long`类型不一致，于是引入`FastJsonHttpMessageConverter`进行统一转换，复制粘贴一气呵成：

```java
	@Bean
	public HttpMessageConverters fastJsonHttpMessageConverters() {
		//1、定义一个convert转换消息的对象
		FastJsonHttpMessageConverter fastConverter = new FastJsonHttpMessageConverter();
		//2、添加fastjson的配置信息
		FastJsonConfig fastJsonConfig = new FastJsonConfig();
		fastJsonConfig.setSerializerFeatures(SerializerFeature.WriteMapNullValue);
		//3、在convert中添加配置信息
		fastConverter.setFastJsonConfig(fastJsonConfig);
		//4、将convert添加到converters中
		HttpMessageConverter<?> converter = fastConverter;
		return new HttpMessageConverters(converter);
	}
```

然后自测中发现有些接口返回值被进行了二次转换，如：

```code
"{\"a\":\"a\"}"
```

看代码发现，有个项目RestController的所有返回值都被手动转换了：

```java
return JSON.toJSONString(resultMap);
```

上面的配置方式，由于`FastJsonHttpMessageConverter`的优先级高于`StringHttpMessageConverter`，导致所有返回都被进行转换，而且没有排除`String`类型的配置，于是debug一下springboot源码，发现默认转换器的添加逻辑：

```java
	/**
	 * Adds a set of default HttpMessageConverter instances to the given list.
	 * Subclasses can call this method from {@link #configureMessageConverters}.
	 * @param messageConverters the list to add the default message converters to
	 */
	protected final void addDefaultHttpMessageConverters(List<HttpMessageConverter<?>> messageConverters) {
		StringHttpMessageConverter stringHttpMessageConverter = new StringHttpMessageConverter();
		stringHttpMessageConverter.setWriteAcceptCharset(false);  // see SPR-7316

		messageConverters.add(new ByteArrayHttpMessageConverter());
		messageConverters.add(stringHttpMessageConverter);
		messageConverters.add(new ResourceHttpMessageConverter());
		messageConverters.add(new ResourceRegionHttpMessageConverter());
		messageConverters.add(new SourceHttpMessageConverter<>());
		messageConverters.add(new AllEncompassingFormHttpMessageConverter());

		if (romePresent) {
			messageConverters.add(new AtomFeedHttpMessageConverter());
			messageConverters.add(new RssChannelHttpMessageConverter());
		}

		if (jackson2XmlPresent) {
			Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.xml();
			if (this.applicationContext != null) {
				builder.applicationContext(this.applicationContext);
			}
			messageConverters.add(new MappingJackson2XmlHttpMessageConverter(builder.build()));
		}
		else if (jaxb2Present) {
			messageConverters.add(new Jaxb2RootElementHttpMessageConverter());
		}

		if (jackson2Present) {
			Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.json();
			if (this.applicationContext != null) {
				builder.applicationContext(this.applicationContext);
			}
			messageConverters.add(new MappingJackson2HttpMessageConverter(builder.build()));
		}
		else if (gsonPresent) {
			messageConverters.add(new GsonHttpMessageConverter());
		}
		else if (jsonbPresent) {
			messageConverters.add(new JsonbHttpMessageConverter());
		}

		if (jackson2SmilePresent) {
			Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.smile();
			if (this.applicationContext != null) {
				builder.applicationContext(this.applicationContext);
			}
			messageConverters.add(new MappingJackson2SmileHttpMessageConverter(builder.build()));
		}
		if (jackson2CborPresent) {
			Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.cbor();
			if (this.applicationContext != null) {
				builder.applicationContext(this.applicationContext);
			}
			messageConverters.add(new MappingJackson2CborHttpMessageConverter(builder.build()));
		}
	}
```

然后决定换一种方式添加`FastJsonHttpMessageConverter`，只需其优先级高于默认的`jacksonConverter`，并且低于`StringHttpMessageConverter`即可：

```java
@Configuration
public class Mvc2JsonConfig implements WebMvcConfigurer {

    /**
     * FastJsonHttpMessageConverter 在 HttpMessageConverter 列表中的位置
     * 若 FastJsonHttpMessageConverter 在 StringHttpMessageConverter 前被调用，会导致对string进行二次转换
     * 由于 StringHttpMessageConverter 在第1和2的位置上，要排在其后，并且排在jacksonConverter之前，故位置为3
     */
    private static final int FAST_JSON_CONVERTER_INDEX = 3;

    FastJsonHttpMessageConverter fastJsonHttpMessageConverter() {
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();

        List<MediaType> supportMediaTypeList = new ArrayList<>();
        supportMediaTypeList.add(MediaType.TEXT_HTML);
        supportMediaTypeList.add(MediaType.APPLICATION_JSON);
        supportMediaTypeList.add(MediaType.APPLICATION_JSON_UTF8);
        supportMediaTypeList.add(MediaType.valueOf("application/*+json"));

        FastJsonConfig fastJsonConfig = new FastJsonConfig();
        fastJsonConfig.setSerializerFeatures(SerializerFeature.WriteMapNullValue);
        converter.setFastJsonConfig(fastJsonConfig);
        converter.setSupportedMediaTypes(supportMediaTypeList);

        return converter;
    }

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> messageConverters) {
        messageConverters.add(FAST_JSON_CONVERTER_INDEX, fastJsonHttpMessageConverter());
    }
}
```