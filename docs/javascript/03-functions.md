# JavaScript 3. 関数の解説と使い方

[← 前: 構文](02-syntax.md) | [目次](../index.md) | [次: HTML・PHP との組み合わせ →](04-html-php.md)

---

## 3.1 関数の書き方

```js
// ① 関数宣言：宣言より前の行からでも呼べる
function add(a, b) {
  return a + b;
}

// ② 関数式：変数に関数を入れる
const sub = function (a, b) {
  return a - b;
};

// ③ アロー関数：短く書ける
const mul = (a, b) => a * b;          // 1行なら return と { } を省略できる
const square = x => x * x;            // 引数が1つなら ( ) も省略できる
const makeUser = (name) => ({ name }); // オブジェクトを返すときは ( ) で囲む
```

| 書き方 | 宣言より前で呼べるか | `this` | 主な使いどころ |
|-------|------------------|--------|-------------|
| 関数宣言 | 呼べる | 呼び出し方で決まる | 普通の関数 |
| 関数式 | 呼べない | 呼び出し方で決まる | 関数を値として扱う |
| アロー関数 | 呼べない | **外側の `this` をそのまま使う** | コールバック、短い処理 |

!!! warning "アロー関数の注意点"
    - 自分の `this` を持たないため、オブジェクトのメソッドには向きません。
    - `new` でインスタンスを作れません（コンストラクタにできない）。

    ```js
    const obj = {
      i: 10,
      a: () => this.i,   // undefined（外側の this を見てしまう）
      b() { return this.i; },   // 10
    };
    ```

## 3.2 引数

```js
// 既定値
function greet(name = "ゲスト") {
  return `こんにちは、${name}さん`;
}
greet();          // "こんにちは、ゲストさん"

// 残りの引数をまとめて配列で受け取る
function sum(...nums) {
  return nums.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3);     // 6

// オブジェクトで受け取る（引数が多いときに分かりやすい）
function createUser({ name, age = 0, admin = false }) {
  return { name, age, admin };
}
createUser({ name: "Taro", age: 20 });
```

- 引数の数が足りないと、足りない引数は `undefined` になります（エラーにはならない）。
- オブジェクトや配列を渡すと、関数の中で中身を変えると呼び出し元にも反映されます（参照が渡されるため）。

## 3.3 スコープとクロージャ

関数は、**作られた場所の外側の変数を覚えて** 使い続けられます。これを **クロージャ** といいます。

```js
function makeCounter() {
  let count = 0;               // 外からは直接さわれない
  return () => {
    count++;
    return count;
  };
}

const counter = makeCounter();
counter();   // 1
counter();   // 2（count の値が保たれている）
```

外から変更されたくない値を隠すときに使えます。

## 3.4 コールバック関数

**関数を引数として渡し**、あとで呼んでもらう書き方です。イベント処理や配列の処理でよく使います。

```js
setTimeout(() => console.log("1秒後"), 1000);

document.querySelector("#btn").addEventListener("click", (event) => {
  console.log("クリックされた要素:", event.target);
});

[1, 2, 3].forEach((n) => console.log(n));
```

## 3.5 配列の便利な関数

元の配列を **変えずに** 新しい値を返すものが多く、組み合わせて使います。

| 関数 | 内容 | 例 → 結果 |
|------|------|----------|
| `map(fn)` | 全要素を変換した新しい配列 | `[1,2,3].map(n => n * 2)` → `[2,4,6]` |
| `filter(fn)` | 条件に合う要素だけの新しい配列 | `[1,2,3].filter(n => n > 1)` → `[2,3]` |
| `reduce(fn, 初期値)` | 全要素を1つの値にまとめる | `[1,2,3].reduce((s, n) => s + n, 0)` → `6` |
| `find(fn)` | 条件に合う最初の要素（なければ `undefined`） | `[5,8].find(n => n > 6)` → `8` |
| `findIndex(fn)` | 条件に合う最初の位置（なければ `-1`） | `[5,8].findIndex(n => n > 6)` → `1` |
| `some(fn)` / `every(fn)` | 1つでも合うか / 全部合うか | `[1,2].some(n => n > 1)` → `true` |
| `forEach(fn)` | 全要素に処理をする（戻り値なし） | |
| `sort(fn)` | 並べ替え（**元の配列が変わる**） | `nums.sort((a, b) => a - b)` |
| `toSorted(fn)` | 並べ替えた新しい配列（元は変わらない） | |
| `join(区切り)` | 文字列につなげる | `["a","b"].join("-")` → `"a-b"` |
| `flat()` | 入れ子の配列を平らにする | `[[1],[2]].flat()` → `[1,2]` |

```js
const users = [
  { name: "A", age: 20, active: true },
  { name: "B", age: 35, active: false },
  { name: "C", age: 28, active: true },
];

// 有効なユーザーの名前を、年齢の高い順に
const names = users
  .filter((u) => u.active)
  .sort((a, b) => b.age - a.age)
  .map((u) => u.name);       // ["C", "A"]
```

!!! warning "sort() の既定の動き"
    比較の関数を渡さないと、**文字列として** 並べ替えます。`[10, 9, 1].sort()` は `[1, 10, 9]` になります。数値は `sort((a, b) => a - b)` のように比較の関数を渡します。

## 3.6 よく使う組み込み関数

| 関数 | 内容 |
|------|------|
| `JSON.stringify(obj)` | オブジェクトを JSON 文字列にする |
| `JSON.parse(text)` | JSON 文字列をオブジェクトにする（不正な形式だと例外） |
| `setTimeout(fn, ms)` / `clearTimeout(id)` | 一定時間後に1回実行 / 取り消し |
| `setInterval(fn, ms)` / `clearInterval(id)` | 一定間隔で繰り返し実行 / 取り消し |
| `Math.round` / `Math.floor` / `Math.ceil` | 四捨五入 / 切り捨て / 切り上げ |
| `Math.max(...arr)` / `Math.min(...arr)` | 最大 / 最小 |
| `Math.random()` | 0 以上 1 未満の乱数（暗号用ではない） |
| `crypto.getRandomValues()` / `crypto.randomUUID()` | 暗号用の安全な乱数（ブラウザ） |
| `encodeURIComponent(s)` | URL のパラメータ用にエンコードする |
| `structuredClone(obj)` | オブジェクトを中身まで丸ごとコピーする（深いコピー） |

```js
// 日付
const now = new Date();
now.getFullYear();               // 年
now.getMonth() + 1;              // 月（0 から始まるので +1）
now.toISOString();               // "2026-10-23T01:23:45.678Z" の形式（UTC）
now.toLocaleString("ja-JP");     // 日本の形式で表示
```

## 3.7 非同期処理：Promise と async / await

通信やタイマーなど、**終わるまで時間がかかる処理** を待つための仕組みです。待っている間も画面は止まりません（[1章](01-runtime.md) のイベントループ）。

### Promise

```js
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

wait(1000)
  .then(() => console.log("1秒たった"))
  .catch((err) => console.error(err))      // 途中で失敗したらここに来る
  .finally(() => console.log("終了"));
```

### async / await（推奨）

`await` を使うと、非同期処理を上から順に読める形で書けます。

```js
async function loadUser(id) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
    if (!res.ok) {                          // fetch は 404 や 500 では失敗扱いにならない
      throw new Error(`HTTP ${res.status}`);
    }
    const user = await res.json();
    return user;
  } catch (err) {
    console.error("取得に失敗しました:", err);
    return null;
  }
}
```

- `async` を付けた関数は、必ず Promise を返します。
- `await` は `async` 関数の中（またはモジュールの一番外側）でしか使えません。
- **`fetch()` は、通信そのものが失敗したときだけエラーになります。** 404 や 500 が返ってきても成功扱いなので、`res.ok` を必ず確認します。

### 複数の処理をまとめて待つ

```js
// 並行して実行し、全部終わるのを待つ（1つでも失敗したら catch へ）
const [a, b] = await Promise.all([fetch("/api/a"), fetch("/api/b")]);

// 全部の結果を、成功・失敗に関係なく受け取る
const results = await Promise.allSettled([p1, p2]);
```

## 参考資料

- [MDN: 関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Functions)
- [MDN: アロー関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [MDN: Array](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: async function](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: fetch()](https://developer.mozilla.org/ja/docs/Web/API/Window/fetch)
