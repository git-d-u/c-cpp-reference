# C言語 5. 構造体・共用体・列挙型

[← 前: 配列・ポインタ・文字列](04-pointers-arrays.md) | [目次](../index.md) | [次: 動的メモリ管理 →](06-memory.md)

---

## 5.1 構造体 (struct)

```c
struct Point {
    int x;
    int y;
};

struct Point p1 = {1, 2};               // 順番に初期化
struct Point p2 = {.y = 5, .x = 3};     // 指示付き初期化子 (C99)
struct Point p3 = p1;                   // 構造体は代入（コピー）可能

p1.x = 10;                              // . でメンバアクセス

struct Point *pp = &p1;
pp->y = 20;                             // ポインタからは -> でアクセス
```

- 構造体同士の `==` 比較はできない。メンバごとに比較する。
- 構造体は関数に**値渡し**（全体がコピーされる）。大きい構造体はポインタで渡すのが一般的。

### typedef で型名を付ける

```c
typedef struct {
    char name[32];
    int  age;
} Person;

Person a = {"Taro", 20};

// 自己参照する場合はタグ名が必要
typedef struct Node {
    int value;
    struct Node *next;
} Node;
```

### 構造体のサイズとパディング

```c
struct S {
    char c;   // 1 バイト
    int  i;   // 4 バイト（アライメントのため前に詰め物が入ることがある）
};
sizeof(struct S);  // 典型的には 8（処理系依存）
```

- メンバの間や末尾にパディングが入ることがある。サイズは `sizeof` で取得する。
- メンバのオフセットは `offsetof(型, メンバ)`（`<stddef.h>`）で取得できる。

### ビットフィールド

```c
struct Flags {
    unsigned int a : 1;   // 1 ビット
    unsigned int b : 3;   // 3 ビット
};
```

ビットの配置順などは処理系定義。

### フレキシブル配列メンバ (C99)

```c
struct Buffer {
    size_t len;
    char data[];   // 最後のメンバのみ。サイズ 0 として扱われる
};

struct Buffer *b = malloc(sizeof(struct Buffer) + 100);
b->len = 100;
```

## 5.2 共用体 (union)

全メンバが**同じメモリ領域を共有**する。サイズは最大のメンバ以上。

```c
union Value {
    int    i;
    float  f;
    char   bytes[4];
};

union Value v;
v.i = 42;      // 最後に書き込んだメンバを読むのが基本
```

タグ付き共用体（どのメンバが有効かを別の変数で管理する）の例:

```c
enum Kind { KIND_INT, KIND_FLOAT };

struct Variant {
    enum Kind kind;
    union {
        int   i;
        float f;
    } u;
};
```

※ 無名共用体（`union { ... };` とメンバ名を省略する形）は C11 から標準。

## 5.3 列挙型 (enum)

```c
enum Color { RED, GREEN, BLUE };          // 0, 1, 2
enum Level { LOW = 1, MID = 5, HIGH };    // 1, 5, 6

enum Color c = GREEN;

typedef enum { OFF, ON } Switch;
```

- C の列挙定数は `int` 型の定数として扱われ、整数と自由に変換できる。
- 列挙定数はスコープを持たない（同じスコープ内で名前が衝突する）。

---

[← 前: 配列・ポインタ・文字列](04-pointers-arrays.md) | [目次](../index.md) | [次: 動的メモリ管理 →](06-memory.md)
