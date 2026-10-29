# C言語 8. プリプロセッサ

[← 前: 標準ライブラリ](07-stdlib.md) | [目次](../index.md) | [C++ 1. 基本 →](../cpp/01-basics.md)

---

プリプロセッサはコンパイル前にソースコードをテキストとして処理する。`#` で始まる行が指令（ディレクティブ）。

## 8.1 #include

```c
#include <stdio.h>     // 標準・システムヘッダ（処理系の検索パスから探す）
#include "myheader.h"  // ユーザーヘッダ（通常はカレントディレクトリから先に探す）
```

## 8.2 #define（マクロ）

### オブジェクト形式マクロ

```c
#define PI 3.14159
#define BUF_SIZE 1024
```

### 関数形式マクロ

```c
#define SQUARE(x) ((x) * (x))     // 引数・全体を括弧で囲む
#define MAX(a, b) ((a) > (b) ? (a) : (b))

SQUARE(1 + 2);   // => ((1 + 2) * (1 + 2)) = 9
```

注意点:

- 括弧がないと `#define SQ(x) x * x` → `SQ(1+2)` が `1+2*1+2 = 5` になる。
- 引数が複数回評価される: `MAX(i++, j)` は `i++` が2回実行される可能性がある。
- 型チェックがない。可能なら `static inline` 関数を使う。

### 複数文のマクロ

```c
#define SWAP(a, b) do { int t_ = (a); (a) = (b); (b) = t_; } while (0)
```

`do { ... } while (0)` で囲むと、`if (x) SWAP(a, b); else ...` のような文脈でも正しく動作する。

### # と ## 演算子

```c
#define STR(x) #x              // 文字列化
#define CONCAT(a, b) a##b      // トークン連結

STR(hello);        // => "hello"
int CONCAT(var, 1) = 10;  // => int var1 = 10;
```

### 可変長引数マクロ (C99)

```c
#define LOG(fmt, ...) fprintf(stderr, fmt "\n", __VA_ARGS__)
LOG("x=%d y=%d", x, y);
```

### #undef

```c
#undef PI   // マクロ定義を取り消す
```

## 8.3 条件コンパイル

```c
#ifdef DEBUG
    printf("debug: x=%d\n", x);
#endif

#if defined(_WIN32)
    // Windows 向け
#elif defined(__linux__)
    // Linux 向け
#else
    // その他
#endif

#ifndef MAX_USERS
#define MAX_USERS 100   // 未定義の場合のみ定義
#endif

#if 0
    // 一時的にコードを無効化
#endif
```

コンパイル時にマクロを定義する: `gcc -DDEBUG main.c`

## 8.4 インクルードガード

ヘッダが複数回読み込まれても問題が起きないようにする。

```c
// myheader.h
#ifndef MYHEADER_H
#define MYHEADER_H

void my_func(void);

#endif /* MYHEADER_H */
```

多くのコンパイラ（GCC、Clang、MSVC）は `#pragma once` もサポートしている（ただし標準ではない）。

```c
#pragma once
void my_func(void);
```

## 8.5 定義済みマクロ

| マクロ | 内容 |
|--------|------|
| `__FILE__` | 現在のファイル名（文字列） |
| `__LINE__` | 現在の行番号（整数） |
| `__func__` | 現在の関数名（C99、厳密にはマクロではなく定義済み識別子） |
| `__DATE__` / `__TIME__` | コンパイル日 / 時刻 |
| `__STDC__` | 標準準拠なら 1 |
| `__STDC_VERSION__` | C 規格のバージョン（C99: `199901L`、C11: `201112L`、C17: `201710L`） |
| `__cplusplus` | C++ としてコンパイルされた場合に定義 |

```c
#define TRACE() printf("%s:%d %s\n", __FILE__, __LINE__, __func__)
```

## 8.6 その他の指令

```c
#error "このプラットフォームは未対応です"   // コンパイルを停止してメッセージ表示
#pragma warning(disable: 4996)             // 処理系依存の指示（この例は MSVC）
#line 100 "virtual.c"                      // 行番号・ファイル名の変更
```

### static_assert (C11)

```c
#include <assert.h>
static_assert(sizeof(int) == 4, "int must be 4 bytes");   // コンパイル時チェック
```

（C11 のキーワードは `_Static_assert`。`<assert.h>` で `static_assert` が定義される。C23 ではキーワード化）

## 8.7 C と C++ の相互利用

C の関数を C++ から呼べるようにするヘッダの書き方:

```c
#ifdef __cplusplus
extern "C" {
#endif

void c_function(int x);

#ifdef __cplusplus
}
#endif
```

---

[← 前: 標準ライブラリ](07-stdlib.md) | [目次](../index.md) | [C++ 1. 基本 →](../cpp/01-basics.md)
