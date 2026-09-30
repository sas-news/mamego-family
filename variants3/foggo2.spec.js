// FOGGO — 濃霧碁: 幅4列の霧の帯が盤を這い、霧の中には着手できず石も見えない
const K = require('../gen_kit.js');
module.exports = {
    file: 'foggo2.html',
    en: 'FOGGO',
    jp: '濃霧碁',
    prefix: 'foggo2',
    desc: '幅4列の霧の帯が盤を這う。霧の中には着手できず、中の石は不可視。',
    kind: 'weather',
    icon: 'foggo2',
    spec: [
        ...K.rb('FOGGO', '濃霧碁', 'foggo2'),
        // 霧の帯: 2手ごとに1列ずつ進む幅4列の移動域 (ループ)。霧内は着手不可
        [K.ONE, K.VALID_BOUNDS, `            const fogHead = Math.floor(history.length / 2) % BOARD_SIZE;
            const inFog = (x) => ((x - fogHead) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE < 4;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (inFog(p.x)) return false; // 濃霧の中には着手できない
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 濃霧: 霧列を白い帯で覆い、中の石を隠す
            {
                const fogHead = Math.floor(history.length / 2) % BOARD_SIZE;
                const inFog = (x) => ((x - fogHead) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE < 4;
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!inFog(x)) continue;
                    const gx = ((x - fogHead) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE;
                    const a = 0.75 - gx * 0.13; // 先頭ほど濃い
                    ctx.fillStyle = 'rgba(226,232,240,' + a.toFixed(2) + ')';
                    ctx.fillRect(padding + x * cellSize - cellSize / 2, padding - cellSize / 2, cellSize, BOARD_SIZE * cellSize);
                }
                // 霧の先端の流線
                ctx.strokeStyle = 'rgba(148,163,184,0.5)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (!inFog(x)) continue;
                    for (let y = 0; y < BOARD_SIZE; y += 2) {
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.3, Math.PI * 0.8, Math.PI * 1.4);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'霧 ' + (Math.floor(history.length / 2) % BOARD_SIZE) + '列〜'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '幅4列の霧の帯が盤を右へ這い回る (2手で1列)。霧の列には着手できず、霧の中の石は見えない。',
            '霧の中の石も捕獲対象として生きている — 位置を記憶して攻めを組み立てよう。霧は両者共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 初期 (history.length=0) は fogHead=0 → 列0〜3が霧
        assert('霧列は着手不可', isValidPlacement([{ x: 1, y: 5 }], 1) === false);
        assert('霧の外は置ける', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        // history.length=2 → fogHead=1 → 列1〜4が霧
        assert('霧が1列進む', isValidPlacement([{ x: 4, y: 5 }], 1) === false);
        assert('進んだ分は解禁', isValidPlacement([{ x: 0, y: 5 }], 1) === true);
    `,
};
