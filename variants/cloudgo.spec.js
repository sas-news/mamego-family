// CLOUDGO — 雲碁: 3つの浮遊島盤。島間は細い筋で接続
const K = require('../gen_kit.js');
module.exports = {
    file: 'cloudgo.html',
    en: 'CLOUDGO',
    jp: '雲碁',
    prefix: 'cloudgo',
    desc: '3つの浮遊島が細い筋で繋がる雲上盤。島を跨ぐ連絡線が生命線。',
    kind: 'stone',
    icon: 'cloudgo',
    spec: [
        ...K.rb('CLOUDGO', '雲碁', 'cloudgo'),
        K.params([
            { key: 'cloud_r', label: '浮遊島の半径', min: 0, max: 6, def: 0, hint: '0=自動 (盤幅の1/5)' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 3つの浮遊島 (円) + 細い接続筋
        const CLOUD_F = Math.max(2, Math.floor(BOARD_SIZE / 4));
        const CLOUD_M = (BOARD_SIZE - 1) / 2;
        const CLOUD_R = Math.max(1, P('cloud_r') || Math.max(2, Math.floor(BOARD_SIZE / 5)));
        const CLOUD_A = { x: CLOUD_F, y: CLOUD_F };
        const CLOUD_B = { x: BOARD_SIZE - 1 - CLOUD_F, y: CLOUD_F };
        const CLOUD_D = { x: CLOUD_M, y: BOARD_SIZE - 1 - CLOUD_F };
        function isCloudCell(x, y) {
            const N = BOARD_SIZE;
            const inIsland = (c) => Math.hypot(x - c.x, y - c.y) <= CLOUD_R + 0.4;
            if (inIsland(CLOUD_A) || inIsland(CLOUD_B) || inIsland(CLOUD_D)) return true;
            // A-B間の横筋
            if (y === CLOUD_F && x >= CLOUD_A.x && x <= CLOUD_B.x) return true;
            // 中央からDへの縦筋
            if (x === CLOUD_M && y >= CLOUD_F && y <= CLOUD_D.y) return true;
            return false;
        }`],
        // 雲の外は空
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                if (!isCloudCell(x, y)) board[i] = 3;
            }`],
        // 空の描画
        [K.ONE, K.COVERED_ANCHOR, K.voidDraw(`'rgba(125,171,225,0.42)'`)],
        // 雲の漂い
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 雲の漂い: 島の周りを薄い雲が流れる
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            ctx2.fillStyle = 'rgba(255,255,255,0.20)';
            for (let k = 0; k < 4; k++) {
                const t = (now / 9000 + k / 4) % 1;
                const mx = pad + (t * (BOARD_SIZE + 4) - 2) * cs;
                const my = pad + BOARD_SIZE * cs * (0.15 + 0.22 * k) + Math.sin(now / 3000 + k * 1.7) * cs * 0.4;
                ctx2.beginPath();
                ctx2.ellipse(mx, my, cs * 1.4, cs * 0.5, 0, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.restore();
        });`],
        // 空を死に石選択から除外
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.INFO_BASE, `            雲碁: 3つの浮遊島が細い筋で繋がる雲上盤 (外側は空)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手できるのは3つの浮遊島と島を結ぶ細い筋だけ。外側は空。',
            '筋を抑えれば島を分断できる。島内の包囲戦は小さいが橋頭堡になる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('島の中央は打てる', isValidPlacement([{ x: CLOUD_A.x, y: CLOUD_A.y }], 1) === true);
        assert('雲の外は打てない', isValidPlacement([{ x: 0, y: BOARD_SIZE - 1 }], 1) === false);
        assert('接続筋は打てる', isValidPlacement([{ x: CLOUD_M, y: CLOUD_F }], 1) === true);
        assert('雲の外は空', board[I(0, BOARD_SIZE - 1)] === 3);
        assert('島が3つある', isCloudCell(CLOUD_A.x, CLOUD_A.y) && isCloudCell(CLOUD_B.x, CLOUD_B.y) && isCloudCell(CLOUD_D.x, CLOUD_D.y));
    `,
};
