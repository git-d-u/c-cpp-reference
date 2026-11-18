// 得意分野診断の問題データ（questions.json）を検査する
// 使い方: node tools/validate_shindan.js docs/sc/shindan/questions.json
// 問題があれば内容を表示して終了コード 1 で終わる（GitHub Actions の公開を止める）
"use strict";
const fs = require("fs");

const file = process.argv[2] || "docs/sc/shindan/questions.json";
const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`JSON として読めません: ${e.message}`);
  process.exit(1);
}

// アプリと同じ正規化（全角・半角、記号、空白の違いを無視）
function norm(s) {
  return String(s || "").normalize("NFKC").toLowerCase()
    .replace(/[\s　・･()（）「」『』"'`、。,.\-‐－–—_:：]/g, "");
}

const KANA = ["ア", "イ", "ウ", "エ"];
const fields = Array.isArray(data.fields) ? data.fields : [];
const fieldKeys = new Set(fields.map(f => f.key));
if (!fields.length) err("fields", "分野の一覧がありません");

const qs = Array.isArray(data.questions) ? data.questions : [];
if (!qs.length) err("questions", "問題がありません");

// 出典は「オリジナル」か「IPA の過去問（H31春 午後Ⅰ 問2 …）」の形に限る
const SRC_OK = /^(オリジナル|(H|R)\d+(春|秋)? 午後)/;
// 市販の問題集など、公開できない出どころの混入を防ぐ
const SRC_NG = /うかる|問題集|ISBN|出版/;

const ids = new Set();
const slots = new Set();
const perDay = {};
const perField = {};

for (const [i, q] of qs.entries()) {
  const id = q && q.id ? q.id : `#${i}`;
  if (!q || typeof q !== "object") { err(id, "問題の形式が不正"); continue; }

  if (ids.has(q.id)) err(id, "ID が重複");
  ids.add(q.id);

  if (!Number.isInteger(q.day) || q.day < 1) err(id, "day は1以上の整数");
  if (!Number.isInteger(q.no) || q.no < 1) err(id, "no は1以上の整数");
  const want = `D${q.day}-${String(q.no).padStart(2, "0")}`;
  if (q.id !== want) err(id, `ID は ${want} にする`);
  const slot = `${q.day}-${q.no}`;
  if (slots.has(slot)) err(id, `${q.day}日目の${q.no}問目が重複`);
  slots.add(slot);

  if (!fieldKeys.has(q.f)) err(id, `分野 ${q.f} は fields にない`);
  for (const k of ["q", "src", "ex", "disp"]) {
    if (typeof q[k] !== "string" || !q[k].trim()) err(id, `${k} が空`);
  }
  if (typeof q.src === "string") {
    if (!SRC_OK.test(q.src)) err(id, `出典の書き方が不正: ${q.src}`);
    if (SRC_NG.test(q.src + q.q + q.ex)) err(id, "公開できない出どころの記述がある");
  }

  if (q.c != null) {
    // 記号選択
    if (!Array.isArray(q.c) || q.c.length < 2 || q.c.length > 4) err(id, "選択肢は2〜4個");
    else if (q.c.some(c => typeof c !== "string" || !c.trim())) err(id, "空の選択肢がある");
    const n = Array.isArray(q.c) ? q.c.length : 0;
    if (!KANA.slice(0, n).includes(q.a)) err(id, `正解 ${q.a} が選択肢の範囲外`);
  } else {
    // 記述（単語）
    if (!Array.isArray(q.acc) || !q.acc.length) err(id, "acc（正解として認める答え）が空");
    else if (q.acc.some(a => typeof a !== "string" || !norm(a))) err(id, "acc に空の答えがある");
    // a は「横展開（ラテラルムーブメント）」のような表示用の形でもよいが、acc のどれかを含むこと
    else if (typeof q.a !== "string" || !q.acc.some(a => norm(q.a).includes(norm(a)))) err(id, "a と acc が対応していない");
  }

  perDay[q.day] = (perDay[q.day] || 0) + 1;
  perField[q.f] = (perField[q.f] || 0) + 1;
}

console.log(`問題数: ${qs.length}`);
console.log("日ごと: " + Object.entries(perDay).map(([d, n]) => `${d}日目=${n}`).join(" "));
console.log("分野ごと: " + fields.map(f => `${f.name}=${perField[f.key] || 0}`).join(" "));

if (errors.length) {
  console.error(`\nエラー ${errors.length} 件:`);
  errors.forEach(e => console.error("  " + e));
  process.exit(1);
}
console.log("検査 OK");
