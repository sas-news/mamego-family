// check-unique.js — PR チェック用の一意性検査。
//   失敗 (fail): file/prefix/icon の重複、spec 管理外 HTML との衝突、icon 未作成
//   警告 (warn): en/jp 名の類似 (見た目の被り。既存にも類似名があるため fail にしない)
// gen 実行前でも動くが、CI では gen_wave3_index.js の後に実行する想定。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let bad = 0;
const complain = (msg) => { console.error('NG:', msg); bad++; };
const warn = (msg) => console.error('WARN:', msg);

const collect = (dir) => {
    const d = path.join(ROOT, dir);
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d).filter(f => f.endsWith('.spec.js'))
        .map(f => ({ at: `${dir}/${f}`, spec: require(path.join(d, f)) }));
};
const specs = [...collect('variants2'), ...collect('variants3')];

// 1) spec 同士の重複。file/prefix/icon は保存キーや上書きの実害があるので fail、
//    en/jp は表示名の類似なので warn のみ。
for (const key of ['file', 'prefix', 'icon']) {
    const seen = new Map();
    for (const { at, spec } of specs) {
        const v = spec[key];
        if (!v) continue;
        if (seen.has(v)) complain(`${key} '${v}' が重複: ${seen.get(v)} と ${at}`);
        else seen.set(v, at);
    }
}
for (const key of ['en', 'jp']) {
    const seen = new Map();
    for (const { at, spec } of specs) {
        const v = spec[key];
        if (!v) continue;
        if (seen.has(v)) warn(`${key} '${v}' が類似: ${seen.get(v)} と ${at}`);
        else seen.set(v, at);
    }
}

// 2) spec の file が spec 管理外の HTML と衝突しないか
//    (spec 経由でない html = wave1 生成物・algo/tetogo/index 等の手書きファイル)
const specFiles = new Set(specs.map(s => s.spec.file));
const managedOutsideSpecs = new Set(
    fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !specFiles.has(f)));
for (const { at, spec } of specs) {
    if (managedOutsideSpecs.has(spec.file))
        complain(`${at}: file '${spec.file}' は既存の手書き/別系統 HTML と同名です (上書き事故になります)`);
}

// 3) wave3 spec の icon 参照が実在するか
const iconsDir = path.join(ROOT, 'variants3', 'icons');
const icons = new Set();
if (fs.existsSync(iconsDir)) {
    for (const f of fs.readdirSync(iconsDir).filter(f => f.endsWith('.icon.js'))) {
        const m = require(path.join(iconsDir, f));
        const name = m.icon || f.replace(/\.icon\.js$/, '');
        if (icons.has(name)) complain(`icon '${name}' が重複 (variants3/icons/)`);
        icons.add(name);
    }
}
for (const { at, spec } of specs) {
    if (!at.startsWith('variants3/')) continue;
    if (!spec.icon) complain(`${at}: icon がありません (一覧は汎用アイコンになります)`);
    else if (!icons.has(spec.icon))
        complain(`${at}: icon '${spec.icon}' → variants3/icons/${spec.icon}.icon.js がありません`);
}

// 4) index.html のカタログ (GAMES 配列 + WAVE3 セクション) 内の重複
const indexPath = path.join(ROOT, 'index.html');
if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    const entries = [...html.matchAll(
        /\{\s*file:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*jp:\s*'([^']+)'/g)];
    const fSeen = new Map(), nSeen = new Map();
    for (const m of entries) {
        const [, f, n] = m;
        if (fSeen.has(f)) complain(`index.html: file '${f}' が重複 (${fSeen.get(f)} と ${n})`);
        else fSeen.set(f, n);
        if (nSeen.has(n)) warn(`index.html: name '${n}' が類似 (${nSeen.get(n)} と ${f})`);
        else nSeen.set(n, f);
    }
}

console.log(bad
    ? `${bad} 件の重複/衝突が見つかりました (WARN は検査のみ)`
    : `OK: ${specs.length} spec / ${icons.size} icon / index カタログを検査`);
process.exitCode = bad ? 1 : 0;
