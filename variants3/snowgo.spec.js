// SNOWGO — 雪崩碁: 山頂 (上辺) から雪線が下り、雪線より上の連は凍結 (着手不可・取れない)
const K = require('../gen_kit.js');
module.exports = {
    file: 'snowgo.html',
    en: 'SNOWGO',
    jp: '雪崩碁',
    prefix: 'snowgo',
    desc: '8手ごとに雪線が1段下りる (最大4段)。雪線より上は凍結: 着手不可・連も取れない。',
    kind: 'weather',
    icon: 'snowgo',
    spec: [
        ...K.rb('SNOWGO', '雪崩碁', 'snowgo'),
        K.params([
            { key: 'snow_interval', label: '雪線の下降間隔', min: 3, max: 20, def: 8, unit: '手' },
            { key: 'snow_cycle', label: '雪線の周期 (段数)', min: 2, max: 9, def: 5, hint: 'この段数で雪解けに戻る' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 2.0, def: 1.1, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 雪線: 8手ごとに1段ずつ下り、4段で解けて元に戻る (5段階周期)
        [K.ONE, K.VALID_BOUNDS, `            const snowDepth = Math.floor(history.length / (P('snow_interval') || 8)) % (P('snow_cycle') || 5);
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (p.y < snowDepth) return false; // 凍結帯には着手できない
            }`],
        // 凍結帯の連は取られない
        [K.ONE, K.CAPTURE_BLOCK, `            const snowDepth2 = Math.floor(history.length / (P('snow_interval') || 8)) % (P('snow_cycle') || 5);
            const captured = getCapturedStones(board, opponent).filter(i => Math.floor(i / BOARD_SIZE) >= snowDepth2);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 雪線の下降/融解の演出
            if (history.length % (P('snow_interval') || 8) === 0) {
                const sd = Math.floor(history.length / (P('snow_interval') || 8)) % (P('snow_cycle') || 5);
                const cm = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                if (sd === 0) fxText(cm, '雪解け!', '#7dd3fc', 1100);
                else fxText(cm, '雪崩!', '#e0f2fe', 1100);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 雪線: 凍結帯を雪で覆い、石には雪帽を被せる
            {
                const sd = Math.floor(history.length / (P('snow_interval') || 8)) % (P('snow_cycle') || 5);
                if (sd > 0) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(224,242,254,0.55)';
                    for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < sd && y < BOARD_SIZE; y++) {
                        ctx.fillRect(padding + x * cellSize - cellSize / 2, padding + y * cellSize - cellSize / 2, cellSize, cellSize);
                    }
                    // 凍った石には雪帽
                    for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < sd && y < BOARD_SIZE; y++) {
                        const i = y * BOARD_SIZE + x;
                        if (board[i] !== 1 && board[i] !== 2) continue;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.fillStyle = 'rgba(255,255,255,0.9)';
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.18, cellSize * 0.20, Math.PI, 0);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'雪線 ' + (Math.floor(history.length / (P('snow_interval') || 8)) % (P('snow_cycle') || 5)) + '段'`),
        // 連続パスは雪に埋もれて即終局 — 死石は自動判定で採点 (対話的死石確認は省略)
        [K.ONE, `                startDeadStoneSelectionPhase();`, `                endGameByScore();`],
        [K.ONE, K.RV_BASE, K.rv([
            '雪線は8手ごとに1段ずつ上辺から下りる (最大4段、その後雪解けで0に戻る周期)。',
            '雪線より上は凍結: 着手できず、そこにある連も凍り付いて取られない。周期は両者共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('初期は雪線なし', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 凍結判定の検証用に白石を上辺近くに配置
        board[I(3, 0)] = 2;
        // 8手進めて雪線1段へ
        for (let k = 0; k < 8; k++) {
            executeMove({ cells: [{ x: 4 + (k % 5), y: 8 + Math.floor(k / 5) }] }, k % 2 === 0 ? 1 : 2);
        }
        assert('雪線下は着手不可', isValidPlacement([{ x: 1, y: 0 }], 1) === false);
        assert('雪線外は置ける', isValidPlacement([{ x: 1, y: 5 }], 1) === true);
        // 凍結帯の白石は包囲しても取れない
        board[I(2, 0)] = 1; board[I(4, 0)] = 1; board[I(3, 1)] = 1;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('凍結帯の連は取られない', board[I(3, 0)] === 2);
    `,
};
