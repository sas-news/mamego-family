// SLEDGO — 橇碁: 盤の半分は雪原。橇(石)は雪原では滑って走り、凍った敵石を押しのける
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'sledgo.html',
    en: 'SLEDGO',
    jp: '橇碁',
    prefix: 'sledgo',
    desc: '下半分は雪原。雪原の自石に向かって着手すると橇が滑り、直線上の孤立敵石を押し出す。',
    kind: 'stone',
    icon: 'sledgo',
    spec: [
        ...K.rb('SLEDGO', '橇碁', 'sledgo'),
        K.params([
            { key: 'snow_frac', label: '雪原の広さ', min: 0.2, max: 0.8, def: 0.5, step: 0.05, hint: '盤の下側の割合' },
            { key: 'sled_pts', label: '押し潰しのアゲハマ', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.6, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 橇: 雪原(下半分)で自石と同じ行/列に置くと橇が滑走 — 間に孤立敵石があれば1つ押し出す (落として+1)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 橇: 雪原 (下半分) で同じ行または列に自石がある方向へ滑走。途中の孤立敵石を1つ押し潰す
            {
                const x0 = move.cells[0].x, y0 = move.cells[0].y;
                const snow = Math.floor(BOARD_SIZE * (P('snow_frac') || 0.5)); // y >= snow が雪原
                if (y0 >= snow) {
                    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    let squashed = 0;
                    for (const [dx, dy] of dirs) {
                        // この方向に自石があるか (橇の発車点)
                        let hasOwn = false;
                        for (let s = 1; ; s++) {
                            const x = x0 + dx * s, y = y0 + dy * s;
                            if (x < 0 || x >= BOARD_SIZE || y < snow || y >= BOARD_SIZE) break;
                            if (board[y * BOARD_SIZE + x] === player) { hasOwn = true; break; }
                            if (board[y * BOARD_SIZE + x] !== 0) break; // 敵がいると発車しない
                        }
                        if (!hasOwn) continue;
                        // 自石との間の孤立敵石を1つ押し潰す — 実際には自石の手前の敵はいないので、自石の向こう側の孤立敵を潰す
                        for (let s = 1; ; s++) {
                            const x = x0 + dx * s, y = y0 + dy * s;
                            if (x < 0 || x >= BOARD_SIZE || y < snow || y >= BOARD_SIZE) break;
                            const i2 = y * BOARD_SIZE + x;
                            if (board[i2] === player) continue; // 味方は飛び越える
                            if (board[i2] === opponent) {
                                const g = getConnectedGroup(i2, opponent);
                                if (g.length === 1) {
                                    board[i2] = 0;
                                    captures[player] += (P('sled_pts') ?? 1);
                                    squashed++;
                                    fxBurst(i2, '#e0f2fe', 12, 1.6);
                                    fxText(i2, '橇で轢いた!', '#38bdf8', 1200);
                                }
                                break; // 敵がいればその先は止まる
                            }
                        }
                        break; // 滑走は1方向のみ
                    }
                    if (squashed) { fxShake(5, 300); cleanUpPieces(); }
                }
            }

            turn = opponent;`],
        // 雪原の描画: 下半分を雪色に
        ...K.CUE_GRID(`            // 雪原: 下半分を雪色に
            {
                const snow2 = Math.floor(BOARD_SIZE * (P('snow_frac') || 0.5));
                ctx.save();
                ctx.fillStyle = 'rgba(224,242,254,0.35)';
                ctx.fillRect(padding - cellSize * 0.5, padding + (snow2 - 0.5) * cellSize, BOARD_SIZE * cellSize, (BOARD_SIZE - snow2) * cellSize);
                ctx.restore();
            }`),
        // 雪原の結晶が舞う
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 雪原の雪: 下半分に雪片が漂う
        fxAmbient((ctx2, now, pad, cs) => {
            const snow3 = Math.floor(BOARD_SIZE * (P('snow_frac') || 0.5));
            ctx2.save();
            for (let k = 0; k < 10; k++) {
                const t = (now / 4000 + k * 0.17) % 1;
                const fx = pad + ((k * 1.37) % 1) * (BOARD_SIZE - 1) * cs + Math.sin(now / 700 + k) * cs * 0.2;
                const fy = pad + (snow3 + t * (BOARD_SIZE - snow3 - 0.2)) * cs;
                ctx2.globalAlpha = 0.5 * (1 - t);
                ctx2.fillStyle = '#f0f9ff';
                ctx2.beginPath();
                ctx2.arc(fx, fy, cs * 0.08, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`'下半分は雪原 — 橇が敵を押し潰す'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            橇碁: 盤の下半分は雪原。雪原で行/列の先に自石があると橇が滑走し、進路上の孤立敵石を押し潰す<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の下半分は雪原。雪原で着手したとき、その行または列の先に自石があれば橇がその方向へ滑走する。',
            '滑走する橇は進路上の孤立した敵石 (連1石) を押し潰してアゲハマにする。連は石を連ねて橇に耐えろ。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const snow = Math.floor(BOARD_SIZE / 2);
        const sy = snow + 1; // 雪原の行
        board[sy * BOARD_SIZE + 8] = 1; // 発車点の自石
        board[sy * BOARD_SIZE + 5] = 2; // 間の孤立敵石
        board[sy * BOARD_SIZE + 3] = 2; board[sy * BOARD_SIZE + 2] = 2; // 連ねた敵は潰れない
        executeMove({ cells: [{ x: 10, y: sy }] }, 1); // 右端から着手 → 左方向に橇 (自石x=8へ)
        assert('橇が孤立敵を押し潰す', board[sy * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('連ねた敵は潰れない', board[sy * BOARD_SIZE + 3] === 2);
        assert('雪原の外では普通', isValidPlacement([{ x: 2, y: 1 }], 2) === true);
    `,
};
