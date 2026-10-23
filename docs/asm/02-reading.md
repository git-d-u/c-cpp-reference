# アセンブラ 2. 命令と読み方

[← 前: 基本とレジスタ・構文](01-basics.md) | [目次](../index.md) | [次: つまずきポイント →](03-pitfalls.md)

---

> 以降のコードは特に断りがない限り **Intel 構文** で書きます。

## 2.1 よく出る命令

### データ移動

| 命令 | 意味 | 補足 |
|------|------|------|
| `mov a, b` | a = b | メモリ同士の mov はできない |
| `movzx a, b` | 0 で拡張してコピー | `unsigned char` → `int` など |
| `movsx` / `movsxd a, b` | 符号拡張してコピー | `int` → `long` など |
| `lea a, [式]` | a = 式で計算したアドレス | **メモリは読まない**。計算に使われることが多い |
| `push x` / `pop x` | スタックに積む / 取り出す | |
| `xchg a, b` | a と b を交換 | |

### 算術・論理

| 命令 | 意味 | 補足 |
|------|------|------|
| `add a, b` / `sub a, b` | a += b / a -= b | フラグが変わる |
| `inc a` / `dec a` | a++ / a-- | |
| `imul a, b` | a *= b（符号付き） | |
| `idiv x` / `div x` | `rdx:rax` を x で割る | 商は rax、余りは rdx |
| `neg a` | a = -a | |
| `and` / `or` / `xor` / `not` | ビット演算 | `xor eax, eax` は eax = 0 の定番 |
| `shl` / `shr` / `sar` | 左シフト / 論理右シフト / 算術右シフト | `sar` は符号を保つ |

### 比較・分岐・呼び出し

| 命令 | 意味 |
|------|------|
| `cmp a, b` | a - b を計算してフラグだけ変える |
| `test a, b` | a & b を計算してフラグだけ変える（`test eax, eax` で 0 判定） |
| `jmp label` | 無条件ジャンプ |
| `je` / `jne` など | 条件ジャンプ（次の表） |
| `call f` / `ret` | 関数呼び出し / 戻る |
| `cmovXX a, b` | 条件が成り立てば a = b（分岐なしの if） |
| `setXX a` | 条件が成り立てば a = 1、そうでなければ 0 |
| `nop` | 何もしない（位置合わせ用に入る） |

## 2.2 cmp と条件ジャンプの対応

`cmp a, b` の直後に置かれたとき、「a と b の関係」で読みます。

| 条件 | 符号付き | 符号なし |
|------|---------|---------|
| a == b | `je`（= `jz`） | `je` |
| a != b | `jne`（= `jnz`） | `jne` |
| a < b | `jl` | `jb` |
| a <= b | `jle` | `jbe` |
| a > b | `jg` | `ja` |
| a >= b | `jge` | `jae` |

覚え方: 符号付きは **l**ess / **g**reater、符号なしは **b**elow / **a**bove です。どちらが使われているかで、C の変数が `int` か `unsigned` かが分かります。

## 2.3 条件分岐を C に戻す

```c
int max(int a, int b) {
    if (a > b) return a;
    return b;
}
```

最適化なし（`-O0`）だと素直に分岐します。

```asm
; 構造の一例
    cmp     eax, edx        ; a と b を比較
    jle     .L2             ; a <= b なら .L2 へ（if の条件の「逆」で飛ぶ）
    ; ... a を返す処理
    jmp     .L3
.L2:
    ; ... b を返す処理
.L3:
```

!!! tip "条件ジャンプは C の if と逆の条件になりやすい"
    コンパイラは「条件が成り立たないときに then 部分を飛ばす」形で出力することが多いです。
    `jle` を見たら「`a > b` のときに直後の処理を実行する if」と読み替えます。

最適化あり（`-O2`）だと、分岐の代わりに `cmov` が使われることがあります。

```asm
; 一例（gcc -O2）
max:
    cmp     edi, esi
    mov     eax, esi        ; とりあえず b を戻り値に
    cmovge  eax, edi        ; a >= b なら a に置き換え
    ret
```

## 2.4 ループの形

```c
long sum(int *a, long n) {
    long s = 0;
    for (long i = 0; i < n; i++) s += a[i];
    return s;
}
```

```asm
; 構造の一例
    xor     eax, eax              ; s = 0
    test    rsi, rsi              ; n <= 0 なら
    jle     .Ldone                ;   ループに入らない
    xor     edx, edx              ; i = 0
.Lloop:
    movsxd  rcx, DWORD PTR [rdi+rdx*4]   ; a[i] を 64 ビットに符号拡張
    add     rax, rcx              ; s += a[i]
    add     rdx, 1                ; i++
    cmp     rdx, rsi
    jne     .Lloop                ; i != n なら繰り返す
.Ldone:
    ret
```

読み方のコツ:

1. **後ろ（上）に戻るジャンプ** を探すと、そこがループです。
2. ループの直前にある `test` / `cmp` + ジャンプは「1回も回らない場合」の処理です。
3. 毎回 1 ずつ増えるレジスタが添字（`i`）、`[ベース+添字*4]` が配列の要素です。

> `-O2` 以上では SIMD 命令（`paddd` など）で 4 個ずつまとめて足すようにループが書き換えられることがあり、元の形が分かりにくくなります。読む練習には `-O1` も便利です。

## 2.5 関数呼び出しの規約（呼び出し規約）

引数をどのレジスタで渡すかは OS で異なります。**Linux/macOS と Windows で違う** ことが最大の注意点です。

| 項目 | System V AMD64（Linux・macOS など） | Microsoft x64（Windows） |
|------|-------------------------------------|--------------------------|
| 整数・ポインタの引数 | `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9` | `rcx`, `rdx`, `r8`, `r9` |
| 浮動小数点の引数 | `xmm0`〜`xmm7` | `xmm0`〜`xmm3`（引数の位置に対応） |
| それ以降の引数 | スタック | スタック |
| 戻り値 | `rax`（浮動小数点は `xmm0`） | `rax`（浮動小数点は `xmm0`） |
| 呼び出し先が保存するレジスタ | `rbx`, `rbp`, `r12`〜`r15`（と `rsp`） | `rbx`, `rbp`, `rdi`, `rsi`, `r12`〜`r15`, `xmm6`〜`xmm15`（と `rsp`） |
| スタック上の特別な領域 | レッドゾーン（`rsp` より下の 128 バイト） | シャドウ領域（呼び出し側が 32 バイト確保） |
| スタックのアライメント | 16 バイト | 16 バイト |

- 「呼び出し先が保存するレジスタ」は、関数を呼んだあとも値が変わらないと期待してよいレジスタです。それ以外（`rax`, `rcx`, `rdx` など）は、関数を呼ぶと壊れている可能性があります。
- Windows では引数が 4 個しかなくても、呼び出し側は 32 バイト（4 個 × 8 バイト）のシャドウ領域を確保します。`sub rsp, 28h` のような命令がよく出るのはこのためです。

## 2.6 関数の入口と出口（プロローグ・エピローグ）

最適化なしでよく見る形です。

```asm
func:
    push    rbp             ; 呼び出し元の rbp を保存
    mov     rbp, rsp        ; rbp = 今のスタック位置（フレームの基準）
    sub     rsp, 16         ; ローカル変数の領域を確保
    ; ... 本体。ローカル変数は [rbp-4], [rbp-8] のように参照される
    leave                   ; mov rsp, rbp; pop rbp と同じ
    ret
```

- `[rbp-...]` はローカル変数、Windows の `[rbp+...]` / `[rsp+...]` の一部はスタック渡しの引数、と読むと見当がつきます。
- 最適化すると `rbp` を使わず、`rsp` 基準になることが多いです（`-fomit-frame-pointer`）。

## 2.7 実際に読む手順

1. **構文を確認する**：`%` や `$` があれば AT&T 構文です（[1章](01-basics.md)）。
2. **関数の入口を見る**：引数がどのレジスタで来るか、規約（2.5）に当てはめます。
3. **`call` を探す**：呼んでいる関数名（`printf@plt` など）は大きな手掛かりになります。
4. **ジャンプの向きを見る**：前に飛ぶ → if、後ろに戻る → ループ。
5. **`ret` の直前の `rax`** を見て、何を返しているか確認します。

### ツール

```bash
# C のソースとアセンブリを対応付けて出力（-g が必要）
gcc -O1 -g -c foo.c
objdump -d -S -M intel foo.o

# 呼び出し名を読みやすく（C++ のマングル名を元に戻す）
objdump -d -C -M intel ./a.out
```

```text
(gdb) set disassembly-flavor intel
(gdb) disassemble main        # 関数を逆アセンブル
(gdb) layout asm              # TUI でアセンブリ表示
(gdb) stepi / nexti           # 1 命令ずつ実行
(gdb) info registers          # レジスタの値を表示
(gdb) x/8xg $rsp              # スタックの中身を 8 バイト × 8 個表示
```

[Compiler Explorer](https://godbolt.org/) では、C/C++ のどの行がどの命令になったかが色分けで表示されます。コンパイラの種類やオプションもすぐに切り替えられるので、最初の練習に向いています。

## 参考資料

- [x64 calling convention (Microsoft Learn)](https://learn.microsoft.com/ja-jp/cpp/build/x64-calling-convention) — Windows の呼び出し規約
- [x86-64 psABI](https://gitlab.com/x86-psABIs/x86-64-ABI) — Linux などの呼び出し規約（System V AMD64 ABI）
- [X86 calling conventions (Wikipedia)](https://en.wikipedia.org/wiki/X86_calling_conventions)
