// tools/scaffold-game.js — 新規ゲームの spec+icon 雛形を生成する
//   npm run new-game -- <prefix> [en] [jp]
//     prefix: file名から .html を除いたもの (例: mygo → mygo.html)。英小文字+数字、go で終わる
//     en:     一覧に出る英字名 (省略時は prefix の大文字)
//     jp:     日本語名 ○○碁 (省略時は '新碁' が入るのであとで書き換える)
// 出力:
//   variants/<prefix>.spec.js
//   variants/icons/<prefix>.icon.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const [prefix, enArg, jpArg] = process.argv.slice(2);
if (!prefix) {
    console.error('使い方: npm run new-game -- <prefix> [en] [jp]   例: npm run new-game -- mygo MYGO マイ碁');
    process.exit(1);
}
if (!/^[a-z][a-z0-9]*go$/.test(prefix)) {
    console.error(`NG: prefix '${prefix}' — 英小文字 (+数字) で始まり 'go' で終わる名前にしてください`);
    process.exit(1);
}
const en = (enArg || prefix.toUpperCase()).toUpperCase();
const jp = jpArg || '新碁';
const file = prefix + '.html';

// ---- 衝突検査 ----
const taken = new Set();
const specsDir = path.join(ROOT, 'variants');
for (const f of fs.readdirSync(specsDir).filter(f => f.endsWith('.spec.js'))) {
    const s = require(path.join(specsDir, f));
    if (s.file) taken.add(s.file);
    if (s.prefix) taken.add(s.prefix);
    if (s.en) taken.add(String(s.en).toUpperCase());
}
if (taken.has(file)) fail(`file '${file}' は既に使われています`);
if (taken.has(prefix)) fail(`prefix '${prefix}' は既に使われています`);
if (taken.has(en)) fail(`en '${en}' は既に使われています`);
if (fs.existsSync(path.join(ROOT, 'docs', file))) fail(`docs/${file} が既に存在します`);
if (fs.existsSync(path.join(specsDir, prefix + '.spec.js'))) fail(`variants/${prefix}.spec.js が既に存在します`);

function fail(msg) { console.error('NG: ' + msg); process.exit(1); }

// ---- 雛形展開 (テンプレート内の mygo/MYGO/マイ碁 を一括置換) ----
function fillTemplate(rel) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return src.split('MYGO').join(en).split('mygo').join(prefix).split('マイ碁').join(jp);
}

const specPath = path.join(specsDir, prefix + '.spec.js');
const iconPath = path.join(specsDir, 'icons', prefix + '.icon.js');
fs.writeFileSync(specPath, fillTemplate('guides/new-game.spec.js'));
fs.writeFileSync(iconPath, fillTemplate('guides/new-game.icon.js'));

console.log(`OK: ${path.relative(ROOT, specPath)} と ${path.relative(ROOT, iconPath)} を作成しました`);
console.log(`  file=${file} en=${en} jp=${jp}`);
if (!jpArg) console.log('  ※ jp は仮の「新碁」です。spec 内の 新碁 を自分の日本語名に書き換えてください');
console.log('次: 2ファイルを編集 → npm run check → node tools/sim-game.js --plies 200 docs/' + file);
