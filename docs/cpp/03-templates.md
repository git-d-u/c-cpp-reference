# C++ 3. テンプレート

[← 前: クラスとオブジェクト指向](02-classes.md) | [目次](../index.md) | [次: STL コンテナ →](04-stl-containers.md)

---

テンプレートは型をパラメータとして受け取り、コンパイル時にコードを生成する仕組み。

## 3.1 関数テンプレート

```cpp
template <typename T>
T max_of(T a, T b)
{
    return (a > b) ? a : b;
}

max_of(3, 5);          // T = int（テンプレート引数の推論）
max_of(2.5, 1.0);      // T = double
max_of<double>(3, 2.5);// 明示的に指定
```

- `typename` の代わりに `class` と書いても同じ意味。

## 3.2 クラステンプレート

```cpp
template <typename T>
class Stack {
public:
    void push(const T &v) { data_.push_back(v); }
    void pop() { data_.pop_back(); }
    const T &top() const { return data_.back(); }
    bool empty() const { return data_.empty(); }
private:
    std::vector<T> data_;
};

Stack<int> s;
s.push(1);

Stack s2 = Stack<double>();   // C++17 ではクラステンプレート引数推論 (CTAD) も可能
std::pair p(1, 2.0);          // CTAD: std::pair<int, double>
```

## 3.3 非型テンプレート引数

```cpp
template <typename T, std::size_t N>
class FixedArray {
public:
    T &operator[](std::size_t i) { return data_[i]; }
    constexpr std::size_t size() const { return N; }
private:
    T data_[N];
};

FixedArray<int, 10> arr;
```

## 3.4 デフォルトテンプレート引数

```cpp
template <typename T, typename Container = std::vector<T>>
class MyQueue { Container c_; };

MyQueue<int> q;   // Container = std::vector<int>
```

## 3.5 特殊化

```cpp
template <typename T>
struct TypeName { static const char *get() { return "unknown"; } };

template <>                       // 完全特殊化
struct TypeName<int> { static const char *get() { return "int"; } };

template <typename T>             // 部分特殊化（クラステンプレートのみ可能）
struct TypeName<T *> { static const char *get() { return "pointer"; } };

TypeName<int>::get();     // => "int"
TypeName<double*>::get(); // => "pointer"
```

## 3.6 可変引数テンプレート (C++11)

```cpp
#include <iostream>

// C++17 の畳み込み式 (fold expression)
template <typename... Args>
auto sum(Args... args)
{
    return (args + ...);
}

template <typename... Args>
void print_all(const Args &...args)
{
    ((std::cout << args << ' '), ...);
    std::cout << '\n';
}

sum(1, 2, 3, 4);              // => 10
print_all(1, "abc", 3.5);     // => 1 abc 3.5

template <typename... Args>
constexpr std::size_t count_args(Args...) { return sizeof...(Args); }  // パラメータパックの要素数
count_args(1, 'a', 2.0);      // => 3
```

## 3.7 型特性と if constexpr

```cpp
#include <type_traits>

template <typename T>
std::string describe(T value)
{
    if constexpr (std::is_integral_v<T>) {        // C++17: コンパイル時の分岐
        return "integer: " + std::to_string(value);
    } else if constexpr (std::is_floating_point_v<T>) {
        return "float: " + std::to_string(value);
    } else {
        return "other";
    }
}
```

主な型特性（`<type_traits>`）:

| 名前 | 意味 |
|------|------|
| `std::is_integral_v<T>` | 整数型か |
| `std::is_floating_point_v<T>` | 浮動小数点型か |
| `std::is_pointer_v<T>` | ポインタ型か |
| `std::is_same_v<T, U>` | 同じ型か |
| `std::is_base_of_v<B, D>` | B が D の基底クラスか |
| `std::remove_reference_t<T>` | 参照を除いた型 |
| `std::decay_t<T>` | 関数引数として渡したときの型 |
| `std::enable_if_t<cond, T>` | 条件が真のときのみ有効になる型（SFINAE） |

※ `_v` / `_t` 付きの別名は C++17 / C++14 から。

## 3.8 コンセプト (C++20)

テンプレート引数に対する制約を名前付きで記述できる。

```cpp
#include <concepts>

template <typename T>
concept Number = std::integral<T> || std::floating_point<T>;

template <Number T>
T twice(T x) { return x * 2; }

// 簡略記法
auto add(std::integral auto a, std::integral auto b) { return a + b; }

// requires 節
template <typename T>
    requires std::copyable<T>
void store(T value);

twice(3);      // OK
// twice("a"); // コンパイルエラー: 制約を満たさない
```

## 3.9 テンプレートの注意点

- テンプレートの定義は通常**ヘッダファイルに書く**（使用箇所で実体化するため、定義が見えている必要がある）。
- 依存名の型には `typename` が必要: `typename T::value_type x;`
- エラーメッセージが長くなりがち。C++20 のコンセプトで改善できる。

---

[← 前: クラスとオブジェクト指向](02-classes.md) | [目次](../index.md) | [次: STL コンテナ →](04-stl-containers.md)
