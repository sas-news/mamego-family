// 自律プレイアウトハーネス: 各バリアント HTML を vm サンドボックスで起動し、
// evaluateBestAiMove() (= 合法手列挙AI) で双方が指し続ける模擬対局を行う。
// ゲームとして成立しない問題を機械的に検出する:
//   - boot/sim 例外
//   - 序盤デッドロック (合法手ゼロ→パス連鎖)
//   - 全滅イベント (着手後に盤上の石が全滅)
//   - 終局不能 (手数上限到達)
//   - スコア計算の NaN / クラッシュ
// 使い方:
//   node tools/sim-game.js [--plies 400] [--repeat 3] [--timeout 20000] file1.html file2.html ...
//   node tools/sim-game.js --all
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
    const p = [path.join(__dirname, '..', 'docs', file), path.join(__dirname, '..', file)].find(fs.existsSync);
    if (!p) throw new Error(file + ': not found');
    const html = fs.readFileSync(p, 'utf8');
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
            body: makeEl(),
        },
        window: { addEventListener: () => {}, devicePixelRatio: 1 },
        localStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        sessionStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        console,
        setTimeout: () => 1, clearTimeout: () => {},
        setInterval: () => 1, clearInterval: () => {},
        requestAnimationFrame: () => {},
        performance: { now: () => Date.now() },
        Date,
        Math, JSON, Object, Array, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite,
    };
    vm.createContext(sandbox);
    vm.runInContext(m[1], sandbox, { filename: file + '<script>', timeout: 15000 });
    if (typeof sandbox.window.onload === 'function') {
        vm.runInContext('window.onload()', sandbox, { timeout: 15000 });
    }
    return sandbox;
}

// サンドボックス内で実行するシミュレーション本体 (文字列で注入)
const SIM_SRC = `
(function (MAX_PLIES) {
    const log = { plies: 0, errors: [], flags: [], passes: 0, endedBy: null };
    function stones() { return board.filter(v => v === 1 || v === 2).length; }
    try {
        if (typeof resetGame === 'function') resetGame();
        if (gamePhase !== 'playing') gamePhase = 'playing';
        if (gameMode !== 'local') gameMode = 'local';
        let prevStones = stones();
        let earlyPasses = 0;
        for (let ply = 0; ply < MAX_PLIES; ply++) {
            if (gameOver) { log.endedBy = log.endedBy || 'gameOver'; break; }
            if (gamePhase !== 'playing') { log.endedBy = log.endedBy || gamePhase; break; }
            let m;
            try {
                m = evaluateBestAiMove();
            } catch (e) {
                log.errors.push('evaluate@ply' + ply + ': ' + e.message);
                break;
            }
            if (!m) {
                log.passes++;
                if (ply < 6) earlyPasses++;
                try { handlePass(); } catch (e) {
                    log.errors.push('pass@ply' + ply + ': ' + e.message);
                    break;
                }
                continue;
            }
            const mover = turn;
            try {
                executeMove({ cells: m.cells, type: m.type, rot: m.rot }, mover);
            } catch (e) {
                log.errors.push('exec@ply' + ply + ': ' + e.message);
                break;
            }
            log.plies++;
            const s = stones();
            if (s === 0 && prevStones > 0) {
                log.flags.push('wipe@ply' + ply + ':' + prevStones + 'stones->0');
            }
            prevStones = s;
        }
        if (earlyPasses >= 3 && log.plies < 10) {
            log.flags.push('early-deadlock: 序盤から合法手なし (plies=' + log.plies + ')');
        }
        if (log.plies === 0 && !gameOver) {
            log.flags.push('no-first-move: 初手の合法手がない/全滅');
        }
        if (!gameOver && gamePhase === 'playing' && log.plies >= MAX_PLIES) {
            log.flags.push('no-end: ' + MAX_PLIES + '手超過');
        }
        // 終局処理の健全性: スコア計算が走れるか
        if (gamePhase === 'dead_stone_selection' || gamePhase === 'ended') {
            try {
                deadStones.clear && deadStones.clear();
                endGameByScore();
                if (gameResultData && /NaN|undefined/.test(JSON.stringify(gameResultData))) {
                    log.flags.push('result-NaN: ' + JSON.stringify(gameResultData).slice(0, 120));
                }
            } catch (e) {
                log.errors.push('endGameByScore: ' + e.message);
            }
        }
        if (gameOver) log.endedBy = log.endedBy || 'gameOver';
    } catch (e) {
        log.errors.push('sim-boot: ' + e.message);
    }
    return log;
})`;

function simOne(file, maxPlies, timeout) {
    let sandbox;
    try {
        sandbox = loadSandbox(file);
    } catch (e) {
        return { file, fatal: 'boot: ' + e.message };
    }
    if (typeof sandbox.evaluateBestAiMove !== 'function') {
        return { file, fatal: 'no evaluateBestAiMove (AI列挙なし)' };
    }
    try {
        const log = vm.runInContext(`${SIM_SRC}(${maxPlies})`, sandbox, { timeout });
        return { file, ...log };
    } catch (e) {
        return { file, fatal: 'sim-timeout/crash: ' + e.message };
    }
}

function allVariantFiles() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf8');
    const m = html.match(/const GAMES = \[([\s\S]*?)\];/);
    const files = [];
    const re = /file: '([^']+\.html)'/g;
    let mm;
    while ((mm = re.exec(m[1]))) files.push(mm[1]);
    return files;
}

const args = process.argv.slice(2);
function argVal(name, dflt) {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : dflt;
}
const maxPlies = parseInt(argVal('--plies', '400'), 10);
const repeat = parseInt(argVal('--repeat', '3'), 10);
const timeout = parseInt(argVal('--timeout', '20000'), 10);
const files = args.includes('--all')
    ? allVariantFiles()
    : args.filter(a => a.endsWith('.html'));

if (!files.length) {
    console.log('usage: node tools/sim-game.js [--plies N] [--repeat K] [--timeout ms] files...|--all');
    process.exit(2);
}

let flagCount = 0;
for (const f of files) {
    const runs = [];
    for (let r = 0; r < repeat; r++) runs.push(simOne(f, maxPlies, timeout));
    const fatal = runs.find(r => r.fatal);
    const allFlags = [...new Set(runs.flatMap(r => (r.flags || [])))];
    const allErrs = [...new Set(runs.flatMap(r => (r.errors || [])))];
    const plies = runs.map(r => r.plies || 0);
    if (fatal || allFlags.length || allErrs.length) {
        flagCount++;
        console.log(`FLAG  ${f}  plies=[${plies.join(',')}]`);
        if (fatal) console.log(`      fatal: ${fatal.fatal}`);
        allErrs.forEach(e => console.log(`      err: ${e}`));
        allFlags.forEach(fl => console.log(`      flag: ${fl}`));
    } else {
        console.log(`OK    ${f}  plies=[${plies.join(',')}] ended=${runs[0].endedBy}`);
    }
}
console.log(`\n${files.length - flagCount}/${files.length} clean`);
process.exit(0);
