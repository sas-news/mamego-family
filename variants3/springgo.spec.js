// SPRINGGO — 季節碁: 5手ごとに春夏秋冬が巡る。春=芽吹/秋=枯れてアゲハマ無し/冬=凍結(取れない)
const K = require('../gen_kit.js');
module.exports = {
    file: 'springgo.html',
    en: 'SPRINGGO',
    jp: '季節碁',
    prefix: 'springgo',
    desc: '5手周期の季節: 春=石が芽吹く / 秋=アゲハマ無し / 冬=石は凍り取れない。',
    kind: 'weather',
    icon: 'springgo',
    spec: [
        ...K.rb('SPRINGGO', '季節碁', 'springgo'),
        K.params([
            { key: 'season_len', label: '季節の長さ', min: 2, max: 15, def: 5, unit: '手' },
        ]),
        // 冬 (季節3) は連が凍り付き取られない
        [K.ONE, K.CAPTURE_BLOCK, `            const seasonNow = Math.floor(history.length / (P('season_len') || 5)) % 4;
            const captured = seasonNow === 3 ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                // 秋 (季節2) は枯れ: アゲハマにならない
                if (seasonNow !== 2) captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 季節: 5手ごとに 0:春 1:夏 2:秋 3:冬 が巡る
            const season = Math.floor(history.length / (P('season_len') || 5)) % 4;
            if (season === 0) {
                // 春: 置いた石の隣の空点に芽石が1個生える
                for (const c of move.cells) {
                    const ci = c.y * BOARD_SIZE + c.x;
                    const buds = getNeighbors(ci).filter(n => board[n] === 0);
                    if (buds.length > 0) {
                        const b = buds[Math.floor(Math.random() * buds.length)];
                        board[b] = player;
                        fxGlow(b, '#86efac', 700);
                        fxText(b, '芽吹', '#22c55e', 900);
                    }
                }
            }
            if (history.length % (P('season_len') || 5) === 0) {
                const names = ['春', '夏', '秋', '冬'];
                fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), names[season] + '到来', '#22c55e', 1100);
            }
            // 冬明け: 凍っていた呼吸点0の連は溶けて流される (アゲハマ無し)。全滅はさせない
            if (season !== 3) {
                [1, 2].forEach(pl => {
                    const dead = getCapturedStones(board, pl);
                    if (dead.length > 0 && dead.length < board.filter(v => v === 1 || v === 2).length) {
                        dead.forEach(idx => board[idx] = 0);
                    }
                });
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 季節色: 盤全体を季節色の縁で彩る
            {
                const ss = Math.floor(history.length / (P('season_len') || 5)) % 4;
                const cols = ['rgba(74,222,128,0.55)', 'rgba(251,146,60,0.55)', 'rgba(217,119,6,0.55)', 'rgba(147,197,253,0.65)'];
                ctx.save();
                ctx.strokeStyle = cols[ss];
                ctx.lineWidth = Math.max(2, cellSize * 0.12);
                const w = padding * 2 + (BOARD_SIZE - 1) * cellSize;
                ctx.strokeRect(1.5, 1.5, w - 3, w - 3);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`['春=芽吹', '夏', '秋=枯れ', '冬=凍結'][Math.floor(history.length / (P('season_len') || 5)) % 4] + ' ' + ((P('season_len') || 5) - history.length % (P('season_len') || 5)) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '季節は5手周期で巡る — 春: 置いた石の隣に芽石が生える。夏: 通常。秋: 捕獲してもアゲハマ無し。',
            '冬: 連は凍り付き取られない (呼吸点0のまま耐える)。季節の巡りは両プレイヤー共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('春の着手で芽が生える', getNeighbors(I(4, 4)).some(n => board[n] === 1));
        assert('盤に2石以上', board.filter(v => v === 1).length >= 2);
        // 冬判定: history を冬帯の手数に合わせる
        while (history.length < 15) executeMove({ cells: [{ x: history.length % 10, y: 8 }] }, history.length % 2 === 0 ? 1 : 2);
        board[I(6, 6)] = 2; board[I(5, 6)] = 1; board[I(7, 6)] = 1; board[I(6, 5)] = 1;
        executeMove({ cells: [{ x: 6, y: 7 }] }, 2);
        assert('冬は取れない', board[I(6, 6)] === 2);
    `,
};
