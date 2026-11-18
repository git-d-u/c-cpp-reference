# C++ 5. STL アルゴリズムとイテレータ

[← 前: STL コンテナ](04-stl-containers.md) | [目次](../index.md) | [次: メモリ管理とスマートポインタ →](06-memory.md)

---

## 5.1 イテレータ

イテレータはコンテナの要素を指す、ポインタのように扱えるオブジェクト。

```cpp
std::vector<int> v = {1, 2, 3};

for (auto it = v.begin(); it != v.end(); ++it) {
    std::cout << *it << ' ';
}
// end() は「最後の要素の次」を指す（間接参照してはいけない）
```

### イテレータのカテゴリ

| カテゴリ | できること | 例 |
|----------|-----------|-----|
| 入力 / 出力 | 1方向に1回だけ読む / 書く | `istream_iterator` / `ostream_iterator` |
| 前方向 (forward) | `++`、複数回の走査 | `forward_list`, `unordered_*` |
| 双方向 (bidirectional) | `++`、`--` | `list`, `set`, `map` |
| ランダムアクセス | `+n`、`-n`、`[]`、大小比較 | `vector`, `deque`, `array` |
| 連続 (contiguous, C++20) | 要素がメモリ上で連続 | `vector`, `array`, `string` |

### イテレータ補助関数（`<iterator>`）

```cpp
std::advance(it, 3);           // it を 3 進める
auto n = std::distance(a, b);  // a から b までの距離
auto nx = std::next(it);       // 1つ先（it は変更しない）
auto pv = std::prev(it);       // 1つ前
std::back_inserter(v);         // 末尾に push_back する出力イテレータ
```

## 5.2 主なアルゴリズム（`<algorithm>`）

アルゴリズムは `[first, last)`（半開区間）の範囲を受け取る。

### 検索

```cpp
std::vector<int> v = {5, 3, 8, 1, 9, 3};

auto it = std::find(v.begin(), v.end(), 8);                   // 値で検索
auto it2 = std::find_if(v.begin(), v.end(), [](int x) { return x > 6; });  // 条件で検索
if (it != v.end()) { /* 見つかった */ }

std::count(v.begin(), v.end(), 3);                             // => 2
std::count_if(v.begin(), v.end(), [](int x) { return x % 2; });
std::any_of(v.begin(), v.end(), [](int x) { return x > 8; });  // => true
std::all_of(v.begin(), v.end(), [](int x) { return x > 0; });  // => true
std::none_of(v.begin(), v.end(), [](int x) { return x < 0; }); // => true

auto mx = std::max_element(v.begin(), v.end());                // 最大要素のイテレータ
auto mn = std::min_element(v.begin(), v.end());
std::max(1, 2); std::min(1, 2); std::clamp(15, 0, 10);         // => 2, 1, 10 (clamp は C++17)
```

### ソート

```cpp
std::sort(v.begin(), v.end());                          // 昇順
std::sort(v.begin(), v.end(), std::greater<int>());     // 降順
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });  // 比較関数を指定
std::stable_sort(v.begin(), v.end());                   // 安定ソート
std::partial_sort(v.begin(), v.begin() + 3, v.end());   // 先頭3つだけ確定
std::nth_element(v.begin(), v.begin() + 2, v.end());    // 3番目の要素を確定
std::is_sorted(v.begin(), v.end());
std::reverse(v.begin(), v.end());                       // 逆順
```

- `std::sort` はランダムアクセスイテレータが必要（`list` には使えない）。
- 計算量は O(n log n)（C++11 以降で規定）。

### 二分探索（ソート済み範囲に対して）

```cpp
std::binary_search(v.begin(), v.end(), 5);      // 存在するか (bool)
std::lower_bound(v.begin(), v.end(), 5);        // 5 以上の最初の位置
std::upper_bound(v.begin(), v.end(), 5);        // 5 より大きい最初の位置
std::equal_range(v.begin(), v.end(), 5);        // [lower, upper) の pair
```

### 変更・変換

```cpp
std::vector<int> dst(v.size());
std::copy(v.begin(), v.end(), dst.begin());
std::copy_if(v.begin(), v.end(), std::back_inserter(dst), [](int x) { return x > 3; });
std::transform(v.begin(), v.end(), dst.begin(), [](int x) { return x * 2; });
std::fill(v.begin(), v.end(), 0);
std::replace(v.begin(), v.end(), 3, 30);        // 3 を 30 に置換
std::swap(a, b);
std::rotate(v.begin(), v.begin() + 1, v.end()); // 左に1つ回転

// 重複の除去（ソート後に unique + erase）
std::sort(v.begin(), v.end());
v.erase(std::unique(v.begin(), v.end()), v.end());
```

- `std::remove` / `std::unique` は要素を実際には削除せず、新しい論理的な終端を返す。実際の削除には `erase` が必要。

### 集計（`<numeric>`）

```cpp
#include <numeric>

int total = std::accumulate(v.begin(), v.end(), 0);      // 合計（初期値の型で計算される）
long long big = std::accumulate(v.begin(), v.end(), 0LL);
std::iota(v.begin(), v.end(), 1);                        // 1, 2, 3, ... で埋める
std::partial_sum(v.begin(), v.end(), dst.begin());       // 累積和
std::gcd(12, 18); std::lcm(4, 6);                        // => 6, 12 (C++17)
```

### 順列

```cpp
std::vector<int> p = {1, 2, 3};
do {
    // 1 2 3 / 1 3 2 / 2 1 3 / ... の全順列
} while (std::next_permutation(p.begin(), p.end()));     // ソート済みから開始する
```

## 5.3 Ranges (C++20)

範囲を直接渡せるアルゴリズムと、遅延評価のビュー。

```cpp
#include <algorithm>
#include <ranges>

std::vector<int> v = {5, 3, 8, 1};
std::ranges::sort(v);                                     // begin/end 不要
auto it = std::ranges::find(v, 8);

auto evens_squared = v
    | std::views::filter([](int x) { return x % 2 == 0; })
    | std::views::transform([](int x) { return x * x; });

for (int x : evens_squared) std::cout << x << ' ';

for (int i : std::views::iota(0, 5)) { }                  // 0, 1, 2, 3, 4
```

## 5.4 関数オブジェクト（`<functional>`）

```cpp
#include <functional>

std::function<int(int, int)> op = [](int a, int b) { return a + b; };
op(2, 3);   // => 5

std::plus<int>{}(1, 2);       // => 3
std::greater<int>{}(3, 1);    // => true
```

`std::function` は任意の呼び出し可能オブジェクト（関数・ラムダ・関数オブジェクト）を保持できる。

---

[← 前: STL コンテナ](04-stl-containers.md) | [目次](../index.md) | [次: メモリ管理とスマートポインタ →](06-memory.md)
