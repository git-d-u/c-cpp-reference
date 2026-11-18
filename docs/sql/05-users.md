# SQL 5. ユーザーと権限の一覧を確認する

[← 前: ファイルの読み込みと出力](04-import-export.md) | [目次](../index.md)

---

> 権限の与え方・取り上げ方は [2章](02-grant.md) を参照してください。この章は「今どうなっているか」を確認する方法をまとめます。
> SQLite にはユーザーや権限の仕組みがないため、PostgreSQL と MySQL を扱います。

## 5.1 今の自分を確認する

| 確認したいこと | PostgreSQL | MySQL |
|--------------|-----------|-------|
| 今のユーザー | `SELECT current_user;` | `SELECT CURRENT_USER();` |
| 有効なロール | `SELECT current_role;` | `SELECT CURRENT_ROLE();` |
| 自分の権限 | `\du`（自分の行を見る）、`\dp <table>` | `SHOW GRANTS;` |

## 5.2 PostgreSQL

### ユーザー（ロール）の一覧

```sql
\du          -- ロールの一覧と属性（psql のメタコマンド）
\du+         -- 説明（コメント）も表示
```

```sql
-- SQL で取得する（パスワードは ******** と表示され、中身は見えない）
SELECT rolname, rolsuper, rolcanlogin, rolcreaterole, rolcreatedb,
       rolreplication, rolbypassrls, rolvaliduntil, rolconnlimit
FROM pg_roles
ORDER BY rolname;
```

| 列 | 意味 |
|----|------|
| `rolname` | ロール名 |
| `rolsuper` | **スーパーユーザーか**（すべての権限チェックを通過する） |
| `rolcanlogin` | ログインできるか（ユーザーとして使えるか） |
| `rolcreaterole` | ロールを作れるか |
| `rolcreatedb` | データベースを作れるか |
| `rolreplication` | レプリケーション用のロールか |
| `rolbypassrls` | 行レベルセキュリティ（RLS）を無視できるか |
| `rolinherit` | 所属するロールの権限を自動で受け継ぐか |
| `rolvaliduntil` | パスワードの有効期限（NULL は期限なし） |
| `rolconnlimit` | 同時に接続できる数の上限（-1 は無制限） |

> PostgreSQL では「ユーザー」と「グループ」の区別はなく、どちらも **ロール** です。`rolcanlogin` が true のロールが、いわゆるユーザーです。

### どのロールに所属しているか

```sql
SELECT r.rolname AS role, m.rolname AS member, am.admin_option
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
ORDER BY role, member;
```

`admin_option` が true のメンバーは、そのロールをほかの人に付け外しできます（[2章](02-grant.md) の `WITH ADMIN OPTION`）。

### テーブルなどの権限

```sql
\dp <table>     -- テーブルの権限（記号の読み方は 2章 2.9）
\l              -- データベースの一覧と、その権限
\dn+            -- スキーマの一覧と、その権限
```

```sql
-- あるユーザーが持つテーブルの権限を一覧にする
SELECT grantee, table_schema, table_name, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE grantee = '<user>'
ORDER BY table_schema, table_name, privilege_type;

-- 特定の権限を持っているかを true / false で確認する
SELECT has_table_privilege('<user>', '<schema>.<table>', 'SELECT');
SELECT has_database_privilege('<user>', '<dbname>', 'CONNECT');
```

### 点検に使うクエリ

```sql
-- スーパーユーザーの一覧（最小限であるべき）
SELECT rolname FROM pg_roles WHERE rolsuper;

-- ログインできて、ロールや DB を作れる強いユーザー
SELECT rolname FROM pg_roles
WHERE rolcanlogin AND (rolcreaterole OR rolcreatedb OR rolbypassrls);

-- サーバー上のファイル・コマンドを扱えるロール（4章 4.6）のメンバー
SELECT r.rolname AS role, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname IN ('pg_read_server_files', 'pg_write_server_files', 'pg_execute_server_program');
```

## 5.3 MySQL

### ユーザーの一覧

```sql
SELECT User, Host, plugin, account_locked, password_expired, password_last_changed
FROM mysql.user
ORDER BY User, Host;
```

| 列 | 意味 |
|----|------|
| `User` / `Host` | ユーザー名と、接続を許す接続元。MySQL のアカウントは **この2つの組み合わせ** で1つ |
| `plugin` | 認証の方式（`caching_sha2_password` など） |
| `authentication_string` | 認証情報（ハッシュなど。パスワードそのものではない） |
| `account_locked` | ロックされているか（`Y` / `N`） |
| `password_expired` | パスワードが期限切れか（`Y` なら、新しいパスワードを設定するまで操作できない） |
| `password_last_changed` | パスワードを最後に変えた日時 |

> `mysql.user` は管理用のテーブルなので、一般のユーザーは読めないのが普通です。内容を変えるときは、テーブルを直接書き換えず、`CREATE USER`・`ALTER USER`・`GRANT`・`REVOKE` を使います（公式マニュアルでも推奨されています）。

### 権限の一覧

```sql
SHOW GRANTS;                              -- 自分の権限
SHOW GRANTS FOR '<user>'@'%';             -- 特定のアカウントの権限
SHOW GRANTS FOR '<user>'@'%' USING '<role>';   -- ロール経由の権限も展開して表示
SHOW PRIVILEGES;                          -- MySQL にある権限の種類の一覧
```

```sql
-- information_schema で一覧にする（自分が見られる範囲だけが表示される）
SELECT GRANTEE, PRIVILEGE_TYPE, IS_GRANTABLE
FROM information_schema.USER_PRIVILEGES          -- グローバル（*.*）の権限
ORDER BY GRANTEE;

SELECT GRANTEE, TABLE_SCHEMA, PRIVILEGE_TYPE
FROM information_schema.SCHEMA_PRIVILEGES        -- DB 単位の権限
ORDER BY GRANTEE, TABLE_SCHEMA;

SELECT GRANTEE, TABLE_SCHEMA, TABLE_NAME, PRIVILEGE_TYPE
FROM information_schema.TABLE_PRIVILEGES         -- テーブル単位の権限
ORDER BY GRANTEE, TABLE_SCHEMA, TABLE_NAME;
```

| 情報源 | 範囲 |
|-------|------|
| `USER_PRIVILEGES` | グローバル（サーバー全体、`ON *.*`） |
| `SCHEMA_PRIVILEGES` | データベース単位（`ON db.*`） |
| `TABLE_PRIVILEGES` | テーブル単位（`ON db.tbl`） |
| `COLUMN_PRIVILEGES` | 列単位 |

### 点検に使うクエリ

```sql
-- どこからでも接続できるアカウント（Host が '%'）
SELECT User, Host FROM mysql.user WHERE Host = '%';

-- 強い権限（FILE、SUPER、GRANT OPTION など）をグローバルに持つアカウント
SELECT GRANTEE, PRIVILEGE_TYPE
FROM information_schema.USER_PRIVILEGES
WHERE PRIVILEGE_TYPE IN ('FILE', 'SUPER', 'PROCESS', 'SHUTDOWN', 'CREATE USER', 'GRANT OPTION')
ORDER BY GRANTEE;

-- ロックされていない、使われていないかもしれないアカウントを洗い出す
SELECT User, Host, password_last_changed
FROM mysql.user
WHERE account_locked = 'N'
ORDER BY password_last_changed;

-- ファイルを扱う設定（4章 4.6）
SHOW VARIABLES LIKE 'secure_file_priv';
SHOW VARIABLES LIKE 'local_infile';
```

## 5.4 点検のチェックリスト

- [ ] 管理者（PostgreSQL のスーパーユーザー、MySQL の `root` など）は必要最小限で、アプリからは使っていない
- [ ] アプリ用のユーザーには、必要な DB・テーブルの権限だけが付いている（[2章 2.10](02-grant.md)）
- [ ] ファイルを扱う権限（PostgreSQL の `pg_read_server_files` など、MySQL の `FILE`）を、アプリ用のユーザーに与えていない
- [ ] `WITH GRANT OPTION` / `WITH ADMIN OPTION` が付いた権限が、想定外のユーザーに付いていない
- [ ] MySQL で、`Host` が `'%'`（どこからでも接続可）のアカウントが本当に必要か
- [ ] 退職者や使っていないアカウントが残っていない（削除するか、ロックする）
- [ ] パスワードの有効期限や最終変更日が、運用のルールに合っている

```sql
-- 使わなくなったアカウントをすぐに消せない場合は、ロックしておく
ALTER ROLE <user> NOLOGIN;                      -- PostgreSQL：ログインできなくする
ALTER USER '<user>'@'%' ACCOUNT LOCK;            -- MySQL：アカウントをロックする
```

## 参考資料

- [PostgreSQL: pg_roles](https://www.postgresql.org/docs/current/view-pg-roles.html) / [psql（\du、\dp）](https://www.postgresql.org/docs/current/app-psql.html) / [information_schema.table_privileges](https://www.postgresql.org/docs/current/infoschema-table-privileges.html)
- [MySQL 8.4: Grant Tables（mysql.user）](https://dev.mysql.com/doc/refman/8.4/en/grant-tables.html) / [SHOW GRANTS](https://dev.mysql.com/doc/refman/8.4/en/show-grants.html) / [INFORMATION_SCHEMA Table Reference](https://dev.mysql.com/doc/refman/8.4/en/information-schema-table-reference.html)
