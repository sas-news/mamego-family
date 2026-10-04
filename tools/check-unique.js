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

// 2) spec の file が spec 管理外の既存 HTML を上書きしないか。
//    生成 HTML は全て STORAGE_KEY = '<prefix>-save-v1' を含むので、
//    「コミット済みのそのファイルが自分の prefix を持つ生成物か」で所有を判定する。
//    HEAD 基準のため gen_wave3 の実行順に依らない。git が無い環境では
//    ワークツリーの内容で判定 (その場合 gen 実行前が前提)。
const keyRe = /STORAGE_KEY = '([a-z0-9_]+)-save-v1'/;
const committedHtml = new Set();     // HEAD に存在するルート直下の *.html
const committedOwner = new Map();    // html file -> HEAD に埋め込まれた prefix
let gitOk = true;
try {
    const { execSync } = require('child_process');
    // ls-tree の pathspec は glob 非対応なので全取得して JS 側で絞る
    execSync('git ls-tree -r --name-only HEAD', { cwd: ROOT, encoding: 'utf8' })
        .split('\n').filter(f => f.endsWith('.html') && !f.includes('/'))
        .forEach(f => committedHtml.add(f));
    const gg = execSync('git grep -n STORAGE_KEY HEAD', { cwd: ROOT, encoding: 'utf8' });
    for (const line of gg.split('\n')) {
        const m = line.match(/^HEAD:([^:]+\.html):\d+:.*STORAGE_KEY = '([a-z0-9_]+)-save-v1'/);
        if (m) committedOwner.set(m[1], m[2]);
    }
} catch { gitOk = false; }

const ownCheck = (f, spec) => {
    if (gitOk) {
        if (!committedHtml.has(f)) return null;    // HEAD に無い → 新規ファイル (衝突なし)
        const p = committedOwner.get(f);
        return p === undefined ? false : p === spec.prefix;
    }
    if (!fs.existsSync(path.join(ROOT, f))) return null;
    const m = fs.readFileSync(path.join(ROOT, f), 'utf8').match(keyRe);
    return m ? m[1] === spec.prefix : false;
};

for (const { at, spec } of specs) {
    // ルート直下の英小文字名のみ (パスエスケープ・上書き事故の防止)
    if (spec.file && !/^[a-z0-9]+\.html$/.test(spec.file))
        complain(`${at}: file '${spec.file}' はルート直下の「英小文字+.html」にしてください`);
    if (spec.prefix && !/^[a-z0-9]+$/.test(spec.prefix))
        complain(`${at}: prefix '${spec.prefix}' は英小文字のみにしてください`);
    const own = spec.file ? ownCheck(spec.file, spec) : null;
    if (own === false) {
        const owner = committedOwner.get(spec.file);
        complain(`${at}: file '${spec.file}' は既存の HTML を上書きします (${owner ? `'${owner}' の生成物` : 'ゲーム以外のページ'})。別名にしてください`);
    }
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
