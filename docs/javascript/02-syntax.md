# JavaScript 2. 構文

[← 前: 動作条件と処理の流れ](01-runtime.md) | [目次](../index.md) | [次: 関数 →](03-functions.md)

---

## 2.1 変数の宣言

```js
const PI = 3.14;      // 再代入できない（基本はこれを使う）
let count = 0;        // 再代入できる
count = count + 1;

var old = "古い書き方";  // 新しいコードでは使わない
```

| 宣言 | 再代入 | 有効範囲（スコープ） | 宣言より前で使うと |
|------|-------|-----------------|-----------------|
| `const` | できない | ブロック `{ }` の中 | エラー（ReferenceError） |
| `let` | できる | ブロック `{ }` の中 | エラー（ReferenceError） |
| `var` | できる | 関数全体 | `undefined`（エラーにならず、ミスに気づきにくい） |

```js
if (true) {
  let a = 1;
  var b = 2;
}
console.log(b);   // 2（var はブロックの外でも使えてしまう）
console.log(a);   // ReferenceError
```

> `const` で宣言した配列やオブジェクトは、**中身は変更できます**（変数に別の値を入れ直せないだけ）。

## 2.2 データ型

| 型 | 例 | `typeof` の結果 |
|----|----|---------------|
| 数値 | `42`、`3.14`、`NaN`、`Infinity` | `"number"` |
| 大きな整数 | `12345678901234567890n` | `"bigint"` |
| 文字列 | `"abc"`、`'abc'`、`` `abc` `` | `"string"` |
| 真偽値 | `true`、`false` | `"boolean"` |
| 未定義 | `undefined`（値が入っていない） | `"undefined"` |
| null | `null`（意図的に「なし」） | `"object"`（歴史的な仕様） |
| シンボル | `Symbol("id")` | `"symbol"` |
| オブジェクト | `{}`、`[]`、関数 | `"object"`（関数は `"function"`） |

- 数値は整数と小数の区別がありません（どちらも `number`）。
- `0.1 + 0.2` は `0.30000000000000004` になります（浮動小数点の誤差）。お金の計算などでは整数（円・銭単位）で扱います。

### 型の変換

```js
Number("42");        // 42
Number("abc");       // NaN（数値にできない）
parseInt("42px", 10);  // 42（先頭の数字だけ読む。第2引数は基数）
parseFloat("3.14");  // 3.14
String(42);          // "42"
(255).toString(16);  // "ff"（16進数の文字列）
Boolean("");         // false
Number.isNaN(NaN);   // true（NaN の判定はこれを使う）
```

「偽」とみなされる値（falsy）は、`false`、`0`、`-0`、`0n`、`""`、`null`、`undefined`、`NaN` です。それ以外は「真」とみなされます（`"0"` や `[]` も真）。

## 2.3 文字列

```js
const name = "Taro";
const msg = `こんにちは、${name}さん`;   // テンプレートリテラル（バッククォート）
const multi = `1行目
2行目`;                                   // 改行もそのまま書ける

msg.length;                 // 文字数
msg.includes("Taro");       // true
msg.startsWith("こん");      // true
msg.slice(0, 5);            // 部分文字列
msg.split("、");            // 配列に分割
"  abc  ".trim();           // "abc"
"a-b-c".replaceAll("-", "/");  // "a/b/c"
"5".padStart(3, "0");       // "005"
```

## 2.4 演算子と比較

```js
10 % 3;          // 1（余り）
2 ** 10;         // 1024（べき乗）
a ?? "既定値";    // a が null か undefined のときだけ "既定値"
a || "既定値";    // a が falsy（0 や "" も含む）なら "既定値"
user?.address?.city;   // 途中が null/undefined なら undefined を返す（エラーにしない）
```

!!! warning "比較は `===` を使う"
    `==` は型を変換してから比べるため、意図しない結果になります。

    ```js
    "1" == 1;            // true
    0 == false;          // true
    null == undefined;   // true
    "1" === 1;           // false（型も比べる）
    ```

    基本は `===` と `!==` を使います。

## 2.5 制御構文

```js
// if
if (score >= 80) {
  console.log("A");
} else if (score >= 60) {
  console.log("B");
} else {
  console.log("C");
}

// 三項演算子
const label = score >= 60 ? "合格" : "不合格";

// switch（=== で比較される）
switch (status) {
  case "draft":
    console.log("下書き");
    break;            // break を忘れると次の case も実行される
  default:
    console.log("その他");
}

// for
for (let i = 0; i < 3; i++) { console.log(i); }

// for...of：配列などの「値」を順に取り出す
for (const fruit of ["apple", "banana"]) { console.log(fruit); }

// for...in：オブジェクトの「キー」を順に取り出す（配列には使わない）
for (const key in { a: 1, b: 2 }) { console.log(key); }

// while
while (n > 0) { n--; }
```

## 2.6 配列

```js
const nums = [3, 1, 2];
nums.push(4);          // 末尾に追加 → [3, 1, 2, 4]
nums.pop();            // 末尾を取り出す
nums.unshift(0);       // 先頭に追加
nums.length;           // 要素の数
nums.includes(2);      // true
nums.indexOf(2);       // 位置（なければ -1）
nums.at(-1);           // 最後の要素
```

`map`、`filter`、`reduce` などの便利な関数は [3章](03-functions.md) で説明します。

## 2.7 オブジェクト

```js
const user = {
  name: "Taro",
  age: 20,
  greet() {                       // メソッド
    return `I am ${this.name}`;
  },
};

user.name;            // "Taro"
user["age"];          // 20（キーを変数で指定するときはこの書き方）
user.email = "user@example.com";   // 追加
delete user.email;    // 削除
"name" in user;       // true

Object.keys(user);    // キーの配列
Object.values(user);  // 値の配列
Object.entries(user); // [キー, 値] の配列
```

### 分割代入とスプレッド構文

```js
const { name, age } = user;          // オブジェクトから取り出す
const [first, second] = [10, 20];    // 配列から取り出す

const copy = { ...user, age: 21 };   // コピーして一部を上書き（浅いコピー）
const merged = [...[1, 2], ...[3]];  // 配列の結合 → [1, 2, 3]
```

## 2.8 クラス

```js
class Animal {
  #secret = "見えない";        // # で始まるフィールドはクラスの外から読めない

  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} が鳴きました`;
  }

  static create(name) {        // インスタンスを作らずに呼べる
    return new Animal(name);
  }
}

class Dog extends Animal {     // 継承
  speak() {
    return `${super.speak()}（ワン）`;
  }
}

const d = new Dog("Pochi");
d.speak();                     // "Pochi が鳴きました（ワン）"
```

## 2.9 例外処理

```js
try {
  const data = JSON.parse(text);   // 不正な JSON だと SyntaxError
} catch (e) {
  console.error("解析に失敗しました:", e.message);
} finally {
  // 成功・失敗どちらでも実行
}

throw new Error("値が不正です");
```

## 2.10 モジュール

ファイルを分けて、必要なものだけを読み込む仕組みです。

```js
// math.js
export function add(a, b) { return a + b; }
export const PI = 3.14;
export default function sub(a, b) { return a - b; }
```

```js
// main.js
import sub, { add, PI } from "./math.js";
console.log(add(1, 2), sub(5, 3), PI);
```

```html
<!-- ブラウザでは type="module" を付けて読み込む -->
<script type="module" src="main.js"></script>
```

- モジュールは自動的に strict モードになり、`defer` と同じタイミングで実行されます（[1章](01-runtime.md)）。
- モジュールの中で宣言した変数は、そのファイルの中だけで有効です。

## 参考資料

- [MDN: JavaScript ガイド](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide)
- [MDN: let](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/let)
- [MDN: 等価演算子（==）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Equality)
