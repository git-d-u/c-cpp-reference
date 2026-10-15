# C++ 6. メモリ管理とスマートポインタ

[← 前: STL アルゴリズムとイテレータ](05-stl-algorithms.md) | [目次](../index.md) | [次: モダンC++ →](07-modern-cpp.md)

---

## 6.1 new / delete

```cpp
int *p = new int(42);        // 単一オブジェクト
delete p;

int *arr = new int[10]{};    // 配列（{} で 0 初期化）
delete[] arr;                // 配列は delete[] で解放

Person *person = new Person("Taro", 20);   // コンストラクタが呼ばれる
delete person;                             // デストラクタが呼ばれる
```

- `new` は失敗すると `std::bad_alloc` 例外を投げる（`NULL` を返さない）。`new (std::nothrow) T` とすると失敗時に `nullptr` を返す。
- `new` と `delete`、`new[]` と `delete[]` を対応させる。混在は未定義動作。
- `malloc` / `free` と `new` / `delete` も混在させない。

> モダンC++では `new` / `delete` を直接書くことは少なく、スマートポインタやコンテナを使う。

## 6.2 RAII

**RAII (Resource Acquisition Is Initialization)**: リソースの取得をオブジェクトの初期化で行い、解放をデストラクタで行う設計。スコープを抜けると（例外発生時も含め）自動的に解放される。

```cpp
#include <fstream>
#include <mutex>

void write_log(const std::string &msg)
{
    std::ofstream file("log.txt", std::ios::app);   // コンストラクタでオープン
    file << msg << '\n';
}   // スコープを抜けるとデストラクタでクローズ

std::mutex mtx;
void safe_increment(int &counter)
{
    std::lock_guard<std::mutex> lock(mtx);   // ロック取得
    ++counter;
}   // 自動でアンロック
```

## 6.3 スマートポインタ（`<memory>`）

| 種類 | 所有権 | 用途 |
|------|--------|------|
| `std::unique_ptr<T>` | 単独所有（コピー不可、ムーブ可） | 基本はこれを使う |
| `std::shared_ptr<T>` | 共有所有（参照カウント） | 複数の所有者が必要な場合 |
| `std::weak_ptr<T>` | 所有しない（`shared_ptr` を監視） | 循環参照の回避 |

### unique_ptr

```cpp
#include <memory>

auto p = std::make_unique<Person>("Taro", 20);   // C++14
p->birthday();
(*p).age();

std::unique_ptr<Person> q = std::move(p);        // 所有権の移動（p は nullptr になる）
// std::unique_ptr<Person> r = q;                // NG: コピー不可

auto arr = std::make_unique<int[]>(10);          // 配列版
arr[0] = 1;

q.reset();          // 明示的に解放
q.get();            // 生ポインタを取得（所有権は移らない）
q.release();        // 所有権を手放して生ポインタを返す（解放は呼び出し側の責任）
if (q) { }          // nullptr でないか

// 関数で所有権を受け渡す
std::unique_ptr<Person> create() { return std::make_unique<Person>("A", 1); }
void consume(std::unique_ptr<Person> p);   // 所有権を受け取る
consume(std::move(q));
```

カスタムデリータの例:

```cpp
std::unique_ptr<FILE, decltype(&fclose)> fp(fopen("a.txt", "r"), &fclose);
```

### shared_ptr

```cpp
auto a = std::make_shared<Person>("Hanako", 30);
auto b = a;                // 参照カウント +1
a.use_count();             // => 2
a.reset();                 // a は手放す（b がまだ所有）
// 最後の所有者がいなくなった時点で解放される
```

- `std::make_shared` は管理領域とオブジェクトを1回の確保で作るため効率的。
- 参照カウントの操作はスレッドセーフだが、指す先のオブジェクトへのアクセスはスレッドセーフではない。

### weak_ptr と循環参照

```cpp
struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;    // shared_ptr にすると循環参照でリークする
};

std::weak_ptr<Person> w = b;
if (auto sp = w.lock()) {        // 有効なら shared_ptr を取得
    sp->age();
} else {
    // 既に解放済み
}
w.expired();                     // 解放済みか
```

## 6.4 スマートポインタの使い分けの指針

- 所有権を持たない参照には、生ポインタ (`T*`) や参照 (`T&`) を使ってよい。
- 関数の引数で所有権に関係しない場合、スマートポインタではなく `T&` / `T*` を受け取る。
- `shared_ptr` は必要な場合のみ使う（デフォルトは `unique_ptr`）。

## 6.5 ムーブとコピーのコスト

```cpp
std::vector<int> make_big() {
    std::vector<int> v(1'000'000);   // 1'000'000 は桁区切り (C++14)
    return v;                        // コピーされず、ムーブまたはコピー省略される
}
```

ムーブの詳細は [モダンC++: ムーブセマンティクス](07-modern-cpp.md#74-ムーブセマンティクス) を参照。

---

[← 前: STL アルゴリズムとイテレータ](05-stl-algorithms.md) | [目次](../index.md) | [次: モダンC++ →](07-modern-cpp.md)
