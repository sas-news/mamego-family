// TIDEPOOLGO — 潮間碁: 10手ごとに満潮/干潮。満潮時は盤の外周1段が水没 (着手不可・石は流出)
const K = require('../gen_kit.js');
module.exports = {
    file: 'tidepoolgo.html',
    en: 'TIDEPOOLGO',
    jp: '潮間碁',
    prefix: 'tidepoolgo',
    desc: '10手周期の潮汐: 満潮時は外周1段が水没し着手不可、石は流出する。',
    kind: 'weather',
    icon: 'tidepoolgo',
    spec: [
        ...K.rb('TIDEPOOLGO', '潮間碁', 'tidepoolgo'),
        K.params([
            { key: 'tide_period', label: '潮汐の周期', min: 4, max: 30, def: 10, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.0, step: 0.1, def: 1.1, hint: '交点数比' },
        ]),
        // 満潮時 (手数の10の位が奇数の10手帯) は外周1段が水没で着手不可
        [K.ONE, K.VALID_BOUNDS, `            const isHigh = Math.floor(history.length / (P('tide_period') || 10)) % 2 === 1;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (isHigh && (p.x === 0 || p.y === 0 || p.x === BOARD_SIZE - 1 || p.y === BOARD_SIZE - 1)) return false; // 満潮で水没
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 潮汐: 10手ごとに満潮/干潮が入れ替わる (両者共通)
            if (history.length % (P('tide_period') || 10) === 0) {
                const nowHigh = Math.floor(history.length / (P('tide_period') || 10)) % 2 === 1;
                if (nowHigh) {
                    // 満潮: 外周1段の石は全て流出 (アゲハマにはならない)。全滅はさせない
                    const washed = [];
                    for (let i = 0; i < board.length; i++) {
                        const tx = i % BOARD_SIZE, ty = Math.floor(i / BOARD_SIZE);
                        if ((tx === 0 || ty === 0 || tx === BOARD_SIZE - 1 || ty === BOARD_SIZE - 1) && (board[i] === 1 || board[i] === 2)) washed.push(i);
                    }
                    if (washed.length < board.filter(v => v === 1 || v === 2).length) {
                        washed.forEach(i => { board[i] = 0; fxSplash(i, '#38bdf8', 6); });
                        cleanUpPieces();
                    }
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '満潮!', '#38bdf8', 1200);
                } else {
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '干潮!', '#fbbf24', 1200);
                }
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 満潮時: 外周1段を水面で覆う
            if (Math.floor(history.length / (P('tide_period') || 10)) % 2 === 1) {
                ctx.save();
                ctx.fillStyle = 'rgba(56,189,248,0.35)';
                for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < BOARD_SIZE; y++) {
                    if (!(x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1)) continue;
                    ctx.fillRect(padding + x * cellSize - cellSize / 2, padding + y * cellSize - cellSize / 2, cellSize, cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`Math.floor(history.length / (P('tide_period') || 10)) % 2 === 1 ? '満潮' : '干潮'`),
        // 連続パスは潮に流されて即終局 — 死石は自動判定で採点 (対話的死石確認は省略)
        [K.ONE, `                startDeadStoneSelectionPhase();`, `                endGameByScore();`],
        [K.ONE, K.RV_ALGO, K.rv([
            '潮汐は10手周期: 満潮の10手帯は盤の外周1段が水没し、そこに着手もできない。',
            '潮が満ちる瞬間、外周の石は全て流出する (アゲハマにはならない)。周期は両者共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('干潮時は端にも置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 9手進めて満潮帯 (10-19手) へ
        for (let k = 0; k < 9; k++) {
            executeMove({ cells: [{ x: 3 + (k % 6), y: 3 + Math.floor(k / 6) }] }, k % 2 === 0 ? 1 : 2);
        }
        board[I(0, 5)] = 1; // 外周に黒石を置く
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2); // 10手目 → 満潮へ
        assert('満潮で外周の石が流出', board[I(0, 5)] === 0);
        assert('満潮時は端に置けない', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('内側は置ける', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
