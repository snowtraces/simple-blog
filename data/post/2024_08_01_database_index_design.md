# 数据库索引设计

```meta
date: 2024-08-07
title: 数据库索引设计
title_en: database_index_design
author: snowtraces
id: 00011
tags:
    - database
category: database
status: public
```

## 1. 索引的数据结构
mysql中索引默认为为B+树
![database_index](/data/static/image/post_0011/database_index.png)

一个页面会被指定为B+树的根；在索引中查找一个键时，就从这里开始。该页面包含几个键和 对子页面的引用。每个子页面负责一段连续范围的键，引用之间的键，指明了引用子页面的键范围。

B+树中只有叶子节点会带有指向记录的指针（ROWID）， 叶子节点之间通过指针来连接，范围扫描将十分简单。

## 2. 聚簇索引和非聚簇索引
聚簇索引：默认主键，其叶子节点和数据行存储在一起，找到聚簇索引的叶子节点也找到了数据本身。聚簇索引的数据的物理存放顺序与索引顺序是一致的，如果索引的增长不是单调的，物理存储位置要不停的调整。一张表上只能有一个聚簇索引。

非聚簇索引：叶子节点存储的是聚簇索引的指针，每次查询要经过查询主键索引的过程。

## 3. 索引片和过滤因子
索引片就是 SQL查询语句在执行中需要扫描的一个索引片段，我们会根据索引片中包含的匹配列的数量不同，将索引分成窄索引（比如包含索引列数为1或2）和宽索引（包含的索引列数大于2）。

如果索引片越宽，那么需要顺序扫描的索引页就越多；如果索引片越窄，就会减少索引访问的开销。

过滤因子描述了谓词的选择性。在WHERE条件语句中，每个条件都称为一个谓词，谓词的选择性也等于满足这个条件列的记录数除以总记录数的比例。

过滤因子的条件过滤能力越强，满足条件的记录数就越少，SQL查询需要扫描的索引片也就越小。

## 4. 三星索引 - 查询语句的理想索引
三星索引，一次查询通常只需要一次磁盘随机读取及一次窄索引片的扫描，其响应时间会比一个普通索引的响应时间少几个数量级。

★☆☆

**定义**：如果与一个查询相关的索引行是相邻的，或者至少相距足够靠近的话，那这个索引就可以标记上一颗星。

**收益**：它最小化了必须扫描的索引片的宽度。

**实现**：把 WHERE 后的等值条件列作为索引最开头的列，如此，必须扫描的索引片宽度就会缩至最短。

★★☆

**定义**：如果索引行的顺序与查询语句的需求一致，则索引可以标记上第二颗星。

**收益**：它排除了排序操作。

**实现**：将 ORDER BY 列加入到索引中，保持列的顺序

★★★

**定义**：如果索引行中包含查询语句中的所有列，那么这个索引就可以标记上第三颗星。

**收益**：这避免了访问表的操作（避免了回表操作），只访问索引就可以满足了。

**实现**：将查询语句中剩余的列都加入到索引中。

## 5. 索引设计

### 候选A

+ 取出对于优化器来说不过分复杂的等值谓词列，将其作为索引的前导列（任意顺序皆可，优化器可以自动优化）。
+ 如果存在，将选择性最好的范围谓词作为索引下一列。只考虑对优化器不过分复杂的范围谓词即可。
+ 以正确的顺序条件order by列（注意正逆序）。忽略前面步骤中已添加的列。
+ 以任意顺序将select语句中其余的列添加到索引中（但要以不易变的开始）。

### 候选B

+ 如果候选A引起了排序操作，可以考虑候选B，其第二颗星比第一颗星更重要。
+ 取出对于优化器来说不过分复杂的等值谓词列，将其作为索引的前导列（任意顺序皆可）。
+ 以正确的顺序条件order by列（注意正逆序）。忽略前面步骤中已添加的列。
+ 以任意顺序将select语句中其余的列添加到索引中（但要以不易变的开始）。

## 6. 索引有效性评估方法
基本问题法（Basic Question，BQ）
快速上限估算法（Quick Upper-Bound Estimate，QUBE）

### 6.1 基本问题法（BQ）
是否存在包含了where子句所有列（半宽索引）：

+ 否，考虑将缺少的谓词列加到一个现有索引上。保证过滤条件本身不回表，只有匹配后查询数据才回表。
+ 如果还是不理想，考虑索引中添加所有列，产生一个宽索引，不需要回表。
+ 如果select还是很慢，使用候选A/B来设计一个新的索引。

BQ并不能最终保证足够好的性能，但是保证了最小化对表的访问。

### 6.2 快速上限估算法（QUBE）
QUBE方法是悲观的，可能会误报，但不会像BQ那样漏掉发现某些问题。其输出结果是本地响应时间（LRT），即在数据库中的耗时，包括以下：

服务时间
+ CPU时间
+ 磁盘服务时间（同步读、同步写、异步读）
排队时间
+ CPU时间
+ 磁盘排队
+ 锁等待
+ 其他等待

```
LRT = TR * 10ms + TS * 0.01ms + F * 0.1ms

LRT = 本地响应时间
TR  = 随机访问时间
TS  = 顺序访问时间
F   = 有效FETCH的数量
```

### 6.3 QUBE 时间评估
#### 主键索引访问

| 对象  | 操作&耗时 |
| :---: | :-------: |
| 索引  |  TR = 1   |
|  表   |  TR = 1   |
| FETCH | 1 * 0.1ms |

```
LRT = 2 * 10ms + 0.1ms ≈ 20ms
```

#### 聚簇索引访问

预设读取1000条数据，假设索引列有二级能命中，且表中1000数据相邻

| 对象  |     操作&耗时     |
| :---: | :---------------: |
| 索引  | TR = 1, TS = 1000 |
|  表   | TR = 1，TS = 999  |
| FETCH |   1000 * 0.1ms    |

```
LRT = 2 * 10ms + 1999 * 0.01ms + 1000 * 0.1ms ≈ 140ms
```

如果不是相邻的数据依旧会变成1000次随机读取，时间接近10s，如果取10条数据，耗时0.5s左右还是可以接受。

#### 非聚簇索引访问

非聚簇索引会导致1000次回表的随机访问，时间接近10s (1000 * 10ms)，如果是三星索引不回表，还是在0.1s左右。

## 7. Explain

**explain**会查询指定sql的执行计划，输入如下列：

|  id  | select_type | table  | partitions | type | possible_keys | key  | key_len | ref  |  rows   | filtered |    Extra    |
| :--: | :---------: | :----: | :--------: | :--: | :-----------: | :--: | :-----: | :--: | :-----: | :------: | :---------: |
|  1   |   SIMPLE    | t_user |    NULL    | ALL  |     NULL      | NULL |  NULL   | NULL | 4823553 |   0.37   | Using where |

|      列       |                             描述                             |
| :-----------: | :----------------------------------------------------------: |
|      id       | SELECT 查询的标识符. 每个 SELECT 都会自动分配一个唯一的标识符. |
|  select_type  |                      SELECT 查询的类型.                      |
|     table     |                        查询的是哪个表                        |
|  partitions   |                          匹配的分区                          |
|     type      |                          join 类型                           |
| possible_keys |                   此次查询中可能选用的索引                   |
|      key      |                 此次查询中确切使用到的索引.                  |
|      ref      |               哪个字段或常数与 key 一起被使用                |
|     rows      |        显示此查询一共扫描了多少行. 这个是一个估计值.         |
|   filtered    |              表示此查询条件所过滤的数据的百分比              |
|     extra     |                          额外的信息                          |

详细见：[MySQL :: MySQL 8.0 Reference Manual :: 8.8.2 EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html)

## 8. 案例分析

假设有表`t_user`，数据量500W：

```
CREATE TABLE `t_user` (
  `id` varchar(18) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `sex` tinyint(1) DEFAULT NULL,
  `age` int DEFAULT NULL
) ENGINE=InnoDB;
```

### 8.1 分页查询30+的男性，按年龄排序（ASC）：

无索引查询：

```
mysql> SELECT * from t_user where age >= 30 AND sex = 1 ORDER BY age limit 10;
+--------------------+--------+-------------+-----+-----+
| id                 | name   | phone       | sex | age |
+--------------------+--------+-------------+-----+-----+
| 140581********2913 | 王杨   | 182****0046 |   1 |  30 |
| 513224********5818 | 谢珩   | 130****6156 |   1 |  30 |
| 511621********4374 | 向小刚 | 189****0350 |   1 |  30 |
| 412326********0378 | 何文领 | 165****0573 |   1 |  30 |
| 420322********1210 | 梅光丹 | 183****9030 |   1 |  30 |
| 320922********3335 | 徐守林 | 159****4663 |   1 |  30 |
| 350124********2911 | 刘利焱 | 130****4646 |   1 |  30 |
| 510781********5019 | 殷斌   | 136****1685 |   1 |  30 |
| 372323********091X | 李芝鹏 | 189****3378 |   1 |  30 |
| 450702********515X | 裴冬明 | 187****6220 |   1 |  30 |
+--------------------+--------+-------------+-----+-----+
10 rows in set (4.10 sec)
```

#### 设计候选A索引

+ 等值谓词列`sex`
+ 范围谓词列`age`
+ 排序列`age`，已添加可忽略
+ select 语句中的其他列（此处先不添加全部，只添加where条件中的列。因为分页数据有限，回表读取数据本身）

由上生成索引`(sex, age)`。其实这个需求比较简单，有经验的可以快速判定需要什么索引。

```
mysql> SELECT * from t_user where age >= 30 AND sex = 1 ORDER BY age limit 10;
+--------------------+--------+-------------+-----+-----+
| id                 | name   | phone       | sex | age |
+--------------------+--------+-------------+-----+-----+
| 350124********2911 | 刘利焱 | 130****4646 |   1 |  30 |
| 510781********5019 | 殷斌   | 136****1685 |   1 |  30 |
| 511621********4374 | 向小刚 | 189****0350 |   1 |  30 |
| 320922********3335 | 徐守林 | 159****4663 |   1 |  30 |
| 372323********091X | 李芝鹏 | 189****3378 |   1 |  30 |
| 450702********515X | 裴冬明 | 187****6220 |   1 |  30 |
| 140581********2913 | 王杨   | 182****0046 |   1 |  30 |
| 412326********0378 | 何文领 | 165****0573 |   1 |  30 |
| 513224********5818 | 谢珩   | 130****6156 |   1 |  30 |
| 420322********1210 | 梅光丹 | 183****9030 |   1 |  30 |
+--------------------+--------+-------------+-----+-----+
10 rows in set (0.06 sec)
```

|  id  | select_type | table  | partitions | type  | possible_keys |  key  | key_len | ref  |  rows   | filtered |         Extra         |
| :--: | :---------: | :----: | :--------: | :---: | :-----------: | :---: | :-----: | :--: | :-----: | :------: | :-------------------: |
|  1   |   SIMPLE    | t_user |    NULL    | range |     idx_1     | idx_1 |    7    | NULL | 2411776 |  100.00  | Using index condition |

`Using index condition`代表先根据索引过滤，还需要回表查数据。

### 8.2 分页查询30+的男性，按年龄排序，名字模糊查询

#### 使用8.1 中已有索引查询

```
mysql> SELECT * from t_user where age >= 30 AND sex = 1 and name like '%虎%' ORDER BY age limit 10;
+--------------------+--------+-------------+-----+-----+
| id                 | name   | phone       | sex | age |
+--------------------+--------+-------------+-----+-----+
| 330726********2717 | 郑钢虎 | 137****1951 |   1 |  30 |
| 130532********1535 | 王延虎 | 182****0212 |   1 |  30 |
| 622425********123X | 张军虎 | 153****0556 |   1 |  30 |
| 321324********6238 | 钱虎   | 181****9779 |   1 |  30 |
| 341226********6911 | 李飞虎 | 158****3136 |   1 |  30 |
| 330281********7432 | 姚狄虎 | 157****6490 |   1 |  30 |
| 522427********1374 | 徐虎龙 | 185****4225 |   1 |  30 |
| 532101********4857 | 虎虎林 | 182****9620 |   1 |  30 |
| 140525********1934 | 宋虎   | 182****2674 |   1 |  30 |
| 622429********4519 | 黎小虎 |             |   1 |  30 |
+--------------------+--------+-------------+-----+-----+
10 rows in set (0.37 sec)
```

|  id  | select_type | table  | partitions | type  | possible_keys |  key  | key_len | ref  |  rows   | filtered |               Extra                |
| :--: | :---------: | :----: | :--------: | :---: | :-----------: | :---: | :-----: | :--: | :-----: | :------: | :--------------------------------: |
|  1   |   SIMPLE    | t_user |    NULL    | range |     idx_1     | idx_1 |    7    | NULL | 2411776 |  11.11   | Using index condition; Using where |

`Using where`说明过滤时需要回表查询，导致时间上升，由于这里只查询第一个分页，如果查询后续分页时间会飙升：

```
mysql> SELECT * from t_user where age >= 30 AND sex = 1 and name like '%虎%' ORDER BY age limit 1000, 10;
+--------------------+--------+--------------+-----+-----+
| id                 | name   | phone        | sex | age |
+--------------------+--------+--------------+-----+-----+
| 330824********2217 | 汪小虎 | 159****2112  |   1 |  36 |
| 511323********4551 | 唐虎   | 136****5725  |   1 |  36 |
| 310104********1232 | 高晓虎 | 139****1672  |   1 |  36 |
| 612301********4339 | 陈虎   | 134****7397  |   1 |  36 |
| 321302********3394 | 陈太虎 | 139****4623  |   1 |  36 |
| 510125********5610 | 梁虎   | 159****6187  |   1 |  36 |
| 320922********507X | 钱士虎 | 015****20061 |   1 |  36 |
| 320982********0879 | 吉虎   | 139****0101  |   1 |  36 |
| 511324********1298 | 李虎   | 136****6833  |   1 |  36 |
| 500103********6218 | 姜小虎 | 139****1984  |   1 |  36 |
+--------------------+--------+--------------+-----+-----+
10 rows in set (6.48 sec)
```

#### 设计**候选A**索引

这里只添加where条件中的列，故生成索引`(sex, age, name)`:

```
mysql> SELECT * from t_user where age >= 30 AND sex = 1 and name like '%虎%' ORDER BY age limit 1200, 10;
+--------------------+--------+-------------+-----+-----+
| id                 | name   | phone       | sex | age |
+--------------------+--------+-------------+-----+-----+
| 370303********4212 | 李小虎 | 152****5513 |   1 |  36 |
| 362228********0514 | 李小虎 | 135****8594 |   1 |  36 |
| 650102********0718 | 李小虎 | 134****9991 |   1 |  36 |
| 340121********6195 | 李小虎 | 158****3660 |   1 |  36 |
| 341204********0018 | 李小虎 | 137****8781 |   1 |  36 |
| 140211********4753 | 李小虎 |             |   1 |  36 |
| 112722********0295 | 李小虎 |             |   1 |  36 |
| 610103********2810 | 李小虎 | 189****0900 |   1 |  36 |
| 142326********1214 | 李小虎 |             |   1 |  36 |
| 612722********0295 | 李小虎 | 138****3336 |   1 |  36 |
+--------------------+--------+-------------+-----+-----+
10 rows in set (0.77 sec)
```

|  id  | select_type | table  | partitions | type  | possible_keys |  key  | key_len | ref  |  rows   | filtered |         Extra         |
| :--: | :---------: | :----: | :--------: | :---: | :-----------: | :---: | :-----: | :--: | :-----: | :------: | :-------------------: |
|  1   |   SIMPLE    | t_user |    NULL    | range |     idx_1     | idx_1 |    7    | NULL | 2411776 |  11.11   | Using index condition |

虽然**key_len=7**没有变化，但`Using where`消失，说明直接使用了索引进行过滤。

**key_len=7**，由sex(tinyint 1, null 1) + age(int 4, null 1)相加`1 + 1 + 4 + 1`而来，参与初步过滤，name虽然没有参与，但模糊查询直接读取索引中的name不用回表所以很快。

### 8.3 分页查询30+的男性和25+的女性，按年龄排序（ASC）：

由于这个条件`(age > 30 AND sex = 1) or (age > 25 and sex = 0)`对数据库的执行优化器来说，是一个**过分复杂的谓词**，很难优化：

```
mysql> SELECT * from t_user where ((age > 30 AND sex = 1) or (age > 25 and sex = 0))  ORDER BY age limit 10;
+--------------------+--------+-------------+-----+-----+
| id                 | name   | phone       | sex | age |
+--------------------+--------+-------------+-----+-----+
| 522729********4269 | 杨李艳 | 182****7864 |   0 |  26 |
| 440982********6023 | 颜颖颖 | 184****4200 |   0 |  26 |
| 522622********2545 | 冉绿燕 | 180****0535 |   0 |  26 |
| 150424********302X | 王静   | 151****6500 |   0 |  26 |
| 510521********8043 | 邓勤丽 | 177****7116 |   0 |  26 |
| 522229********5823 | 江兰   | 178****6860 |   0 |  26 |
| 450902********2025 | 李珍英 | 177****0502 |   0 |  26 |
| 370302********3645 | 孙永新 | 155****6552 |   0 |  26 |
| 130535********1423 | 卢明珠 | 155****5008 |   0 |  26 |
| 452427********3762 | 毕伶君 | 178****4426 |   0 |  26 |
+--------------------+--------+-------------+-----+-----+
10 rows in set (3.46 sec)
```

|  id  | select_type | table  | partitions | type | possible_keys | key  | key_len | ref  |  rows   | filtered |            Extra            |
| :--: | :---------: | :----: | :--------: | :--: | :-----------: | :--: | :-----: | :--: | :-----: | :------: | :-------------------------: |
|  1   |   SIMPLE    | t_user |    NULL    | ALL  |     idx_1     | NULL |  NULL   | NULL | 4823553 |  100.00  | Using where; Using filesort |

此次`key_len = 0`，说明没有索引参与，`Using filesort`排序也是查询慢的很大因素。

## 9.更多

- **书籍**：[数据库索引设计与优化](https://book.douban.com/subject/26419771/)
- **书籍**：[数据密集型应用系统设计](https://book.douban.com/subject/30329536/)