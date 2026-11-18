# C言語 3. 関数

[← 前: 制御構文](02-control-flow.md) | [目次](../index.md) | [次: 配列・ポインタ・文字列 →](04-pointers-arrays.md)

---

## 3.1 宣言（プロトタイプ）と定義

```c
#include <stdio.h>

int add(int a, int b);        // プロトタイプ宣言

int main(void)
{
    printf("%d\n", add(2, 3)); // => 5
    return 0;
}

int add(int a, int b)         // 定義
{
    return a + b;
}
```

- 呼び出しより前に宣言が必要。通常はヘッダファイル (`.h`) に宣言を書く。
- 引数なしは `void` と明示する: `int f(void);`
  （C17 以前で `int f();` と書くと「引数の情報なし」の意味になる。C23 では `()` も引数なしの意味になった）
- 戻り値がない場合は `void`。

## 3.2 引数の渡し方（値渡し）

C の引数は**すべて値渡し**（コピーが渡される）。呼び出し元の変数を変更したい場合はポインタを渡す。

```c
void swap(int *a, int *b)
{
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int x = 1, y = 2;
swap(&x, &y);   // x = 2, y = 1
```

### 配列を渡す

配列は先頭要素へのポインタとして渡される（要素数は伝わらない）。

```c
int sum(const int arr[], size_t n)   // int *arr と同じ意味
{
    int s = 0;
    for (size_t i = 0; i < n; i++) s += arr[i];
    return s;
}

int data[] = {1, 2, 3};
sum(data, sizeof(data) / sizeof(data[0]));  // => 6
```

## 3.3 再帰

```c
unsigned long factorial(unsigned int n)
{
    return (n <= 1) ? 1 : n * factorial(n - 1);
}
```

## 3.4 static とスコープ

```c
// ファイルスコープの static: 他のファイルから見えない（内部結合）
static int counter = 0;
static void helper(void) { /* ... */ }

int next_id(void)
{
    static int id = 0;   // 関数内 static: 呼び出し間で値が保持される
    return ++id;
}
// next_id() => 1, 2, 3, ...
```

| 記述場所 | `static` の意味 |
|----------|-----------------|
| 関数内の変数 | 静的記憶域期間（プログラム終了まで存続、初期化は1回） |
| ファイルスコープの変数・関数 | 内部結合（そのファイル内でのみ参照可能） |

### extern

```c
// a.c
int global_value = 42;     // 定義

// b.c
extern int global_value;   // 宣言のみ（他ファイルの定義を参照）
```

## 3.5 inline 関数（C99）

```c
static inline int square(int x) { return x * x; }
```

- コンパイラへのインライン展開のヒント。展開されるかはコンパイラ次第。

## 3.6 可変長引数（`<stdarg.h>`）

```c
#include <stdarg.h>

int sum_n(int count, ...)
{
    va_list ap;
    va_start(ap, count);          // 最後の固定引数を指定
    int s = 0;
    for (int i = 0; i < count; i++)
        s += va_arg(ap, int);     // 型を指定して取り出す
    va_end(ap);
    return s;
}

sum_n(3, 10, 20, 30);  // => 60
```

- `char` / `short` は `int` に、`float` は `double` に昇格されて渡されるため、`va_arg` ではそれらの昇格後の型を指定する。

## 3.7 関数ポインタ

```c
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

int (*op)(int, int) = add;   // 関数ポインタの宣言
op(2, 3);                    // => 5
op = mul;
op(2, 3);                    // => 6

typedef int (*BinOp)(int, int);  // typedef で読みやすく
BinOp ops[] = { add, mul };
```

コールバックの例（`qsort`）は [標準ライブラリ](07-stdlib.md#77-stdlibh--ユーティリティ) を参照。

---

[← 前: 制御構文](02-control-flow.md) | [目次](../index.md) | [次: 配列・ポインタ・文字列 →](04-pointers-arrays.md)
