// カタログ行 (icon: フィールドを持つ spec のみ) ・アイコンを index.html に冪等に挿入する。
// 使い方: node gen_index.js   (variants/*.spec.js と variants/icons/*.icon.js を読む)
const fs = require('fs');
const path = require('path');

const specsDir = path.join(__dirname, 'variants');
const iconsDir = path.join(specsDir, 'icons');
const indexPath = path.join(__dirname, 'docs', 'index.html');
const iconsPath = path.join(__dirname, 'docs', 'icon-draw.js');

const specs = fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.spec.js')).sort()
    .map(f => require(path.join(specsDir, f)));

// ---- カタログ行 (marked block を再生成) ----
// icon: を持つ spec だけがカタログ行になる。catalog: false の wave1/2 spec は
// index.html の手書きカードが掲載するため自動生成しない。
const rows = specs.filter(v => v.catalog !== false && v.icon).map(v => {
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
let iconJs = fs.readFileSync(iconsPath, 'utf8');
const strip = (s, b, e) => s.replace(new RegExp(`${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'm'), '');

// 既存ブロックを除去してから再挿入 (カタログ行は index.html、アイコン case は icon-draw.js)
html = strip(html, CATALOG_BEGIN.trim(), CATALOG_END.trim());
iconJs = strip(iconJs, ICON_BEGIN.trim(), ICON_END.trim());
if (!html.includes('                    ];')) throw new Error('GAMES配列終端アンカーが見つかりません');
html = html.replace('                    ];', catalogBlock + '\n                    ];');
iconJs = iconJs.replace('                default: // 未定義kind: 石+スパークル (wave2汎用)', iconBlock + '\n                default: // 未定義kind: 石+スパークル (wave2汎用)');

fs.writeFileSync(indexPath, html);
fs.writeFileSync(iconsPath, iconJs);
console.log(`index.html: ${specs.length} catalog rows, ${Object.keys(iconBodies).length} icon cases injected`);
