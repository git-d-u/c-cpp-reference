---
hide:
  - toc
---

# HTML 1. 基本の構文（コードと表示結果）

[目次](../index.md) | [次: フォームとページの骨組み →](02-forms-layout.md)

---

> 各例は、**左がコード、右がブラウザでの表示結果** です（画面の幅が狭いときは上下に並びます）。表示結果はブラウザが実際にコードを描画したもので、このサイトのデザインの影響は受けません。スクリプトとフォームの送信は無効にしてあります。

## 1.1 HTML の基本構造

HTML は **タグ** で文章に意味を付ける言語です。

```html
<p class="lead">こんにちは</p>
```

| 部分 | この例では | 説明 |
|------|----------|------|
| 開始タグ | `<p class="lead">` | 要素の始まり。`<タグ名>` の形 |
| 属性 | `class="lead"` | 開始タグの中に `名前="値"` の形で書く追加の情報 |
| 中身 | `こんにちは` | 開始タグと終了タグの間 |
| 終了タグ | `</p>` | 要素の終わり。`</タグ名>` の形 |
| 要素 | `<p class="lead">こんにちは</p>` | 開始タグから終了タグまでの全体 |

- `<br>` や `<img>` のように、**中身を持たない要素（空要素）** には終了タグを書きません。空要素は `area`、`base`、`br`、`col`、`embed`、`hr`、`img`、`input`、`link`、`meta`、`source`、`track`、`wbr` などです。`<br />` のように最後に `/` を付けても、HTML では意味がありません（付けても害はない）。

ページ全体は、次の形が基本です。

<div class="html-demo" markdown>

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ページのタイトル</title>
</head>
<body>
  <h1>ようこそ</h1>
  <p>ここに表示される内容を書きます。</p>
</body>
</html>
```

</div>

| 部分 | 役割 |
|------|------|
| `<!DOCTYPE html>` | HTML5 の文書であることを示す（先頭に1回だけ書く） |
| `<html lang="ja">` | 文書全体。`lang` で言語を指定する |
| `<head>` | 画面には出ない情報（文字コード、タイトル、CSS の読み込みなど） |
| `<meta charset="UTF-8">` | 文字コードの指定（文字化けを防ぐ） |
| `<meta name="viewport" …>` | スマートフォンで画面幅に合わせて表示する |
| `<title>` | ブラウザのタブに表示される名前 |
| `<body>` | 画面に表示される内容 |

> 以降の例では `<body>` の中身だけを書いています。

## 1.2 見出し

<div class="html-demo" markdown>

```html
<h1>見出し1（ページに1つ）</h1>
<h2>見出し2（大きな区切り）</h2>
<h3>見出し3</h3>
<h4>見出し4</h4>
<h5>見出し5</h5>
<h6>見出し6</h6>
```

</div>

- 数字が小さいほど大きな見出しです。文字の大きさではなく、**文書の構造（章・節）** に合わせて使います。
- 見出しのレベルは飛ばさずに使います（`h2` の次にいきなり `h4` にしない）。

## 1.3 段落・改行・区切り線

<div class="html-demo" markdown>

```html
<p>これは段落です。HTML では、
コードの中で改行しても      空白をたくさん入れても、
表示では1つの空白にまとめられます。</p>

<p>改行したい場所には<br>br を入れます。</p>

<hr>

<p>hr は話題の区切りを表す線です。</p>
```

</div>

- 段落は `<p>` で囲みます。段落と段落の間には自動で余白が入ります。
- コードの中の改行や連続した空白は、表示では1つの空白になります。
- `<br>` は「行の途中で改行する」ためのものです。段落を分けたいときは `<p>` を分けます。

## 1.4 文字の意味付け・装飾

<div class="html-demo" markdown>

```html
<p><strong>strong</strong>：重要な内容</p>
<p><em>em</em>：強調（読むときに強く言う部分）</p>
<p><mark>mark</mark>：目立たせたい部分（検索語など）</p>
<p><b>b</b> / <i>i</i>：特別な意味はないが太字・斜体で表す部分</p>
<p><small>small</small>：注記・細則</p>
<p><del>del</del> → <ins>ins</ins>：削除された文字と追加された文字</p>
<p><code>code</code>：プログラムのコード</p>
<p><kbd>Ctrl</kbd> + <kbd>C</kbd>：キーボードの入力</p>
<p>H<sub>2</sub>O、x<sup>2</sup>：下付き・上付き文字</p>
```

</div>

- `<strong>` は「重要」、`<em>` は「強調」という **意味** を表します。単に太字にしたいだけなら CSS（`font-weight: bold`）を使います。
- `<b>` は特別な重要性を持たない語（要約の中のキーワード、製品名など）を太字で表すときに使い、見出しには使いません。

## 1.5 引用と整形済みテキスト

<div class="html-demo" markdown>

```html
<blockquote>
  <p>ブロックの引用は blockquote で囲みます。</p>
</blockquote>

<p>文中の引用は <q>q 要素</q> を使います。</p>

<pre>
pre の中は
    空白や改行が
        そのまま表示されます
</pre>

<pre><code>for (let i = 0; i &lt; 3; i++) {
  console.log(i);
}</code></pre>
```

</div>

> `<pre>` の中で `<` を表示したいときは `&lt;` と書きます（1.9）。

## 1.6 リスト

<div class="html-demo" markdown>

```html
<ul>
  <li>順番のないリスト</li>
  <li>項目2
    <ul>
      <li>入れ子のリスト</li>
    </ul>
  </li>
</ul>

<ol>
  <li>順番のあるリスト</li>
  <li>項目2</li>
</ol>

<ol start="5" reversed>
  <li>5から逆順</li>
  <li>次は4</li>
</ol>

<dl>
  <dt>HTML</dt>
  <dd>ページの構造を書く言語</dd>
  <dt>CSS</dt>
  <dd>ページの見た目を書く言語</dd>
</dl>
```

</div>

| タグ | 意味 |
|------|------|
| `<ul>` | 順番のないリスト（unordered list） |
| `<ol>` | 順番のあるリスト（ordered list）。`start` で開始番号、`reversed` で逆順 |
| `<li>` | リストの項目。`<ul>` / `<ol>` の直下に置く |
| `<dl>` / `<dt>` / `<dd>` | 用語と説明のリスト |

> リストを入れ子にするときは、内側の `<ul>` を **`<li>` の中に** 書きます。

## 1.7 リンク

<div class="html-demo" markdown>

```html
<p><a href="https://example.com/">外部のページへのリンク</a></p>

<p><a href="https://example.com/" target="_blank" rel="noopener noreferrer">
  新しいタブで開くリンク</a></p>

<p><a href="#section2">同じページ内の id="section2" へ移動</a></p>

<p><a href="mailto:user@example.com">メールを送る</a></p>

<p><a href="report.pdf" download>ファイルをダウンロード</a></p>

<h2 id="section2">移動先の見出し</h2>
```

</div>

| 書き方 | 意味 |
|-------|------|
| `href="https://…"` | 別のページへ移動 |
| `href="#id名"` | 同じページ内の、その `id` を持つ要素へ移動 |
| `href="mailto:…"` | メールソフトを開く |
| `target="_blank"` | 新しいタブで開く。`rel="noopener noreferrer"` も付けるのが安全 |
| `download` | 開かずにダウンロードする（同じサイトのファイルなどに限る） |

> 新しいブラウザでは `target="_blank"` だけで `rel="noopener"` と同じ保護が働きますが、古いブラウザへの対策と、`noreferrer`（リンク元を送らない）のために明示しておきます。

## 1.8 画像

<div class="html-demo" markdown>

```html
<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90'%3E%3Crect width='160' height='90' fill='%2390caf9'/%3E%3Ctext x='80' y='52' text-anchor='middle' font-size='18'%3ESAMPLE%3C/text%3E%3C/svg%3E"
     alt="青い四角に SAMPLE と書かれた画像" width="160" height="90">

<p>読み込めなかったときは alt の文字が表示されます：</p>
<img src="no-such-file.png" alt="（ここに地図の画像が入ります）" width="200" height="40">

<figure>
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Ccircle cx='60' cy='30' r='25' fill='%23a5d6a7'/%3E%3C/svg%3E"
       alt="緑の円" width="120" height="60">
  <figcaption>図1：figure と figcaption で説明を付ける</figcaption>
</figure>
```

</div>

- `alt` は **必ず書きます**。画像が読み込めないときや、画面読み上げソフトで内容を伝えるために使われます。飾りだけの画像は `alt=""`（空）にします。
- `width` と `height` を書いておくと、画像を読み込む前から場所が確保され、読み込み後に表示がずれるのを防げます。
- ここでは例として画像のデータを `src` に直接書いています。普段は `src="images/photo.jpg"` のようにファイルを指定します。

## 1.9 表

<div class="html-demo" markdown>

```html
<table border="1">
  <caption>月別の売上（万円）</caption>
  <thead>
    <tr>
      <th>月</th>
      <th>東京</th>
      <th>大阪</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>4月</td>
      <td>120</td>
      <td>80</td>
    </tr>
    <tr>
      <td>5月</td>
      <td colspan="2">集計中（2列分をつなげたセル）</td>
    </tr>
    <tr>
      <td rowspan="2">6月<br>（2行分）</td>
      <td>130</td>
      <td>95</td>
    </tr>
    <tr>
      <td>135</td>
      <td>90</td>
    </tr>
  </tbody>
</table>
```

</div>

| タグ・属性 | 意味 |
|-----------|------|
| `<table>` | 表全体 |
| `<caption>` | 表のタイトル |
| `<thead>` / `<tbody>` | 見出し行のまとまり / データ行のまとまり |
| `<tr>` | 1行 |
| `<th>` / `<td>` | 見出しのセル / データのセル |
| `colspan="2"` / `rowspan="2"` | 横に2列 / 縦に2行をつなげる |

> ここでは枠線を見せるために `border="1"` を付けていますが、これは古い書き方です。実際の見た目は CSS で付けます。表はデータを並べるために使い、ページのレイアウト（配置）には使いません。

## 1.10 特殊な文字（文字参照）

<div class="html-demo" markdown>

```html
<p>&lt;p&gt; と書くと、タグにならずに表示されます。</p>
<p>&amp; → &amp;amp; と書く</p>
<p>&quot; と &#39; → 引用符</p>
<p>&copy; 2026　&yen;1,000　&times; &divide;</p>
<p>A&nbsp;&nbsp;&nbsp;B（&amp;nbsp; は詰められない空白）</p>
```

</div>

| 書き方 | 表示 | 用途 |
|-------|------|------|
| `&lt;` / `&gt;` | `<` / `>` | タグとして解釈させたくないとき |
| `&amp;` | `&` | `&` そのもの |
| `&quot;` / `&#39;` | `"` / `'` | 属性値の中の引用符 |
| `&nbsp;` | 空白 | まとめられない空白、改行させない空白 |
| `&copy;` / `&yen;` / `&times;` | © / ¥ / × | 記号 |

> 利用者が入力した文字を HTML に出すときは、この変換をしないと XSS の原因になります（[PHP 2章](../php/02-security.md) の `htmlspecialchars()`）。

## 1.11 コメント

<div class="html-demo" markdown>

```html
<p>表示される文章</p>
<!-- これはコメントです。画面には表示されません -->
<p>次の文章</p>
```

</div>

!!! warning "コメントも利用者に見られる"
    コメントは画面には表示されませんが、ブラウザの「ページのソースを表示」で誰でも読めます。パスワードや内部の情報を書いてはいけません。

## 参考資料

- [MDN: HTML 要素リファレンス](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements)
- [MDN: 空要素](https://developer.mozilla.org/ja/docs/Glossary/Void_element)
- [MDN: a 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/a) / [img 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/img) / [b 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/b)
