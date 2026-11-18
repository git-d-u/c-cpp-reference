# 付録 A. C と C++ の主な違い早見表

[← 目次へ戻る](../index.md) | [次: コンパイルとビルドの基本 →](build.md)

---

| 項目 | C | C++ |
|------|---|-----|
| 出力 | `printf("%d\n", x);` | `std::cout << x << '\n';` |
| 入力 | `scanf("%d", &x);` | `std::cin >> x;` |
| 文字列 | `char s[]` / `char *` + `<string.h>` | `std::string` |
| 動的配列 | `malloc` / `realloc` / `free` | `std::vector` |
| メモリ確保 | `malloc` / `free` | `new` / `delete`（実際はスマートポインタ） |
| null ポインタ | `NULL`（C23 から `nullptr` も） | `nullptr` |
| 真偽値 | `<stdbool.h>` の `bool`（C23 からキーワード） | 組み込みの `bool` |
| 定数 | `#define`、`const`、`enum` | `const`、`constexpr`、`enum class` |
| 参照渡し | ポインタを渡す | 参照 `T&` |
| 関数のオーバーロード | 不可（`_Generic` で近いことは可能） | 可 |
| デフォルト引数 | 不可 | 可 |
| 名前空間 | なし | `namespace` |
| 構造体 | データのみ | メンバ関数・アクセス制御を持てる（クラスと同等） |
| 構造体の型名 | `struct S`（typedef しない場合） | `S` |
| ジェネリック | マクロ、`void *`、`_Generic` (C11) | テンプレート |
| エラー処理 | 戻り値、`errno` | 例外、`std::optional`、`std::expected` |
| `void *` → `T *` | 暗黙変換可 | 明示キャストが必要 |
| 文字定数 `'a'` の型 | `int` | `char` |
| ソースファイル拡張子 | `.c` / `.h` | `.cpp` `.cc` `.cxx` / `.h` `.hpp` |
| コンパイラ (GCC) | `gcc` | `g++` |

## 同じ処理の比較

### 配列の合計

```c
/* C */
#include <stdio.h>

int main(void)
{
    int a[] = {1, 2, 3, 4};
    size_t n = sizeof a / sizeof a[0];
    int sum = 0;
    for (size_t i = 0; i < n; i++) sum += a[i];
    printf("%d\n", sum);
    return 0;
}
```

```cpp
// C++
#include <iostream>
#include <numeric>
#include <vector>

int main()
{
    std::vector<int> a = {1, 2, 3, 4};
    std::cout << std::accumulate(a.begin(), a.end(), 0) << '\n';
}
```

### 文字列の連結

```c
/* C */
char buf[64];
snprintf(buf, sizeof buf, "%s %s", "Hello", "World");
```

```cpp
// C++
std::string s = std::string("Hello") + " " + "World";
```

### ソート

```c
/* C */
int cmp(const void *a, const void *b)
{
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}
qsort(arr, n, sizeof arr[0], cmp);
```

```cpp
// C++
std::sort(v.begin(), v.end());
```

## C++ に C のコードを持ち込むときの注意

- C で有効でも C++ ではエラーになるコードがある（例: `int *p = malloc(...);` はキャストが必要）。
- C99 の可変長配列 (VLA) や `restrict` は標準 C++ にない。
- C++ のキーワード（`class`、`new`、`delete`、`template` など）を変数名に使っている C コードはそのままでは通らない。
- C のライブラリを C++ から使う場合は `extern "C"` が必要（[プリプロセッサ](../c/08-preprocessor.md#87-c-と-c-の相互利用) 参照）。

---

[← 目次へ戻る](../index.md) | [次: コンパイルとビルドの基本 →](build.md)
