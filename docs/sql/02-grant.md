# SQL 2. 権限と GRANT OPTION

[← 前: 基本構文](01-syntax.md) | [目次](../index.md)

---

> PostgreSQL と MySQL では、権限まわりの動きに大きな違いがあります。違う部分は表で並べています。

## 2.1 権限の考え方

- DB のオブジェクト（表、ビュー、関数など）には **所有者** がいます。普通は作成したユーザーが所有者です。
- 所有者以外のユーザーが使うには、**`GRANT` で権限を与える** 必要があります。
- 与えた権限は **`REVOKE` で取り上げ** られます。
- **`WITH GRANT OPTION`** を付けて与えると、受け取った人がその権限を **さらに別の人に与えられる** ようになります。

```
所有者 A ──GRANT SELECT WITH GRANT OPTION──▶ B ──GRANT SELECT──▶ C
         （B は他人に渡せる）                     （C は他人に渡せない）
```

## 2.2 ユーザーとロールの作成

```sql
-- PostgreSQL（ユーザー＝ログインできるロール）
CREATE ROLE app_user LOGIN PASSWORD '********';
CREATE ROLE readonly;            -- ログインしないロール（権限のまとめ役）

-- MySQL（ユーザーは '名前'@'接続元ホスト' で区別される）
CREATE USER 'app_user'@'%' IDENTIFIED BY '********';
CREATE ROLE 'readonly';          -- 8.0 以降
```

!!! warning "MySQL 8.0 以降は GRANT でユーザーを作れない"
    MySQL 5.7 までは、存在しないユーザーへの `GRANT` でユーザーを自動作成できました。
    この機能は 8.0 で削除されたので、先に `CREATE USER` を実行する必要があります。
    `GRANT ... IDENTIFIED BY` でパスワードを設定する書き方も使えません。

## 2.3 GRANT の基本構文

```sql
GRANT 権限 [, 権限 ...] ON 対象 TO 相手 [WITH GRANT OPTION];
```

### PostgreSQL

```sql
GRANT SELECT ON employees TO app_user;
GRANT SELECT, INSERT, UPDATE ON employees TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;  -- スキーマ内の既存の全表
GRANT UPDATE (salary) ON employees TO hr_user;           -- 列単位
GRANT USAGE ON SCHEMA public TO readonly;                -- スキーマ自体の利用権
GRANT CONNECT ON DATABASE mydb TO app_user;              -- DB への接続権
GRANT EXECUTE ON FUNCTION calc_bonus(integer) TO app_user;
```

### MySQL

```sql
GRANT SELECT ON mydb.employees TO 'app_user'@'%';        -- 表単位
GRANT SELECT, INSERT ON mydb.* TO 'app_user'@'%';        -- DB 単位
GRANT UPDATE (salary) ON mydb.employees TO 'hr'@'%';     -- 列単位
GRANT EXECUTE ON PROCEDURE mydb.myproc TO 'app_user'@'%';-- ルーチン単位
GRANT PROCESS ON *.* TO 'monitor'@'localhost';           -- グローバル（サーバー全体）
```

| MySQL の対象の書き方 | 範囲 |
|--------------------|------|
| `*.*` | グローバル（サーバー全体、管理系の権限） |
| `db.*` | DB 内のすべてのオブジェクト |
| `db.tbl` | 特定の表（表のすべての列） |
| `(列) ON db.tbl` | 特定の列 |
| `PROCEDURE db.proc` / `FUNCTION db.func` | ストアドルーチン |

## 2.4 主な権限の種類

### PostgreSQL

| 対象 | 権限 |
|------|------|
| 表・ビュー | `SELECT` `INSERT` `UPDATE` `DELETE` `TRUNCATE` `REFERENCES` `TRIGGER` `MAINTAIN` |
| 列 | `SELECT` `INSERT` `UPDATE` `REFERENCES` |
| シーケンス | `USAGE` `SELECT` `UPDATE` |
| データベース | `CREATE` `CONNECT` `TEMPORARY` |
| スキーマ | `CREATE` `USAGE` |
| 関数・プロシージャ | `EXECUTE` |

> `MAINTAIN`（VACUUM や ANALYZE などを実行する権限）は PostgreSQL 17 で追加されました。

- PostgreSQL では、表を読むには表の `SELECT` に加えて、その表があるスキーマの `USAGE` も必要です。
- 表を削除する権限や、表の定義を変える権限は所有者だけが持ち、`GRANT` では渡せません。

### MySQL（よく使うもの）

| 権限 | 内容 |
|------|------|
| `SELECT` `INSERT` `UPDATE` `DELETE` | データの読み書き |
| `CREATE` `ALTER` `DROP` `INDEX` | 表の作成・変更・削除、インデックス |
| `EXECUTE` `CREATE ROUTINE` `ALTER ROUTINE` | ストアドルーチン |
| `GRANT OPTION` | 自分の持つ権限を他人に与える |
| `PROCESS` `RELOAD` `SHUTDOWN` `SUPER` など | サーバー管理（グローバル） |
| `ALL [PRIVILEGES]` | そのレベルの全権限。**`GRANT OPTION` と `PROXY` は含まない** |

## 2.5 WITH GRANT OPTION の詳細

### 何ができるようになるか

```sql
-- 所有者 A が実行
GRANT SELECT ON films TO b WITH GRANT OPTION;

-- B が実行（B はこの権限を C に渡せる）
GRANT SELECT ON films TO c;
```

| | PostgreSQL | MySQL |
|--|-----------|-------|
| 付け方 | `WITH GRANT OPTION` | `WITH GRANT OPTION`、または `GRANT OPTION` 権限として与える |
| 渡せる範囲 | GRANT OPTION 付きで受け取ったその権限 | **そのレベル（DB・表など）で自分が持つすべての権限** |
| 自分が持っていない権限 | 渡せない | 渡せない |
| PUBLIC（全員）に付ける | できない | （PUBLIC という仕組みが無い） |
| 誰が与えたかの記録 | 記録される（REVOKE の連鎖に使われる） | — |

!!! danger "MySQL の GRANT OPTION は「そのレベルの全権限」を配れる"
    MySQL の `WITH GRANT OPTION` は、その GRANT 文で与えた権限だけでなく、**同じレベルで本人が持っているすべての権限** を他人に与えられるようにします。
    公式マニュアルでも「異なる権限を持つ 2 人のユーザーが、権限を組み合わせられる可能性がある」と注意されています。
    たとえば、`mydb.*` に対して SELECT だけを GRANT OPTION 付きで受け取ったユーザーでも、別に `mydb.*` の DELETE を持っていれば、DELETE も他人に配れます。

### 所有者の権限

- PostgreSQL では、所有者は最初からすべての権限と GRANT OPTION を持っています。所有者に GRANT する必要はありません。
- PostgreSQL のスーパーユーザーが GRANT / REVOKE を実行すると、その操作は所有者が行ったものとして記録されます。

## 2.6 REVOKE（取り上げ）と連鎖

### 基本

```sql
-- PostgreSQL
REVOKE INSERT ON employees FROM app_user;
REVOKE ALL PRIVILEGES ON employees FROM app_user;

-- MySQL
REVOKE INSERT ON mydb.employees FROM 'app_user'@'%';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'app_user'@'%';  -- 全権限を一括で取り上げ
```

### GRANT OPTION だけを取り上げる

```sql
-- PostgreSQL：SELECT 自体は残し、「他人に渡す権利」だけを外す
REVOKE GRANT OPTION FOR SELECT ON films FROM b;

-- MySQL
REVOKE GRANT OPTION ON mydb.* FROM 'b'@'%';
```

### PostgreSQL の CASCADE と RESTRICT

B がすでに C に権限を渡しているとき、C の権限は B の権限に **依存** しています。

```sql
-- A が実行：B の GRANT OPTION を外したい
REVOKE GRANT OPTION FOR SELECT ON films FROM b;           -- エラー（既定は RESTRICT）
REVOKE GRANT OPTION FOR SELECT ON films FROM b CASCADE;   -- B の GRANT OPTION と、C の SELECT が外れる
```

| 指定 | 依存する権限がある場合 |
|------|---------------------|
| `RESTRICT`（既定） | REVOKE が **失敗する** |
| `CASCADE` | 依存する権限も **まとめて取り上げる** |

PostgreSQL の REVOKE で押さえておく点:

1. **自分が与えた権限しか取り上げられません。** 上の例で A が `REVOKE SELECT ON films FROM c;` を実行しても、C の権限は B が与えたものなので消えません。
2. **別の経路で与えられた権限は残ります。** A と B の両方が C に SELECT を与えていた場合、A が自分の分を取り上げても、B の分が残るので C は読み続けられます。
3. **`REVOKE ALL PRIVILEGES` は「自分が与えた全権限の取り上げ」です。** 他の人が与えた権限、ロール経由の権限、PUBLIC 経由の権限は残ります。

### MySQL の場合

- MySQL の REVOKE 構文には、`CASCADE` / `RESTRICT` の指定がありません。
- B が他人に渡した権限が、B の権限の取り上げと連動して自動で消えるかどうかは、MySQL の公式マニュアルでは確認できませんでした。権限を渡した先は `SHOW GRANTS` で個別に確認し、不要なら個別に REVOKE してください。

## 2.7 ロールでまとめて管理する

1 人ずつ権限を与えるより、**ロールに権限を集め、ロールをユーザーに付ける** ほうが管理しやすくなります。

```sql
-- PostgreSQL
CREATE ROLE readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT readonly TO alice;                       -- alice に readonly ロールを付ける
GRANT readonly TO team_lead WITH ADMIN OPTION; -- team_lead は readonly を他人に付け外しできる

-- MySQL 8.0 以降
CREATE ROLE 'readonly';
GRANT SELECT ON mydb.* TO 'readonly';
GRANT 'readonly' TO 'alice'@'%';
SET DEFAULT ROLE 'readonly' TO 'alice'@'%';    -- ログイン時に有効にする
```

| 項目 | PostgreSQL | MySQL |
|------|-----------|-------|
| ロールを他人に付ける権利 | `WITH ADMIN OPTION` | `WITH ADMIN OPTION` |
| 付けたロールが有効になるタイミング | すぐ（`INHERIT` が有効なら） | **自動では有効にならない**。`SET DEFAULT ROLE` か `SET ROLE` が必要（サーバー設定 `activate_all_roles_on_login` を ON にするとログイン時に全ロールが有効になる） |

!!! note "ロールでは GRANT OPTION ではなく ADMIN OPTION"
    表などの権限を他人に渡す権利が `WITH GRANT OPTION`、**ロールそのもの** を他人に付け外しする権利が `WITH ADMIN OPTION` です。

## 2.8 PUBLIC（PostgreSQL）

- `PUBLIC` は「全ロール（これから作るロールも含む）」を表す特別なグループです。
- ロールが実際に持つ権限は、「直接与えられた権限」＋「所属するロールの権限」＋「PUBLIC の権限」の合計です。
- そのため、あるユーザーから REVOKE しても、PUBLIC に同じ権限があれば使えてしまいます。

```sql
-- public スキーマに誰でも表を作れる状態を止める（PostgreSQL 14 以前では既定で許可されていた）
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

> PostgreSQL 15 以降は、新しく作ったデータベースでは `public` スキーマの CREATE 権限が PUBLIC に与えられなくなりました。ただし、古い版からアップグレードしたクラスタや、ダンプから復元したデータベースでは元の権限が引き継がれます。psql の `\dn+` で現在の状態を確認できます。

## 2.9 今の権限を確認する

```sql
-- PostgreSQL（psql のメタコマンド）
\dp employees          -- 表の権限一覧（アクセス権限の欄に表示）
\du                    -- ロール一覧
SELECT * FROM information_schema.role_table_grants WHERE table_name = 'employees';

-- MySQL
SHOW GRANTS FOR 'app_user'@'%';
SHOW GRANTS FOR 'app_user'@'%' USING 'readonly';   -- ロールの中身も展開して表示
```

PostgreSQL の `\dp` の表示例: `app_user=arw/owner` は「owner が app_user に権限を与えた」という意味です。

| 記号 | 権限 | 記号 | 権限 |
|------|------|------|------|
| `r` | SELECT | `D` | TRUNCATE |
| `a` | INSERT | `x` | REFERENCES |
| `w` | UPDATE | `t` | TRIGGER |
| `d` | DELETE | `*` | 直前の権限に GRANT OPTION 付き |

## 2.10 実務での指針

1. **アプリ用ユーザーには必要な権限だけを与えます。** 普通は `SELECT` `INSERT` `UPDATE` `DELETE` までにし、`DROP` や管理系の権限は与えません。
2. **`WITH GRANT OPTION` は原則として使いません。** 権限を配る役割は DBA に集中させたほうが、誰が何を持っているか追いやすくなります。
3. **ロール単位で管理します。** 人の異動はロールの付け外しで済み、個別の GRANT が散らばりません。
4. **MySQL では接続元ホストも絞ります。** `'user'@'%'` は全ホストからの接続を許します。可能なら `'user'@'10.0.0.%'` などに限定します。
5. **定期的に棚卸しします。** `SHOW GRANTS` や `\dp` で、不要な権限や退職者のアカウントが残っていないか確認します。

## 参考資料

- [PostgreSQL: GRANT](https://www.postgresql.org/docs/current/sql-grant.html) / [REVOKE](https://www.postgresql.org/docs/current/sql-revoke.html) / [Privileges](https://www.postgresql.org/docs/current/ddl-priv.html)
- [MySQL 8.4: GRANT Statement](https://dev.mysql.com/doc/refman/8.4/en/grant.html) / [REVOKE Statement](https://dev.mysql.com/doc/refman/8.4/en/revoke.html)
- [MySQL 8.0: Features Removed in MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/mysql-nutshell.html)
