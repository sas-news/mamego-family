const fs = require('fs');
const files = ['reversego','pushgo','attractgo','turngo','nogo','limitgo','growgo','molego','blastgo','handigo'];
let bad = 0;
for (const f of files) {
    const m = fs.readFileSync(f + '.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/);
    try { new Function(m[1]); console.log(f + ': OK'); }
    catch (e) { console.log(f + ': ' + e.message); bad++; }
}
process.exit(bad ? 1 : 0);
