# Python 1. 基本構文と型の変換

[目次](../index.md) | [次: 便利な関数と、使わない場合の書き方 →](02-builtins.md)

---

> **Python 3.10 以降** を対象にします。2026年10月時点でサポートされている版は 3.11〜3.15 です（[Python Developer's Guide](https://devguide.python.org/versions/)）。

## 1.1 書き方の基本

```python
def add(a: int, b: int) -> int:   # 型ヒント（実行時にはチェックされない）
    """2つの数を足す"""              # docstring（関数の説明）
    return a + b


if __name__ == "__main__":         # このファイルを直接実行したときだけ動く
    print(add(1, 2))               # 3
```

- ブロックは `{}` ではなく **インデント** で表します。スペース 4 つが標準です。
- 文の終わりに `;` は付けません。
- コメントは `#` から行末までです。
- 変数は宣言せず、代入すると作られます。

## 1.2 主な型

| 型 | 例 | 中身を変更できるか |
|----|----|-----------------|
| `int`（整数） | `42`、`0xff`、`0b101`、`1_000_000` | できない |
| `float`（小数） | `3.14`、`1e-3` | できない |
| `bool`（真偽値） | `True`、`False` | できない |
| `str`（文字列） | `"abc"`、`'abc'` | できない |
| `bytes`（バイト列） | `b"abc"` | できない |
| `list`（リスト） | `[1, 2, 3]` | **できる** |
| `tuple`（タプル） | `(1, 2)`、`(1,)` | できない |
| `dict`（辞書） | `{"a": 1}` | **できる** |
| `set`（集合） | `{1, 2}` | **できる** |
| `None` | `None` | — |

- `int` には桁数の上限がありません。C 言語の `int` のような桁あふれは起きません。
- 型は `type(x)` で調べ、`isinstance(x, int)` で判定します。

## 1.3 文字列

```python
name = "Taro"
age = 20
print(f"{name} は {age} 歳")      # Taro は 20 歳（f 文字列）
print(f"{3.14159:.2f}")           # 3.14
print(f"{age:05d}")               # 00020

s = "Hello, World"
print(s[0], s[-1])                # H d
print(s[0:5])                     # Hello（0 以上 5 未満）
print(s.upper())                  # HELLO, WORLD
print(s.split(", "))              # ['Hello', 'World']
print("-".join(["a", "b"]))       # a-b
print("World" in s)               # True
```

## 1.4 リスト・タプル・辞書・集合

```python
nums = [3, 1, 2]
nums.append(4)          # 末尾に追加 → [3, 1, 2, 4]
nums.sort()             # 並べ替え（元のリストが変わる）→ [1, 2, 3, 4]
print(len(nums))        # 4
print(nums[1:3])        # [2, 3]

point = (10, 20)        # タプル
x, y = point            # 分割代入

user = {"name": "Taro", "age": 20}
user["email"] = "user@example.com"     # 追加
print(user.get("phone", "なし"))        # キーがなければ既定値 → なし
for key, value in user.items():
    print(key, value)

tags = {"a", "b"}
tags.add("c")
print("a" in tags)      # True
```

### 内包表記

```python
squares = [n * n for n in range(5)]            # [0, 1, 4, 9, 16]
evens = [n for n in range(10) if n % 2 == 0]   # [0, 2, 4, 6, 8]
lengths = {w: len(w) for w in ["ab", "cde"]}   # {'ab': 2, 'cde': 3}
```

## 1.5 制御構文

```python
score = 75
if score >= 80:
    print("A")
elif score >= 60:
    print("B")
else:
    print("C")

for i in range(3):          # 0, 1, 2
    print(i)

for i, v in enumerate(["a", "b"]):   # 番号付きで取り出す
    print(i, v)

n = 3
while n > 0:
    n -= 1

# match 文（3.10〜）
command = "stop"
match command:
    case "start":
        print("開始")
    case "stop" | "quit":
        print("停止")
    case _:
        print("不明")
```

## 1.6 関数

```python
def greet(name, greeting="こんにちは"):   # 既定値のある引数
    return f"{greeting}、{name}"

print(greet("Taro"))                      # こんにちは、Taro
print(greet(greeting="やあ", name="Taro"))  # 名前を指定して渡す

def total(*args, **kwargs):               # 可変長の引数
    return sum(args), kwargs

print(total(1, 2, 3, unit="円"))          # (6, {'unit': '円'})

double = lambda x: x * 2                  # 無名関数
print(double(5))                          # 10
```

!!! warning "既定値にリストや辞書を使わない"
    既定値は関数を定義したときに 1 回だけ作られ、呼び出しのたびに使い回されます。

    ```python
    def add_item(item, items=[]):       # NG：前の呼び出しの結果が残る
        items.append(item)
        return items

    def add_item(item, items=None):     # OK
        if items is None:
            items = []
        items.append(item)
        return items
    ```

## 1.7 クラス

```python
class User:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"{self.name} です"

u = User("Taro", 20)
print(u.greet())         # Taro です

from dataclasses import dataclass

@dataclass               # __init__ などを自動で作る
class Point:
    x: int
    y: int

print(Point(1, 2))       # Point(x=1, y=2)
```

## 1.8 例外処理

```python
try:
    value = int("abc")
except ValueError as e:
    print("数値に変換できません:", e)
else:
    print("成功")          # 例外が起きなかったとき
finally:
    print("必ず実行")
```

## 1.9 ファイルの読み書き

```python
with open("data.txt", "w", encoding="utf-8") as f:   # with を使うと自動で閉じる
    f.write("1行目\n")

with open("data.txt", encoding="utf-8") as f:
    for line in f:
        print(line.rstrip())
```

> Windows では `encoding` を省略すると、環境によって UTF-8 以外の文字コードで読み書きされることがあります。`encoding="utf-8"` を明示します。

## 1.10 型の変換

Python は、型が違う値どうしを自動では変換しません（`"1" + 1` はエラー）。変換は関数で明示的に行います。

### 数値と文字列

```python
print(int("42"))           # 42（文字列 → 整数）
print(int("  42 \n"))      # 42（前後の空白は無視される）
print(float("3.14"))       # 3.14
print(str(42))             # '42'（整数 → 文字列）
print(int("ff", 16))       # 255（16進数の文字列 → 整数）
print(int("0b101", 0))     # 5（基数 0 は接頭辞 0b / 0o / 0x から判断）
print(hex(255), oct(8), bin(5))   # 0xff 0o10 0b101
print(format(255, "08b"))  # 11111111（8桁の2進数）
```

### 小数と整数

```python
print(int(3.9))            # 3（小数点以下を切り捨て。0 の方向へ）
print(int(-3.9))           # -3
print(round(3.5), round(2.5))   # 4 2（ちょうど半分のときは偶数のほうへ丸める）
print(float(3))            # 3.0

import math
print(math.floor(-3.5), math.ceil(-3.5))   # -4 -3
```

!!! warning "int(\"3.5\") はエラーになる"
    小数の形の文字列を整数にするときは、いったん `float()` を通します：`int(float("3.5"))` → 3

### 整数と文字（C の int → char にあたる変換）

```python
print(chr(65))             # 'A'（文字コード → 文字）
print(ord("A"))            # 65（文字 → 文字コード）
print(chr(0x3042))         # 'あ'（Unicode の番号から）
print(ord("あ"))           # 12354
print(chr(ord("a") + 1))   # 'b'

# 数字 1 文字と数値
print(int("7"))            # 7
print(ord("7") - ord("0")) # 7（C 言語と同じ考え方）
print(str(7))              # '7'
```

> Python には 1 文字だけを表す `char` 型はなく、長さ 1 の `str` で表します。

### 文字列とバイト列

```python
b = "あいう".encode("utf-8")        # str → bytes
print(b)                            # b'\xe3\x81\x82\xe3\x81\x84\xe3\x81\x86'
print(b.decode("utf-8"))            # あいう（bytes → str）
print(b.hex())                      # e38182e38184e38186（16進数の文字列）
print(bytes.fromhex("414243"))      # b'ABC'

# 整数とバイト列
print((258).to_bytes(2, "big"))             # b'\x01\x02'
print(int.from_bytes(b"\x01\x02", "big"))   # 258
print(int.from_bytes(b"\x01\x02", "little"))  # 513
```

### 真偽値への変換

```python
print(bool(0), bool(""), bool([]), bool(None))   # False False False False
print(bool(1), bool("0"), bool([0]))             # True True True
```

- 0、空文字列、空のリスト・辞書、`None` は「偽」、それ以外は「真」として扱われます。
- 文字列の `"0"` や `"False"` も、空ではないので「真」です。

### コレクションどうしの変換

```python
print(list("abc"))                  # ['a', 'b', 'c']
print(tuple([1, 2]))                # (1, 2)
print(set([1, 1, 2]))               # {1, 2}（重複がなくなる）
print(dict([("a", 1), ("b", 2)]))   # {'a': 1, 'b': 2}
print(list({"a": 1, "b": 2}))       # ['a', 'b']（キーだけになる）
print(", ".join(map(str, [1, 2, 3])))   # 1, 2, 3（数値のリスト → 文字列）
print([int(x) for x in "1,2,3".split(",")])   # [1, 2, 3]
```

### 変換に失敗したとき

```python
def to_int(text: str, default: int = 0) -> int:
    try:
        return int(text)
    except ValueError:
        return default

print(to_int("12"), to_int("abc"))   # 12 0
```

### 変換の一覧

| 変換 | 書き方 | 例 → 結果 |
|------|-------|----------|
| 文字列 → 整数 | `int(s)` / `int(s, 基数)` | `int("ff", 16)` → `255` |
| 文字列 → 小数 | `float(s)` | `float("1.5")` → `1.5` |
| 数値 → 文字列 | `str(n)` / `f"{n}"` | `str(42)` → `'42'` |
| 小数 → 整数 | `int(x)`（切り捨て） / `round(x)` | `int(3.9)` → `3` |
| 整数 → 文字 | `chr(n)` | `chr(65)` → `'A'` |
| 文字 → 整数 | `ord(c)` | `ord("A")` → `65` |
| 整数 → 16進数の文字列 | `hex(n)` / `format(n, "x")` | `hex(255)` → `'0xff'` |
| 文字列 → バイト列 | `s.encode("utf-8")` | `"A".encode()` → `b'A'` |
| バイト列 → 文字列 | `b.decode("utf-8")` | `b"A".decode()` → `'A'` |
| 整数 → バイト列 | `n.to_bytes(長さ, "big")` | `(1).to_bytes(2, "big")` → `b'\x00\x01'` |
| バイト列 → 整数 | `int.from_bytes(b, "big")` | `int.from_bytes(b"\x00\x01", "big")` → `1` |

## 参考資料

- [Python 公式ドキュメント（日本語）](https://docs.python.org/ja/3/)
- [組み込み関数](https://docs.python.org/ja/3/library/functions.html) — `int()`、`chr()`、`ord()` など
- [組み込み型](https://docs.python.org/ja/3/library/stdtypes.html) — `str`、`bytes`、`int.to_bytes()` など
- [Python のサポート状況（Developer's Guide）](https://devguide.python.org/versions/)
