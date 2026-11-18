# JavaScript 5. DOM の構造と書き換えパターン

[← 前: HTML・PHP との組み合わせ](04-html-php.md) | [目次](../index.md)

---

> HTML の中身・クラス・タグを JavaScript で書き換えるときに必要な考え方と、よく使う書き方をまとめます。[4章](04-html-php.md) の補足です。

## 5.1 全体の流れ：PHP → HTML → DOM → JavaScript

```
【サーバー】                    【ブラウザ】
 PHP が実行される
   │ 「HTML の文字列」を作って送る
   ▼
 <div class="card">…</div>  ──▶  ① HTML（ただの文字列）を受け取る
                                   ② HTML を読んで「オブジェクトの木」を作る ← これが DOM
                                   ③ JavaScript が DOM のオブジェクトを書き換える
                                   ④ 書き換わった DOM のとおりに画面が描き直される
```

- PHP の仕事は「HTML の文字列を作って送る」ところで終わります。ブラウザに PHP のコードは届きません。
- ブラウザは受け取った HTML の **タグ1つ1つを JavaScript のオブジェクトに変換** します。このオブジェクトの集まりが **DOM**（Document Object Model）です。
- JavaScript が書き換えるのは HTML の文字列ではなく、この **DOM のオブジェクト** です。DOM を書き換えると、画面にすぐ反映されます。

## 5.2 「クラス」という言葉の2つの意味

Web では「クラス」が、まったく別の2つのものを指します。

| | ① HTML の `class` 属性 | ② JavaScript の `class`（設計図） |
|--|----------------------|------------------------------|
| 書く場所 | `<div class="card active">` | `class Dog extends Animal { }` |
| 正体 | 要素に付ける **ラベル（タグ付け）** | オブジェクトの **設計図** |
| 何に使う | CSS で見た目を決める、JavaScript で要素を探す | 同じ種類のオブジェクトをまとめて作る |
| 継承 | **しない**（ただの名前のリスト） | **する**（`extends`） |
| JavaScript での操作 | `el.classList.add("active")` | `new Dog()` |

`classList.add("active")` は「要素に `active` というラベルを貼る」操作です。**JavaScript のクラスの継承とは関係ありません。**

## 5.3 「継承・親子」は3種類ある

### (A) DOM オブジェクトの型の継承：「なぜその機能が使えるのか」

ブラウザが作る DOM のオブジェクトには、型（インターフェース）があります。たとえば `<button>` から作られたオブジェクトの型は、次のように継承されています。

```
EventTarget        … addEventListener()（イベントを受け取る機能）
   ▲ 継承
Node               … textContent、parentNode、appendChild()（木の一部としての機能）
   ▲ 継承
Element            … id、classList、innerHTML、setAttribute()、querySelector()、append()、remove()
   ▲ 継承
HTMLElement        … style、hidden、dataset、click()（HTML の要素に共通する機能）
   ▲ 継承
HTMLButtonElement  … disabled、type、form（ボタンだけの機能）
```

```js
const btn = document.querySelector("button");   // 型は HTMLButtonElement

btn.disabled = true;                 // HTMLButtonElement の機能
btn.style.color = "red";             // HTMLElement から受け継いだ機能
btn.classList.add("active");         // Element から受け継いだ機能
btn.textContent = "送信中…";          // Node から受け継いだ機能
btn.addEventListener("click", f);    // EventTarget から受け継いだ機能
```

- `<div>` なら最後が `HTMLDivElement`、`<input>` なら `HTMLInputElement` に変わるだけで、上の4段は共通です。**どの要素でも `classList` や `textContent` が使えるのは、すべての要素が `Element` や `Node` を継承しているから** です。
- これは自分で書く継承ではなく、**ブラウザがあらかじめ用意している型の仕組み** です。普段の操作で意識する必要はほとんどありません。

### (B) DOM ツリーの親子関係：「どの要素の中にあるか」

```html
<body>
  <div class="card">
    <h2>タイトル</h2>
    <p>本文 <strong>強調</strong></p>
  </div>
</body>
```

```
body
 └ div.card            ← h2 と p の「親」
    ├ h2               ← p の「兄弟」
    └ p
       ├ テキスト "本文 "  ← タグではない「文字だけの部品」（テキストノード）
       └ strong        ← p の「子」
          └ テキスト "強調"
```

これは **入れ物の関係（包含）** で、継承ではありません。`<p>` は `<div>` の機能を受け継ぐわけではなく、`<div>` の中に置かれているだけです。

```js
const p = document.querySelector(".card p");
p.parentElement;           // div.card（親）
p.children;                // [strong]（子の要素。テキストノードは含まない）
p.childNodes;              // [テキスト "本文 ", strong]（テキストノードも含む）
p.closest(".card");        // 自分から上にさかのぼって、.card に当てはまる最初の要素
```

### (C) CSS の継承：「親の見た目が子にも伝わるか」

(B) の親子関係に沿って、**一部の CSS の値が親から子に引き継がれます**。

```css
.card { color: navy; border: 1px solid gray; }
```

- `color` は **継承する** プロパティです。`.card` の中の `h2`、`p`、`strong` もすべて紺色になります。
- `border` は **継承しない** プロパティです。枠線が付くのは `.card` だけで、中の `p` には付きません。

どのプロパティが継承するかは、CSS の仕様でプロパティごとに決まっています（MDN の各プロパティのページの「継承」欄で確認できます）。

## 5.4 3つがつながる例：クラスを1つ付けたら何が起きるか

```html
<!-- PHP が出力した HTML -->
<div class="card" id="card1">
  <h2>お知らせ</h2>
  <p>本文です <button type="button">既読にする</button></p>
</div>
```

```css
.card.read { color: gray; }      /* read というラベルが付いたカードは灰色 */
```

```js
const card = document.querySelector("#card1");

card.addEventListener("click", (event) => {
  if (event.target.matches("button")) {   // クリックされたのがボタンなら
    card.classList.add("read");           // カードに read のラベルを貼る
  }
});
```

ボタンを押したときの流れ:

1. **(B) の親子関係に沿って、イベントが上に伝わる（バブリング）**
   クリックは `button` で起き、`p` → `div.card` → `body` …と親へ順に伝わります。そのため、`card` に付けた1つのリスナーで、中のボタンのクリックも受け取れます。`event.target` は実際にクリックされた要素（`button`）、`event.currentTarget` はリスナーを付けた要素（`card`）です。
2. **(A) の型の継承のおかげで使える機能を呼ぶ**
   `card` は `HTMLDivElement` なので、`Element` から受け継いだ `classList.add()` が使えます。
3. **HTML の class 属性（ラベル）が変わる**
   `<div class="card read">` になります。JavaScript のクラスとは関係ありません。
4. **CSS のルール `.card.read` が当てはまる**
5. **(C) の CSS の継承で、中身にも色が伝わる**
   `color` は継承するので、`h2` も `p` も灰色になります。

| 出てきたもの | 種類 | 役割 |
|------------|------|------|
| `classList.add()` が使えた | (A) 型の継承 | 機能の出どころ |
| ボタンのクリックを親で受け取れた | (B) DOM ツリーの親子 | イベントの伝わり方 |
| `class="read"` | HTML の class 属性 | 見た目を切り替えるラベル |
| 中の文字も灰色になった | (C) CSS の継承 | 見た目の伝わり方 |

> 見た目は `style` で直接変えるより、**CSS にクラスのルールを書いておき、JavaScript は `classList` でラベルを付け外しするだけ** にするほうが整理しやすくなります。見た目の定義が CSS の1か所にまとまるからです。

## 5.5 書き換えパターン集

以降の例は、すべてこの HTML を元にしています。「結果」は、実行後の HTML です。

```html
<body>
  <div class="card">
    <h2>タイトル</h2>
    <p>本文 <strong>強調</strong></p>
  </div>
</body>
```

!!! note "実行するタイミング"
    DOM を操作するコードは、HTML の解析が終わってから実行します。`<script defer>` で読み込むか、`DOMContentLoaded` のあとに実行します（[1章](01-runtime.md)）。

### h2 タグの中身だけを変える

```js
document.querySelector(".card h2").textContent = "新しいタイトル";
```

結果：`<h2>新しいタイトル</h2>`

`querySelector()` には、CSS と同じ書き方（セレクタ）で場所を指定します。`".card h2"` は「`class="card"` の中にある `h2`」という意味です。ページに h2 が1つしかなければ `"h2"` だけでも動きますが、場所を絞っておくと、あとで h2 が増えても別の h2 を書き換える事故を防げます。

### class="card" の中の「本文」だけを書き換える

**一番つまずきやすいところです。** `<p>` の中身は、文字だけの部品（テキストノード `"本文 "`）と `<strong>` の2つに分かれています（5.3 の (B) の図）。

```js
// NG：<strong> まで消えてしまう
document.querySelector(".card p").textContent = "新しい本文";
```

結果：`<p>新しい本文</p>`（`<strong>強調</strong>` が消えた）

`textContent` に代入すると、その要素の **中身全部（子要素も含めて）** が、指定した文字に置き換わるためです。

```js
// OK：p の最初の部品（文字だけの部品）だけを書き換える
const p = document.querySelector(".card p");
p.firstChild.textContent = "新しい本文 ";
```

結果：`<p>新しい本文 <strong>強調</strong></p>`

`firstChild` は「最初の子の部品」で、ここではテキストノードを指します。

!!! tip "実務でのおすすめ：書き換える部分を最初からタグで囲んでおく"
    `firstChild` は、HTML の書き方が少し変わる（前に別のタグが入る、など）と、別の部品を指してしまいます。PHP で HTML を出力する段階で、書き換えたい部分を囲んでおくのが確実です。

    ```html
    <p><span class="body-text">本文</span> <strong>強調</strong></p>
    ```

    ```js
    document.querySelector(".card .body-text").textContent = "新しい本文";
    ```

### 「強調」という文字列を書き換える

```js
document.querySelector(".card strong").textContent = "重要";
```

結果：`<p>本文 <strong>重要</strong></p>`

`strong` の中には文字の部品しかないので、`textContent` で書き換えて問題ありません。

### 値を読む

```js
document.querySelector(".card h2").textContent;   // "タイトル"
document.querySelector(".card p").textContent;    // "本文 強調"（子要素の文字もつなげて返す）
```

### クラス（ラベル）を付け外しする

```js
const card = document.querySelector(".card");
card.classList.add("read");                 // <div class="card read">
card.classList.remove("read");              // 外す
card.classList.toggle("open");              // あれば外し、なければ付ける
card.classList.contains("open");            // 付いているか（true / false）
card.classList.replace("card", "panel");    // <div class="panel">
```

### 見た目を直接変える・隠す

```js
document.querySelector(".card h2").style.color = "red";   // <h2 style="color: red;">
document.querySelector(".card strong").hidden = true;     // <strong hidden="">（非表示になる）
```

### 属性を変える

```js
const card = document.querySelector(".card");
card.id = "card1";                     // id="card1"
card.dataset.status = "done";          // data-status="done"
card.setAttribute("title", "説明");     // title="説明"
```

### 要素を追加する

```js
const card = document.querySelector(".card");
const h2 = card.querySelector("h2");

// card の中の一番最後に追加
const p = document.createElement("p");
p.textContent = "追加の段落";
card.append(p);
// 結果：<div class="card"><h2>…</h2><p>本文 …</p><p>追加の段落</p></div>

// h2 の中の先頭に追加
const span = document.createElement("span");
span.textContent = "NEW";
h2.prepend(span);
// 結果：<h2><span>NEW</span>タイトル</h2>

// h2 のすぐ後ろ（兄弟として）に追加
h2.after(document.createElement("hr"));
// 結果：<h2>…</h2><hr><p>…</p>
```

| メソッド | 追加される場所 |
|---------|-------------|
| `el.prepend(x)` | el の **中の先頭** |
| `el.append(x)` | el の **中の最後** |
| `el.before(x)` | el の **すぐ前**（外側。兄弟として） |
| `el.after(x)` | el の **すぐ後ろ**（外側。兄弟として） |

### 要素を消す・置き換える

```js
document.querySelector(".card strong").remove();
// 結果：<p>本文 </p>

// h2 を h3 に置き換える（タグの種類は変えられないので、新しく作って入れ替える）
const h2 = document.querySelector(".card h2");
const h3 = document.createElement("h3");
h3.textContent = h2.textContent;
h2.replaceWith(h3);
// 結果：<h3>タイトル</h3>
```

### 中身をまとめて入れ替える

```js
const p = document.querySelector(".card p");
const em = document.createElement("em");
em.textContent = "斜体";
p.replaceChildren("書き換えた本文 ", em);
// 結果：<p>書き換えた本文 <em>斜体</em></p>

p.replaceChildren();   // 引数なしなら、中身を空にする
```

### カードが複数あるとき

```js
// すべてのカードの h2 を書き換える
document.querySelectorAll(".card h2").forEach((h2, i) => {
  h2.textContent = `カード${i + 1}`;
});
// 結果：1枚目 <h2>カード1</h2>、2枚目 <h2>カード2</h2>

// 2枚目だけ（0 から数えるので [1]）
document.querySelectorAll(".card")[1].querySelector("h2").textContent = "2番目だけ";
```

### カードを複製して増やす

```js
const card = document.querySelector(".card");
const copy = card.cloneNode(true);       // true を指定すると中身ごとコピーする
copy.querySelector("h2").textContent = "2枚目";
card.after(copy);
```

### ある要素から、親のカードを探す

```js
document.querySelector(".card strong").closest(".card").classList.add("hit");
// strong から上にさかのぼって、最初に見つかった .card に hit を付ける
```

PHP で同じ形のカードを何枚も出力したときに、「押されたボタンが入っているカード」だけを操作する定番の書き方です（5.6）。

### 要素が見つからないときに備える

```js
const el = document.querySelector(".none");   // 見つからないと null が返る
el.textContent = "x";                          // TypeError（null にはプロパティがない）

document.querySelector(".none")?.classList.add("x");   // ?. を使うと、null なら何もしない
```

### HTML ごと書き換える（innerHTML）

```js
document.querySelector(".card p").innerHTML = "新しい本文 <strong>強調</strong>";
```

固定の文字列ならこれで構いません。ただし、**利用者の入力やサーバーから来た値を入れてはいけません**（XSS。[4章](04-html-php.md)）。`textContent` なら、タグを書かれても文字として表示されるだけです。

```js
document.querySelector(".card h2").textContent = "<img src=x onerror=alert(1)>";
// 結果：<h2>&lt;img src=x onerror=alert(1)&gt;</h2>（タグとして解釈されず、文字のまま表示される）
```

## 5.6 通しの例：PHP で出したカード一覧を、ボタンで1枚ずつ既読にする

```php
<?php
// $notices は DB から取得したお知らせの配列とする
// 例：[['id' => 1, 'title' => '…', 'body' => '…'], …]
function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<div id="notices">
<?php foreach ($notices as $n): ?>
  <div class="card" data-id="<?= (int)$n['id'] ?>">
    <h2><?= h($n['title']) ?></h2>
    <p><span class="body-text"><?= h($n['body']) ?></span>
       <button type="button" class="mark-read">既読にする</button></p>
  </div>
<?php endforeach; ?>
</div>
```

```css
.card.read { color: gray; }
.card.read .mark-read { display: none; }   /* 既読のカードではボタンを隠す */
```

```js
// 親の #notices に1つだけリスナーを付ける（中のボタンのクリックはバブリングで届く）
document.querySelector("#notices").addEventListener("click", (event) => {
  const button = event.target.closest(".mark-read");
  if (!button) return;                     // ボタン以外のクリックは無視

  const card = button.closest(".card");    // 押されたボタンが入っているカード
  card.classList.add("read");              // ラベルを付けて見た目を変える

  const id = card.dataset.id;              // PHP が埋め込んだ data-id（文字列）
  console.log("既読にしたお知らせの ID:", id);
  // ここで fetch を使い、サーバーにも既読を保存できる（4章 4.5）
});
```

この例のポイント:

- PHP 側では、出力するすべての値を `h()`（`htmlspecialchars()`）でエスケープしています。ID は `(int)` で数値にしています。
- カードが何枚あっても、リスナーは親の `#notices` に1つだけです（**イベントの委譲**）。あとから JavaScript でカードを追加しても、そのまま動きます。
- `closest()` で「押されたボタンが入っているカード」を特定しています。
- 書き換えたい本文を `<span class="body-text">` で囲んでいるので、本文だけを変えたいときも `card.querySelector(".body-text").textContent = …` で確実に変えられます。

## 5.7 選び方のまとめ

| やりたいこと | 使うもの |
|------------|---------|
| 文字だけを変える（中に子要素がない） | `el.textContent = …` |
| 子要素を残して、文字の部分だけを変える | `el.firstChild.textContent = …`（できれば `<span>` で囲んでおく） |
| 見た目を切り替える | `classList.add / remove / toggle` |
| 要素を足す | `createElement` ＋ `append / prepend / before / after` |
| 要素を消す・入れ替える | `remove()` / `replaceWith()` / `replaceChildren()` |
| 複数をまとめて変える | `querySelectorAll(...).forEach(...)` |
| 押された要素の親を探す | `closest(".card")` |
| たくさんの子要素のクリックを受け取る | 親に1つだけリスナーを付ける（イベントの委譲） |
| 利用者の入力を表示する | `textContent`（`innerHTML` は使わない） |

## 参考資料

- [MDN: Element](https://developer.mozilla.org/ja/docs/Web/API/Element) / [Node](https://developer.mozilla.org/ja/docs/Web/API/Node) / [HTMLButtonElement](https://developer.mozilla.org/ja/docs/Web/API/HTMLButtonElement)
- [MDN: 継承（CSS）](https://developer.mozilla.org/ja/docs/Web/CSS/Guides/Cascade/Inheritance)
- [MDN: イベントのバブリング](https://developer.mozilla.org/ja/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [MDN: innerHTML（セキュリティの考慮事項）](https://developer.mozilla.org/ja/docs/Web/API/Element/innerHTML)
