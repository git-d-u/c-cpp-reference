# C++ 2. クラスとオブジェクト指向

[← 前: C++の基本](01-basics.md) | [目次](../index.md) | [次: テンプレート →](03-templates.md)

---

## 2.1 クラスの定義

```cpp
#include <string>

class Person {
public:                                   // 外部から参照可能
    Person(std::string name, int age)     // コンストラクタ
        : name_(std::move(name)), age_(age) {}   // メンバ初期化子リスト

    const std::string &name() const { return name_; }  // const メンバ関数
    int age() const { return age_; }
    void birthday() { ++age_; }

private:                                  // クラス内からのみ参照可能
    std::string name_;
    int age_;
};

Person p("Taro", 20);
p.birthday();
p.age();   // => 21
```

### アクセス指定子

| 指定子 | アクセス可能な範囲 |
|--------|--------------------|
| `public` | どこからでも |
| `protected` | 自クラスと派生クラス |
| `private` | 自クラスのみ（と `friend`） |

- `class` のデフォルトは `private`、`struct` のデフォルトは `public`。それ以外の違いはない。

### const メンバ関数

末尾に `const` を付けたメンバ関数はメンバを変更できず、`const` オブジェクトからも呼び出せる。

## 2.2 宣言と定義の分離

```cpp
// counter.h
#pragma once
class Counter {
public:
    void increment();
    int value() const;
private:
    int count_ = 0;   // デフォルトメンバ初期化子 (C++11)
};

// counter.cpp
#include "counter.h"
void Counter::increment() { ++count_; }
int Counter::value() const { return count_; }
```

## 2.3 コンストラクタとデストラクタ

```cpp
class Buffer {
public:
    Buffer() : Buffer(16) {}                     // 委譲コンストラクタ (C++11)
    explicit Buffer(size_t n)                    // explicit: 暗黙の型変換を禁止
        : size_(n), data_(new int[n]{}) {}
    ~Buffer() { delete[] data_; }                // デストラクタ: 破棄時に自動で呼ばれる

private:
    size_t size_;
    int *data_;
};
```

- メンバは**宣言順**に初期化される（初期化子リストの記述順ではない）。
- `const` メンバや参照メンバは初期化子リストで初期化する必要がある。

### 特殊メンバ関数

| 関数 | シグネチャ例 |
|------|-------------|
| デフォルトコンストラクタ | `T()` |
| コピーコンストラクタ | `T(const T &)` |
| コピー代入演算子 | `T &operator=(const T &)` |
| ムーブコンストラクタ (C++11) | `T(T &&) noexcept` |
| ムーブ代入演算子 (C++11) | `T &operator=(T &&) noexcept` |
| デストラクタ | `~T()` |

```cpp
class NonCopyable {
public:
    NonCopyable() = default;                               // コンパイラ生成版を使う
    NonCopyable(const NonCopyable &) = delete;             // コピー禁止
    NonCopyable &operator=(const NonCopyable &) = delete;
};
```

### Rule of Zero / Three / Five

- **Rule of Three**: デストラクタ・コピーコンストラクタ・コピー代入のいずれかを自前で定義するなら、3つすべてを定義すべき。
- **Rule of Five** (C++11): 上記にムーブコンストラクタ・ムーブ代入を加えた5つ。
- **Rule of Zero**: リソース管理はスマートポインタや標準コンテナに任せ、特殊メンバ関数を自前で定義しないのが理想。

## 2.4 static メンバ

```cpp
class Counter {
public:
    static int count() { return count_; }   // static メンバ関数（this を持たない）
    Counter() { ++count_; }
private:
    static inline int count_ = 0;           // C++17: inline でクラス内定義可能
};

Counter::count();
```

## 2.5 this ポインタ

```cpp
class Point {
public:
    Point &setX(int x) { this->x = x; return *this; }   // メソッドチェーン
    Point &setY(int y) { this->y = y; return *this; }
private:
    int x = 0, y = 0;
};

Point p;
p.setX(1).setY(2);
```

## 2.6 継承

```cpp
class Animal {
public:
    explicit Animal(std::string name) : name_(std::move(name)) {}
    virtual ~Animal() = default;              // 基底クラスのデストラクタは virtual に
    virtual std::string speak() const { return "..."; }
protected:
    std::string name_;
};

class Dog : public Animal {                   // public 継承
public:
    using Animal::Animal;                     // 継承コンストラクタ (C++11)
    std::string speak() const override { return "Woof"; }  // override で上書きを明示
};
```

| 継承の種類 | 基底の public メンバ | 基底の protected メンバ |
|-----------|----------------------|--------------------------|
| `public` | public | protected |
| `protected` | protected | protected |
| `private` | private | private |

基底の `private` メンバはどの継承でも派生クラスから直接アクセスできない。

## 2.7 仮想関数とポリモーフィズム

```cpp
#include <memory>
#include <vector>
#include <iostream>

std::vector<std::unique_ptr<Animal>> zoo;
zoo.push_back(std::make_unique<Dog>("Pochi"));

for (const auto &a : zoo)
    std::cout << a->speak() << '\n';   // 実行時の型 (Dog) の speak が呼ばれる
```

- `virtual` 関数は基底クラスのポインタ/参照経由で呼ぶと派生クラスの実装が呼ばれる（動的ディスパッチ）。
- ポリモーフィックに使う基底クラスのデストラクタは `virtual` にする（そうしないと基底ポインタ経由の `delete` が未定義動作）。
- `override`: 基底の仮想関数を上書きしていることを明示（シグネチャ不一致をコンパイルエラーにできる）。
- `final`: それ以上のオーバーライド・継承を禁止。

### 純粋仮想関数と抽象クラス

```cpp
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;   // 純粋仮想関数
};
// Shape s;  // NG: 抽象クラスはインスタンス化できない

class Circle final : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.141592653589793 * r_ * r_; }
private:
    double r_;
};
```

## 2.8 演算子オーバーロード

```cpp
struct Vec2 {
    double x, y;

    Vec2 operator+(const Vec2 &o) const { return {x + o.x, y + o.y}; }
    Vec2 &operator+=(const Vec2 &o) { x += o.x; y += o.y; return *this; }
    bool operator==(const Vec2 &o) const { return x == o.x && y == o.y; }
};

// 出力演算子は非メンバ関数として定義
std::ostream &operator<<(std::ostream &os, const Vec2 &v)
{
    return os << '(' << v.x << ", " << v.y << ')';
}

Vec2 a{1, 2}, b{3, 4};
std::cout << a + b << '\n';   // => (4, 6)
```

C++20 では `operator<=>`（三方比較演算子）を `= default` で定義すると、比較演算子をまとめて生成できる。

```cpp
#include <compare>
struct Version {
    int major, minor;
    auto operator<=>(const Version &) const = default;   // C++20
};
```

## 2.9 friend

```cpp
class Box {
    friend void inspect(const Box &b);   // 非メンバ関数に private へのアクセスを許可
private:
    int secret_ = 42;
};
void inspect(const Box &b) { std::cout << b.secret_; }
```

---

[← 前: C++の基本](01-basics.md) | [目次](../index.md) | [次: テンプレート →](03-templates.md)
