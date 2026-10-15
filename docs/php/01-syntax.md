# PHP 1. 構文と使い方

[目次](../index.md) | [次: セキュリティ対策とやってはいけない例 →](02-security.md)

---

> この章は **PHP 8.x** を対象にします。2026年10月時点でサポートされているのは 8.2・8.3・8.4・8.5 で、8.2 のセキュリティサポートは 2026年12月31日に終わります（[php.net](https://www.php.net/supported-versions.php)）。8.1 以前はサポートが終了しているので、新しく作るものは 8.3 以降を使います。

## 1.1 基本の書き方

```php
<?php
declare(strict_types=1);   // 型を厳密にチェックする（ファイルの先頭に書く）

// 1行コメント
# これも1行コメント
/* 複数行
   コメント */

echo "Hello, World!\n";
```

- PHP のコードは `<?php` から始まります。ファイルが PHP だけなら、最後の `?>` は書きません（後ろに余計な空白や改行が出力される事故を防ぐため）。
- 文の終わりには `;` が必要です。
- `declare(strict_types=1);` を書くと、関数の引数の型が違うときに自動変換せずエラーにします。

### HTML の中に書く場合

```php
<ul>
<?php foreach ($items as $item): ?>
    <li><?= htmlspecialchars($item) ?></li>
<?php endforeach; ?>
</ul>
```

`<?= ... ?>` は `<?php echo ... ?>` の短縮形です。HTML に値を出すときは、必ず `htmlspecialchars()` を通します（[2章](02-security.md)）。

## 1.2 変数と型

```php
$name   = "Taro";        // 文字列（string）
$age    = 20;            // 整数（int）
$height = 170.5;         // 浮動小数点数（float）
$isAdmin = false;        // 真偽値（bool）
$nothing = null;         // null
```

- 変数は `$` から始まり、宣言なしで使えます。
- 定数は `const` か `define()` で定義します。

```php
const MAX_USERS = 100;
define('APP_ENV', 'production');
```

### 文字列

```php
$name = "Taro";
echo 'Hello, $name';      // シングルクォート：変数は展開されない → Hello, $name
echo "Hello, $name";      // ダブルクォート：変数が展開される   → Hello, Taro
echo "Hello, {$name}!";   // {} で囲むと境界がはっきりする
echo 'A' . 'B';           // 連結は . （+ ではない）

// 複数行の文字列（ヒアドキュメント）
$text = <<<EOT
    名前: {$name}
    年齢: {$age}
    EOT;
```

よく使う文字列関数:

| 関数 | 内容 |
|------|------|
| `strlen($s)` | バイト数（日本語は `mb_strlen($s)` で文字数） |
| `str_contains($s, 'abc')` | 含まれているか（PHP 8.0〜） |
| `str_starts_with` / `str_ends_with` | 前方一致 / 後方一致（PHP 8.0〜） |
| `str_replace('a', 'b', $s)` | 置換 |
| `explode(',', $s)` / `implode(',', $arr)` | 分割 / 結合 |
| `trim($s)` | 前後の空白を削除 |
| `sprintf('%05d', 42)` | 書式を指定して文字列にする |

## 1.3 配列

PHP の配列は、番号で並べる「リスト」と、キーで引く「連想配列」を同じ仕組みで扱います。

```php
// リスト
$fruits = ['apple', 'banana', 'cherry'];
$fruits[] = 'grape';                 // 末尾に追加
echo $fruits[0];                     // apple
echo count($fruits);                 // 4

// 連想配列
$user = [
    'name' => 'Taro',
    'age'  => 20,
];
echo $user['name'];                  // Taro
$user['email'] = 'user@example.com'; // 追加

// 分割代入
[$a, $b] = [1, 2];
['name' => $n, 'age' => $g] = $user;
```

よく使う配列関数:

| 関数 | 内容 |
|------|------|
| `in_array($v, $arr, true)` | 値が含まれているか（第3引数 `true` で型も比較） |
| `array_key_exists('k', $arr)` / `isset($arr['k'])` | キーがあるか（`isset` は値が null だと false） |
| `array_map(fn($x) => $x * 2, $arr)` | 全要素に関数を適用 |
| `array_filter($arr, fn($x) => $x > 0)` | 条件に合う要素だけ残す |
| `array_merge($a, $b)` / `[...$a, ...$b]` | 結合 |
| `sort` / `usort` / `ksort` | 並べ替え（元の配列が変わる） |
| `array_find($arr, fn)` | 条件に合う最初の要素（PHP 8.4〜） |

## 1.4 演算子と比較

```php
$a = 10 % 3;      // 1（余り）
$b = 2 ** 10;     // 1024（べき乗）
$c = $x ?? 'default';    // $x が null か未定義なら 'default'
$d = $x ?: 'default';    // $x が「偽」とみなされる値なら 'default'
$e = $obj?->getName();   // $obj が null なら null を返す（PHP 8.0〜）
$f = $a <=> $b;          // 小さい -1、等しい 0、大きい 1
```

!!! warning "比較は `===` を使う"
    `==` は型を変換してから比べるため、意図しない結果になることがあります。

    ```php
    var_dump("1" == "01");    // true（両方とも数値の文字列なので数値として比較）
    var_dump("10" == "1e1");  // true
    var_dump(0 == "a");       // PHP 8 では false（PHP 7 までは true）
    var_dump("1" === "01");   // false（型も値も比べる）
    ```

    PHP の公式マニュアルも、ほとんどの場合は `===` と `!==` を使うよう勧めています。セキュリティ上の問題については [2章](02-security.md) を参照してください。

## 1.5 制御構文

```php
// if
if ($age >= 20) {
    echo "成人";
} elseif ($age >= 13) {
    echo "10代";
} else {
    echo "子ども";
}

// match（PHP 8.0〜）。=== で比較し、値を返す
$label = match ($status) {
    'draft'     => '下書き',
    'published' => '公開中',
    default     => '不明',
};

// for / foreach / while
for ($i = 0; $i < 3; $i++) { echo $i; }

foreach ($user as $key => $value) {
    echo "{$key}: {$value}\n";
}

while ($row = $stmt->fetch()) { /* ... */ }
```

> `switch` は `==`（型を変換する比較）で比べますが、`match` は `===` で比べます。新しく書くなら `match` が安全です。

## 1.6 関数

```php
function add(int $a, int $b = 0): int   // 型と既定値を指定できる
{
    return $a + $b;
}

echo add(1, 2);              // 3
echo add(b: 5, a: 1);        // 名前付き引数（PHP 8.0〜）

// null を許す型、複数の型
function find(?int $id): string|false { /* ... */ }

// 可変長引数
function sum(int ...$nums): int
{
    return array_sum($nums);
}

// 無名関数とアロー関数
$double = fn($x) => $x * 2;           // 外側の変数を自動で使える
$tax = 0.1;
$withTax = function ($price) use ($tax) {   // 外側の変数は use で渡す
    return $price * (1 + $tax);
};
```

## 1.7 クラスとオブジェクト

```php
class User
{
    // コンストラクタで引数をそのままプロパティにする（PHP 8.0〜）
    public function __construct(
        public readonly int $id,        // readonly：一度だけ代入できる（PHP 8.1〜）
        private string $name,
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public static function guest(): self
    {
        return new self(0, 'guest');
    }
}

$u = new User(1, 'Taro');
echo $u->getName();     // Taro
echo $u->id;            // 1
$g = User::guest();
```

| キーワード | 内容 |
|-----------|------|
| `public` / `protected` / `private` | 公開範囲 |
| `static` | インスタンスを作らずに使えるメンバー |
| `extends` | 継承（1つだけ） |
| `interface` / `implements` | インターフェースの定義と実装 |
| `abstract` | 抽象クラス・抽象メソッド |
| `trait` / `use` | 複数のクラスでコードを共有する |
| `enum` | 列挙型（PHP 8.1〜） |

```php
enum Status: string       // 値を持つ列挙型
{
    case Draft = 'draft';
    case Published = 'published';
}
$s = Status::from('draft');   // Status::Draft
```

### 名前空間とオートロード

```php
namespace App\Models;

use App\Services\Mailer;

class Order { /* ... */ }
```

実際の開発では、パッケージ管理ツールの **Composer** でライブラリを入れ、`require 'vendor/autoload.php';` でクラスを自動的に読み込むのが一般的です。

## 1.8 例外処理

```php
try {
    $result = riskyOperation();
} catch (InvalidArgumentException | RuntimeException $e) {
    error_log($e->getMessage());     // ログに残す（画面には出さない）
    echo "処理に失敗しました";
} finally {
    // 成功・失敗どちらでも実行
}

throw new InvalidArgumentException('不正な値です');
```

## 1.9 フォームの値を受け取る

```php
// GET: URL の ?q=... 、POST: フォームの送信内容
$q    = $_GET['q'] ?? '';
$name = $_POST['name'] ?? '';

// 型を確かめながら受け取る
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if ($id === false || $id === null) {
    http_response_code(400);
    exit('不正な ID です');
}
```

| 変数 | 中身 |
|------|------|
| `$_GET` | URL のクエリ文字列 |
| `$_POST` | POST で送られたフォームの値 |
| `$_COOKIE` | クッキー |
| `$_FILES` | アップロードされたファイル |
| `$_SERVER` | リクエストやサーバーの情報（一部はクライアントが書き換えられる） |
| `$_SESSION` | セッションに保存した値 |

!!! danger "これらの値はすべて信用しない"
    `$_GET`、`$_POST`、`$_COOKIE`、`$_FILES`、`$_SERVER` の一部（`HTTP_` で始まるものなど）は、利用者が自由に書き換えられます。
    受け取ったら必ず検証し、出力するときはエスケープします（[2章](02-security.md)）。

## 1.10 データベース（PDO）

```php
$dsn = 'mysql:host=localhost;dbname=<dbname>;charset=utf8mb4';
$pdo = new PDO($dsn, '<user>', '<pass>', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // エラー時に例外を投げる
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // 連想配列で取得
]);

// 値はプレースホルダで渡す（SQL インジェクション対策）
$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();            // 1行（なければ false）

$stmt = $pdo->prepare('INSERT INTO posts (user_id, body) VALUES (?, ?)');
$stmt->execute([$userId, $body]);
$newId = $pdo->lastInsertId();

// トランザクション
$pdo->beginTransaction();
try {
    // ... 複数の更新
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```

> 接続情報（`<user>`、`<pass>`）はコードに直接書かず、環境変数や Web 公開ディレクトリの外に置いた設定ファイルから読み込みます（[2章](02-security.md)）。

## 1.11 新しいバージョンの主な機能

| 版 | 主な追加機能 |
|----|------------|
| 8.0 | `match`、名前付き引数、`?->`、コンストラクタでのプロパティ宣言、`str_contains` |
| 8.1 | `enum`、`readonly` プロパティ |
| 8.4 | プロパティフック、非対称の公開範囲（`public private(set)`）、`array_find()`、`new` の後のかっこ省略 |
| 8.5 | パイプ演算子（下の例）、URI 拡張、`clone` でのプロパティ更新、`array_first()` / `array_last()` |

```php
// パイプ演算子（PHP 8.5〜）：左の値を右の関数に順に渡す
$slug = ' PHP 8.5 Released '
    |> trim(...)
    |> (fn($s) => str_replace(' ', '-', $s))
    |> strtolower(...);
```

## 参考資料

- [型変換の早見表](../appendix/type-conversion.md) — この言語を含む各言語の型変換の例
- [PHP マニュアル（日本語）](https://www.php.net/manual/ja/)
- [サポートされているバージョン](https://www.php.net/supported-versions.php)
- [PHP 8.4 リリース情報](https://www.php.net/releases/8.4/ja.php) / [PHP 8.5 リリース情報](https://www.php.net/releases/8.5/ja.php)
- [PDO: プリペアドステートメント](https://www.php.net/manual/ja/pdo.prepared-statements.php)
