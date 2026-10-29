# C言語 7. 標準ライブラリ

[← 前: 動的メモリ管理](06-memory.md) | [目次](../index.md) | [次: プリプロセッサ →](08-preprocessor.md)

---

## 7.1 主な標準ヘッダ一覧

| ヘッダ | 内容 |
|--------|------|
| `<stdio.h>` | 入出力（printf, scanf, ファイル操作） |
| `<stdlib.h>` | メモリ管理、数値変換、乱数、ソート、終了処理 |
| `<string.h>` | 文字列・メモリ操作 |
| `<math.h>` | 数学関数 |
| `<ctype.h>` | 文字の分類・変換 |
| `<time.h>` | 日付・時刻 |
| `<stdbool.h>` | `bool`, `true`, `false` (C99) |
| `<stdint.h>` | 固定幅整数型 (C99) |
| `<stddef.h>` | `size_t`, `NULL`, `offsetof`, `ptrdiff_t` |
| `<limits.h>` | 整数型の範囲 (`INT_MAX` など) |
| `<float.h>` | 浮動小数点型の特性 (`DBL_MAX` など) |
| `<assert.h>` | `assert` マクロ |
| `<errno.h>` | エラー番号 `errno` |
| `<stdarg.h>` | 可変長引数 |
| `<threads.h>` | スレッド (C11、オプション) |

## 7.2 stdio.h — 入出力

### printf の書式指定子

```c
printf("%d %s %.2f\n", 42, "abc", 3.14159);  // => 42 abc 3.14
```

| 指定子 | 型 | 例 |
|--------|----|-----|
| `%d` / `%i` | `int` | `42` |
| `%u` | `unsigned int` | `42` |
| `%ld` / `%lld` | `long` / `long long` | |
| `%zu` | `size_t` (C99) | |
| `%f` | `double`（`float` も昇格して渡る） | `3.140000` |
| `%e` | `double`（指数表記） | `3.140000e+00` |
| `%g` | `double`（短い方の表記） | `3.14` |
| `%c` | 文字 (`int`) | `A` |
| `%s` | 文字列 (`char *`) | `abc` |
| `%p` | ポインタ (`void *`) | 処理系依存の表記 |
| `%x` / `%X` | 16進数 (`unsigned int`) | `2a` / `2A` |
| `%o` | 8進数 | `52` |
| `%%` | `%` 自体 | `%` |

#### フラグ・幅・精度

```c
printf("[%5d]\n", 42);     // => [   42]  幅5、右寄せ
printf("[%-5d]\n", 42);    // => [42   ]  左寄せ
printf("[%05d]\n", 42);    // => [00042]  0埋め
printf("[%+d]\n", 42);     // => [+42]    符号を表示
printf("[%.3f]\n", 3.14159); // => [3.142] 小数点以下3桁
printf("[%8.2f]\n", 3.14159); // => [    3.14]
printf("[%.3s]\n", "abcdef"); // => [abc]  最大3文字
```

### 入力

```c
int n;
if (scanf("%d", &n) != 1) { /* 入力エラー */ }   // 変数のアドレスを渡す

char buf[100];
if (fgets(buf, sizeof buf, stdin) != NULL) {      // 1行読み込み（改行も含む）
    buf[strcspn(buf, "\n")] = '\0';               // 末尾の改行を除去
}
```

- `scanf` で `double` を読むときは `%lf`（`printf` では `%f` でよい）。
- `gets` は危険なため C11 で削除された。`fgets` を使う。

### ファイル操作

```c
FILE *fp = fopen("data.txt", "r");
if (fp == NULL) {
    perror("fopen");
    return 1;
}

char line[256];
while (fgets(line, sizeof line, fp) != NULL) {
    printf("%s", line);
}
fclose(fp);
```

| モード | 意味 |
|--------|------|
| `"r"` | 読み込み（ファイルが必要） |
| `"w"` | 書き込み（新規作成 / 既存は内容を破棄） |
| `"a"` | 追記 |
| `"r+"` / `"w+"` / `"a+"` | 読み書き |
| `"b"` を付加 | バイナリモード（例: `"rb"`, `"wb"`） |

| 関数 | 説明 |
|------|------|
| `fprintf(fp, fmt, ...)` | 書式付き出力 |
| `fscanf(fp, fmt, ...)` | 書式付き入力 |
| `fgetc(fp)` / `fputc(c, fp)` | 1文字入出力（`EOF` で終端） |
| `fgets(buf, n, fp)` / `fputs(s, fp)` | 1行入出力 |
| `fread(ptr, size, n, fp)` | バイナリ読み込み |
| `fwrite(ptr, size, n, fp)` | バイナリ書き込み |
| `fseek(fp, off, whence)` | 位置移動（`SEEK_SET` / `SEEK_CUR` / `SEEK_END`） |
| `ftell(fp)` | 現在位置 |
| `feof(fp)` / `ferror(fp)` | 終端 / エラー判定 |
| `fflush(fp)` | 出力バッファを書き出す |
| `snprintf(buf, n, fmt, ...)` | 文字列への安全な書式付き出力 (C99) |
| `sprintf(buf, fmt, ...)` | 文字列への書式付き出力（サイズ確認なし） |

標準ストリーム: `stdin`（標準入力）、`stdout`（標準出力）、`stderr`（標準エラー出力）

## 7.3 string.h — 文字列・メモリ操作

| 関数 | 説明 |
|------|------|
| `strlen(s)` | 長さ（`'\0'` を含まない） |
| `strcpy(dst, src)` | コピー（サイズ確認なし） |
| `strncpy(dst, src, n)` | 最大 n 文字コピー（**n に達すると `'\0'` が付かない**） |
| `strcat(dst, src)` | 連結 |
| `strncat(dst, src, n)` | 最大 n 文字連結（`'\0'` は付く） |
| `strcmp(a, b)` | 比較（等しければ 0、a<b なら負、a>b なら正） |
| `strncmp(a, b, n)` | 先頭 n 文字を比較 |
| `strchr(s, c)` | 文字 c の最初の位置（なければ `NULL`） |
| `strrchr(s, c)` | 文字 c の最後の位置 |
| `strstr(s, sub)` | 部分文字列の位置 |
| `strtok(s, delim)` | トークン分割（元の文字列を書き換える） |
| `strspn` / `strcspn` | 指定文字集合に含まれる / 含まれない先頭部分の長さ |
| `memcpy` / `memmove` / `memset` / `memcmp` | メモリ操作（[動的メモリ管理](06-memory.md#66-メモリ操作関数) 参照） |

```c
char buf[32];
snprintf(buf, sizeof buf, "%s-%d", "id", 7);   // 安全な文字列組み立て => "id-7"

if (strcmp(a, b) == 0) { /* 等しい */ }        // == では内容を比較できない

char text[] = "a,b,c";
for (char *tok = strtok(text, ","); tok; tok = strtok(NULL, ","))
    printf("%s\n", tok);    // => a / b / c
```

## 7.4 ctype.h — 文字の分類

| 関数 | 真となる文字 |
|------|--------------|
| `isdigit(c)` | 数字 `0-9` |
| `isalpha(c)` | 英字 |
| `isalnum(c)` | 英数字 |
| `isspace(c)` | 空白文字（スペース、`\t`、`\n` など） |
| `isupper(c)` / `islower(c)` | 大文字 / 小文字 |
| `toupper(c)` / `tolower(c)` | 大文字 / 小文字に変換 |

> 引数は `unsigned char` の範囲の値か `EOF` でなければならない。`char` が負になり得る環境では `isdigit((unsigned char)c)` のようにキャストする。

## 7.5 math.h — 数学関数

| 関数 | 説明 |
|------|------|
| `sqrt(x)` | 平方根 |
| `pow(x, y)` | x の y 乗 |
| `fabs(x)` | 絶対値（整数は `<stdlib.h>` の `abs`） |
| `floor(x)` / `ceil(x)` | 切り捨て / 切り上げ |
| `round(x)` | 四捨五入（0.5 は 0 から遠い方へ、C99） |
| `trunc(x)` | 0 方向への切り捨て (C99) |
| `fmod(x, y)` | 浮動小数点の剰余 |
| `exp(x)` / `log(x)` / `log10(x)` | 指数 / 自然対数 / 常用対数 |
| `sin` / `cos` / `tan` | 三角関数（ラジアン） |
| `atan2(y, x)` | 偏角 |
| `hypot(x, y)` | √(x²+y²) (C99) |

- GCC / Linux 環境では `-lm` のリンク指定が必要な場合がある: `gcc main.c -lm`
- 円周率 `M_PI` は標準ではない（POSIX 等の拡張）。

## 7.6 time.h — 日付・時刻

```c
#include <time.h>

time_t now = time(NULL);               // 現在時刻（通常は UNIX 時間）
struct tm *lt = localtime(&now);       // ローカル時刻に分解
char buf[64];
strftime(buf, sizeof buf, "%Y-%m-%d %H:%M:%S", lt);
printf("%s\n", buf);

clock_t start = clock();               // プロセッサ時間の計測
/* 処理 */
double sec = (double)(clock() - start) / CLOCKS_PER_SEC;
```

- `struct tm` の `tm_year` は 1900 年からの年数、`tm_mon` は 0〜11。

## 7.7 stdlib.h — ユーティリティ

### 数値変換

```c
int    i = atoi("123");           // エラー検出不可
long   l = strtol("ff", NULL, 16);// 基数指定 => 255。エラー検出可能
double d = strtod("3.14", NULL);

char *end;
errno = 0;
long v = strtol(str, &end, 10);
if (end == str || *end != '\0' || errno == ERANGE) { /* 変換エラー */ }
```

### 乱数

```c
srand((unsigned)time(NULL));   // シード設定
int r = rand() % 100;          // 0〜99（rand() の範囲は 0〜RAND_MAX）
```

`rand()` の品質は処理系依存で、暗号用途には使えない。

### ソートと探索

```c
int cmp_int(const void *a, const void *b)
{
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);   // a - b はオーバーフローの恐れがある
}

int arr[] = {5, 2, 9, 1};
qsort(arr, 4, sizeof arr[0], cmp_int);           // => {1, 2, 5, 9}

int key = 5;
int *found = bsearch(&key, arr, 4, sizeof arr[0], cmp_int);  // ソート済み配列を二分探索
```

### その他

| 関数 | 説明 |
|------|------|
| `abs(n)` / `labs(n)` | 整数の絶対値 |
| `exit(status)` | プログラム終了（`EXIT_SUCCESS` / `EXIT_FAILURE`） |
| `atexit(func)` | 終了時に呼ぶ関数を登録 |
| `getenv(name)` | 環境変数の取得 |
| `system(cmd)` | シェルコマンド実行 |

## 7.8 assert.h / errno.h

```c
#include <assert.h>
assert(ptr != NULL);   // 偽なら診断メッセージを出して abort。NDEBUG 定義時は無効化される

#include <errno.h>
#include <string.h>
FILE *fp = fopen("none.txt", "r");
if (!fp) {
    printf("error: %s\n", strerror(errno));   // エラー内容を文字列で取得
}
```

---

[← 前: 動的メモリ管理](06-memory.md) | [目次](../index.md) | [次: プリプロセッサ →](08-preprocessor.md)
