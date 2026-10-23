# C++ 4. STL コンテナ

[← 前: テンプレート](03-templates.md) | [目次](../index.md) | [次: STL アルゴリズムとイテレータ →](05-stl-algorithms.md)

---

## 4.1 コンテナ一覧と計算量

| コンテナ | ヘッダ | 構造 | 要素アクセス | 末尾追加 | 途中挿入/削除 | 検索 |
|----------|--------|------|-------------|----------|---------------|------|
| `vector` | `<vector>` | 動的配列 | O(1) | 償却 O(1) | O(n) | O(n) |
| `array` | `<array>` | 固定長配列 (C++11) | O(1) | — | — | O(n) |
| `deque` | `<deque>` | 両端キュー | O(1) | O(1)（先頭も O(1)） | O(n) | O(n) |
| `list` | `<list>` | 双方向リスト | — | O(1) | O(1)※ | O(n) |
| `forward_list` | `<forward_list>` | 単方向リスト (C++11) | — | — | O(1)※ | O(n) |
| `set` / `multiset` | `<set>` | 平衡二分木（典型的に赤黒木） | — | — | O(log n) | O(log n) |
| `map` / `multimap` | `<map>` | 平衡二分木（典型的に赤黒木） | O(log n) | — | O(log n) | O(log n) |
| `unordered_set` | `<unordered_set>` | ハッシュテーブル (C++11) | — | — | 平均 O(1) | 平均 O(1) |
| `unordered_map` | `<unordered_map>` | ハッシュテーブル (C++11) | 平均 O(1) | — | 平均 O(1) | 平均 O(1) |

※ 挿入位置のイテレータが既にある場合。

**迷ったら `std::vector`** を使うのが一般的な指針。

### コンテナアダプタ

| アダプタ | ヘッダ | 説明 |
|----------|--------|------|
| `stack` | `<stack>` | LIFO（後入れ先出し） |
| `queue` | `<queue>` | FIFO（先入れ先出し） |
| `priority_queue` | `<queue>` | 優先度付きキュー（デフォルトは最大値が先頭） |

## 4.2 共通メンバ関数

```cpp
c.size();     // 要素数
c.empty();    // 空か
c.clear();    // 全削除
c.begin(); c.end();     // イテレータ
c.cbegin(); c.cend();   // const イテレータ
c.rbegin(); c.rend();   // 逆イテレータ
```

（`forward_list` には `size()` がないなど、例外もある）

## 4.3 vector

```cpp
#include <vector>

std::vector<int> v;                 // 空
std::vector<int> v2(5);             // 0 が 5 個
std::vector<int> v3(5, 7);          // 7 が 5 個
std::vector<int> v4 = {1, 2, 3};    // 初期化子リスト

v.push_back(10);                    // 末尾に追加（コピー/ムーブ）
v.emplace_back(20);                 // 末尾に直接構築
v.pop_back();                       // 末尾を削除
v[0];                               // 範囲チェックなし
v.at(0);                            // 範囲チェックあり（std::out_of_range）
v.front(); v.back();                // 先頭 / 末尾
v.insert(v.begin() + 1, 99);        // 位置を指定して挿入
v.erase(v.begin());                 // 位置を指定して削除
v.resize(10);                       // 要素数変更
v.reserve(100);                     // 容量を事前確保（要素数は変わらない）
v.capacity();                       // 現在の容量
v.data();                           // 先頭要素へのポインタ

std::vector<std::vector<int>> grid(3, std::vector<int>(4, 0));  // 3x4 の2次元配列
```

- 容量を超える追加が起きると再確保が発生し、**既存のイテレータ・ポインタ・参照が無効になる**。

### 条件に合う要素の削除

```cpp
// C++20
std::erase_if(v, [](int x) { return x % 2 == 0; });

// C++17 以前: erase-remove イディオム
v.erase(std::remove_if(v.begin(), v.end(),
                       [](int x) { return x % 2 == 0; }),
        v.end());
```

## 4.4 array

```cpp
#include <array>

std::array<int, 3> a = {1, 2, 3};
a.size();     // => 3（コンパイル時に決まる）
a.fill(0);
```

C 配列と違い、代入・比較・関数からの返却が可能。

## 4.5 deque / list

```cpp
#include <deque>
std::deque<int> d;
d.push_front(1);   // 先頭に追加
d.push_back(2);
d.pop_front();

#include <list>
std::list<int> l = {3, 1, 2};
l.push_front(0);
l.sort();          // list は std::sort が使えないためメンバ関数を使う
l.remove(1);       // 値が 1 の要素をすべて削除
```

## 4.6 map / unordered_map

```cpp
#include <map>
#include <string>

std::map<std::string, int> m;          // キーで自動的にソートされる
m["apple"] = 3;                        // キーがなければ挿入（値はデフォルト構築）
m.insert({"banana", 5});
m.emplace("cherry", 7);
m.insert_or_assign("apple", 10);       // C++17

m.at("apple");                         // キーがなければ std::out_of_range
m.count("apple");                      // 存在すれば 1、なければ 0
m.contains("apple");                   // C++20

auto it = m.find("banana");
if (it != m.end()) {
    std::cout << it->first << ": " << it->second << '\n';
}
m.erase("banana");

for (const auto &[key, value] : m) {   // C++17 構造化束縛
    std::cout << key << " = " << value << '\n';
}

// 範囲検索（map / set のみ）
m.lower_bound("b");   // "b" 以上の最初の要素
m.upper_bound("b");   // "b" より大きい最初の要素
```

- `operator[]` は存在しないキーに対して**要素を挿入する**ため、存在確認には `find` / `count` / `contains` を使う。
- `unordered_map` は順序を持たないが、平均的に高速。自作型をキーにする場合はハッシュ関数が必要。

## 4.7 set / unordered_set

```cpp
#include <set>

std::set<int> s = {3, 1, 4, 1, 5};   // => {1, 3, 4, 5}（重複なし・ソート済み）
s.insert(2);
s.erase(3);
bool has = s.count(4) > 0;

std::multiset<int> ms = {1, 1, 2};   // 重複を許す
```

## 4.8 stack / queue / priority_queue

```cpp
#include <stack>
#include <queue>

std::stack<int> st;
st.push(1); st.push(2);
st.top();   // => 2
st.pop();

std::queue<int> q;
q.push(1); q.push(2);
q.front();  // => 1
q.pop();

std::priority_queue<int> pq;                       // 最大値が先頭
pq.push(3); pq.push(5); pq.push(1);
pq.top();   // => 5

std::priority_queue<int, std::vector<int>, std::greater<int>> minpq;  // 最小値が先頭
```

`pop()` は値を返さない。取り出す前に `top()` / `front()` で取得する。

## 4.9 pair / tuple

```cpp
#include <utility>
#include <tuple>

std::pair<std::string, int> p = {"Taro", 20};
p.first; p.second;
auto p2 = std::make_pair(1, 2.0);

std::tuple<int, double, std::string> t = {1, 2.0, "x"};
std::get<0>(t);                // => 1
auto [a, b, c] = t;            // C++17 構造化束縛
```

---

[← 前: テンプレート](03-templates.md) | [目次](../index.md) | [次: STL アルゴリズムとイテレータ →](05-stl-algorithms.md)
