# JavaScript 4. HTML・PHP との組み合わせ

[← 前: 関数](03-functions.md) | [目次](../index.md) | [次: DOM の構造と書き換えパターン →](05-dom-patterns.md)

---

## 4.1 役割分担

```
 ブラウザ                                           サーバー
┌───────────────────────────────┐              ┌──────────────────────┐
│ HTML  … ページの構造            │   リクエスト   │ PHP                    │
│ CSS   … 見た目                  │ ───────────▶ │ ・HTML を組み立てて返す   │
│ JavaScript … 動き（表示の書き換え、│              │ ・JSON を返す（API）      │
│              入力チェック、通信）  │ ◀─────────── │ ・DB の読み書き           │
└───────────────────────────────┘   レスポンス   └──────────────────────┘
```

- **PHP はサーバーで動き**、結果（HTML や JSON）をブラウザに送ります。ブラウザに届いた時点で PHP のコードは残っていません。
- **JavaScript はブラウザで動き**、届いた HTML を操作したり、サーバーに追加のデータを問い合わせたりします。
- そのため、PHP の変数を JavaScript から直接読むことはできません。値を渡すには、HTML に埋め込むか、通信で受け取ります（4.4、4.5）。

## 4.2 HTML の要素を操作する（DOM）

```html
<p id="message">初期の文章</p>
<ul class="list">
  <li>りんご</li>
  <li>みかん</li>
</ul>
<button id="add">追加</button>
```

```js
// 要素を取得する
const msg = document.querySelector("#message");          // 最初の1つ（CSS セレクタで指定）
const items = document.querySelectorAll(".list li");     // 当てはまるものすべて

// 文章を変える
msg.textContent = "新しい文章";

// 見た目を変える（クラスの付け外し）
msg.classList.add("highlight");
msg.classList.toggle("hidden");

// 属性
msg.setAttribute("title", "説明");
msg.dataset.status = "done";        // data-status="done" になる

// 要素を作って追加する
const li = document.createElement("li");
li.textContent = "ぶどう";
document.querySelector(".list").append(li);

// 削除する
li.remove();
```

!!! danger "利用者の入力は innerHTML に入れない（XSS）"
    `innerHTML` に入れた文字列は **HTML として解釈** されます。利用者が入力した値を入れると、`<img src=x onerror=...>` のような文字列でスクリプトを実行されてしまいます（クロスサイトスクリプティング）。

    ```js
    // NG
    msg.innerHTML = userInput;

    // OK：文字列として表示する
    msg.textContent = userInput;
    ```

    `<script>` 要素は `innerHTML` で入れても実行されませんが、ほかの方法で実行されるので安全ではありません。

## 4.3 イベントとフォーム

```html
<form id="contact">
  <input type="email" name="email" required>
  <textarea name="body"></textarea>
  <button type="submit">送信</button>
</form>
<p id="error"></p>
```

```js
const form = document.querySelector("#contact");

form.addEventListener("submit", (event) => {
  const email = form.elements.email.value.trim();
  if (!email.includes("@")) {
    event.preventDefault();      // 送信を止める
    document.querySelector("#error").textContent = "メールアドレスを確認してください";
  }
});

// 入力のたびに処理する
form.elements.body.addEventListener("input", (e) => {
  console.log("文字数:", e.target.value.length);
});
```

| イベント | いつ起きるか |
|---------|------------|
| `click` | クリック |
| `submit` | フォームの送信 |
| `input` / `change` | 入力のたび / 確定したとき |
| `keydown` | キーを押した |
| `DOMContentLoaded` | HTML の解析が終わった（[1章](01-runtime.md)） |

!!! warning "JavaScript の入力チェックはサーバーでもう一度行う"
    ブラウザでのチェックは、開発者ツールなどで簡単に回避できます。JavaScript のチェックは「使いやすさのため」と考え、**PHP 側でも必ず同じ検証を行います**（[PHP 2章](../php/02-security.md)）。

## 4.4 PHP から JavaScript に値を渡す

### 方法1：data 属性に入れる（シンプルな値）

```php
<div id="app"
     data-user-id="<?= htmlspecialchars((string)$userId, ENT_QUOTES, 'UTF-8') ?>"
     data-user-name="<?= htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') ?>">
</div>
```

```js
const app = document.querySelector("#app");
const userId = Number(app.dataset.userId);   // data-user-id → dataset.userId（値は常に文字列）
const userName = app.dataset.userName;
```

### 方法2：JSON として埋め込む（配列やオブジェクト）

```php
<script id="initial-data" type="application/json">
<?= json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) ?>
</script>
```

```js
const data = JSON.parse(document.querySelector("#initial-data").textContent);
```

!!! danger "PHP の値を JavaScript のコードに直接つなげない"
    ```php
    <!-- NG：$name に " や </script> が入ると、スクリプトを書き換えられる -->
    <script>
      const name = "<?= $name ?>";
    </script>
    ```

    `json_encode()` に `JSON_HEX_TAG` などを付けると、`<` `>` `&` `'` `"` が `<` のような形に変換されるので、`<script>` の中に入れても安全になります。

## 4.5 JavaScript から PHP にデータを送る（fetch）

### JavaScript 側

```js
async function saveComment(body) {
  const token = document.querySelector('meta[name="csrf-token"]').content;

  const res = await fetch("/api/comment.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,                  // CSRF 対策のトークン
    },
    body: JSON.stringify({ body }),
    // credentials の既定は "same-origin"（同じサイトへの通信ならセッションの Cookie が送られる）
  });

  if (!res.ok) {
    throw new Error(`保存に失敗しました（HTTP ${res.status}）`);
  }
  return res.json();
}
```

### PHP 側（/api/comment.php）

```php
<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=UTF-8');

// メソッドの確認
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// CSRF トークンの確認（PHP 2章を参照）
$token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// JSON の本文を受け取る（$_POST には入らない）
$input = json_decode(file_get_contents('php://input'), true);
$body = trim((string)($input['body'] ?? ''));

// サーバー側でも検証する
if ($body === '' || mb_strlen($body) > 1000) {
    http_response_code(422);
    echo json_encode(['error' => 'コメントの長さが不正です']);
    exit;
}

// DB への保存はプリペアドステートメントで（PHP 1章・2章を参照）
// $stmt = $pdo->prepare('INSERT INTO comments (body) VALUES (?)');
// $stmt->execute([$body]);

echo json_encode(['result' => 'ok'], JSON_UNESCAPED_UNICODE);
```

### フォームの内容をそのまま送る場合

```js
const res = await fetch("/save.php", {
  method: "POST",
  body: new FormData(document.querySelector("#contact")),   // PHP 側は $_POST で受け取れる
});
```

| 送り方 | JavaScript | PHP での受け取り方 |
|-------|-----------|-----------------|
| JSON | `body: JSON.stringify(obj)` と `Content-Type: application/json` | `json_decode(file_get_contents('php://input'), true)` |
| フォーム | `body: new FormData(form)` | `$_POST`、ファイルは `$_FILES` |
| URL のパラメータ | `fetch("/api.php?id=" + encodeURIComponent(id))` | `$_GET` |

## 4.6 セキュリティのまとめ

| 場面 | やること |
|------|--------|
| 利用者の入力を画面に出す | `textContent` を使う。`innerHTML` には入れない |
| PHP の値を HTML・JavaScript に渡す | `htmlspecialchars()`、`json_encode()` に `JSON_HEX_*` を付ける |
| 入力チェック | JavaScript でのチェックに加え、**PHP 側で必ず検証** |
| 状態を変える通信 | POST で送り、CSRF トークンを付ける |
| 秘密の情報 | API キーやパスワードを JavaScript に書かない（利用者が誰でも読める） |
| 外部のスクリプト | 信頼できる配布元だけを使う。Content-Security-Policy（CSP）ヘッダーで読み込み元を制限する |

!!! note "JavaScript のコードは全部見られる"
    ブラウザに送った JavaScript は、開発者ツールで誰でも読めます。認証や権限のチェックは必ずサーバー（PHP）側で行い、JavaScript には秘密の情報を書きません。

## 参考資料

- [MDN: DOM の紹介](https://developer.mozilla.org/ja/docs/Web/API/Document_Object_Model/Introduction)
- [MDN: innerHTML（セキュリティの考慮事項）](https://developer.mozilla.org/ja/docs/Web/API/Element/innerHTML)
- [MDN: data 属性の使用](https://developer.mozilla.org/ja/docs/Web/HTML/How_to/Use_data_attributes)
- [MDN: fetch() のオプション（RequestInit）](https://developer.mozilla.org/ja/docs/Web/API/RequestInit)
- [PHP: json_encode の定数](https://www.php.net/manual/ja/json.constants.php)
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/ja/docs/Web/HTTP/Guides/CSP)
