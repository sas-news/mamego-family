// wave2 バリアント (variants2/*.spec.js で生成された HTML) の
// スモークテスト: 各 HTML のスクリプトを vm サンドボックスで起動し、
// spec の test 文字列を実行する (DOM はスタブ化)。
// 使い方: node test-wave2.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function makeCtx() {
    return new Proxy({}, {
        get: (t, p) => {
            if (!(p in t)) t[p] = function () { return makeCtx(); };
            return t[p];
        },
        set: (t, p, v) => { t[p] = v; return true; },
    });
}

function makeEl() {
    return {
        width: 68, height: 68,
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener() {},
        appendChild() {},
        querySelectorAll: () => [],
        querySelector: () => null,
        getContext: () => makeCtx(),
        getBoundingClientRect: () => ({ width: 500, height: 500, left: 0, top: 0 }),
        textContent: '', innerHTML: '', value: '', disabled: false, title: '',
    };
}

function loadSandbox(file) {
    const html = fs.readFileSync(path.join(__dirname, 'docs', file), 'utf8');
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) throw new Error(file + ': inline <script> not found');
    const store = {};
    const sandbox = {
        document: {
            getElementById: () => makeEl(),
            querySelectorAll: () => [],
            createElement: () => makeEl(),
            addEventListener: () => {},
            activeElement: null,
        },
        window: { addEventListener: () => {}, devicePixelRatio: 1 },
        sessionStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        console,
        setTimeout: () => 1, clearTimeout: () => {},
        setInterval: () => 1, clearInterval: () => {},
        requestAnimationFrame: () => {},
    };
    vm.createContext(sandbox);
    vm.runInContext(m[1], sandbox, { filename: file + '<script>' });
    if (typeof sandbox.window.onload === 'function') sandbox.window.onload();
    return sandbox;
}

const specsDir = path.join(__dirname, 'variants2');
const specFiles = fs.existsSync(specsDir)
    ? fs.readdirSync(specsDir).filter(f => f.endsWith('.spec.js')).sort()
    : [];

let total = 0, failed = 0;
for (const sf of specFiles) {
    const v = require(path.join(specsDir, sf));
    let sandbox;
    try {
        sandbox = loadSandbox(v.file);
    } catch (e) {
        console.log(`FAIL  ${v.file}: boot error — ${e.message}`);
        failed++; continue;
    }
    const src = v.test || 'assert("boots", true);';
    let results;
    try {
        results = JSON.parse(vm.runInContext(
            `JSON.stringify((() => { const r = []; function assert(n, c) { r.push([n, !!c]); }
            try { ${src} } catch (e) { r.push(['runtime error: ' + e.message, false]); } return r; })())`,
            sandbox));
    } catch (e) {
        console.log(`FAIL  ${v.file}: test crash — ${e.message}`);
        failed++; continue;
    }
    for (const [name, ok] of results) {
        total++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  [${v.file}] ${name}`);
        if (!ok) failed++;
    }
}
console.log(`\n${total - failed}/${total} checks passed (${specFiles.length} variants)`);
process.exit(failed ? 1 : 0);
