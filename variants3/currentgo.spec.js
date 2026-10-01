// CURRENTGO — 海流碁: 5行おきに東西の海流が走り、8手ごとに石上の石が1マス流される
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'currentgo.html',
    en: 'CURRENTGO',
    jp: '海流碁',
    prefix: 'currentgo',
    desc: '5行おきの海流が8手ごとに石を1マス流す。盤外に流されると取られる。',
    kind: 'stone',
    icon: 'currentgo',
    spec: [
        ...K.rb('CURRENTGO', '海流碁', 'currentgo'),
        K.params([
            { key: 'current_period', label: '潮汐の間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'current_step', label: '海流の行間隔', min: 3, max: 8, def: 5, unit: '行' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        // 海流: 8手ごとに流れのある段の石を1マス流す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 海流: 一定間隔の手数ごとに、流れの段の石が1マス流される (盤外に出ると取られる)
            const _cp = Math.max(1, P('current_period') || 8);
            const _cs = Math.max(3, P('current_step') || 5);
            if (history.length > 0 && history.length % _cp === 0) {
                const drifted = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const dir = y % _cs === 2 ? 1 : (y % _cs === _cs - 1 ? -1 : 0);
                    if (!dir) continue;
                    const xs = [];
                    for (let x = 0; x < BOARD_SIZE; x++) xs.push(x);
                    if (dir > 0) xs.reverse(); // 下流側から処理して追い越しを防ぐ
                    xs.forEach(x => {
                        const i = y * BOARD_SIZE + x;
                        const v = board[i];
                        if (v !== 1 && v !== 2) return;
                        const tx = x + dir;
                        if (tx < 0 || tx >= BOARD_SIZE) {
                            board[i] = 0;
                            captures[3 - v]++; // 沖に流された石は相手のアゲハマ
                            fxText(i, '流失', '#22d3ee', 900);
                            return;
                        }
                        const ti = y * BOARD_SIZE + tx;
                        if (board[ti] !== 0) return;
                        board[ti] = v;
                        board[i] = 0;
                        pieces.forEach(pc => pc.cells.forEach(c => { if (c.x === x && c.y === y) { c.x = tx; } }));
                        fxSlide(i, ti, 380);
                        drifted.push(ti);
                    });
                }
                if (drifted.length) {
                    fxShake(3, 260);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 海流: 流れのある段に矢印マーク
            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const _cs = Math.max(3, P('current_step') || 5);
                    const dir = y % _cs === 2 ? 1 : (y % _cs === _cs - 1 ? -1 : 0);
                    if (!dir) continue;
                    ctx.strokeStyle = 'rgba(34,211,238,0.55)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    for (let x = 1; x < BOARD_SIZE; x += 3) {
                        const cx = padding + x * cellSize;
                        const cy = padding + y * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(cx - dir * cellSize * 0.3, cy - cellSize * 0.12);
                        ctx.lineTo(cx + dir * cellSize * 0.3, cy);
                        ctx.lineTo(cx - dir * cellSize * 0.3, cy + cellSize * 0.12);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'海流まで ' + (Math.max(1, P('current_period') || 8) - history.length % Math.max(1, P('current_period') || 8)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            海流碁: 5行おきの海流が8手ごとに石を1マス流す。盤外に流されると取られる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            'y≡2 の行は東へ、y≡4 の行は西へ — 5行おきに海流が走っている。',
            '8手ごとの潮汐で流れの段の石が1マスずれる。盤外に押し出されると相手のアゲハマに。',
            '流れに乗せて石を運ぶか、連を崩されるか。両者共通の潮流。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[2 * BOARD_SIZE + 3] = 1; // 東流れの行
        board[4 * BOARD_SIZE + 9] = 2; // 西流れの行
        history.length = 7;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 8手目 → 潮汐
        assert('東流れの石が+1x', board[2 * BOARD_SIZE + 4] === 1 && board[2 * BOARD_SIZE + 3] === 0);
        assert('西流れの石が-1x', board[4 * BOARD_SIZE + 8] === 2 && board[4 * BOARD_SIZE + 9] === 0);
        // 端の石は流失する
        board[2 * BOARD_SIZE + (BOARD_SIZE - 1)] = 1;
        history.length = 15;
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2);
        assert('端の石は流失して相手のアゲハマ', board[2 * BOARD_SIZE + (BOARD_SIZE - 1)] === 0 && captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
