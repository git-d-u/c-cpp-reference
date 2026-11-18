# JavaScript 1. 動作条件と処理の流れ

[目次](../index.md) | [次: 構文 →](02-syntax.md)

---

## 1.1 JavaScript が動く場所

JavaScript は、**実行環境（ランタイム）** の中で動きます。言語そのものは共通ですが、使える機能は環境によって違います。

| 環境 | 主な用途 | 使える主な機能 | 使えないもの |
|------|---------|--------------|------------|
| **ブラウザ** | Web ページの動き（クリック、表示の書き換え、通信） | `document`（DOM）、`window`、`fetch`、`localStorage`、イベント | ファイルの直接の読み書き、OS のコマンド |
| **Node.js など** | サーバー、コマンドラインツール | ファイル操作（`fs`）、ネットワークのサーバー、`process` | `document` や `window`（画面がないため） |

この章では主に **ブラウザ** での動きを説明します。

### ブラウザで動かす条件

- HTML の `<script>` 要素で読み込まれていること。
- ブラウザで JavaScript が有効になっていること（無効にしている利用者もいます）。
- 読み込み元のファイルが、そのページから取得できる場所にあること。ブラウザには **同一オリジンポリシー** という仕組みがあり、別のサイト（オリジン）へのアクセスには制限がかかります（[4章](04-html-php.md)）。

!!! tip "すぐに試すには"
    ブラウザで `F12` を押して開発者ツールを開き、「コンソール」タブに `console.log("Hello")` と入力すると、その場で実行できます。

## 1.2 HTML への読み込み方

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <!-- 外部ファイルを読み込む（defer：HTML を読み終えてから順番に実行） -->
  <script src="app.js" defer></script>
</head>
<body>
  <button id="btn">押す</button>

  <!-- HTML の中に直接書く（インラインスクリプト） -->
  <script>
    console.log("ここまで HTML が読まれた時点で実行される");
  </script>
</body>
</html>
```

### `<script>` の属性による違い

| 書き方 | ダウンロード | 実行のタイミング | 実行の順番 |
|-------|------------|---------------|----------|
| `<script src="a.js">`（属性なし） | その場で取得し、**HTML の解析を止める** | 取得したらすぐ | 書いた順 |
| `<script src="a.js" defer>` | HTML の解析と並行して取得 | **HTML の解析が終わってから**（`DOMContentLoaded` の前） | 書いた順 |
| `<script src="a.js" async>` | HTML の解析と並行して取得 | **取得できしだい** | **順番は保証されない** |
| `<script type="module" src="a.js">` | HTML の解析と並行して取得 | `defer` と同じ（モジュールは既定で遅延実行） | 書いた順 |

- 属性なしの `<script>` を `<head>` に置くと、その JavaScript を取得・実行し終わるまでページの解析が止まります。また、その時点では `<body>` の要素がまだ存在しないので、ボタンなどを操作できません。
- 迷ったら **`defer` を付けて `<head>` に置く** のが分かりやすい方法です。
- `defer` は `src` のある外部ファイルにだけ効きます。インラインスクリプトに付けても意味がありません。
- `async` と `defer` を両方付けると、`async` だけを付けたときと同じ動きになります。

## 1.3 ページが表示されるまでの流れ

```
1. HTML の取得
2. HTML の解析（上から順に要素を作る）
     └ 属性なしの <script> があると、そこで止まって取得・実行
3. HTML の解析が終わる（document.readyState が "interactive" になる）
4. defer と type="module" のスクリプトを順に実行
5. DOMContentLoaded イベント        ← DOM を操作する処理はここから安全
6. async のスクリプト、画像などの読み込みが終わる
7. load イベント（document.readyState が "complete"）  ← 画像なども含めてすべて読み終わった
```

```js
// DOM ができてから処理する
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#btn").addEventListener("click", () => {
    alert("押されました");
  });
});
```

> `defer` を付けたスクリプトは手順4で実行されるので、その中では `DOMContentLoaded` を待たなくても DOM を操作できます。画像の大きさなど、すべての読み込み完了が必要な場合だけ `load` を使います。

## 1.4 処理の流れ：シングルスレッドとイベントループ

JavaScript は、1つの実行環境（ブラウザのタブなど）の中では **一度に1つの処理しか実行しません**（シングルスレッド）。それでも通信やタイマーを待っている間に画面が固まらないのは、**イベントループ** という仕組みで処理を順番に回しているからです。

```
            ┌─────────────────────┐
            │ コールスタック          │  ← 今実行中の関数が積まれる
            └─────────┬───────────┘
                      │ 空になったら
                      ▼
   ┌──────────────────────────────────┐
   │ ① マイクロタスクのキューを全部実行     │  Promise の then / await の続き、queueMicrotask
   └──────────────────────────────────┘
                      ▼
   ┌──────────────────────────────────┐
   │ ② タスクのキューから1つ取り出して実行   │  setTimeout、クリックなどのイベント
   └──────────────────────────────────┘
                      ▼
              （①に戻って繰り返す）
```

- **コールスタック**：関数を呼ぶと積まれ、終わると取り除かれます。
- **タスク**：`setTimeout` や `setInterval` のコールバック、クリックなどのイベントの処理です。
- **マイクロタスク**：Promise の `then` / `catch`、`await` の後の続き、`queueMicrotask()` です。**タスクより優先** され、1つのタスクが終わるたびに、たまっているマイクロタスクがすべて実行されます。
- 1つの処理は **最後まで実行されてから** 次の処理に移ります（途中で割り込まれない）。

### 実行順の例

```js
console.log("1: 同期処理");

setTimeout(() => console.log("4: タスク（setTimeout）"), 0);

Promise.resolve().then(() => console.log("3: マイクロタスク（Promise）"));

console.log("2: 同期処理");
```

```
1: 同期処理
2: 同期処理
3: マイクロタスク（Promise）
4: タスク（setTimeout）
```

`setTimeout(..., 0)` は「0ミリ秒後にすぐ実行」ではなく、「今の処理とマイクロタスクが全部終わってから実行」という意味になります。

!!! warning "重い処理は画面を固める"
    1つの処理が長く続くと、その間はクリックなどのイベントも処理されず、ページが反応しなくなります。
    重い計算は分割するか、**Web Worker**（別のスレッドで動かす仕組み）を使います。

## 1.5 strict モード

```js
"use strict";   // ファイルや関数の先頭に書く

x = 10;         // ReferenceError（宣言していない変数への代入をエラーにする）
```

- 宣言忘れなどのミスをエラーとして知らせてくれるので、書いておくと安全です。
- **モジュール（`type="module"`）と `class` の中は、自動的に strict モード** になります。

## 1.6 エラーの確認

```js
console.log("通常のログ");
console.warn("警告");
console.error("エラー");
console.table([{ id: 1, name: "A" }, { id: 2, name: "B" }]);   // 表で表示
```

- エラーが起きると、開発者ツールの「コンソール」に、メッセージと発生したファイル・行番号が表示されます。
- 「ソース」タブでブレークポイントを置くと、1行ずつ実行して変数の値を確認できます。

## 参考資料

- [MDN: script 要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/script) — async / defer / module
- [MDN: DOMContentLoaded イベント](https://developer.mozilla.org/ja/docs/Web/API/Document/DOMContentLoaded_event)
- [MDN: JavaScript の実行モデル](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Execution_model)
- [MDN: マイクロタスクの使用](https://developer.mozilla.org/ja/docs/Web/API/HTML_DOM_API/Microtask_guide)
