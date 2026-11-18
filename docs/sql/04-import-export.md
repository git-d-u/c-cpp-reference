# SQL 4. ファイルの読み込みと出力

[← 前: DB・テーブル・カラムの確認と information_schema](03-metadata.md) | [目次](../index.md) | [次: ユーザーと権限の一覧を確認する →](05-users.md)

---

> **PostgreSQL**（`psql`）と **MySQL**（`mysql`）を中心に、**SQLite** の書き方も並べています。`<user>`、`<dbname>`、`<table>` などは自分の環境の名前に置き換えてください。

## 4.1 まず押さえること：ファイルは「どのマシン」にあるのか

DB の操作は、**クライアント**（`psql` や `mysql` を動かしているマシン）と **サーバー**（DB が動いているマシン）に分かれています。ファイルを読み書きする方法も、どちら側のファイルを扱うかで2種類に分かれます。

```
 クライアント（自分の PC など）                サーバー（DB が動いているマシン）
┌─────────────────────────┐            ┌─────────────────────────────┐
│ psql / mysql            │  ネットワーク │ PostgreSQL / MySQL           │
│ ・\copy                 │ ◀────────▶ │ ・COPY（ファイル名を指定）       │
│ ・LOAD DATA LOCAL       │            │ ・LOAD DATA（LOCAL なし）       │
│ ・mysql -e … > ファイル  │            │ ・SELECT … INTO OUTFILE        │
│   ↑ クライアント側のファイル │            │   ↑ サーバー側のファイル         │
└─────────────────────────┘            └─────────────────────────────┘
```

| | クライアント側のファイル | サーバー側のファイル |
|--|----------------------|------------------|
| PostgreSQL | `\copy`（psql のコマンド） | `COPY … FROM / TO 'ファイル'` |
| MySQL | `LOAD DATA LOCAL INFILE`、`mysql -e "…" > ファイル` | `LOAD DATA INFILE`、`SELECT … INTO OUTFILE` |
| 必要な権限 | テーブルの権限と、ローカルのファイルを読み書きする OS の権限 | **特別な権限**（4.6） |

サーバー側のファイルを読み書きできる権限は強力です。サーバーのファイルを読まれたり書かれたりするおそれがあるため、普段はクライアント側の方法を使います。

## 4.2 SQL ファイルを実行する

### PostgreSQL

```bash
psql -h localhost -U <user> -d <dbname> -f schema.sql        # ファイルの SQL を実行
psql -U <user> -d <dbname> -c "SELECT count(*) FROM <table>;" # 1つのコマンドを実行
```

```sql
-- psql の中から実行する
\i schema.sql
```

| オプション | 意味 |
|-----------|------|
| `-h` / `-p` | 接続先のホスト / ポート |
| `-U` | ユーザー名 |
| `-d` | データベース名 |
| `-f ファイル` | ファイルの SQL を実行して終了 |
| `-c "SQL"` | 指定した SQL（またはバックスラッシュコマンド）を1つ実行して終了 |

### MySQL

```bash
mysql -u <user> -p <dbname> < schema.sql           # 標準入力から SQL を流し込む（-p だけならパスワードを聞かれる）
mysql -u <user> -p -e "SELECT COUNT(*) FROM <table>;" <dbname>
```

```sql
-- mysql クライアントの中から実行する
SOURCE schema.sql;
```

### SQLite

```bash
sqlite3 app.db < schema.sql
```

```text
sqlite> .read schema.sql
```

## 4.3 CSV などのファイルを取り込む

### PostgreSQL：`\copy`（クライアント側のファイル）

```sql
\copy <table> FROM 'users.csv' WITH (FORMAT csv, HEADER true)
\copy <table> (name, email) FROM 'users.csv' WITH (FORMAT csv, HEADER true)   -- 列を指定
```

- `\copy` は psql のコマンドで、**psql を動かしているマシンのファイル** を読み、サーバーへ送ります。
- ファイルの読み書きは、DB ではなく **ローカルの OS ユーザーの権限** で行われるので、DB のスーパーユーザー権限は要りません（取り込み先のテーブルに `INSERT` 権限は必要）。
- `\copy` は行末までが1つのコマンドなので、末尾に `;` は不要で、途中で改行もできません。

### PostgreSQL：`COPY`（サーバー側のファイル）

```sql
COPY <table> FROM '/var/lib/postgresql/import/users.csv' WITH (FORMAT csv, HEADER true);
```

- ファイルの場所は **サーバーのマシン上** で、PostgreSQL のサーバープロセス（OS ユーザー）が読める必要があります。
- ファイル名を指定する `COPY` を実行できるのは、**スーパーユーザー** か、`pg_read_server_files`（読み込み）・`pg_write_server_files`（書き出し）のロールを持つユーザーだけです（4.6）。

### MySQL：`LOAD DATA`

```sql
-- クライアント側のファイル（LOCAL）
LOAD DATA LOCAL INFILE 'users.csv'
INTO TABLE <table>
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES                -- 1行目（見出し）を飛ばす
(name, email);                -- 取り込む列

-- サーバー側のファイル（LOCAL なし）
LOAD DATA INFILE '/var/lib/mysql-files/users.csv' INTO TABLE <table> ...;
```

| | `LOAD DATA LOCAL INFILE` | `LOAD DATA INFILE` |
|--|-----------------------|------------------|
| ファイルの場所 | クライアント | サーバー |
| 必要な権限 | テーブルの権限（`FILE` 権限は不要） | **`FILE` 権限** |
| 使える条件 | サーバーとクライアントの **両方** で `local_infile` が有効なこと | `secure_file_priv` で許可された場所のファイルであること |

- MySQL 8.4 のサーバーは、既定で `local_infile` が **無効** です。MySQL のバイナリ配布版のクライアントライブラリも、既定では無効です。使うときは、サーバー側で `local_infile` を有効にし、クライアントを `mysql --local-infile=1` で起動します。片方でも無効だと、エラー（ERROR 3950）になります。
- `LOCAL` を付けると、重複したキーなどの扱いは `IGNORE` を付けたときと同じになります（`REPLACE` を付けない限り）。

!!! danger "LOAD DATA LOCAL の注意"
    `LOAD DATA LOCAL` では、**サーバーがクライアントにファイルを送るよう要求する** 仕組みになっています。悪意のあるサーバーに接続すると、クライアントが読めるファイルを送らされるおそれがあると、MySQL の公式マニュアルで注意されています。

    - 信頼できないサーバーには `--local-infile` を有効にして接続しない
    - Web アプリから使う場合、Web サーバーのプロセスが読めるファイルが読まれる危険がある
    - 必要なときだけ有効にし、終わったら無効に戻す

### SQLite

```text
sqlite> .mode csv
sqlite> .import users.csv <table>
```

## 4.4 結果をファイルに出力する

### PostgreSQL

```sql
-- クライアント側に CSV で保存
\copy (SELECT id, name FROM <table> WHERE active) TO 'active_users.csv' WITH (FORMAT csv, HEADER true)

-- 以降のクエリ結果をファイルに書く（\o だけで画面に戻す）
\o result.txt
SELECT * FROM <table>;
\o
```

```bash
# コマンドラインから CSV で出力
psql -U <user> -d <dbname> --csv -c "SELECT id, name FROM <table>;" > users.csv

# 列名や件数を付けず、| 区切りで値だけを出す（スクリプトで扱いやすい）
psql -U <user> -d <dbname> -A -t -F '|' -c "SELECT id, name FROM <table>;"
```

| オプション | 意味 |
|-----------|------|
| `--csv` | CSV 形式で出力 |
| `-A` | 列をそろえない（区切り文字だけで並べる） |
| `-F 文字` | `-A` のときの区切り文字 |
| `-t` | 列名と件数の行を出さない（値だけ） |

### MySQL

```bash
# クライアント側に保存する（タブ区切り。-B は --batch、-N は列名を出さない）
mysql -u <user> -p -B -N -e "SELECT id, name FROM <table>;" <dbname> > users.tsv
```

```sql
-- サーバー側にファイルを作る（FILE 権限が必要）
SELECT id, name FROM <table>
INTO OUTFILE '/var/lib/mysql-files/users.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

`SELECT … INTO OUTFILE` の決まり:

- ファイルは **サーバーのマシン上** に作られます。
- **すでにあるファイルは指定できません**（上書きできない）。`/etc/passwd` のような重要なファイルを書き換えられないようにするためです。
- 作られたファイルの所有者は、MySQL サーバーを動かしている OS ユーザーになります。
- `secure_file_priv` にディレクトリが設定されている場合は、そのディレクトリの中にしか作れません。

### SQLite

```text
sqlite> .headers on
sqlite> .mode csv
sqlite> .output users.csv
sqlite> SELECT id, name FROM <table>;
sqlite> .output stdout
```

## 4.5 バックアップ（ダンプ）と復元

### PostgreSQL

```bash
pg_dump -U <user> -d <dbname> -f backup.sql             # SQL 文の形でバックアップ
psql    -U <user> -d <dbname> -f backup.sql             # 復元

pg_dump -U <user> -d <dbname> -Fc -f backup.dump        # 独自形式（圧縮される）
pg_restore -U <user> -d <dbname> backup.dump            # 独自形式は pg_restore で復元

pg_dump -U <user> -d <dbname> -t <table> -f table.sql   # 特定のテーブルだけ
pg_dumpall -U <user> -f all.sql                         # 全 DB とロールなど
```

### MySQL

```bash
mysqldump -u <user> -p <dbname> > backup.sql             # バックアップ
mysqldump -u <user> -p <dbname> <table> > table.sql      # 特定のテーブルだけ
mysql     -u <user> -p <dbname> < backup.sql             # 復元
```

### SQLite

```bash
sqlite3 app.db .dump > backup.sql      # SQL 文の形でバックアップ
sqlite3 new.db < backup.sql            # 復元
```

!!! warning "バックアップファイルの扱い"
    ダンプには、テーブルの中身がすべて入っています。個人情報やパスワードのハッシュを含むことも多いので、ファイルの権限を絞り（`chmod 600 backup.sql` など）、Git などに入れないようにします。

## 4.6 セキュリティ：ファイルを扱う権限は強力

### PostgreSQL のサーバー側ファイル操作

| ロール | できること |
|-------|----------|
| スーパーユーザー | すべて |
| `pg_read_server_files` | `COPY` などでサーバー上のファイルを読む |
| `pg_write_server_files` | `COPY` などでサーバー上にファイルを書く |
| `pg_execute_server_program` | `COPY … PROGRAM` でサーバー上のコマンドを実行する |

```sql
COPY <table> FROM PROGRAM 'gzip -dc /data/users.csv.gz' WITH (FORMAT csv);
```

`COPY … PROGRAM` は、**サーバー上でシェル経由でコマンドを実行** します。PostgreSQL の公式マニュアルも、外部からの入力をコマンドに含めず、固定の文字列にすることを推奨しています。これらのロールは、アプリ用のユーザーには与えません。

### MySQL の FILE 権限と secure_file_priv

- `FILE` 権限があると、`LOAD DATA INFILE` や `SELECT … INTO OUTFILE` で、サーバーのファイルを読み書きできます。アプリ用のユーザーには与えません。
- `secure_file_priv` は、サーバー側のファイルを読み書きできる場所を制限する設定です。ディレクトリが設定されていれば、その中のファイルしか扱えません。空の場合は場所が制限されず、安全ではないとされています。
- 現在の設定は、次のコマンドで確認できます。

```sql
SHOW VARIABLES LIKE 'secure_file_priv';
SHOW VARIABLES LIKE 'local_infile';
```

### パスワードをコマンドラインに書かない

```bash
# NG：パスワードがシェルの履歴に残る
mysql -u <user> -p<pass> <dbname>        # さらに ps コマンドなどで、ほかのユーザーから見えることがある
PGPASSWORD=<pass> psql -U <user> -d <dbname>
```

MySQL の公式マニュアルでも、コマンドラインにパスワードを書く方法は「便利だが安全ではない」とされています。代わりに、次の方法を使います。

**PostgreSQL：`~/.pgpass` ファイル**

```text
# ホスト名:ポート:DB名:ユーザー名:パスワード（* はどれにでも一致）
localhost:5432:<dbname>:<user>:<pass>
```

```bash
chmod 600 ~/.pgpass      # 自分以外が読めると、ファイルが無視される
```

> Windows では `%APPDATA%\postgresql\pgpass.conf` に置きます。

**MySQL：ログイン情報を暗号化して保存する（mysql_config_editor）**

```bash
mysql_config_editor set --login-path=app --host=localhost --user=<user> --password   # パスワードは対話的に入力
mysql --login-path=app <dbname>
```

または、オプションファイル（`~/.my.cnf` など）の `[client]` に書き、`chmod 600` で保護します。

```ini
[client]
user=<user>
password=<pass>
```

> `-p` だけを指定すると、実行時にパスワードを聞かれます（画面に表示されず、履歴にも残らない）。手で操作するときはこれで十分です。

## 4.7 早見表

| やりたいこと | PostgreSQL | MySQL | SQLite |
|------------|-----------|-------|--------|
| SQL ファイルを実行 | `psql -f file.sql` / `\i file.sql` | `mysql < file.sql` / `SOURCE file.sql` | `sqlite3 db < file.sql` / `.read` |
| CSV を取り込む（クライアント側） | `\copy t FROM 'f.csv' WITH (FORMAT csv, HEADER true)` | `LOAD DATA LOCAL INFILE 'f.csv' INTO TABLE t …` | `.mode csv` → `.import f.csv t` |
| 結果を CSV に出す（クライアント側） | `psql --csv -c "…" > f.csv` / `\copy (…) TO 'f.csv'` | `mysql -B -e "…" > f.tsv` | `.mode csv` → `.output f.csv` |
| サーバー側のファイル | `COPY`（特別なロールが必要） | `LOAD DATA INFILE` / `INTO OUTFILE`（`FILE` 権限が必要） | — |
| バックアップ | `pg_dump` / `pg_dumpall` | `mysqldump` | `.dump` |
| パスワードの保存 | `~/.pgpass`（600） | `mysql_config_editor` / `~/.my.cnf`（600） | —（ファイルの権限で守る） |

## 参考資料

- [PostgreSQL: COPY](https://www.postgresql.org/docs/current/sql-copy.html) / [psql](https://www.postgresql.org/docs/current/app-psql.html) / [パスワードファイル（.pgpass）](https://www.postgresql.org/docs/current/libpq-pgpass.html)
- [MySQL 8.4: LOAD DATA](https://dev.mysql.com/doc/refman/8.4/en/load-data.html) / [LOAD DATA LOCAL のセキュリティ](https://dev.mysql.com/doc/refman/8.4/en/load-data-local-security.html) / [SELECT … INTO](https://dev.mysql.com/doc/refman/8.4/en/select-into.html)
- [MySQL 8.4: パスワードを安全に扱うためのガイドライン](https://dev.mysql.com/doc/refman/8.4/en/password-security-user.html)
