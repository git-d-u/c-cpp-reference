# 型変換の早見表

[目次](../index.md)

---

このサイトで扱っている言語ごとに、よく使う型変換を並べました。最初に一覧表で全体を比べ、そのあと言語ごとに詳しい例と注意点を書いています。

## 一覧表

| 変換 | C | C++ | Python | PHP | PowerShell | bash |
|------|---|-----|--------|-----|-----------|------|
| 整数 → 文字 | `(char)65` | `static_cast<char>(65)` | `chr(65)` | `chr(65)` | `[char]65` | `printf "\\x$(printf '%x' 65)"` |
| 文字 → 整数 | `(int)'A'` | `static_cast<int>('A')` | `ord("A")` | `ord("A")` | `[int][char]'A'` | `printf '%d' "'A"` |
| 数字1文字 → 数値 | `c - '0'` | `c - '0'` | `int("7")` | `(int)"7"` | `[int]"7"` | `$(( c ))` |
| 文字列 → 整数 | `strtol(s, &end, 10)` | `std::stoi(s)` / `std::from_chars` | `int(s)` | `(int)$s` / `intval($s)` | `[int]$s` | `$(( s ))` |
| 整数 → 文字列 | `snprintf(buf, n, "%d", i)` | `std::to_string(i)` | `str(i)` | `(string)$i` / `strval($i)` | `[string]$i` | （もともと文字列） |
| 小数 → 整数 | `(int)3.9` → 3 | `static_cast<int>(3.9)` → 3 | `int(3.9)` → 3 | `(int)3.9` → 3 | `[int]3.9` → **4** | `${x%.*}` → 3 |
| 16進数の文字列 → 整数 | `strtol(s, NULL, 16)` | `std::stoi(s, nullptr, 16)` | `int(s, 16)` | `intval($s, 16)` / `hexdec($s)` | `[Convert]::ToInt32($s, 16)` | `$(( 16#ff ))` |
| 整数 → 16進数の文字列 | `printf("%x", i)` | `std::format("{:x}", i)`（C++20） | `hex(i)` / `format(i, "x")` | `dechex($i)` | `'{0:x}' -f $i` | `printf '%x' 255` |
| 真偽値として扱う | 0 が偽 | 0 が偽 | `bool(x)` | `(bool)$x` | `[bool]$x` | 終了ステータス 0 が「成功」 |

!!! warning "小数 → 整数は言語によって結果が違う"
    C・C++・Python・PHP は **切り捨て**（0 の方向へ）ですが、PowerShell の `[int]` は **四捨五入**（ちょうど半分のときは偶数のほうへ）です。

    | 値 | C / C++ / Python / PHP | PowerShell `[int]` |
    |----|----------------------|-------------------|
    | 3.9 | 3 | 4 |
    | 3.5 | 3 | 4 |
    | 2.5 | 2 | **2** |
    | -3.5 | -3 | -4 |

!!! warning "\"0\" という文字列の真偽値も言語によって違う"
    | 言語 | `"0"` | `""`（空文字列） |
    |------|------|----------------|
    | Python | 真 | 偽 |
    | PHP | **偽** | 偽 |
    | PowerShell | 真 | 偽 |

## C

```c
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

int main(void)
{
    /* 整数と文字：char は小さな整数型なので、そのまま代入できる */
    char c = 65;                  /* 'A' */
    int  code = 'A';              /* 65 */
    char next = c + 1;            /* 'B' */
    int  digit = '7' - '0';       /* 7（数字の文字 → 数値） */
    char ch = 7 + '0';            /* '7'（数値 → 数字の文字） */

    /* 小数と整数 */
    int    i = (int)3.9;          /* 3（小数点以下を切り捨て） */
    double d = (double)7 / 2;     /* 3.5（片方を double にしてから割る） */

    /* 文字列 → 整数（strtol はエラーを判定できる） */
    const char *s = "123";
    char *end;
    errno = 0;
    long v = strtol(s, &end, 10);
    if (end == s || *end != '\0' || errno == ERANGE) {
        /* 変換エラー */
    }

    /* 整数 → 文字列 */
    char buf[32];
    snprintf(buf, sizeof buf, "%d", 42);    /* "42" */
    snprintf(buf, sizeof buf, "%x", 255);   /* "ff" */

    printf("%c %d %c %d %c %d %.1f %ld %s\n", c, code, next, digit, ch, i, d, v, buf);
    return 0;
}
```

注意点:

- 範囲外の値を `signed char` などの **符号付き** の型に変換した結果は、処理系定義です（処理系によって決まる）。
- 範囲外の値を **符号なし** の型に変換すると、2 のべき乗で割った余りになります（例：`unsigned char` に 300 を入れると 44）。
- 小数を整数に変換して、結果が整数の範囲に入らない場合は **未定義動作** です（例：32ビットの `int` に `1e10`）。
- `char` が符号付きか符号なしかは処理系によって違います。文字コードとして扱うときは `unsigned char` を使うと安全です。
- `atoi()` は変換に失敗しても判定できないので、`strtol()` を使います（[C言語 7. 標準ライブラリ](../c/07-stdlib.md)）。

## C++

```cpp
#include <charconv>
#include <iostream>
#include <string>

int main()
{
    // 整数と文字
    char c = static_cast<char>(65);              // 'A'
    int  code = static_cast<int>('A');           // 65

    // 小数と整数
    int i = static_cast<int>(3.9);               // 3

    // 文字列 → 整数（失敗すると例外）
    int n = std::stoi("42");                     // 42
    int h = std::stoi("ff", nullptr, 16);        // 255
    // std::stoi("abc") は std::invalid_argument、範囲外は std::out_of_range を投げる

    // 文字列 → 整数（C++17。例外を投げない・ロケールに依存しない）
    std::string text = "123";
    int value = 0;
    auto [ptr, ec] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (ec != std::errc()) {
        // ec が std::errc::invalid_argument なら数値ではない
        // std::errc::result_out_of_range なら int に入らない
    }

    // 整数 → 文字列
    std::string s = std::to_string(42);          // "42"

    std::cout << c << ' ' << code << ' ' << i << ' ' << n << ' '
              << h << ' ' << value << ' ' << s << '\n';
}
```

注意点:

- C スタイルのキャスト `(int)x` も使えますが、意図が分かりやすい `static_cast` を使います（[C++ 1. C++の基本](../cpp/01-basics.md)）。
- 範囲外の値を符号付きの整数型に変換した結果は、C++17 までは処理系定義、**C++20 からは** 2 のべき乗で割った余りに決まりました（例：`signed char` に 300 → 44）。
- 小数から整数への変換で範囲に入らない場合は、C と同じく未定義動作です。
- `{}` を使った初期化（`int x{3.9};`）では、情報が失われる変換はコンパイルエラーになります。

## Python

詳しくは [Python 1. 基本構文と型の変換](../python/01-basics.md) を参照してください。

```python
print(chr(65), ord("A"))          # A 65
print(int("42"), int("ff", 16))   # 42 255
print(int(3.9), round(2.5))       # 3 2
print(str(42), hex(255))          # 42 0xff
print(bool("0"), bool(""))        # True False
print("あ".encode("utf-8"))       # b'\xe3\x81\x82'
```

- `int("3.5")` はエラーになります。`int(float("3.5"))` と 2 段階で変換します。
- `int("abc")` は `ValueError` になります。

## PHP

```php
<?php
// 整数と文字
echo chr(65), PHP_EOL;            // A
echo ord("A"), PHP_EOL;           // 65
echo mb_chr(0x3042, 'UTF-8'), PHP_EOL;   // あ（Unicode の番号から文字を作る）
echo mb_ord("あ", 'UTF-8'), PHP_EOL;     // 12354

// 文字列 → 整数
var_dump((int) "42");             // int(42)
var_dump((int) "42abc");          // int(42)（先頭の数字だけ読む。警告は出ない）
var_dump((int) "abc");            // int(0)（数字で始まらなければ 0）
var_dump(intval("0x1A", 16));     // int(26)
var_dump(intval("042", 0));       // int(34)（基数 0：先頭の 0 は8進数）
var_dump(intval("42", 8));        // int(34)

// 小数 → 整数（0 の方向へ切り捨て）
var_dump((int) 8.9);              // int(8)
var_dump((int) -8.9);             // int(-8)

// 整数 → 文字列
var_dump((string) 42);            // string(2) "42"
var_dump(dechex(255));            // string(2) "ff"

// 真偽値
var_dump((bool) "0");             // bool(false) ← Python などと違う
var_dump((bool) "false");         // bool(true)（空でも "0" でもないので真）
```

注意点:

- `chr()` が返すのは **1 バイト** で、0〜255 の値に使います。日本語などの文字を作るときは `mb_chr()` を使います。PHP 8.5 から、0〜255 以外の値を `chr()` に渡すと非推奨の警告が出ます。
- `(int)` や `intval()` は、数字以外が混ざっていてもエラーにならず、先頭の数字だけを読みます（`"10oops"` → 10）。入力の **検証** には使わず、`filter_var($s, FILTER_VALIDATE_INT)` や `is_numeric()` で確かめます。
- 計算で文字列を使った場合（`1 + "10 apples"`）は、警告（E_WARNING）が出ます。
- 比較の `==` は型を変換してから比べるため、思わぬ一致が起きます。`===` を使います（[PHP 1. 構文と使い方](../php/01-syntax.md)）。

## SQL

### PostgreSQL

```sql
SELECT CAST('42' AS integer);       -- 42（標準 SQL の書き方）
SELECT '42'::integer;               -- 42（PostgreSQL の書き方）
SELECT 42::text;                    -- '42'
SELECT chr(65);                     -- 'A'（UTF-8 のデータベースでは Unicode の番号として扱う）
SELECT ascii('A');                  -- 65
SELECT to_hex(255);                 -- 'ff'
SELECT trunc(3.9)::integer;         -- 3（切り捨ててから整数にする）
SELECT round(3.5)::integer;         -- 4
SELECT to_char(1234567, 'FM9,999,999');   -- '1,234,567'（書式を付けて文字列に）
```

- `'abc'::integer` のように変換できない値はエラーになります。
- 小数を整数に変換するときは、丸め方をはっきりさせるため、先に `trunc()`（切り捨て）や `round()`（四捨五入）を使います。

### MySQL

```sql
SELECT CAST('42' AS SIGNED);           -- 42（INT ではなく SIGNED / UNSIGNED と書く）
SELECT CAST(42 AS CHAR);               -- '42'
SELECT CHAR(65 USING utf8mb4);         -- 'A'
SELECT ASCII('A');                     -- 65
SELECT HEX(255), CONV('ff', 16, 10);   -- 'FF'、'255'
SELECT TRUNCATE(3.9, 0);               -- 3（小数点以下 0 桁で切り捨て）
SELECT CONVERT('abc' USING utf8mb4);   -- 文字コードの変換
```

注意点:

- `CAST` の変換先に書けるのは `SIGNED`、`UNSIGNED`、`CHAR`、`DECIMAL`、`DATE` などです。`INT` は一覧にありません。
- `CHAR(65)` は、`USING` を付けないと **バイナリ文字列** を返します。
- 文字列と数値を比べると、両方とも浮動小数点数として比べられます。数字で始まらない文字列は 0 として扱われるため、`0 = 'x6'` は **真** になります。文字列の列と比べるときは、値もクォートで囲みます（`WHERE code = '0'`）。

## PowerShell

```powershell
# 整数と文字
[char]65                       # A
[int][char]'A'                 # 65
[char]0x3042                   # あ

# 文字列 → 数値
[int]"42"                      # 42
[int]"0x1A"                    # 26（0x を付けると16進数として読む）
[double]"3.14"                 # 3.14
[Convert]::ToInt32("ff", 16)   # 255
# [int]"abc" はエラー（例外）になる

# 失敗しても例外にしない変換
$n = 0
[int]::TryParse("12x", [ref]$n)   # False（$n は 0 のまま）

# 小数 → 整数（四捨五入。ちょうど半分は偶数のほうへ）
[int]3.5                       # 4
[int]2.5                       # 2
[math]::Truncate(3.9)          # 3（切り捨て）
[math]::Floor(-3.5)            # -4

# 数値 → 文字列
[string]42                     # "42"
'{0:X}' -f 255                 # FF
(255).ToString("x4")           # 00ff
[Convert]::ToString(255, 2)    # 11111111（2進数）

# 文字列とバイト列
[System.Text.Encoding]::UTF8.GetBytes("A")              # 65
[System.Text.Encoding]::UTF8.GetString([byte[]](65,66)) # AB
```

!!! warning "演算子の左側の型に合わせて変換される"
    PowerShell は、`+` や `-eq` の **左側** の型に右側を合わせます。

    ```powershell
    "1" + 1        # "11"（左が文字列なので、文字列の連結）
    1 + "1"        # 2（左が数値なので、足し算）
    "10" -eq 10    # True
    ```

## bash

bash の変数は、基本的にすべて **文字列** です。数値として扱われるのは `$(( ))` の中だけです。

```bash
s="42"
echo $(( s + 1 ))                # 43（文字列 → 整数）
echo $(( 16#ff ))                # 255（16進数）
echo $(( 2#1010 ))               # 10（2進数）
printf '%x\n' 255                # ff（整数 → 16進数の文字列）
printf '%d\n' "'A"               # 65（文字 → 文字コード。' を先頭に付ける）
printf "\\x$(printf '%x' 67)\n"  # C（文字コード → 文字）

x="3.7"
echo "${x%.*}"                   # 3（小数点より後ろを削る＝切り捨て。負の数も 0 の方向）
echo $(( 7 / 2 ))                # 3（整数の割り算）

# 数値かどうかの確認
v="12x"
if [[ "$v" =~ ^-?[0-9]+$ ]]; then echo "数値"; else echo "数値でない"; fi
```

注意点:

- `$(( ))` では、**0 で始まる数は8進数** として扱われます。`$(( 08 ))` はエラー、`$(( 010 ))` は 8 です。日付の `08` などを計算するときは `$(( 10#08 ))` と書きます。
- `$(( ))` は整数しか扱えません。小数の計算は `awk` や `bc` を使います。
- 詳しくは [Linux 4. シェルスクリプトとワンライナー](../linux/04-shell-script.md) を参照してください。

## アセンブラ（x86-64）

コンパイラは、型変換を次のような命令に置き換えます。

| C の変換 | 主な命令 | 動き |
|---------|---------|------|
| `unsigned char` → `int` | `movzx` | 上位ビットを 0 で埋めて広げる |
| `signed char` → `int`、`int` → `long` | `movsx` / `movsxd` | 符号ビットをコピーして広げる |
| `int` → `char` | 下位 8 ビット（`al` など）だけを使う | 上位ビットは捨てられる |
| `int` → `double` | `cvtsi2sd` | 整数を浮動小数点数に変換 |
| `double` → `int` | `cvttsd2si` | 切り捨てて整数に変換（名前の 2 つ目の `t` が truncate） |

詳しくは [アセンブラ 2. 命令と読み方](../asm/02-reading.md) と [3. つまずきポイント](../asm/03-pitfalls.md) を参照してください。

## 参考資料

- [Implicit conversions (C) - cppreference](https://en.cppreference.com/w/c/language/conversion) / [Implicit conversions (C++) - cppreference](https://en.cppreference.com/w/cpp/language/implicit_conversion)
- [std::from_chars - cppreference](https://en.cppreference.com/w/cpp/utility/from_chars)
- [Python 組み込み関数](https://docs.python.org/ja/3/library/functions.html)
- PHP マニュアル：[整数への変換](https://www.php.net/manual/ja/language.types.integer.php) / [論理値への変換](https://www.php.net/manual/ja/language.types.boolean.php) / [intval](https://www.php.net/manual/ja/function.intval.php) / [chr](https://www.php.net/manual/ja/function.chr.php)
- [PostgreSQL 文字列関数](https://www.postgresql.org/docs/current/functions-string.html)
- MySQL：[Cast Functions](https://dev.mysql.com/doc/refman/8.4/en/cast-functions.html) / [String Functions](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html) / [Type Conversion in Expression Evaluation](https://dev.mysql.com/doc/refman/8.4/en/type-conversion.html)
- [about_Type_Conversion（PowerShell）](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_type_conversion)
