# SQL 1. 基本構文

[目次](../index.md) | [次: 権限と GRANT OPTION →](02-grant.md)

---

> 標準 SQL を基本にし、**PostgreSQL** と **MySQL** で書き方が違う箇所には注記を付けています。

## 1.1 SQL の分類

| 分類 | 役割 | 主な文 |
|------|------|-------|
| DDL（データ定義） | 表などの構造を作る・変える | `CREATE` `ALTER` `DROP` `TRUNCATE` |
| DML（データ操作） | データを読み書きする | `SELECT` `INSERT` `UPDATE` `DELETE` |
| DCL（データ制御） | 権限を与える・取り上げる | `GRANT` `REVOKE`（[2章](02-grant.md)） |
| TCL（トランザクション制御） | 変更を確定・取り消す | `BEGIN` `COMMIT` `ROLLBACK` `SAVEPOINT` |

## 1.2 表を作る（CREATE TABLE）

```sql
CREATE TABLE departments (
    id    INTEGER PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE employees (
    id            INTEGER PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id),  -- 外部キー
    salary        INTEGER CHECK (salary >= 0),
    hired_on      DATE DEFAULT CURRENT_DATE
);
```

| 制約 | 意味 |
|------|------|
| `PRIMARY KEY` | 主キー（重複なし・NULL なし） |
| `NOT NULL` | NULL を入れられない |
| `UNIQUE` | 重複を許さない |
| `REFERENCES 表(列)` | 外部キー（参照先に存在する値だけ入れられる） |
| `CHECK (条件)` | 条件を満たす値だけ入れられる |
| `DEFAULT 値` | 値を省略したときの既定値 |

連番の主キー:

```sql
-- PostgreSQL（標準 SQL の書き方）
id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
-- MySQL
id INT AUTO_INCREMENT PRIMARY KEY
```

### 構造の変更・削除

```sql
ALTER TABLE employees ADD COLUMN email VARCHAR(255);
ALTER TABLE employees DROP COLUMN email;
DROP TABLE IF EXISTS employees;   -- 表ごと削除
TRUNCATE TABLE employees;         -- 中身だけ全削除（構造は残る）
```

## 1.3 データを入れる・変える・消す

```sql
INSERT INTO departments (id, name) VALUES (1, '開発'), (2, '営業');

INSERT INTO employees (id, name, department_id, salary)
VALUES (1, '佐藤', 1, 400000);

UPDATE employees SET salary = salary + 10000 WHERE id = 1;

DELETE FROM employees WHERE id = 1;
```

!!! danger "UPDATE / DELETE の WHERE 忘れ"
    `WHERE` を書き忘れると **全行** が更新・削除されます。
    本番環境では、先に同じ条件で `SELECT` を実行して対象の行を確認するか、トランザクションの中で実行して結果を確かめてから `COMMIT` します。

## 1.4 データを読む（SELECT）

### 書く順番と実行される順番

```sql
SELECT   department_id, COUNT(*) AS cnt, AVG(salary) AS avg_salary  -- 5
FROM     employees                                                   -- 1
WHERE    hired_on >= '2020-01-01'                                    -- 2
GROUP BY department_id                                               -- 3
HAVING   COUNT(*) >= 3                                               -- 4
ORDER BY avg_salary DESC                                             -- 6
LIMIT    10;                                                         -- 7
```

右端の番号は、処理される論理的な順番です。

- `WHERE` は `SELECT` より先に処理されるので、`WHERE` では `SELECT` で付けた別名（`avg_salary` など）は使えません。
- 集計結果での絞り込みは `WHERE` ではなく `HAVING` で行います。
- `ORDER BY` は `SELECT` のあとに処理されるので、別名を使えます。

### よく使う条件

| 書き方 | 意味 |
|-------|------|
| `=` `<>` `<` `>` `<=` `>=` | 比較（`<>` は「等しくない」。`!=` も多くの DB で使える） |
| `BETWEEN 1 AND 10` | 1 以上 10 以下 |
| `IN (1, 2, 3)` | いずれかに一致 |
| `LIKE '佐%'` | 前方一致（`%` は任意の文字列、`_` は任意の 1 文字） |
| `IS NULL` / `IS NOT NULL` | NULL かどうか |
| `AND` `OR` `NOT` | 論理演算 |

!!! warning "NULL は `= NULL` では比較できない"
    `WHERE x = NULL` は常に真になりません。必ず `x IS NULL` と書きます。
    `NOT IN (サブクエリ)` のサブクエリ結果に NULL が含まれると、1 行も返らなくなる点にも注意が必要です。

### 集計関数

| 関数 | 内容 |
|------|------|
| `COUNT(*)` | 行数 |
| `COUNT(列)` | NULL でない値の数 |
| `SUM(列)` `AVG(列)` | 合計、平均（NULL は無視） |
| `MIN(列)` `MAX(列)` | 最小、最大 |

## 1.5 結合（JOIN）

```sql
SELECT e.name, d.name AS department
FROM employees AS e
INNER JOIN departments AS d ON e.department_id = d.id;
```

| 結合 | 結果に残る行 |
|------|-------------|
| `INNER JOIN` | 両方の表に対応する行があるものだけ |
| `LEFT JOIN` | 左の表は全行。右に対応がなければ右の列は NULL |
| `RIGHT JOIN` | 右の表は全行（LEFT JOIN の左右逆） |
| `FULL OUTER JOIN` | 両方の全行（MySQL は未対応） |
| `CROSS JOIN` | すべての組み合わせ |

```sql
-- 所属する社員がいない部署を探す（LEFT JOIN + IS NULL の定番）
SELECT d.name
FROM departments AS d
LEFT JOIN employees AS e ON e.department_id = d.id
WHERE e.id IS NULL;
```

## 1.6 サブクエリと WITH 句

```sql
-- 平均より給料が高い社員
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 存在チェック
SELECT d.name
FROM departments AS d
WHERE EXISTS (SELECT 1 FROM employees AS e WHERE e.department_id = d.id);

-- WITH 句（共通テーブル式）で中間結果に名前を付ける
WITH dept_avg AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.name, e.salary, a.avg_salary
FROM employees AS e
JOIN dept_avg AS a ON a.department_id = e.department_id
WHERE e.salary > a.avg_salary;
```

> MySQL で WITH 句が使えるのは 8.0 以降です。

## 1.7 ウィンドウ関数

行をまとめずに、グループ内での順位や累計を出せます。

```sql
SELECT name, department_id, salary,
       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank_in_dept,
       SUM(salary) OVER (ORDER BY id) AS running_total
FROM employees;
```

| 関数 | 内容 |
|------|------|
| `ROW_NUMBER()` | 1, 2, 3, ...（同順位なし） |
| `RANK()` | 同順位があると次の順位を飛ばす（1, 1, 3） |
| `DENSE_RANK()` | 同順位があっても飛ばさない（1, 1, 2） |
| `LAG(列)` / `LEAD(列)` | 前の行 / 次の行の値 |

> MySQL でウィンドウ関数が使えるのは 8.0 以降です。

## 1.8 トランザクション

```sql
BEGIN;   -- MySQL では START TRANSACTION も使える
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;  -- 確定。途中で問題があれば ROLLBACK で取り消す
```

- PostgreSQL では `CREATE TABLE` などの DDL もトランザクションの中で取り消せます。
- MySQL では DDL を実行すると、その時点で自動的にコミットされます（`ROLLBACK` で戻せません）。

## 1.9 インデックス

```sql
CREATE INDEX idx_employees_department ON employees (department_id);
DROP INDEX idx_employees_department;                 -- PostgreSQL
DROP INDEX idx_employees_department ON employees;    -- MySQL
```

- `WHERE` や `JOIN` の条件によく使う列に作ると、検索が速くなります。
- その代わり、`INSERT` / `UPDATE` は少し遅くなります。
- 実際に使われているかは `EXPLAIN SELECT ...` で確認できます。

## 1.10 SQL インジェクション対策

アプリから SQL を組み立てるときは、入力値を文字列連結で埋め込まず、**プレースホルダ（パラメータ化クエリ）** を使います。

```python
# NG：入力に ' OR '1'='1 などを入れられると条件を書き換えられる
cur.execute("SELECT * FROM users WHERE name = '" + name + "'")

# OK：値はドライバが安全に渡す（プレースホルダの記号はドライバによって ? や %s など）
cur.execute("SELECT * FROM users WHERE name = %s", (name,))
```

アプリが使う DB ユーザーの権限を必要最小限にしておくと、万が一インジェクションが起きても被害を小さくできます（[2章](02-grant.md)）。

## 参考資料

- [型変換の早見表](../appendix/type-conversion.md) — この言語を含む各言語の型変換の例
- [PostgreSQL 文書（日本語）](https://www.postgresql.jp/document/)
- [PostgreSQL Documentation: SQL Commands](https://www.postgresql.org/docs/current/sql-commands.html)
- [MySQL 8.4 Reference Manual: SQL Statements](https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html)
