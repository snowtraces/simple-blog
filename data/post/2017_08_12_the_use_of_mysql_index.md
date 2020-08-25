# MySql索引的使用

```meta
date: 2017-08-12
title: MySql索引的使用
title_en: the_use_of_mysql_index
author: snowtraces
id: 00005
id_id: 66302
tags:
    - mysql
category: 数据库
status: public
```

上一篇文章[分页查询时SQL优化](./)中没有使用索引，但在一般的业务场景中都会涉及到模糊查询，如果模糊查询的条件在多张表中，而且不方便设置冗余字段来调整，就需要使用到索引了。MySql的缺省引擎为`InnoDB`，也是最主流的引擎，本文以其上的`Btree`索引进行讲解。

关于索引的技术细节，推荐文章：[理解MySQL——索引与优化](https://www.cnblogs.com/hustcat/archive/2009/10/28/1591648.html)

## sql语句分析

`EXPLAIN`命令可以让你查看sql语句的执行参数，现假设有`table_a`，有`id`（主键）、`name`、`age`和`sex`四个字段，并对`age`设置索引`idx_age`，数据如下：

| id | name | age | sex |
| -- | ---- | --- | --- |
| 1 | Jack | 21 | male |
| 2 | Rose | 20 | female |

先执行分析语句`explain select * from table_a where age<'30'`，结果剔除与索引无关内容后如下：

| possible_keys | key | key_len | Extra |
| ------------- | --- | ------- | -==-- |
|idx_age | idx_age | 4 | Using index condition |

其中`possible_keys`代表可以使用的索引，`key`是实际中使用的索引，具体的选择由sql引擎的确定，但是多个索引时，引擎的选择不一定最优，可以通过`USE INDEX`来主动选择索引：

```sql
select * from table_a　use　index　(idx_age) where age<'30'
```

## 联合索引

联合索引也叫复合索引，是基于两个及以上属性建立的。BTree索引遵循最左匹配原则，是从左到右依次建立和查询树结构的。

现对`table_a`建立索引`(name, age, sex)`，会先检查`name`属性，命中后才会检查`age`属性，`age`命中后才会查询`sex`，例如传入条件顺序为`(name, sex, age)`，此时只有name的索引能被使用到。

### 索引的失效

大家都知道，对于模糊查询的传入条件`%keyword%`，由于前置百分号的原因索引是不会生效的，对于联合索引，还存在断点失效机制。

在联合索引从左到右检索的过程中，遇到范围查询`>, <, like, between`就会形成断点，其后的所有索引都会失效。如传入条件`name = 'Rose' and age < 20 and sex = 'female'`，首先假如`name`条件命中，继续`age`上的条件，由于是范围查询，无论命中与否其后条件都不会使用索引，对于本例，只需将`age < 20`的条件放在最后即可。

### 索引使用的判断

通过以上判断断点，基本可以确定使用了那些索引，但是有时结果并不是你想要的。具体索引使用情况的判断 ，可以根据`key_len`来确定，下面是`key_len`的计算方法：

+ 联合索引中每个字段，如果不是`not null`，则需加1个字节
+ 定长字段，`int`占4个字节、`date`占3个字节、`char(n)`占n个字符
+ 可变字段`varchar(n)`，占n个字符+2个字节
+ 不同的字符集，每个字符占用的字节数不同，其中`latin1`每个字符占1个字节，`gbk`每个字符占2个字节，`utf8`每个字符占3个字节

假如有字段定义为`varchar(32)  DEFAULT  NULL`，那么它的`key_len`为`32*3 + 2 + 1 = 99`。计算出每个字段的`key_len`，然后和EXPLAIN结果中的对比，就看得出结论。

