# MySql索引的使用

```meta
date: 2017-08-07
title: 分页查询时SQL优化
title_en: sql_optimization_for_paging_query
author: snowtraces
id: 00006
old_id: 66289
tags:
    - mysql
category: 数据库
status: public
```
业务上表数据由百万上升到千万级别，涉及到多表联合分页查询，结果是查询超时。问题在于`JOIN`和`ORDER`的条件字段不一致，导致一个索引失效，排序时遍历了千万级别的中间表，最终超时。

解决办法有两个：让索引都生效或减小排序时中间表的长度。前者可以通过联合索引实现，各个数据库支持度不详；后者可以通过先查询出一部分结果再JOIN，中间表的长度有限效率就不是问题。项目中使用mysql，本文就以mysql为例说明。

## mysql 语句的执行流程
来源：[MySQL的语句执行顺序](http://www.cnblogs.com/rollenholt/p/3776923.html)

```markup
(8) SELECT (9) DISTINCT<select_list>
(1) FROM<left_table>
(3) <join_type>JOIN<right_table>
(2) ON<join_condition>
(4) WHERE<where_condition>
(5)	GROUP BY<group_by_list>
(6) WITH{CUBE|ROLLUP}
(7) HAVING<having_condition>
(10) ORDER BY<ordr_by_list>
(11) LIMIT<limit_number>
```
+ FORM: 对FROM的左边的表和右边的表计算笛卡尔积。产生虚表VT1
+ ON: 对虚表VT1进行ON筛选，只有那些符合<join-condition>的行才会被记录在虚表VT2中。
+ JOIN： 如果指定了OUTER JOIN（比如left join、 right join），那么保留表中未匹配的行就会作为外部行添加到虚拟表VT2中，产生虚拟表VT3, rug from子句中包含两个以上的表的话，那么就会对上一个join连接产生的结果VT3和下一个表重复执行步骤1~3这三个步骤，一直到处理完所有的表为止。
+ WHERE： 对虚拟表VT3进行WHERE条件过滤。只有符合<where-condition>的记录才会被插入到虚拟表VT4中。
+ GROUP BY: 根据group by子句中的列，对VT4中的记录进行分组操作，产生VT5.
+ CUBE | ROLLUP: 对表VT5进行cube或者rollup操作，产生表VT6.
+ HAVING： 对虚拟表VT6应用having过滤，只有符合<having-condition>的记录才会被 插入到虚拟表VT7中。
+ SELECT： 执行select操作，选择指定的列，插入到虚拟表VT8中。
+ DISTINCT： 对VT8中的记录进行去重。产生虚拟表VT9.
+ ORDER BY: 将虚拟表VT9中的记录按照<order_by_list>进行排序操作，产生虚拟表VT10.
+ LIMIT：取出指定行的记录，产生虚拟表VT11, 并将结果返回。
个人觉得，以上只是执行流程而已，帮助理解很好，具体的执行优化等远远不止于此。

## sql查询优化
假设有表`table_a`，存在字段`id`、`name`和`age`，其中主键id有索引（默认），其余未设置索引。单表分页查询中，如果按`id`排序，结果是秒开；换成`age`排序后，由于没有索引，此时需要遍历整个表，随着表数据的增加查询会越来越慢，针对这种情况，只要为`age`设置索引即可。

现在又有表`table_b`，存在字段`id`和`sex`，其中主键`id`有索引（默认），其余未设置索引。现在需要多表查询，结果为`id`、`name`、`age`和`sex`。查询语句如下：
```sql
SELECT 
    a.id,
    a.name,
    a.age,
    b.sex
FROM
    table_a a
LEFT JOIN table_b b USING (id)
ORDER BY a.age ASC
LIMIT 0,10
```
以上因为对`age`排序，我们先对`age`设置好索引，但由于`LEFT JOIN`使用了不一样的索引，所以`age`和`id`的索引并不能同时生效，除非设置联合索引，以下的讨论均为不设置联合索引的情况。新的查询语句如下：

```sql
SELECT 
    a.id,
    a.name,
    a.age,
    b.sex
FROM
(
    SELECT 
        id,
        name,
        age,
        sex
    FROM
        table_a
    ORDER BY age ASC
    LIMIT 0,10
) a
LEFT JOIN table_b b USING (id)
ORDER BY age ASC
```
现在我们先使用万恶的子查询，但过程中使用了`age`索引进行排序，效率有保证，最后又一次排序，是因为`JOIN`过程中mysql的优化算法导致乱序了，这10条数据用不用索引都不是重点了。

