# MySQL非主流模糊查询: 全文索引

```meta
date: 2018-06-14
title: MySQL非主流模糊查询: 全文索引
title_en: mysql_non-mainstream_fuzzy_query_full-text_index
author: snowtraces
id: 00003
id_id: 66421
tags:
    - mysql
category: 数据库
status: public
```
现实需求中，要求支持模糊查询再常见不过，可以直接使用数据库模糊匹配，但数据量百万后瓶颈就很明显，一般的选择是使用如solr/elasticSearch等搜索引擎工具。有时候不想引入更多的模块，或者是懒，可以直接使用mysql实现。

一提起全文索引，大家都知道lucence全家桶，但不知道或没用过mysql的全文索引功能。mysql全文索引即fulltext index，旧版本中，MyISAM存储引擎支持`char`、`varchar`和`text`字段建立；自5.6.24版本起，InnoDB引擎也加入全文索引，详细了解可以去看官方文档：[mysql 5.6 document](https://dev.mysql.com/doc/refman/5.6/en/innodb-fulltext-index.html)。

## MySQL全文索引的建立

借用官方文档的例子：

```sql
CREATE TABLE opening_lines (
  id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
  opening_line TEXT(500),
  author VARCHAR(200),
  title VARCHAR(200),
  FULLTEXT idx (opening_line)
  ) ENGINE=InnoDB;
```

上面的DDL语句，使用FULLTEXT关键字建立了名为`idx`的全文索引。全文索引和普通索引一样，也可以建立联合索引，具体参见官方文档。

## MySQL全文索引的使用

官方文档：[mysql 5.6 document](https://dev.mysql.com/doc/refman/5.6/en/innodb-fulltext-index.html)

MySQL全文索引查询条件语法为:

```sql
MATCH (col1,col2,...) AGAINST (expr [search_modifier])

search_modifier:
  {
       IN NATURAL LANGUAGE MODE
     | IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION
     | IN BOOLEAN MODE
     | WITH QUERY EXPANSION
  }
```

针对中文，MySQL没有好用的分词插件，实际效果差强人意。

## MySQL全文索引实践

[github：poetry-web](https://github.com/snowtraces/poetry-web)是一个简单展示唐宋诗词的网站，通过MySQL的全文索引实现查询。由于数据量相对较大，最初尝试使用`%keyword%`的方式模糊查询，每次都要遍历表，效率底下；改用fullText索引后又加入了缓存查询结果，进一步提升效率。

### mysql全文索引

模糊查询通过mysql建立fullText全文索引，未使用分词器，将最小分词数改为2：

```config
[mysqld]
innodb_ft_min_token_size=2
ft_min_word_len=2
```

### 分词问题

不但mysql没有有效的中文分词器，而且针对古文/古诗的分词器根本就没有。只进行了简单的分词，保留2个字的结果，放入keyword属性列，该列作为全文索引的联合字段之一。

### 查询速度

查询采用了boolean模糊匹配，效率虽然比直接模糊查询快，但有时也会很慢。将查询结果前100条id放入表中，每次查询先查结果表。还可以加入分页查看的限制，如只能查看前10页结果，10页后要求填写验证码并且提示修改查询条件。