// wave3 バリアント一括生成スクリプト
// variants3/*.spec.js を全て読み、algo.html から各バリアントHTMLを生成する。
// 使い方: node gen_wave3.js   (失敗した置換はログに出る)
const fs = require('fs');
const path = require('path');
const K = require('./gen_kit.js');

const specsDir = path.join(__dirname, 'variants3');
const files = fs.existsSync(specsDir)
    ? fs.readdirSync(specsDir).filter(f => f.endsWith('.spec.js')).sort()
    : [];

let count = 0;
for (const f of files) {
    const v = require(path.join(specsDir, f));
    const html = typeof v.build === 'function'
        ? v.build(K.ALGO, K)
        : K.apply(K.ALGO, v.spec, v.en);
    K.out(v.file, html);
    count++;
}
console.log(`wave3: generated ${count} variants`);
console.log(K.failures === 0 ? 'ALL OK' : `${K.failures} replacements MISSING`);
process.exitCode = K.failures ? 1 : 0;
