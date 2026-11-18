# C言語 6. 動的メモリ管理

[← 前: 構造体・共用体・列挙型](05-structs.md) | [目次](../index.md) | [次: 標準ライブラリ →](07-stdlib.md)

---

## 6.1 記憶域期間（変数の寿命）

| 種類 | 例 | 寿命 | 主な配置先（一般的な実装） |
|------|----|------|----------------------------|
| 自動 (automatic) | 関数内のローカル変数 | ブロック終了まで | スタック |
| 静的 (static) | グローバル変数、`static` 変数 | プログラム終了まで | データ/BSS 領域 |
| 動的 (allocated) | `malloc` で確保 | `free` するまで | ヒープ |
| スレッド (thread) | `_Thread_local` 変数 (C11) | スレッド終了まで | スレッドごとの領域 |

## 6.2 メモリ確保・解放関数（`<stdlib.h>`）

| 関数 | 説明 |
|------|------|
| `void *malloc(size_t size)` | `size` バイト確保。中身は**不定** |
| `void *calloc(size_t n, size_t size)` | `n * size` バイト確保し、**0 で初期化** |
| `void *realloc(void *ptr, size_t size)` | 確保済み領域のサイズを変更（移動することがある） |
| `void free(void *ptr)` | 確保した領域を解放。`free(NULL)` は何もしない |
| `void *aligned_alloc(size_t align, size_t size)` | アライメント指定で確保 (C11)。MSVC では未対応 |

- 失敗すると `NULL` を返すので必ずチェックする。

## 6.3 基本的な使い方

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    size_t n = 10;
    int *arr = malloc(n * sizeof *arr);   // sizeof *arr とすると型変更に強い
    if (arr == NULL) {
        perror("malloc");
        return EXIT_FAILURE;
    }

    for (size_t i = 0; i < n; i++) arr[i] = (int)i;

    free(arr);
    arr = NULL;   // 解放後は NULL を入れておくと二重解放を防ぎやすい
    return 0;
}
```

> C では `malloc` の戻り値（`void *`）はキャスト不要。C++ ではキャストが必要。

## 6.4 realloc の安全な使い方

```c
int *tmp = realloc(arr, new_n * sizeof *arr);
if (tmp == NULL) {
    // 失敗しても元の arr は有効なまま。arr = realloc(arr, ...) と書くと
    // 失敗時に元の領域を指すポインタを失い、メモリリークになる
    free(arr);
    return -1;
}
arr = tmp;
```

## 6.5 2次元配列の動的確保

```c
// 方法1: 連続領域として確保して添字を計算
int *m = malloc(rows * cols * sizeof *m);
m[r * cols + c] = 1;
free(m);

// 方法2: ポインタの配列
int **m2 = malloc(rows * sizeof *m2);
for (size_t r = 0; r < rows; r++)
    m2[r] = malloc(cols * sizeof *m2[r]);
m2[1][2] = 1;
for (size_t r = 0; r < rows; r++) free(m2[r]);
free(m2);
```

## 6.6 メモリ操作関数

ヘッダ: `<string.h>`

```c
memset(buf, 0, sizeof buf);       // バイト単位で値を埋める
memcpy(dst, src, n);              // n バイトコピー（領域が重なってはいけない）
memmove(dst, src, n);             // 領域が重なっても安全なコピー
int r = memcmp(a, b, n);          // n バイト比較（0 なら等しい）
```

## 6.7 よくあるメモリの不具合

| 不具合 | 内容 |
|--------|------|
| メモリリーク | `free` し忘れ |
| 二重解放 (double free) | 同じ領域を2回 `free` |
| 解放後使用 (use after free) | `free` した領域へのアクセス |
| バッファオーバーラン | 確保サイズを超えたアクセス |
| 未初期化メモリの読み出し | `malloc` 直後の領域を初期化せずに読む |

検出には以下のツールが有効:

- **AddressSanitizer**: `gcc -fsanitize=address -g main.c`（GCC / Clang、MSVC も対応）
- **Valgrind**: `valgrind --leak-check=full ./a.out`（Linux など）

---

[← 前: 構造体・共用体・列挙型](05-structs.md) | [目次](../index.md) | [次: 標準ライブラリ →](07-stdlib.md)
