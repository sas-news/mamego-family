// COMPASSGO — 方位碁: 盤は八方位。外周の石は方角で得点が違い、四正方位+3・四隅方位+1
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
    file: 'compassgo.html',
    en: 'COMPASSGO',
    jp: '方位碁',
    prefix: 'compassgo',
    desc: '盤は八方位。外周の自石は方角で得点が違う — 四正方位 (東西南北) +3・四隅方位 +1。',
    kind: 'stone',
    icon: 'compassgo',
    spec: [
        ...K.rb('COMPASSGO', '方位碁', 'compassgo'),
        K.params([
            { key: 'cardinal_pts', label: '四正方位の得点', min: 0, max: 8, def: 3, unit: '点/石' },
            { key: 'corner_pts', label: '四隅方位の得点', min: 0, max: 6, def: 1, unit: '点/石' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        // 方位ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 八方位: 外周の石の方位を中心からの角度で判定 (0=東 2=南 4=西 6=北)
        function compassSector(i) {
            const c = (BOARD_SIZE - 1) / 2;
            const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
            const a = Math.atan2(y - c, x - c);
            return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
        }
        function compassBonus(pl) {
            let s = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (x !== 0 && y !== 0 && x !== BOARD_SIZE - 1 && y !== BOARD_SIZE - 1) continue;
                const i = y * BOARD_SIZE + x;
                if (board[i] !== pl) continue;
                const sec = compassSector(i);
                s += (sec % 2 === 0) ? (P('cardinal_pts') ?? 3) : (P('corner_pts') ?? 1); // 四正/四隅で得点が違う
            }
            return s;
        }

        function endGameByScore() {`],
        // 採点に方位点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + compassBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + compassBonus(2);`],
        // 八方位の小さな羅針を中央に描く
        K.CUE_STARS(`            // 方位: 中央に八方位の羅針盤
            {
                const c = (BOARD_SIZE - 1) / 2;
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                const r = cellSize * 0.42;
                ctx.save();
                ctx.strokeStyle = 'rgba(14,165,233,0.75)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4;
                    const len = k % 2 === 0 ? r : r * 0.55;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            方位碁: 外周の自石は方角で得点が違う — 四正方位+3・四隅方位+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の外周に残った自分の石は方角で得点: 東・南・西・北の四正方位は1石+3点、四隅方位は1石+1点。',
            '内側の石は方位点にならない — 外周まで伸ばす価値がある。中央の羅針が方位を示す。',
            '方位は中心から見た角度で決まる。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE; const c = Math.floor(B / 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('空盤は方位点0', compassBonus(1) === 0);
        board[c * B + (B - 1)] = 1; // 東端 (中央右) → 四正+3
        assert('東端は四正+3', compassSector(c * B + (B - 1)) === 0 && compassBonus(1) === 3);
        board[0 * B + (B - 1)] = 1; // 北東隅 → 四隅+1
        assert('隅は四隅+1', compassBonus(1) === 4);
        board[0] = 2; // 北西隅に白
        assert('白も同条件', compassBonus(2) === 1);
        board[(B - 1) * B + c] = 2; // 南端に白 → 四正
        assert('白の四正も+3', compassBonus(2) === 4);
    `,
};
