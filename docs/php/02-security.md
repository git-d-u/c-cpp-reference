# PHP 2. セキュリティ対策とやってはいけない例

[← 前: 構文と使い方](01-syntax.md) | [目次](../index.md)

---

> 各項目は「やってはいけない例（NG）」→「正しい書き方（OK）」→「理由」の順に書いています。脆弱性の仕組みを理解するための資料です。確認は、自分の環境か、許可を得た環境だけで行ってください。

## 2.1 対策の全体像

| 脆弱性 | 起きる場所 | 主な対策 |
|-------|-----------|---------|
| SQL インジェクション | DB への問い合わせ | プリペアドステートメント |
| クロスサイトスクリプティング（XSS） | HTML への出力 | `htmlspecialchars()` でエスケープ |
| CSRF | フォームの送信 | トークンの確認、SameSite 属性 |
| セッションハイジャック・固定化 | ログイン | Cookie の属性、ログイン時に ID を変更 |
| OS コマンドインジェクション | `exec()` などの呼び出し | シェルを使わない、`escapeshellarg()` |
| パストラバーサル | ファイルの読み書き | ファイル名を許可リストで判定、`basename()` |
| ファイルインクルード | `include` / `require` | 利用者の入力をパスに使わない |
| 安全でないデシリアライズ | `unserialize()` | 利用者の入力を渡さない。JSON を使う |
| 不適切なパスワード保存 | ユーザー登録・ログイン | `password_hash()` / `password_verify()` |
| 情報漏えい | エラー表示、設定 | 本番では `display_errors = Off` |

## 2.2 SQL インジェクション

```php
// NG：入力を SQL に直接つなげている
$sql = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";
$pdo->query($sql);
```

`email` に `' OR '1'='1` を入れられると、条件が常に真になり、全ユーザーの情報が返ります。

```php
// OK：プリペアドステートメントで値を渡す
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$_POST['email']]);
```

!!! warning "プレースホルダで渡せるのは「値」だけ"
    表の名前や列の名前、`ORDER BY` の並び順はプレースホルダにできません。
    こうした部分を利用者に選ばせる場合は、**許可リスト** で決まった値だけを使います。

    ```php
    $allowed = ['name', 'created_at'];
    $sort = in_array($_GET['sort'] ?? '', $allowed, true) ? $_GET['sort'] : 'created_at';
    $stmt = $pdo->prepare("SELECT * FROM posts ORDER BY {$sort} DESC");
    ```

    `LIKE` 検索では、`%` もプレースホルダの値の中に入れます（`LIKE ?` に `"%{$word}%"` を渡す）。

## 2.3 クロスサイトスクリプティング（XSS）

```php
// NG：入力をそのまま HTML に出している
echo "こんにちは、" . $_GET['name'] . "さん";
```

`name` に `<script>...</script>` を入れられると、閲覧者のブラウザでそのスクリプトが動き、Cookie を盗まれるなどの被害が出ます。

```php
// OK：出力するときにエスケープする
function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
echo "こんにちは、" . h($_GET['name'] ?? '') . "さん";
```

- `htmlspecialchars()` は `&` `"` `'` `<` `>` を変換します。PHP 8.1 から、既定で `'`（シングルクォート）も変換されるようになりました。古い版も考えるなら `ENT_QUOTES` を明示します。
- エスケープは **入力時ではなく出力時** に、出力先に合わせて行います。

!!! danger "htmlspecialchars だけでは防げない場所"
    - **URL を出す場所**（`<a href="...">`）：`javascript:alert(1)` のような URL はエスケープしても動きます。`http://` か `https://` で始まるかを確認します。
    - **`<script>` の中**：PHP の値を JavaScript に渡すときは `json_encode($value, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)` を使います。
    - **属性値をクォートで囲んでいない場所**：`<input value=<?= h($v) ?>>` のような書き方はしません。必ず `"` で囲みます。

## 2.4 CSRF（クロスサイトリクエストフォージェリ）

ログイン中の利用者に、罠のページから勝手にフォームを送信させる攻撃です。

```php
// NG：ログインしていれば、どこから送られたフォームでも処理してしまう
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    changeEmail($_SESSION['user_id'], $_POST['email']);
}
```

```php
// OK：フォームを表示するときにトークンを作り、送信時に照合する
session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<form method="post">
    <input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>">
    ...
</form>
<?php
// 送信を受け取る側
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'] ?? '')) {
    http_response_code(403);
    exit('不正なリクエストです');
}
```

- トークンは `random_bytes()` で作ります（2.9）。
- 比較には `hash_equals()` を使います。処理時間の差から値を推測される攻撃（タイミング攻撃）を防げます。第1引数がサーバー側の値、第2引数が利用者から送られた値です。
- 状態を変える処理（更新・削除）は GET ではなく POST で受け付けます。
- セッション Cookie の `SameSite` 属性（2.5）も CSRF の緩和策になります。

## 2.5 セッション管理

```ini
; php.ini の推奨設定（PHP マニュアル「セッションとセキュリティ」より）
session.use_strict_mode  = 1      ; サーバーが発行していないセッション ID を受け付けない
session.use_only_cookies = 1      ; セッション ID を URL で受け渡ししない
session.cookie_httponly  = 1      ; JavaScript から Cookie を読めないようにする
session.cookie_secure    = 1      ; HTTPS のときだけ Cookie を送る
session.cookie_samesite  = "Lax"  ; 他サイトからのリクエストで Cookie を送らない（CSRF の緩和）
session.use_trans_sid    = 0      ; URL にセッション ID を付けない
```

```php
// ログインに成功したら、セッション ID を新しくする（セッション固定化攻撃の対策）
if (password_verify($password, $user['password_hash'])) {
    session_regenerate_id();
    $_SESSION['user_id'] = $user['id'];
}

// ログアウト
$_SESSION = [];
session_destroy();
```

> `session.use_strict_mode` は既定では無効です。PHP マニュアルでは「安全なセッションのために必須」とされています。

## 2.6 パスワードの保存

```php
// NG：平文、または高速なハッシュ関数で保存
$hash = md5($password);
$hash = sha1($password);
$hash = hash('sha256', $password);
```

MD5 や SHA-256 は計算が速いので、ハッシュが漏れると総当たりで元のパスワードを見つけられてしまいます。

```php
// OK：password_hash() / password_verify() を使う
$hash = password_hash($password, PASSWORD_DEFAULT);   // 登録時
// DB の列は 255 文字分確保しておく（アルゴリズムが変わると長さが変わるため）

if (password_verify($inputPassword, $hash)) {         // ログイン時
    // 成功
    if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
        // 設定が新しくなっていたら作り直して保存する
    }
}
```

- `PASSWORD_DEFAULT` は現在 bcrypt です。PHP 8.4 から、bcrypt の計算回数（cost）の既定値が 10 から 12 に上がりました。
- ソルト（salt）は自動で付きます。自分で指定しません（PHP 8.0 以降、指定しても無視されます）。
- Argon2id を使いたい場合は `PASSWORD_ARGON2ID` を指定します（PHP が Argon2 に対応してビルドされている場合のみ）。

## 2.7 OS コマンドインジェクション

```php
// NG：入力をそのままコマンドに入れている
system("ping -c 1 " . $_GET['host']);
```

`host` に `127.0.0.1; cat /etc/passwd` を入れられると、2つ目のコマンドも実行されます。

```php
// OK①：まず、コマンドを使わずに済む方法（PHP の関数）を探す

// OK②：どうしても使う場合は、値を検証したうえで escapeshellarg() で囲む
$host = $_GET['host'] ?? '';
if (filter_var($host, FILTER_VALIDATE_IP) === false) {
    exit('不正な値です');
}
system('ping -c 1 ' . escapeshellarg($host));
```

> `exec()`、`system()`、`passthru()`、`shell_exec()`、バッククォート（`` `...` ``）、`proc_open()`、`popen()` が対象です。

!!! warning "escapeshellarg() でも防げないこと"
    `escapeshellarg()` は値を `'...'` で囲み、シェルに 1 つの引数として渡します。ただし、値が `-` で始まると、呼び出したコマンドがそれを **オプション** として解釈することがあります（引数インジェクション）。
    値を検証して `-` で始まるものを拒否するか、コマンドが対応していれば `--` の後に値を置きます。Windows では動きが異なる点にも注意が必要です。

## 2.8 ファイル操作（パストラバーサル・インクルード）

```php
// NG：入力をそのままファイルのパスに使っている
readfile('/var/www/files/' . $_GET['file']);   // ../../../etc/passwd で別のファイルを読まれる
include $_GET['page'] . '.php';                 // 任意のファイルを PHP として実行される
```

```php
// OK：許可リストで決まったファイルだけを使う
$pages = ['home' => 'home.php', 'about' => 'about.php'];
$page = $pages[$_GET['page'] ?? ''] ?? 'home.php';
include __DIR__ . '/pages/' . $page;

// ファイル名だけを取り出し、実際の場所が決まったフォルダの中か確認する
$base = realpath('/var/www/files');
$path = realpath($base . '/' . basename($_GET['file'] ?? ''));
if ($path === false || !str_starts_with($path, $base . DIRECTORY_SEPARATOR)) {
    exit('不正なファイルです');
}
readfile($path);
```

- `allow_url_include`（`include` で URL を読み込む機能）は既定で無効です。PHP 7.4 で非推奨になっています。有効にしてはいけません。

### ファイルのアップロード

```php
// NG：ブラウザが送ってきたファイル名と種類をそのまま信用する
move_uploaded_file($_FILES['f']['tmp_name'], 'uploads/' . $_FILES['f']['name']);
// → shell.php をアップロードされ、Web から実行される
```

```php
// OK
$f = $_FILES['f'] ?? null;
if (!$f || $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    exit('アップロードに失敗しました');
}
if ($f['size'] > 2 * 1024 * 1024) {
    exit('ファイルが大きすぎます');
}
// 種類は中身から判定する（$_FILES['f']['type'] はブラウザが送る値なので信用しない）
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
$ext = match ($mime) {
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    default      => throw new RuntimeException('許可されていない形式です'),
};
// ファイル名はサーバーで作る。保存先は Web から直接開けない場所にする
$name = bin2hex(random_bytes(16)) . '.' . $ext;
move_uploaded_file($f['tmp_name'], '/var/app/uploads/' . $name);
```

## 2.9 乱数

```php
// NG：推測できる乱数でトークンやパスワードを作る
$token = md5(rand());
$token = uniqid();
$code  = mt_rand(100000, 999999);
```

`rand()` と `mt_rand()` は暗号用の乱数ではありません。PHP マニュアルにも、暗号の目的や推測されてはいけない値に使ってはいけないと書かれています。

```php
// OK：暗号用の乱数を使う
$token = bin2hex(random_bytes(32));   // トークン
$code  = random_int(100000, 999999);  // ワンタイムコードなど
```

## 2.10 危険な関数・書き方

| やってはいけないこと | 理由 | 代わりに |
|-------------------|------|---------|
| `unserialize($_COOKIE['data'])` など、利用者の入力を `unserialize()` に渡す | オブジェクトが作られる過程で、任意のコードが実行される可能性がある。`allowed_classes` を指定しても安全にはならない | `json_encode()` / `json_decode()` |
| `extract($_GET)` / `extract($_POST)` | 利用者が `$isAdmin` などの変数を自由に上書きできる | 必要な値だけを取り出す |
| `eval($input)` | 入力がそのまま PHP として実行される | 使わない |
| `preg_replace` の `/e` 修飾子 | 置換文字列を PHP コードとして実行する古い機能。今の PHP では使うと警告（E_WARNING）になり動かない。古いコードに残っていたら書き換える | `preg_replace_callback()` |
| 認証の判定に `==` を使う | 型の変換により、意図しない値が一致と判定されることがある（例：`"10" == "1e1"` は true） | `===`、`hash_equals()`、`password_verify()` |
| `in_array($v, $list)`（第3引数なし） | 型を変換して比べる | `in_array($v, $list, true)` |
| ソースコードに `<user>` / `<pass>` や API キーを直接書く | Git に上げたり、設定ミスでソースが見えたりすると漏れる | 環境変数、Web 公開ディレクトリの外の設定ファイル |
| エラーメッセージを画面に出す | パスや SQL の構造が攻撃者に知られる | ログに出す（2.11） |

```php
// NG：入力に応じて変数名を作る（可変変数）
$$_GET['key'] = $_GET['value'];
```

## 2.11 本番環境の設定（php.ini）

```ini
display_errors = Off          ; エラーを画面に出さない
log_errors     = On           ; エラーはログに記録する
error_log      = /var/log/php/error.log
expose_php     = Off          ; レスポンスヘッダーに PHP のバージョンを出さない
allow_url_include = Off       ; 既定値のまま（include で URL を読まない）
session.cookie_httponly = 1   ; ほかのセッション設定は 2.5 を参照
```

そのほかの対策:

- **PHP をサポート期間中の版に保つ**：サポートが終わった版には、脆弱性の修正が提供されません（1章の冒頭を参照）。
- **ライブラリを最新に保つ**：Composer を使っている場合は `composer audit` で、既知の脆弱性があるパッケージを確認できます。
- **Web 公開ディレクトリを分ける**：`index.php` などの入口だけを公開ディレクトリに置き、設定ファイル、ライブラリ（`vendor/`）、アップロードしたファイルは公開ディレクトリの外に置きます。
- **HTTPS を使う**：セッション Cookie の `secure` 属性は HTTPS が前提です。

## 2.12 チェックリスト

- [ ] DB への問い合わせは、すべてプリペアドステートメントで書いている
- [ ] HTML に出す値は、すべて `htmlspecialchars()` を通している
- [ ] 状態を変えるフォームに CSRF トークンを入れている
- [ ] ログイン成功時に `session_regenerate_id()` を呼んでいる
- [ ] パスワードは `password_hash()` で保存している
- [ ] トークンは `random_bytes()` / `random_int()` で作っている
- [ ] 利用者の入力を `include`、`exec`、`unserialize`、`extract`、`eval` に渡していない
- [ ] アップロードしたファイルの種類を中身で判定し、名前をサーバーで作っている
- [ ] 本番で `display_errors = Off` にしている
- [ ] 接続情報やキーをソースコードに直接書いていない
- [ ] サポート期間中の PHP を使っている

## 参考資料

- [PHP マニュアル：セキュリティ](https://www.php.net/manual/ja/security.php)
- [セッションとセキュリティ](https://www.php.net/manual/ja/session.security.ini.php)
- [password_hash](https://www.php.net/manual/ja/function.password-hash.php) / [htmlspecialchars](https://www.php.net/manual/ja/function.htmlspecialchars.php) / [hash_equals](https://www.php.net/manual/ja/function.hash-equals.php) / [random_bytes](https://www.php.net/manual/ja/function.random-bytes.php)
- [unserialize](https://www.php.net/manual/ja/function.unserialize.php) / [extract](https://www.php.net/manual/ja/function.extract.php) / [ファイルアップロード](https://www.php.net/manual/ja/features.file-upload.post-method.php)
- [IPA「安全なウェブサイトの作り方」](https://www.ipa.go.jp/security/vuln/websecurity/about.html)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
