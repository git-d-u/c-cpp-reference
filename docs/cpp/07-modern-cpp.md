# C++ 7. モダンC++

[← 前: メモリ管理とスマートポインタ](06-memory.md) | [目次](../index.md) | [次: 例外処理 →](08-exceptions.md)

---

C++11 以降に追加された主な機能をまとめる。

## 7.1 規格ごとの主な追加機能

| 規格 | 主な機能 |
|------|----------|
| C++11 | `auto`、範囲 for、ラムダ式、ムーブセマンティクス、`nullptr`、スマートポインタ、`constexpr`、`enum class`、可変引数テンプレート、`std::thread` |
| C++14 | 汎用ラムダ、`std::make_unique`、戻り値型の推論、2進数リテラル `0b`、桁区切り `'` |
| C++17 | 構造化束縛、`if constexpr`、`std::optional` / `std::variant` / `std::any`、`std::string_view`、`std::filesystem`、畳み込み式、if/switch の初期化文 |
| C++20 | コンセプト、Ranges、コルーチン、モジュール、`<=>` 演算子、`std::format`、`std::span`、指示付き初期化 |
| C++23 | `std::print`、`std::expected`、`std::mdspan`、deducing this |

## 7.2 auto と型推論

```cpp
auto i = 42;                 // int
auto d = 3.14;               // double
auto s = std::string("a");   // std::string
auto it = v.begin();         // std::vector<int>::iterator

const auto &ref = v;         // const 参照として推論
decltype(i) j = 0;           // i と同じ型 (int)

auto add(int a, int b) { return a + b; }        // 戻り値型の推論 (C++14)
auto mul(int a, int b) -> int { return a * b; } // 後置戻り値型 (C++11)
```

- `auto` は参照と最上位の `const` を取り除いて推論する。参照が必要なら `auto &` と書く。

## 7.3 ラムダ式

```cpp
auto add = [](int a, int b) { return a + b; };
add(1, 2);  // => 3

// [キャプチャ](引数) -> 戻り値型 { 本体 }
auto f = [](double x) -> int { return static_cast<int>(x); };
```

### キャプチャ

| 記法 | 意味 |
|------|------|
| `[]` | キャプチャしない |
| `[x]` | x をコピーでキャプチャ |
| `[&x]` | x を参照でキャプチャ |
| `[=]` | 使用する変数をすべてコピーでキャプチャ |
| `[&]` | 使用する変数をすべて参照でキャプチャ |
| `[this]` | this ポインタをキャプチャ |
| `[y = std::move(x)]` | 初期化キャプチャ (C++14) |

```cpp
int count = 0;
auto inc = [&count]() { ++count; };
inc();  // count == 1

int base = 10;
auto addBase = [base](int x) { return x + base; };

auto counter = [n = 0]() mutable { return ++n; };   // mutable: コピーしたものを変更可能
counter(); counter();  // => 1, 2

auto generic = [](auto a, auto b) { return a + b; }; // 汎用ラムダ (C++14)
```

> 参照キャプチャしたラムダを、変数の寿命より長く保持しないように注意。

## 7.4 ムーブセマンティクス

コピーの代わりにリソースの所有権を「移動」することで、不要なコピーを避ける。

```cpp
#include <utility>

std::string a = "long text ...";
std::string b = std::move(a);   // a の中身を b に移動（a は有効だが未規定の状態）

std::vector<std::string> v;
std::string s = "hello";
v.push_back(std::move(s));      // コピーではなくムーブ
```

- `std::move` 自体は何も移動しない。引数を右辺値（`T&&`）にキャストするだけで、ムーブコンストラクタ等が選ばれるようになる。
- ムーブ後のオブジェクトは「有効だが未規定の状態」。再代入や破棄はできるが、値に依存してはいけない。

### 左辺値と右辺値

```cpp
int x = 10;       // x は左辺値（名前があり、アドレスを取れる）
                  // 10 は右辺値（一時的な値）
int &lr = x;      // 左辺値参照
int &&rr = 10;    // 右辺値参照
// int &&bad = x; // NG: 左辺値は右辺値参照に束縛できない
```

### ムーブコンストラクタの実装例

```cpp
class Buffer {
public:
    explicit Buffer(size_t n) : size_(n), data_(new int[n]) {}
    ~Buffer() { delete[] data_; }

    Buffer(Buffer &&other) noexcept               // ムーブコンストラクタ
        : size_(other.size_), data_(other.data_)
    {
        other.size_ = 0;
        other.data_ = nullptr;                    // 元のオブジェクトを空にする
    }

    Buffer &operator=(Buffer &&other) noexcept    // ムーブ代入演算子
    {
        if (this != &other) {
            delete[] data_;
            size_ = other.size_;
            data_ = other.data_;
            other.size_ = 0;
            other.data_ = nullptr;
        }
        return *this;
    }

    Buffer(const Buffer &) = delete;
    Buffer &operator=(const Buffer &) = delete;

private:
    size_t size_;
    int *data_;
};
```

ムーブ操作に `noexcept` を付けると、`std::vector` の再確保時などにムーブが使われるようになる。

### 完全転送

```cpp
template <typename T>
void wrapper(T &&arg)          // テンプレートの T&& は転送参照（ユニバーサル参照）
{
    target(std::forward<T>(arg));   // 左辺値/右辺値の性質を保ったまま渡す
}
```

## 7.5 enum class (スコープ付き列挙型)

```cpp
enum class Color { Red, Green, Blue };
enum class Status : std::uint8_t { Ok = 0, Error = 1 };   // 基底型を指定

Color c = Color::Red;              // スコープ名が必要
// int n = c;                      // NG: 暗黙の整数変換なし
int n = static_cast<int>(c);       // 明示的な変換が必要
```

## 7.6 構造化束縛 (C++17)

```cpp
std::pair<int, std::string> p = {1, "one"};
auto [num, name] = p;

std::map<std::string, int> m = {{"a", 1}};
for (const auto &[key, val] : m) { }

struct Point { int x, y; };
auto [x, y] = Point{1, 2};
```

## 7.7 if / switch の初期化文 (C++17)

```cpp
if (auto it = m.find("a"); it != m.end()) {
    // it のスコープは if 文内に限定される
}

switch (auto s = get_status(); s) { /* ... */ }
```

## 7.8 std::optional / std::variant / std::any (C++17)

```cpp
#include <optional>
std::optional<int> find_index(const std::vector<int> &v, int x)
{
    for (size_t i = 0; i < v.size(); ++i)
        if (v[i] == x) return static_cast<int>(i);
    return std::nullopt;            // 値なし
}

if (auto idx = find_index(v, 3)) {
    std::cout << *idx;              // 値を取得
}
find_index(v, 99).value_or(-1);     // 値がなければ -1

#include <variant>
std::variant<int, std::string> var = 42;
var = "text";
std::holds_alternative<std::string>(var);   // => true
std::get<std::string>(var);                 // 型を指定して取得（違えば例外 std::bad_variant_access）
std::visit([](const auto &x) { std::cout << x; }, var);

#include <any>
std::any a = 1;
a = std::string("x");
std::any_cast<std::string>(a);
```

## 7.9 constexpr / consteval

```cpp
constexpr int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
constexpr int f10 = fib(10);       // コンパイル時に計算 => 55
static_assert(fib(10) == 55);      // C++17 からメッセージ省略可

consteval int sq(int n) { return n * n; }   // C++20: 必ずコンパイル時に評価
```

## 7.10 統一初期化（波括弧初期化）

```cpp
int a{5};
std::vector<int> v{1, 2, 3};
Point p{1, 2};
// int b{3.5};  // NG: 縮小変換（情報が失われる変換）はコンパイルエラー

std::vector<int> v1(3, 0);   // 要素数 3、値 0 => {0, 0, 0}
std::vector<int> v2{3, 0};   // 初期化子リスト => {3, 0}
```

`()` と `{}` で意味が変わる場合がある（`std::initializer_list` を受け取るコンストラクタが優先される）点に注意。

## 7.11 std::span (C++20)

```cpp
#include <span>
void print(std::span<const int> s)   // 配列・vector・array を所有せずに参照
{
    for (int x : s) std::cout << x << ' ';
}

int arr[] = {1, 2, 3};
std::vector<int> v = {4, 5};
print(arr);
print(v);
```

## 7.12 並行処理（`<thread>` ほか）

```cpp
#include <thread>
#include <mutex>
#include <atomic>
#include <future>

std::mutex mtx;
int shared = 0;
std::atomic<int> counter{0};

std::thread t([&] {
    std::lock_guard<std::mutex> lock(mtx);
    ++shared;
    ++counter;     // atomic はロックなしで安全に操作できる
});
t.join();          // 終了を待つ（join か detach をしないまま破棄すると std::terminate）

auto fut = std::async(std::launch::async, [] { return 42; });
int result = fut.get();   // 結果を待って取得
```

C++20 の `std::jthread` はデストラクタで自動的に `join` する。

## 7.13 その他の便利機能

```cpp
// ファイルシステム (C++17)
#include <filesystem>
namespace fs = std::filesystem;
for (const auto &entry : fs::directory_iterator(".")) {
    std::cout << entry.path() << '\n';
}
fs::exists("a.txt");
fs::create_directories("out/sub");

// 時間計測 (C++11)
#include <chrono>
auto start = std::chrono::steady_clock::now();
/* 処理 */
auto elapsed = std::chrono::steady_clock::now() - start;
auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(elapsed).count();

// 乱数 (C++11)
#include <random>
std::mt19937 gen(std::random_device{}());
std::uniform_int_distribution<int> dist(1, 6);   // 1〜6 の一様分布
int dice = dist(gen);

// 属性
[[nodiscard]] int compute();         // 戻り値を無視すると警告 (C++17)
[[maybe_unused]] int debug_only;     // 未使用の警告を抑制 (C++17)
[[deprecated("use g()")]] void f();  // 非推奨 (C++14)
// switch 内で意図的なフォールスルーには [[fallthrough]]; (C++17)
```

---

[← 前: メモリ管理とスマートポインタ](06-memory.md) | [目次](../index.md) | [次: 例外処理 →](08-exceptions.md)
