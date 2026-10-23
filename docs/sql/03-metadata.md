# SQL 3. DB・テーブル・カラムの確認方法と information_schema

[← 前: 権限と GRANT OPTION](02-grant.md) | [目次](../index.md)

---

> **PostgreSQL** と **MySQL** を中心に、**SQL Server** と **SQLite** の書き方も並べています。`<dbname>`、`<table>` などは自分の環境の名前に置き換えてください。

## 3.1 用語の整理

DB 製品によって、同じ言葉が違うものを指すことがあります。

| 標準 SQL の用語 | PostgreSQL | MySQL | SQL Server |
|---------------|-----------|-------|-----------|
| カタログ（catalog） | データベース | （該当なし。常に `def`） | データベース |
| スキーマ（schema） | スキーマ（DB の中の名前空間。既定は `public`） | **データベースと同じ意味** | スキーマ |
| テーブル | テーブル | テーブル | テーブル |

- PostgreSQL と SQL Server は「データベース → スキーマ → テーブル」の3階層です。
- MySQL は「データベース（＝スキーマ）→ テーブル」の2階層です。`SHOW SCHEMAS` は `SHOW DATABASES` と同じ意味です。

## 3.2 今どこに接続しているか

| 確認したいこと | PostgreSQL | MySQL | SQL Server |
|--------------|-----------|-------|-----------|
| 今の DB | `SELECT current_database();` | `SELECT DATABASE();` | `SELECT DB_NAME();` |
| 今のユーザー | `SELECT current_user;` | `SELECT CURRENT_USER();` | `SELECT SUSER_NAME();` |
| サーバーの版 | `SELECT version();` | `SELECT VERSION();` | `SELECT @@VERSION;` |
| 接続の詳細 | `\conninfo`（psql） | `status`（mysql クライアント） | |

## 3.3 データベースの一覧

```sql
-- PostgreSQL
\l                                         -- psql のメタコマンド（\l+ でサイズも表示）
SELECT datname FROM pg_database;           -- SQL で取得

-- MySQL
SHOW DATABASES;                            -- SHOW SCHEMAS でも同じ
SHOW DATABASES LIKE 'app%';                -- 名前で絞り込み
SELECT schema_name FROM information_schema.schemata;

-- SQL Server
SELECT name FROM sys.databases;
```

!!! note "見えるのは権限がある DB だけ"
    MySQL の `SHOW DATABASES` は、何らかの権限を持っている DB だけを表示します（グローバルな `SHOW DATABASES` 権限を持っている場合は全部）。
    サーバーを `--skip-show-database` で起動すると、`SHOW DATABASES` 権限がない人はこの文を使えなくなります。

### DB を切り替える

```sql
\c <dbname>          -- PostgreSQL（psql）
USE <dbname>;        -- MySQL、SQL Server
```

## 3.4 テーブルの一覧

```sql
-- PostgreSQL
\dt                                        -- 今の検索パス（search_path）のテーブル
\dt <schema>.*                             -- スキーマを指定
\dn                                        -- スキーマの一覧
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- MySQL
SHOW TABLES;                               -- 今の DB
SHOW TABLES FROM <dbname>;
SHOW FULL TABLES;                          -- テーブルかビューかも表示
SELECT table_name, table_type, engine
FROM information_schema.tables
WHERE table_schema = '<dbname>'      -- 一時テーブル（TEMPORARY）は表示されない
ORDER BY table_name;

-- SQL Server
SELECT table_schema, table_name
FROM INFORMATION_SCHEMA.TABLES
WHERE table_type = 'BASE TABLE';

-- SQLite
.tables                                    -- sqlite3 コマンドのドットコマンド
SELECT name FROM sqlite_schema WHERE type = 'table';   -- 古い名前 sqlite_master でも可
```

`information_schema.tables` の `table_type` の値:

| 値 | 意味 |
|----|------|
| `BASE TABLE` | 普通のテーブル |
| `VIEW` | ビュー |
| `FOREIGN` | 外部テーブル（PostgreSQL） |
| `LOCAL TEMPORARY` | 一時テーブル（PostgreSQL） |
| `SYSTEM VIEW` | システムのビュー（MySQL の information_schema 自体など） |

## 3.5 カラム（列）の確認

```sql
-- PostgreSQL
\d <table>                                 -- 列・型・インデックス・制約をまとめて表示
\d+ <table>                                -- コメントや格納方式も表示

-- MySQL
SHOW COLUMNS FROM <table>;                 -- DESCRIBE <table>; でもほぼ同じ情報
SHOW FULL COLUMNS FROM <table>;            -- 照合順序・自分の権限・コメントも表示
SHOW CREATE TABLE <table>;                 -- テーブルを作る SQL 文そのものを表示
SHOW INDEX FROM <table>;                   -- インデックス

-- SQLite
PRAGMA table_info('<table>');
SELECT sql FROM sqlite_schema WHERE name = '<table>';   -- CREATE 文を表示
```

どの DB でも使える書き方（information_schema）:

```sql
SELECT column_name, data_type, character_maximum_length,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '<schema>'      -- MySQL では DB 名
  AND table_name   = '<table>'
ORDER BY ordinal_position;           -- テーブルに定義された順
```

MySQL の `SHOW COLUMNS` の `Key` 欄の読み方:

| 値 | 意味 |
|----|------|
| `PRI` | 主キー（または複数列の主キーの一部） |
| `UNI` | 一意（UNIQUE）インデックスの先頭の列 |
| `MUL` | 重複を許すインデックスの先頭の列 |
| 空欄 | インデックスなし（または複数列インデックスの2番目以降の列） |

### 列名からテーブルを探す

```sql
-- 「email」という名前を含む列が、どのテーブルにあるか
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%email%'
ORDER BY table_schema, table_name;
```

## 3.6 制約・キー・外部キーの確認

```sql
-- テーブルの制約の一覧（主キー・一意・外部キー・CHECK）
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = '<schema>' AND table_name = '<table>';

-- どの列にどの制約が付いているか
SELECT constraint_name, column_name, ordinal_position
FROM information_schema.key_column_usage
WHERE table_schema = '<schema>' AND table_name = '<table>'
ORDER BY constraint_name, ordinal_position;

-- 外部キーの参照先（MySQL）
SELECT column_name, referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = '<dbname>' AND table_name = '<table>'
  AND referenced_table_name IS NOT NULL;
```

> `referenced_table_name` と `referenced_column_name` は MySQL 独自の列です。PostgreSQL では `information_schema.referential_constraints` と `constraint_column_usage` を組み合わせるか、`\d <table>` で確認します。

## 3.7 information_schema とは

**information_schema** は、DB の中にどんなデータベース・テーブル・列・制約・権限があるかを表す **読み取り専用のビューの集まり** です。

- **SQL の標準規格で定められている** ので、PostgreSQL・MySQL・SQL Server で共通の書き方が使えます。
- 中身は実際のデータではなく **メタデータ（データについてのデータ）** です。
- ビューなので、`INSERT` / `UPDATE` / `DELETE` はできません。テーブルを作ったり消したりすると、自動的に内容が変わります。
- **表示されるのは、自分が権限を持っているオブジェクトだけ** です（PostgreSQL・MySQL・SQL Server とも同じ）。

```
information_schema
├── schemata           スキーマ（MySQL では DB）の一覧
├── tables             テーブル・ビューの一覧
│   └── columns        各テーブルの列
├── views              ビューの定義
├── table_constraints  制約（主キー・一意・外部キー・CHECK）
│   ├── key_column_usage         制約が付いている列
│   └── referential_constraints  外部キーの参照関係
├── routines           ストアドプロシージャ・関数
├── triggers           トリガー
└── *_privileges       権限（テーブル・列・ルーチンなど）
```

### 主なビューと役割

| ビュー | 役割 | PostgreSQL | MySQL | SQL Server |
|-------|------|:---:|:---:|:---:|
| `schemata` | スキーマ（MySQL では DB）の一覧 | ○ | ○ | ○ |
| `tables` | テーブル・ビューの一覧 | ○ | ○ | ○ |
| `columns` | 列の名前・型・NULL 可否・既定値 | ○ | ○ | ○ |
| `views` | ビューの定義 | ○ | ○ | ○ |
| `table_constraints` | テーブルの制約の一覧 | ○ | ○ | ○ |
| `key_column_usage` | 制約が付いている列 | ○ | ○ | ○ |
| `referential_constraints` | 外部キーの情報 | ○ | ○ | ○ |
| `routines` | ストアドプロシージャ・関数 | ○ | ○ | ○ |
| `triggers` | トリガー | ○ | ○ | |
| `table_privileges` | テーブルの権限 | ○ | ○ | ○ |
| `column_privileges` | 列の権限 | ○ | ○ | ○ |
| `statistics` | インデックスの情報 | | ○ | |
| `user_privileges` | ユーザーごとのグローバル権限 | | ○ | |
| `processlist` | 実行中の処理 | | ○ | |
| `role_table_grants` | ロールに与えたテーブル権限 | ○ | | |

### 各 DB 独自のカタログとの関係

information_schema は標準に合わせた「共通の窓口」です。各 DB 独自の機能の情報は、それぞれのシステムカタログで確認します。

| DB | 独自のカタログ | 内容 |
|----|--------------|------|
| PostgreSQL | `pg_catalog`（`pg_database`、`pg_class`、`pg_roles` など） | PostgreSQL 独自の機能（ロールの属性、テーブルの格納情報など）。information_schema には出てこない |
| MySQL | `SHOW` 文、`mysql` データベース | `SHOW` 文は information_schema と同じ情報を返す。どちらも同じ権限の制限を受ける |
| SQL Server | カタログビュー（`sys.databases`、`sys.tables` など） | SQL Server 独自の情報 |
| SQLite | `sqlite_schema` テーブル、`PRAGMA` | SQLite には information_schema がない |

## 3.8 セキュリティとの関係

information_schema は、攻撃者にとっても「DB の地図」になります。SQL インジェクションの脆弱性があると、攻撃者はまず information_schema を読んで、どんなテーブルや列（`users`、`password` など）があるかを調べようとします。

対策の考え方:

1. **SQL インジェクションを防ぐ**：プリペアドステートメントを使います（[PHP 2章](../php/02-security.md)、[1章](01-syntax.md)）。
2. **権限を最小にする**：information_schema に表示されるのは権限があるオブジェクトだけです。アプリ用のユーザーに必要な DB・テーブルの権限だけを与えれば、仮に読まれても見える範囲が限られます（[2章](02-grant.md)）。
3. **DB 名の一覧も見せない設定を検討する**：
    - MySQL：サーバーを `--skip-show-database` で起動すると、権限のないユーザーは `SHOW DATABASES` を使えなくなります。
    - SQL Server：既定では public ロールが `VIEW ANY DATABASE` 権限を持ち、全ログインが DB の一覧を見られます。`REVOKE VIEW ANY DATABASE FROM public;` などで止められます（接続中の DB は常に見えます）。
4. **ログを確認する**：アプリの通常の処理では、ふつう information_schema を読みません。アプリ用ユーザーから information_schema への問い合わせが記録されていたら、調査の手掛かりになります。

> 脆弱性の確認は、自分の環境か、許可を得た環境だけで行ってください。

## 参考資料

- [PostgreSQL: The Information Schema](https://www.postgresql.org/docs/current/information-schema.html) / [tables](https://www.postgresql.org/docs/current/infoschema-tables.html) / [columns](https://www.postgresql.org/docs/current/infoschema-columns.html) / [psql](https://www.postgresql.org/docs/current/app-psql.html)
- [MySQL 8.4: INFORMATION_SCHEMA Introduction](https://dev.mysql.com/doc/refman/8.4/en/information-schema-introduction.html) / [Table Reference](https://dev.mysql.com/doc/refman/8.4/en/information-schema-table-reference.html) / [SHOW DATABASES](https://dev.mysql.com/doc/refman/8.4/en/show-databases.html) / [SHOW COLUMNS](https://dev.mysql.com/doc/refman/8.4/en/show-columns.html)
- [SQL Server: sys.databases](https://learn.microsoft.com/ja-jp/sql/relational-databases/system-catalog-views/sys-databases-transact-sql) / [DB_NAME](https://learn.microsoft.com/ja-jp/sql/t-sql/functions/db-name-transact-sql)
- [SQL Server: System Information Schema Views](https://learn.microsoft.com/ja-jp/sql/relational-databases/system-information-schema-views/system-information-schema-views-transact-sql)
- [SQLite: The Schema Table](https://www.sqlite.org/schematab.html) / [PRAGMA](https://www.sqlite.org/pragma.html)
