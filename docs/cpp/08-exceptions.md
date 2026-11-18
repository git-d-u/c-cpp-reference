# C++ 8. 例外処理

[← 前: モダンC++](07-modern-cpp.md) | [目次](../index.md) | [付録: C と C++ の違い →](../appendix/c-vs-cpp.md)

---

## 8.1 基本構文

```cpp
#include <iostream>
#include <stdexcept>

double divide(double a, double b)
{
    if (b == 0.0) {
        throw std::invalid_argument("division by zero");   // 例外を送出
    }
    return a / b;
}

int main()
{
    try {
        divide(1.0, 0.0);
    } catch (const std::invalid_argument &e) {   // const 参照で受け取る
        std::cerr << "invalid: " << e.what() << '\n';
    } catch (const std::exception &e) {          // 基底クラスは後に書く
        std::cerr << "error: " << e.what() << '\n';
    } catch (...) {                              // すべての例外
        std::cerr << "unknown error\n";
    }
}
```

- `catch` は**上から順に**照合される。派生クラスを先、基底クラスを後に書く。
- 例外は `const` 参照で受け取る（スライシングや不要なコピーを避ける）。

## 8.2 標準例外クラスの階層（`<stdexcept>` ほか）

```text
std::exception
├── std::logic_error            （プログラムの論理的な誤り）
│   ├── std::invalid_argument
│   ├── std::domain_error
│   ├── std::length_error
│   └── std::out_of_range       （vector::at などが送出）
├── std::runtime_error          （実行時に検出される誤り）
│   ├── std::range_error
│   ├── std::overflow_error
│   ├── std::underflow_error
│   └── std::system_error
├── std::bad_alloc              （new の失敗）
├── std::bad_cast               （参照への dynamic_cast の失敗）
└── std::bad_optional_access 等
```

※ 主要なもののみ抜粋。

## 8.3 独自の例外クラス

```cpp
class ConfigError : public std::runtime_error {
public:
    ConfigError(const std::string &key)
        : std::runtime_error("config key not found: " + key), key_(key) {}
    const std::string &key() const { return key_; }
private:
    std::string key_;
};

try {
    throw ConfigError("port");
} catch (const ConfigError &e) {
    std::cerr << e.what() << " (" << e.key() << ")\n";
}
```

## 8.4 再送出

```cpp
try {
    process();
} catch (const std::exception &e) {
    log(e.what());
    throw;            // 同じ例外オブジェクトをそのまま再送出（throw e; だとコピー・スライシングが起きる）
}
```

## 8.5 noexcept

```cpp
void safe() noexcept;        // 例外を送出しないことを宣言
void maybe() noexcept(false);

noexcept(safe());            // => true（コンパイル時に判定する演算子）
```

- `noexcept` 関数から例外が送出されると `std::terminate` が呼ばれる。
- デストラクタは暗黙的に `noexcept`（明示しない限り）。デストラクタから例外を送出しない。
- ムーブコンストラクタ・ムーブ代入には可能な限り `noexcept` を付ける。

## 8.6 例外安全性

| 保証レベル | 内容 |
|-----------|------|
| 例外を投げない保証 (nothrow) | 決して例外を送出しない |
| 強い保証 (strong) | 例外発生時、操作前の状態に戻る |
| 基本保証 (basic) | 例外発生時もリソースリークがなく、不変条件が保たれる |

RAII（[メモリ管理](06-memory.md#62-raii)）を徹底すると、例外発生時もリソースが自動的に解放される。

```cpp
void bad()
{
    int *p = new int[100];
    risky();          // ここで例外が出ると p はリークする
    delete[] p;
}

void good()
{
    auto p = std::make_unique<int[]>(100);
    risky();          // 例外が出ても p は自動で解放される
}
```

## 8.7 例外を使わない選択肢

- 戻り値でエラーを表す: `std::optional<T>`（C++17）、`std::expected<T, E>`（C++23）
- エラーコード: `std::error_code`（C++11、`<system_error>`）

```cpp
#include <expected>   // C++23
std::expected<int, std::string> parse(const std::string &s)
{
    try {
        return std::stoi(s);
    } catch (...) {
        return std::unexpected("parse error: " + s);
    }
}

auto r = parse("42");
if (r) std::cout << *r;
else   std::cerr << r.error();
```

---

[← 前: モダンC++](07-modern-cpp.md) | [目次](../index.md) | [付録: C と C++ の違い →](../appendix/c-vs-cpp.md)
