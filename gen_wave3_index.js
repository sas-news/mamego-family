// wave3 以降のカタログ行・アイコンを index.html に冪等に挿入する。
// 使い方: node gen_wave3_index.js   (variants3/*.spec.js と variants3/icons/*.icon.js を読む)
const fs = require('fs');
const path = require('path');

const specsDir = path.join(__dirname, 'variants3');
const iconsDir = path.join(specsDir, 'icons');
const indexPath = path.join(__dirname, 'index.html');

const specs = fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.spec.js')).sort()
    .map(f => require(path.join(specsDir, f)));

// ---- カタログ行 (marked block を再生成) ----
const rows = specs.map(v => {
    const icon = v.icon || v.prefix || v.file.replace('.html', '');
    const jp = String(v.jp).replace(/'/g, "\\'");
    const desc = String(v.desc).replace(/'/g, "\\'");
    return `            { file: '${v.file}', name: '${v.en}', jp: '${jp}', desc: '${desc}', kind: '${v.kind || 'stone'}', icon: '${icon}' },`;
});
const CATALOG_BEGIN = '            // ==== WAVE3 GAMES BEGIN ====';
const CATALOG_END = '            // ==== WAVE3 GAMES END ====';
const catalogBlock = [CATALOG_BEGIN, ...rows, CATALOG_END].join('\n');

// ---- アイコン case (marked block を再生成) ----
const iconBodies = {};
if (fs.existsSync(iconsDir)) {
    for (const f of fs.readdirSync(iconsDir).filter(f => f.endsWith('.icon.js'))) {
        const m = require(path.join(iconsDir, f));
        iconBodies[m.icon] = m.body;
    }
}
const cases = Object.keys(iconBodies).sort().map(icon =>
    `                case '${icon}': {\n${iconBodies[icon]}\n                    break;\n                }`);
const ICON_BEGIN = '                // == WAVE3 ICONS BEGIN ==';
const ICON_END = '                // == WAVE3 ICONS END ==';
const iconBlock = [ICON_BEGIN, cases.join('\n'), ICON_END].join('\n');

let html = fs.readFileSync(indexPath, 'utf8');
const strip = (s, b, e) => s.replace(new RegExp(`${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'm'), '');

// 既存ブロックを除去してから再挿入
html = strip(html, CATALOG_BEGIN.trim(), CATALOG_END.trim());
html = strip(html, ICON_BEGIN.trim(), ICON_END.trim());
html = html.replace('            // ==== WAVE2 GAMES END ====', catalogBlock);
html = html.replace('                default: // 未定義kind: 石+スパークル (wave2汎用)', iconBlock + '\n                default: // 未定義kind: 石+スパークル (wave2汎用)');

fs.writeFileSync(indexPath, html);
console.log(`index.html: ${specs.length} catalog rows, ${Object.keys(iconBodies).length} icon cases injected`);
