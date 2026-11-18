# Python 2. 便利な関数と、使わない場合の書き方

[← 前: 基本構文と型の変換](01-basics.md) | [目次](../index.md)

---

Python には、よく使う処理を 1 行で書ける組み込み関数や標準ライブラリがあります。この章では、それぞれ **関数を使う書き方** と **使わずにループで書いた場合** を並べています。

ループで書いた形を知っておくと、関数が中で何をしているのかが分かり、ほかの言語に書き換えるときにも役立ちます。

## 2.1 一覧

| 関数 | 何をするか | 使わない場合 |
|------|----------|------------|
| `len(x)` | 要素の数 | 数を数えるループ |
| `sum(x)` | 合計 | 足し込むループ |
| `max(x)` / `min(x)` | 最大 / 最小 | 比べながら更新するループ |
| `sorted(x)` | 並べ替えた新しいリスト | 並べ替えのアルゴリズムを自分で書く |
| `reversed(x)` | 逆順 | 後ろから取り出すループ |
| `enumerate(x)` | 番号と要素の組 | 番号用の変数を自分で増やす |
| `zip(a, b)` | 複数のリストを組にする | 添字で両方から取り出す |
| `map(f, x)` | 全要素に関数を適用 | 結果を追加していくループ |
| `filter(f, x)` | 条件に合う要素だけ残す | `if` で選んで追加するループ |
| `any(x)` / `all(x)` | 1 つでも真か / すべて真か | フラグ変数と `break` |
| `"区切り".join(x)` | 文字列をつなげる | `+` でつなげるループ |
| `dict.get(k, 既定値)` | キーがなければ既定値 | `if k in d` で分岐 |
| `divmod(a, b)` | 商と余りを同時に | `//` と `%` を別々に計算 |
| `collections.Counter` | 出現回数を数える | 辞書で数えるループ |
| `collections.defaultdict` | キーがなくても初期値を用意 | `if k not in d` で初期化 |
| `set(x)` | 重複を取り除く | 見たことがあるか調べるループ |

## 2.2 len — 要素の数

```python
items = ["a", "b", "c"]

# 使う
print(len(items))       # 3

# 使わない
count = 0
for _ in items:
    count += 1
print(count)            # 3
```

## 2.3 sum — 合計

```python
nums = [3, 1, 4, 1, 5]

# 使う
print(sum(nums))        # 14
print(sum(nums, 100))   # 114（初期値を 100 にする）

# 使わない
total = 0
for n in nums:
    total += n
print(total)            # 14
```

> 小数をたくさん足すときは、誤差の少ない `math.fsum()` もあります。

## 2.4 max / min — 最大と最小

```python
nums = [3, 1, 4, 1, 5]

# 使う
print(max(nums), min(nums))     # 5 1

# 使わない
largest = nums[0]
for n in nums[1:]:
    if n > largest:
        largest = n
print(largest)                  # 5
```

### key で比べ方を指定する

```python
words = ["apple", "fig", "banana"]

# 使う：文字数がいちばん多い単語
print(max(words, key=len))      # banana

# 使わない
longest = words[0]
for w in words[1:]:
    if len(w) > len(longest):
        longest = w
print(longest)                  # banana

# 空のリストに max を使うとエラーになるので、default を指定できる
print(max([], default=0))       # 0
```

## 2.5 sorted — 並べ替え

```python
nums = [3, 1, 4, 1, 5]

# 使う
print(sorted(nums))                  # [1, 1, 3, 4, 5]
print(sorted(nums, reverse=True))    # [5, 4, 3, 1, 1]
print(nums)                          # [3, 1, 4, 1, 5]（元のリストは変わらない）

# 使わない（挿入ソート）
result = []
for n in nums:
    i = 0
    while i < len(result) and result[i] <= n:
        i += 1
    result.insert(i, n)
print(result)                        # [1, 1, 3, 4, 5]
```

- `sorted()` は新しいリストを返します。元のリストを並べ替えたいときは `nums.sort()` を使います（戻り値は `None`）。
- Python の並べ替えは **安定** です。同じ値の要素は、元の順番のまま並びます。

### key で並べ替えの基準を指定する

```python
users = [
    {"name": "Taro", "age": 30},
    {"name": "Hanako", "age": 25},
    {"name": "Jiro", "age": 30},
]

# 年齢の順
print([u["name"] for u in sorted(users, key=lambda u: u["age"])])
# ['Hanako', 'Taro', 'Jiro']

# 年齢の大きい順、同じ年齢なら名前の順（タプルで複数の基準）
print([u["name"] for u in sorted(users, key=lambda u: (-u["age"], u["name"]))])
# ['Jiro', 'Taro', 'Hanako']
```

## 2.6 reversed — 逆順

```python
items = ["a", "b", "c"]

# 使う
print(list(reversed(items)))    # ['c', 'b', 'a']
print(items[::-1])              # ['c', 'b', 'a']（スライスでも同じ）

# 使わない
result = []
i = len(items) - 1
while i >= 0:
    result.append(items[i])
    i -= 1
print(result)                   # ['c', 'b', 'a']
```

## 2.7 enumerate — 番号付きで取り出す

```python
fruits = ["apple", "banana", "cherry"]

# 使う
print(list(enumerate(fruits, start=1)))
# [(1, 'apple'), (2, 'banana'), (3, 'cherry')]

# 使わない
result = []
i = 1
for f in fruits:
    result.append((i, f))
    i += 1
print(result)
# [(1, 'apple'), (2, 'banana'), (3, 'cherry')]
```

ループでの典型的な使い方:

```python
for i, f in enumerate(fruits, start=1):
    print(f"{i}. {f}")
```

> `for i in range(len(fruits)):` と書いて `fruits[i]` で取り出す書き方もできますが、`enumerate` のほうが読みやすく、間違いも起きにくくなります。

## 2.8 zip — 複数のリストを組にする

```python
names = ["Taro", "Hanako", "Jiro"]
scores = [80, 95, 70]

# 使う
print(list(zip(names, scores)))
# [('Taro', 80), ('Hanako', 95), ('Jiro', 70)]
print(dict(zip(names, scores)))
# {'Taro': 80, 'Hanako': 95, 'Jiro': 70}

# 使わない
result = []
for i in range(min(len(names), len(scores))):
    result.append((names[i], scores[i]))
print(result)
# [('Taro', 80), ('Hanako', 95), ('Jiro', 70)]
```

- 長さが違うと、**短いほうに合わせて** 残りは捨てられます。
- 長さが違うときにエラーにしたい場合は、`zip(names, scores, strict=True)` と書きます（3.10〜）。

## 2.9 map と filter

```python
nums = [1, 2, 3, 4, 5]

# map：全要素に関数を適用
print(list(map(lambda n: n * 2, nums)))      # [2, 4, 6, 8, 10]
print(list(map(str, nums)))                  # ['1', '2', '3', '4', '5']

# filter：条件に合う要素だけ残す
print(list(filter(lambda n: n % 2 == 0, nums)))   # [2, 4]

# 内包表記で書いた場合（Python ではこちらがよく使われる）
print([n * 2 for n in nums])                 # [2, 4, 6, 8, 10]
print([n for n in nums if n % 2 == 0])       # [2, 4]

# 使わない
doubled = []
for n in nums:
    doubled.append(n * 2)
print(doubled)                               # [2, 4, 6, 8, 10]

evens = []
for n in nums:
    if n % 2 == 0:
        evens.append(n)
print(evens)                                 # [2, 4]
```

> `map()` と `filter()` は、すぐにリストを作らず、必要になったときに 1 つずつ計算する **イテレータ** を返します。中身を見るには `list()` で囲みます。

## 2.10 any と all

```python
nums = [3, 8, 12, 5]

# 使う
print(any(n > 10 for n in nums))    # True（10 より大きいものが 1 つでもある）
print(all(n > 0 for n in nums))     # True（すべて 0 より大きい）

# 使わない（any）
found = False
for n in nums:
    if n > 10:
        found = True
        break                       # 見つかった時点でやめる
print(found)                        # True

# 使わない（all）
ok = True
for n in nums:
    if not n > 0:
        ok = False
        break
print(ok)                           # True
```

- 空のリストでは `any([])` は `False`、`all([])` は `True` になります。
- どちらも、結果が決まった時点で残りを調べずに終わります。

## 2.11 join — 文字列をつなげる

```python
words = ["Python", "is", "fun"]

# 使う
print(" ".join(words))              # Python is fun
print(", ".join(map(str, [1, 2])))  # 1, 2（数値は先に文字列にする）

# 使わない
text = ""
for i, w in enumerate(words):
    if i > 0:
        text += " "
    text += w
print(text)                         # Python is fun
```

> 文字列は変更できない型なので、`+=` でつなげるたびに新しい文字列が作られます。たくさんつなげるときは `join()` のほうが効率的です。

## 2.12 dict.get — キーがないときの既定値

```python
stock = {"apple": 3, "banana": 0}

# 使う
print(stock.get("apple", 0))     # 3
print(stock.get("cherry", 0))    # 0

# 使わない
if "cherry" in stock:
    value = stock["cherry"]
else:
    value = 0
print(value)                     # 0
```

> `stock["cherry"]` のように存在しないキーを直接指定すると、`KeyError` になります。

## 2.13 divmod — 商と余り

```python
seconds = 3725

# 使う
minutes, sec = divmod(seconds, 60)
hours, minutes = divmod(minutes, 60)
print(hours, minutes, sec)       # 1 2 5

# 使わない
h = seconds // 3600
m = (seconds % 3600) // 60
s = seconds % 60
print(h, m, s)                   # 1 2 5
```

## 2.14 Counter — 出現回数を数える

```python
from collections import Counter

text = "banana"

# 使う
c = Counter(text)
print(c)                         # Counter({'a': 3, 'n': 2, 'b': 1})
print(c.most_common(1))          # [('a', 3)]

# 使わない
counts = {}
for ch in text:
    if ch in counts:
        counts[ch] += 1
    else:
        counts[ch] = 1
print(counts)                    # {'b': 1, 'a': 3, 'n': 2}
```

> ログから IP アドレスごとの件数を数えるなど、集計によく使います。

## 2.15 defaultdict — キーがなくても初期値を用意する

```python
from collections import defaultdict

pairs = [("fruit", "apple"), ("veg", "carrot"), ("fruit", "banana")]

# 使う
groups = defaultdict(list)       # 存在しないキーには空のリストが用意される
for kind, name in pairs:
    groups[kind].append(name)
print(dict(groups))              # {'fruit': ['apple', 'banana'], 'veg': ['carrot']}

# 使わない
groups2 = {}
for kind, name in pairs:
    if kind not in groups2:
        groups2[kind] = []
    groups2[kind].append(name)
print(groups2)                   # {'fruit': ['apple', 'banana'], 'veg': ['carrot']}
```

> 普通の辞書の `setdefault()` を使って `groups2.setdefault(kind, []).append(name)` と書くこともできます。

## 2.16 set — 重複を取り除く

```python
nums = [3, 1, 3, 2, 1]

# 使う
print(sorted(set(nums)))             # [1, 2, 3]（set は順番を保たないので並べ替えて表示）
print(list(dict.fromkeys(nums)))     # [3, 1, 2]（最初に出てきた順番を保つ）

# 使わない（順番を保つ）
seen = []
for n in nums:
    if n not in seen:
        seen.append(n)
print(seen)                          # [3, 1, 2]
```

集合どうしの計算もできます。

```python
a = {1, 2, 3}
b = {2, 3, 4}
print(a & b)    # {2, 3}（両方にある）
print(a | b)    # {1, 2, 3, 4}（どちらかにある）
print(a - b)    # {1}（a にだけある）
```

> 「使わない」書き方の `if n not in seen`（リストでの検索）は、要素が増えると遅くなります。リストの代わりに `set` で記録すると速くなります。

## 2.17 そのほかの便利な関数

| 関数 | 例 | 結果 |
|------|----|------|
| `abs(x)` | `abs(-5)` | `5` |
| `round(x, n)` | `round(3.14159, 2)` | `3.14` |
| `pow(a, b, m)` | `pow(2, 10, 1000)` | `24`（2 の 10 乗を 1000 で割った余り） |
| `range(start, stop, step)` | `list(range(0, 10, 3))` | `[0, 3, 6, 9]` |
| `isinstance(x, 型)` | `isinstance(1, (int, float))` | `True` |
| `itertools.chain(a, b)` | `list(chain([1], [2, 3]))` | `[1, 2, 3]` |
| `itertools.groupby(x, key)` | 並べ替えたデータを、同じ値ごとにまとめる | — |
| `functools.reduce(f, x)` | `reduce(lambda a, b: a * b, [1, 2, 3, 4])` | `24` |
| `math.prod(x)` | `math.prod([1, 2, 3, 4])` | `24`（3.8〜） |
| `statistics.mean(x)` | `mean([1, 2, 3, 4])` | `2.5` |

## 参考資料

- [組み込み関数（Python 公式ドキュメント）](https://docs.python.org/ja/3/library/functions.html)
- [collections — Counter、defaultdict など](https://docs.python.org/ja/3/library/collections.html)
- [itertools](https://docs.python.org/ja/3/library/itertools.html) / [functools](https://docs.python.org/ja/3/library/functools.html)
- [ソート HOW TO](https://docs.python.org/ja/3/howto/sorting.html)
