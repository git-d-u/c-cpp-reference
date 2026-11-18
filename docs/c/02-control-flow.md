# C言語 2. 制御構文

[← 前: 基本文法とデータ型](01-basics.md) | [目次](../index.md) | [次: 関数 →](03-functions.md)

---

## 2.1 if 文

```c
if (score >= 80) {
    printf("A\n");
} else if (score >= 60) {
    printf("B\n");
} else {
    printf("C\n");
}
```

- 条件式が 0 以外なら真。
- `if (x = 0)` は代入になるため注意（`==` と書き間違えやすい）。

## 2.2 switch 文

```c
switch (n) {
case 1:
    printf("one\n");
    break;          // break がないと次の case へ落ちる（フォールスルー）
case 2:
case 3:
    printf("two or three\n");
    break;
default:
    printf("other\n");
    break;
}
```

- `case` のラベルには**整数定数式**のみ使用可能（文字列や浮動小数点は不可）。

## 2.3 for 文

```c
for (int i = 0; i < 10; i++) {   // ループ変数の宣言は C99 以降
    printf("%d\n", i);
}

for (;;) {   // 無限ループ
    /* ... */
}
```

## 2.4 while 文 / do-while 文

```c
int i = 0;
while (i < 10) {    // 先に条件判定
    i++;
}

do {                // 最低1回は実行される
    i--;
} while (i > 0);    // セミコロンが必要
```

## 2.5 break / continue

```c
for (int i = 0; i < 10; i++) {
    if (i == 3) continue;  // 残りをスキップして次の反復へ
    if (i == 7) break;     // ループを抜ける
    printf("%d ", i);
}
// => 0 1 2 4 5 6
```

- `break` / `continue` は最も内側のループ（`break` は `switch` も）にのみ作用する。

## 2.6 goto 文

```c
for (int i = 0; i < N; i++) {
    for (int j = 0; j < M; j++) {
        if (found(i, j)) goto end;   // 多重ループの脱出
    }
}
end:
    ;   // ラベルの後には文が必要
```

- 一般に多用は避けるが、多重ループ脱出やエラー時の後始末（クリーンアップ処理）で使われることがある。

```c
int process(void)
{
    FILE *fp = fopen("a.txt", "r");
    if (!fp) goto err_open;
    char *buf = malloc(1024);
    if (!buf) goto err_alloc;

    /* 処理 */

    free(buf);
    fclose(fp);
    return 0;

err_alloc:
    fclose(fp);
err_open:
    return -1;
}
```

---

[← 前: 基本文法とデータ型](01-basics.md) | [目次](../index.md) | [次: 関数 →](03-functions.md)
