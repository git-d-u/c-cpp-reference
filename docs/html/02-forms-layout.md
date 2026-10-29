---
hide:
  - toc
---

# HTML 2. フォームとページの骨組み（コードと表示結果）

[← 前: 基本の構文](01-basics.md) | [目次](../index.md)

---

> 各例は、**左がコード、右がブラウザでの表示結果** です。表示結果の中の入力欄は実際に操作できますが、フォームの送信とスクリプトは無効にしてあります。

## 2.1 フォームの基本

<div class="html-demo" markdown>

```html
<form action="/contact.php" method="post">
  <p>
    <label for="name">お名前</label><br>
    <input type="text" id="name" name="name" placeholder="例：山田 太郎" required>
  </p>
  <p>
    <label for="email">メールアドレス</label><br>
    <input type="email" id="email" name="email">
  </p>
  <p>
    <label for="body">お問い合わせ内容</label><br>
    <textarea id="body" name="body" rows="3" cols="30"></textarea>
  </p>
  <button type="submit">送信する</button>
</form>
```

</div>

| 部分 | 意味 |
|------|------|
| `action` | 送信先の URL（PHP のファイルなど） |
| `method` | 送信方法。`post`（データ本体で送る）か `get`（URL に付けて送る） |
| `name` | サーバーで受け取るときの名前。PHP では `$_POST['name']` で受け取る |
| `<label for="…">` | `for` の値と同じ `id` を持つ入力欄に結び付く |
| `required` | 入力必須 |
| `placeholder` | 未入力のときに薄く表示される例 |

- `<label>` を結び付けると、ラベルの文字をクリックしても入力欄が選ばれます。画面読み上げソフトも、入力欄の名前としてラベルを読み上げます。
- ブラウザでの入力チェック（`required` や `type="email"`）は簡単に回避できるので、サーバー（PHP）側でも必ず検証します（[PHP 2章](../php/02-security.md)）。

## 2.2 入力欄の種類（input の type）

<div class="html-demo" markdown>

```html
<p>text：<input type="text" value="文字"></p>
<p>password：<input type="password" value="<pass>"></p>
<p>number：<input type="number" min="0" max="10" value="3"></p>
<p>date：<input type="date" value="2026-10-29"></p>
<p>color：<input type="color" value="#4caf50"></p>
<p>range：<input type="range" min="0" max="100" value="40"></p>
<p>file：<input type="file"></p>
<p>読み取り専用：<input type="text" value="変更不可" readonly></p>
<p>無効：<input type="text" value="使えない" disabled></p>
```

</div>

| type | 用途 |
|------|------|
| `text` | 1行の文字 |
| `password` | パスワード（入力した文字が隠れる） |
| `email` / `tel` / `url` | メールアドレス / 電話番号 / URL（スマートフォンで専用のキーボードになる） |
| `number` | 数値（`min`、`max`、`step` で範囲を指定） |
| `date` / `time` | 日付 / 時刻 |
| `checkbox` / `radio` | チェックボックス / ラジオボタン（2.3） |
| `file` | ファイルの選択（フォームに `enctype="multipart/form-data"` が必要） |
| `hidden` | 画面に出さない値（CSRF トークンなど） |

> `disabled` の入力欄はフォーカスも当たらず、フォームを送信しても **値が送られません**。`readonly` は値を変更できないだけで、フォーカスは当たります。

## 2.3 選択肢（チェックボックス・ラジオボタン・セレクト）

<div class="html-demo" markdown>

```html
<fieldset>
  <legend>好きな言語（複数選択）</legend>
  <label><input type="checkbox" name="lang[]" value="php" checked> PHP</label>
  <label><input type="checkbox" name="lang[]" value="js"> JavaScript</label>
</fieldset>

<fieldset>
  <legend>経験年数（1つだけ）</legend>
  <label><input type="radio" name="years" value="0" checked> 1年未満</label>
  <label><input type="radio" name="years" value="1"> 1年以上</label>
</fieldset>

<p>
  <label for="os">OS：</label>
  <select id="os" name="os">
    <option value="">選んでください</option>
    <option value="win" selected>Windows</option>
    <option value="linux">Linux</option>
  </select>
</p>
```

</div>

- ラジオボタンは、**同じ `name` のものの中から1つだけ** 選べます。
- PHP で複数の値を配列として受け取りたいときは、`name="lang[]"` のように `[]` を付けます（`$_POST['lang']` が配列になる）。
- `checked`（チェック済み）や `selected`（選択済み）で、最初の状態を指定できます。
- `<fieldset>` と `<legend>` で、関係する入力欄をまとめて見出しを付けます。

## 2.4 ボタン

<div class="html-demo" markdown>

```html
<form>
  <button type="submit">送信（submit）</button>
  <button type="reset">入力を元に戻す（reset）</button>
  <button type="button">何もしない（button）</button>
</form>
```

</div>

!!! warning "form の中のボタンは type を必ず書く"
    `<form>` の中の `<button>` は、`type` を省略すると `submit`（送信ボタン）になります。JavaScript で処理するだけのボタンには `type="button"` を書きます。

## 2.5 開閉できる部分

<div class="html-demo" markdown>

```html
<details>
  <summary>クリックすると開きます</summary>
  <p>details と summary を使うと、JavaScript なしで開閉できる部分を作れます。</p>
</details>

<details open>
  <summary>最初から開いている例（open）</summary>
  <p>中身です。</p>
</details>
```

</div>

## 2.6 ブロック要素とインライン要素（div と span）

<div class="html-demo" markdown>

```html
<style>
  div  { background: #e3f2fd; border: 1px solid #64b5f6; margin: 4px 0; }
  span { background: #fff3e0; border: 1px solid #ffb74d; }
</style>

<div>div 1（横幅いっぱいに広がり、前後で改行される）</div>
<div>div 2</div>

<p>文章の中の <span>span 1</span> と <span>span 2</span> は、
改行されずに文章の流れの中に並びます。</p>
```

</div>

| | ブロック要素 | インライン要素 |
|--|------------|-------------|
| 例 | `div`、`p`、`h1`〜`h6`、`ul`、`table`、`form` | `span`、`a`、`strong`、`em`、`img`、`input` |
| 並び方 | 縦に積まれる（前後で改行） | 文章の中で横に並ぶ |
| 横幅 | 親の幅いっぱい | 中身の分だけ |

- `<div>` と `<span>` は **意味を持たない入れ物** です。CSS や JavaScript で操作するためのまとまりを作るときに使います。
- 意味がある場合は、それに合ったタグ（2.7 の `header`、`nav` など）を先に検討します。

## 2.7 ページの骨組み（セマンティック要素）

<div class="html-demo" markdown>

```html
<style>
  header, nav, main, article, section, aside, footer {
    display: block; border: 1px dashed #888; padding: 4px 8px; margin: 4px 0;
  }
  header, footer { background: #eceff1; }
  nav            { background: #e8f5e9; }
  aside          { background: #fff8e1; }
</style>

<header>header：サイト名・ロゴ
  <nav>nav：<a href="#">ホーム</a> | <a href="#">お知らせ</a></nav>
</header>

<main>main：このページの主な内容（1ページに1つ）
  <article>article：記事など、それだけで完結する内容
    <section>section：記事の中の章・節</section>
  </article>
  <aside>aside：補足・関連リンク</aside>
</main>

<footer>footer：著作権表示・問い合わせ先</footer>
```

</div>

| タグ | 役割 |
|------|------|
| `<header>` | ページや記事の先頭部分（サイト名、ロゴなど） |
| `<nav>` | 主なナビゲーション（メニュー） |
| `<main>` | ページの主な内容。1ページに1つ（`hidden` を付けたものを除く） |
| `<article>` | それだけで完結する内容（記事、投稿、カード） |
| `<section>` | 内容の章・節（見出しを伴うのが基本） |
| `<aside>` | 本筋から外れた補足 |
| `<footer>` | ページや記事の末尾部分 |

- これらのタグは、見た目を変えるためではなく、**内容の役割を伝えるため** に使います。画面読み上げソフトや検索エンジンが、ページの構造を理解しやすくなります。
- 例では区切りを見せるために `<style>` で枠と色を付けています。タグ自体に見た目はほとんどありません。

## 2.8 よく使う属性（どの要素にも書ける属性）

<div class="html-demo" markdown>

```html
<style>
  .note { color: #c62828; }
  #main-title { text-decoration: underline; }
</style>

<h3 id="main-title">id：ページ内で1つだけの名前</h3>
<p class="note">class：グループの名前（何回でも使える）</p>
<p class="note" title="マウスを乗せると表示される説明">title：補足の説明（マウスを乗せる）</p>
<p style="background: #e0f7fa;">style：その要素だけに CSS を書く</p>
<p data-user-id="42">data-*：JavaScript で使う独自のデータ（画面には出ない）</p>
<p hidden>hidden：この段落は表示されない</p>
```

</div>

| 属性 | 用途 |
|------|------|
| `id` | ページ内で一意の名前。リンクの移動先（`#id`）、JavaScript での取得に使う |
| `class` | グループの名前。CSS の指定、JavaScript での取得に使う。空白で区切って複数付けられる |
| `style` | その要素だけの CSS（多用せず、CSS ファイルにまとめるのが基本） |
| `title` | 補足の説明 |
| `data-*` | JavaScript 用の独自データ（[JavaScript 4章](../javascript/04-html-php.md)、[5章](../javascript/05-dom-patterns.md)） |
| `hidden` | 非表示にする |
| `lang` | その部分の言語 |

## 2.9 よくある間違い

### p の中に div を入れる

<div class="html-demo" markdown>

```html
<style> p { background: #fff3e0; } div { background: #e3f2fd; } </style>

<p>段落の中に
  <div>div を入れると</div>
  ここは p の外になる
</p>
```

</div>

`<p>` の中には、`<div>` のようなブロック要素を入れられません。ブラウザは `<div>` が現れた時点で `<p>` を自動的に閉じるため、意図と違う構造になります（右の表示で、背景色が途中で切れていることを確認できます）。

### 閉じ忘れ・入れ子の順番の間違い

```html
<!-- NG：閉じる順番が逆 -->
<p><strong>強調</p></strong>

<!-- OK：後から開いたものを先に閉じる -->
<p><strong>強調</strong></p>
```

ブラウザはある程度自動で直して表示しますが、意図しない構造になることがあります。HTML が正しいかどうかは、[W3C Markup Validation Service](https://validator.w3.org/) で確認できます。

## 参考資料

- [MDN: form 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/form) / [input 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/input) / [label 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/label)
- [MDN: p 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/p)
- [MDN: HTML 要素リファレンス](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements)
