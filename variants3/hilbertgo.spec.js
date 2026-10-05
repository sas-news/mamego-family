// HILBERTGO — 充填碁: 盤は空間充填曲線。曲線の巡り順の先頭3点にしか着手できない。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'hilbertgo.html',
    en: 'HILBERTGO',
    jp: '充填碁',
    prefix: 'hilbertgo',
    desc: '充填曲線の巡り順の先頭3点にしか着手できない。',
    kind: 'stone',
    icon: 'hilbertgo',
    spec: [
        ...K.rb('HILBERTGO', '充填碁', 'hilbertgo'),
        K.params([
            { key: 'window_size', label: '着手できる先頭の点数', min: 1, max: 9, def: 3, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.5, max: 2, def: 1.1, step: 0.05 },
        ]),
        // 充填曲線: Zオーダー (モートン順) の未占領の先頭3点のみ着手可
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        const mortonCode = (x, y) => {
            let m = 0;
            for (let b = 0; b < 4; b++) m |= ((x >> b) & 1) << (2 * b + 1) | ((y >> b) & 1) << (2 * b);
            return m;
        };
        const curveWindow = () => {
            const order = [];
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                if (board[i] === 0) order.push({ i, m: mortonCode(i % BOARD_SIZE, (i / BOARD_SIZE) | 0) });
            }
            order.sort((a, b) => a.m - b.m);
            return order.slice(0, Math.max(1, P('window_size') || 3)).map(e => e.i);
        };
        function isValidPlacement(cells, player) {`],
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 充填曲線: 巡り順の先頭3点以外は着手不可
                if (!curveWindow().includes(p.y * BOARD_SIZE + p.x)) return false;
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        // 着手可能点をドット表示
        ...K.LEGAL_DOTS_SPEC,
        // 曲線の通り道を薄く示す
        ...K.CUE_GRID(`            // 充填曲線の行進方向を薄い点線で表示
            {
                ctx.save();
                ctx.fillStyle = alphaColor(currentTheme.lineColor, 0.18);
                const seq = [];
                for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) seq.push({ i, m: mortonCode(i % BOARD_SIZE, (i / BOARD_SIZE) | 0) });
                seq.sort((a, b) => a.m - b.m);
                ctx.beginPath();
                seq.forEach((e, k) => {
                    const cx = padding + (e.i % BOARD_SIZE) * cellSize, cy = padding + ((e.i / BOARD_SIZE) | 0) * cellSize;
                    if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
                });
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.10);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'充填 ' + board.filter(v => v !== 0).length + '/' + (BOARD_SIZE * BOARD_SIZE)`),
        [K.ONE, K.INFO_BASE, `            充填碁: 空間充填曲線の巡り順にしか打てない。ドットの3点が現在の着手可能点<br>
            PC: クリックで配置 (先頭3点のみ)<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の交点はZ字の充填曲線で順序付けられている。空点のうち巡り順の先頭3点にしか着手できない。',
            'ドットが現在の着手可能点。相手の進行を読んで曲線の先を埋めるか。',
            '取り・コウ・呼吸のルールは通常どおり — 打てる場所だけが縛られる。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const win = curveWindow();
        assert('巡り順の先頭3点が着手可能', win.length === 3);
        assert('先頭点は合法', isValidPlacement([{ x: win[0] % BOARD_SIZE, y: (win[0] / BOARD_SIZE) | 0 }], 1) === true);
        assert('先頭以外は禁手', isValidPlacement([{ x: 7, y: 7 }], 1) === false || win.includes(7 * BOARD_SIZE + 7));
        executeMove({ cells: [{ x: win[0] % BOARD_SIZE, y: (win[0] / BOARD_SIZE) | 0 }] }, 1);
        const win2 = curveWindow();
        assert('着手で窓が進む', !win2.includes(win[0]));
    `,
};
