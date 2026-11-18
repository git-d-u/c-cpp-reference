# アセンブラ 1. 基本とレジスタ・構文

[目次](../index.md) | [次: 命令と読み方 →](02-reading.md)

---

> この章は **x86-64（AMD64）** を対象にします。PC・サーバーで最も多く、C/C++ のコンパイラ出力を読む場面が多いためです。ARM など他の CPU では命令もレジスタも異なります。

## 1.1 アセンブラを読む目的

| 場面 | 何を見るか |
|------|-----------|
| C/C++ の最適化を確認したい | コンパイラが出した命令（`gcc -S`、Compiler Explorer） |
| クラッシュの原因を追いたい | デバッガの逆アセンブル表示と、落ちた命令のアドレス |
| バイナリの動きを調べたい | `objdump -d` などの逆アセンブル結果 |

書く機会より **読む** 機会のほうが圧倒的に多いので、この資料も読むことを中心にしています。

## 1.2 汎用レジスタ

64ビットのレジスタは 16 個あります。下位の 32 / 16 / 8 ビットにも別名でアクセスできます。

| 64ビット | 下位32 | 下位16 | 下位8 | 主な用途（慣習） |
|---------|--------|--------|-------|-----------------|
| `rax` | `eax` | `ax` | `al` | 戻り値、演算 |
| `rbx` | `ebx` | `bx` | `bl` | 汎用（呼び出し先が保存） |
| `rcx` | `ecx` | `cx` | `cl` | カウンタ、引数 |
| `rdx` | `edx` | `dx` | `dl` | 引数、乗除算の上位 |
| `rsi` | `esi` | `si` | `sil` | 引数（Linux）、コピー元 |
| `rdi` | `edi` | `di` | `dil` | 引数（Linux）、コピー先 |
| `rbp` | `ebp` | `bp` | `bpl` | フレームポインタ（省略されることも多い） |
| `rsp` | `esp` | `sp` | `spl` | **スタックポインタ**（常にスタックの先頭） |
| `r8`〜`r15` | `r8d`〜`r15d` | `r8w`〜`r15w` | `r8b`〜`r15b` | 汎用、引数 |

特殊なレジスタ:

| レジスタ | 内容 |
|---------|------|
| `rip` | 次に実行する命令のアドレス（直接書き換えられない） |
| `rflags` | 比較・演算結果のフラグ（ZF, SF, CF, OF など） |
| `xmm0`〜`xmm15` | 浮動小数点数・SIMD 演算用（128ビット） |

!!! warning "32ビットレジスタへの書き込みは上位32ビットを0にする"
    `mov eax, 1` を実行すると `rax` の上位 32 ビットは **0 になります**。
    一方、`mov ax, 1` や `mov al, 1` は上位ビットを **そのまま残します**。
    コンパイラが `mov eax, 0` や `xor eax, eax` で `rax` 全体を 0 にしているのはこのためです。

## 1.3 フラグ（rflags の主要ビット）

| フラグ | 名前 | 立つ条件 |
|-------|------|---------|
| ZF | Zero Flag | 結果が 0 |
| SF | Sign Flag | 結果の最上位ビットが 1（符号付きで負） |
| CF | Carry Flag | 符号なし演算で桁あふれ・借り |
| OF | Overflow Flag | 符号付き演算であふれ |

`cmp` や `test` はフラグだけを変え、その直後の条件分岐（`je`, `jl` など）がフラグを見て飛ぶかどうかを決めます（[2章「条件分岐」](02-reading.md)）。

## 1.4 2つの構文：Intel 構文と AT&T 構文

同じ命令でも、ツールによって書き方が 2 種類あります。**最初に「どちらの構文か」を見分けることが、読む上で一番大事です。**

| 項目 | Intel 構文 | AT&T 構文 |
|------|-----------|-----------|
| 使う場面 | MSVC、NASM、Intel のマニュアル | GCC / GDB / objdump の既定 |
| オペランドの順番 | `命令 書き込み先, 読み込み元` | `命令 読み込み元, 書き込み先`（**逆**） |
| レジスタ | `rax` | `%rax` |
| 即値（定数） | `5` | `$5` |
| サイズ | `DWORD PTR` などで指定 | 命令の末尾に `b`/`w`/`l`/`q` |
| メモリ参照 | `[rbp-8]` | `-8(%rbp)` |

同じ処理の書き比べ:

```asm
; Intel 構文
mov     eax, 5                  ; eax = 5
mov     DWORD PTR [rbp-4], eax  ; *(int*)(rbp-4) = eax
add     rax, rbx                ; rax = rax + rbx
lea     rax, [rdi+rsi*4+8]      ; rax = rdi + rsi*4 + 8
```

```asm
# AT&T 構文（上と同じ意味）
movl    $5, %eax
movl    %eax, -4(%rbp)
addq    %rbx, %rax
leaq    8(%rdi,%rsi,4), %rax
```

見分け方: **`%` と `$` が付いていれば AT&T 構文** です。

GCC 系のツールで Intel 構文に切り替える方法:

```bash
gcc -S -O2 -masm=intel foo.c        # アセンブリを foo.s に出力
objdump -d -M intel ./a.out         # 実行ファイルを逆アセンブル
```

GDB では `set disassembly-flavor intel` を実行すると Intel 構文になります。

## 1.5 サイズの表し方

| バイト数 | Intel 構文の指定 | AT&T の接尾辞 | C の型の例（x86-64） |
|---------|-----------------|--------------|-------------------|
| 1 | `BYTE PTR` | `b` | `char` |
| 2 | `WORD PTR` | `w` | `short` |
| 4 | `DWORD PTR` | `l` | `int` |
| 8 | `QWORD PTR` | `q` | `long`（Linux）、ポインタ |

> `long` は Linux（LP64）では 8 バイト、Windows（LLP64）では 4 バイトです。ポインタはどちらも 8 バイトです。

## 1.6 メモリの参照（アドレッシング）

Intel 構文の基本形は `[ベース + インデックス*スケール + 変位]` です。スケールは 1, 2, 4, 8 のどれかです。

| 書き方 | 意味 | C で言うと |
|-------|------|-----------|
| `[rax]` | rax が指す場所 | `*p` |
| `[rbp-8]` | rbp から 8 バイト手前 | ローカル変数 |
| `[rdi+8]` | rdi + 8 | 構造体のメンバ `p->member` |
| `[rdi+rsi*4]` | rdi + rsi×4 | `int` 配列の要素 `a[i]` |
| `[rip+0x2000]` | 命令位置からの相対 | グローバル変数 |

```c
int get(int *a, long i) { return a[i]; }
```

```asm
; 一例（gcc -O2 -masm=intel）
get:
    mov     eax, DWORD PTR [rdi+rsi*4]   ; a は rdi、i は rsi。4 は sizeof(int)
    ret
```

## 1.7 スタックの基本

- スタックは **アドレスが小さくなる方向に伸びます**。
- `push x` は「`rsp` を 8 減らしてから、`[rsp]` に x を書く」という動きです。
- `pop x` は「`[rsp]` を x に読み込んでから、`rsp` を 8 増やす」という動きです。
- `call f` は戻り先アドレスを push してから f に飛び、`ret` はそれを pop して戻ります。

```
高いアドレス
  | 呼び出し元のデータ |
  | 戻りアドレス       |  ← call 直後の rsp
  | 保存した rbp       |
  | ローカル変数        |
  |                    |  ← 現在の rsp
低いアドレス
```

## 参考資料

- [Intel 64 and IA-32 Architectures Software Developer Manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) — 命令の公式仕様
- [Compiler Explorer](https://godbolt.org/) — C/C++ のコンパイル結果をブラウザで確認できる
- [x64 calling convention (Microsoft Learn)](https://learn.microsoft.com/ja-jp/cpp/build/x64-calling-convention)
