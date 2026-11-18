# C++ 1. C++の基本（Cとの違い）

[← C言語: プリプロセッサ](../c/08-preprocessor.md) | [目次](../index.md) | [次: クラスとオブジェクト指向 →](02-classes.md)

---

## 1.1 最小のプログラム

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

- C++ では `main()` の引数なしは `()` で表す（`(void)` も可）。
- 標準ヘッダには `.h` が付かない（`<iostream>`、`<string>`、`<vector>`）。
- C の標準ヘッダは `<cstdio>`、`<cstring>`、`<cmath>` のように `c` を付けて `.h` を外した名前でも使える。

## 1.2 入出力（iostream）

```cpp
#include <iostream>
#include <string>

int n;
std::string name;
std::cin >> n >> name;            // 空白区切りで読み込み
std::getline(std::cin, name);     // 1行読み込み

std::cout << "n = " << n << '\n'; // '\n' は改行のみ
std::cout << std::endl;           // 改行 + フラッシュ
std::cerr << "error\n";           // 標準エラー出力
```

### 書式設定（`<iomanip>`）

```cpp
#include <iomanip>
std::cout << std::fixed << std::setprecision(2) << 3.14159;  // => 3.14
std::cout << std::setw(5) << 42;                             // => "   42"
std::cout << std::setfill('0') << std::setw(5) << 42;        // => "00042"
std::cout << std::hex << 255;                                // => ff
```

C++20 では `std::format`（`<format>`）、C++23 では `std::print`（`<print>`）も使える。

```cpp
#include <format>   // C++20
std::string s = std::format("{} + {} = {}", 1, 2, 3);  // => "1 + 2 = 3"
```

## 1.3 名前空間 (namespace)

```cpp
namespace mylib {
    int value = 10;
    void hello() { /* ... */ }

    namespace detail {     // 入れ子
        int x;
    }
}

mylib::hello();
mylib::detail::x = 1;

namespace mylib::util { }  // C++17: 入れ子の簡略記法

using mylib::hello;        // 特定の名前を取り込む
hello();

using namespace std;       // 名前空間全体を取り込む（ヘッダファイルでは避ける）
```

## 1.4 参照

参照は既存の変数の**別名**。

```cpp
int x = 10;
int &r = x;      // r は x の別名（宣言時に必ず初期化）
r = 20;          // x も 20 になる

void swap(int &a, int &b)    // 参照渡し: ポインタなしで呼び出し元を変更
{
    int t = a; a = b; b = t;
}
swap(x, y);

void print(const std::string &s);  // const 参照: コピーを避けつつ変更を禁止
```

| | ポインタ | 参照 |
|-|---------|------|
| 初期化 | 不要（NULL 可） | 必須 |
| 再代入（指す先の変更） | 可能 | 不可 |
| null | `nullptr` を取れる | 原則なし |
| アクセス | `*p`、`p->m` | そのまま `r`、`r.m` |

右辺値参照 `T&&` については [モダンC++](07-modern-cpp.md#74-ムーブセマンティクス) を参照。

## 1.5 C との主な違い

### bool 型

```cpp
bool flag = true;    // ヘッダ不要の組み込み型
```

### nullptr (C++11)

```cpp
int *p = nullptr;    // NULL や 0 ではなく nullptr を使う
```

### 関数のオーバーロード

同じ名前で引数の型・数が異なる関数を定義できる。

```cpp
int    add(int a, int b)       { return a + b; }
double add(double a, double b) { return a + b; }

add(1, 2);      // int 版
add(1.0, 2.0);  // double 版
```

戻り値の型だけが異なるオーバーロードはできない。

### デフォルト引数

```cpp
void greet(const std::string &name, int times = 1);   // 右側の引数から指定
greet("Taro");      // times = 1
greet("Taro", 3);
```

### キャスト

```cpp
double d = 3.7;
int i = static_cast<int>(d);              // 通常の型変換
const int *cp = &i;
int *p = const_cast<int *>(cp);           // const を外す
Base *b = new Derived;
Derived *dp = dynamic_cast<Derived *>(b); // 実行時型チェック付きダウンキャスト（失敗時 nullptr）
auto addr = reinterpret_cast<std::uintptr_t>(p);  // ビット表現の再解釈
```

C スタイルのキャスト `(int)d` も使えるが、意図が明確な C++ のキャストが推奨される。

### その他

| 項目 | C | C++ |
|------|---|-----|
| `void *` から他のポインタへの暗黙変換 | 可 | 不可（キャストが必要） |
| 構造体の型名 | `struct S s;`（typedef なしの場合） | `S s;` で使える |
| 文字定数 `'a'` の型 | `int` | `char` |
| `const` 変数 | 定数式には使えない | 定数式で初期化されたものは定数式に使える |

## 1.6 std::string

```cpp
#include <string>

std::string s = "Hello";
s += ", World";                 // 連結
s.size();                       // 長さ（length() も同じ）
s[0];                           // 'H'（範囲チェックなし）
s.at(0);                        // 範囲チェックあり（範囲外で std::out_of_range）
s.substr(0, 5);                 // => "Hello"（位置, 長さ）
s.find("World");                // 位置（見つからなければ std::string::npos）
s.replace(0, 5, "Hi");          // 置換
s.insert(0, ">> ");             // 挿入
s.erase(0, 3);                  // 削除
s.empty();                      // 空か
s == "abc";                     // == で内容を比較できる
s.c_str();                      // C 文字列 (const char *) を取得

int n = std::stoi("123");       // 文字列 → 整数（stol, stod なども）
std::string t = std::to_string(3.5);  // 数値 → 文字列
```

C++17 の `std::string_view`（`<string_view>`）は文字列を所有せずに参照する軽量な型。

```cpp
void print(std::string_view sv) { std::cout << sv << '\n'; }
print("literal");               // コピーなし
```

## 1.7 const と constexpr

```cpp
const int a = 10;                 // 変更不可
constexpr int b = 10 * 2;         // コンパイル時定数 (C++11)

constexpr int square(int x) { return x * x; }
int arr[square(3)];               // コンパイル時に評価できる
```

## 1.8 範囲 for 文 (C++11)

```cpp
std::vector<int> v = {1, 2, 3};
for (int x : v) { }               // コピー
for (int &x : v) { x *= 2; }      // 参照（要素を変更）
for (const auto &x : v) { }       // const 参照（読み取り専用。大きな型で推奨）
```

---

[← C言語: プリプロセッサ](../c/08-preprocessor.md) | [目次](../index.md) | [次: クラスとオブジェクト指向 →](02-classes.md)
