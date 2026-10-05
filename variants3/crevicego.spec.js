// CREVICEGO — 亀裂碁: 盤の中央に亀裂が走る。亀裂を挟む石は連にならない (4行ごとに自然橋)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
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
    file: 'crevicego.html',
    en: 'CREVICEGO',
    jp: '亀裂碁',
    prefix: 'crevicego',
    desc: '盤の中央に亀裂。亀裂を挟む石は連にも呼吸も通らない (4行ごとに自然橋)。',
    kind: 'stone',
    icon: 'crevicego',
    spec: [
        ...K.rb('CREVICEGO', '亀裂碁', 'crevicego'),
        K.params([
            { key: 'bridge_step', label: '自然橋の間隔', min: 0, max: 8, def: 4, unit: '行', hint: '0=橋なし' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        // 亀裂: 中央列の境を越える横方向の近傍を断つ (y%4==1 は自然橋で通れる)
        [K.ONE, K.NBRS_GRID, `        function getNeighbors(idx) {
            const x = idx % BOARD_SIZE;
            const y = Math.floor(idx / BOARD_SIZE);
            const neighbors = [];
            // 亀裂: 中央列 a と a+1 の間。一定間隔の行は自然橋で繋がる
            const a = Math.floor((BOARD_SIZE - 1) / 2);
            const _bs = P('bridge_step') ?? 4;
            const cracked = (x1, x2, yy) => (_bs <= 0 || yy % _bs !== 1) &&
                ((x1 === a && x2 === a + 1) || (x2 === a && x1 === a + 1));

            if (x > 0 && !cracked(x - 1, x, y)) neighbors.push(idx - 1);
            if (x < BOARD_SIZE - 1 && !cracked(x, x + 1, y)) neighbors.push(idx + 1);
            if (y > 0) neighbors.push(idx - BOARD_SIZE);
            if (y < BOARD_SIZE - 1) neighbors.push(idx + BOARD_SIZE);

            return neighbors;
        }`],
        // 亀裂線を描く (自然橋は隙間を残す)
        K.CUE_GRID(`            // 亀裂: 中央の縦割れを暗いギザ線で描く
            {
                const a = Math.floor((BOARD_SIZE - 1) / 2);
                const gx = padding + (a + 0.5) * cellSize;
                const _bs = P('bridge_step') ?? 4;
                ctx.save();
                ctx.strokeStyle = 'rgba(24,18,14,0.75)';
                ctx.lineWidth = Math.max(2, cellSize * 0.09);
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                for (let y = 0; y < BOARD_SIZE; y++) {
                    if (_bs > 0 && y % _bs === 1) continue; // 自然橋: 亀裂が途切れる
                    const cy = padding + y * cellSize;
                    const j = Math.sin(y * 2.7) * cellSize * 0.14;
                    ctx.beginPath();
                    ctx.moveTo(gx + j, cy - cellSize * 0.42);
                    ctx.lineTo(gx - j * 0.6, cy);
                    ctx.lineTo(gx + j, cy + cellSize * 0.42);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'中央の亀裂: 連を分断する'`),
        [K.ONE, K.INFO_BASE, `            亀裂碁: 盤の中央に亀裂。亀裂を挟む石は連にも呼吸も通らない (4行ごとに自然橋)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央に縦の亀裂が走る。亀裂を挟んだ石同士は隣接しない — 連も呼吸も通らない。',
            'ただし4行ごと (y%4=1) に「自然橋」があり、そこでは繋がる。',
            '亀裂で分断された連は別連扱い。両者に対称の地形。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const a = Math.floor((BOARD_SIZE - 1) / 2);
        assert('亀裂で右の近傍が切れる', !getNeighbors(I(a, 0)).includes(I(a + 1, 0)));
        assert('亀裂で左の近傍が切れる', !getNeighbors(I(a + 1, 0)).includes(I(a, 0)));
        assert('自然橋は繋がる', getNeighbors(I(a, 1)).includes(I(a + 1, 1)));
        assert('亀裂以外は普通', getNeighbors(I(1, 0)).includes(I(2, 0)));
        assert('起動して通常着手可', isValidPlacement([{ x: a, y: 0 }], 1) === true);
    `,
};
