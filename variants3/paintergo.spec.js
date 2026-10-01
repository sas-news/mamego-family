// PAINTERGO — 絵画碁: 前の自分の着手と8近傍以内に筆を繋げると「連続筆」ボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'paintergo.html',
    en: 'PAINTERGO',
    jp: '絵画碁',
    prefix: 'paintergo',
    desc: '前の自石と8近傍以内に筆を繋ぐと+1目。筆跡は盤上に残る。',
    kind: 'stone',
    icon: 'paintergo',
    spec: [
        ...K.rb('PAINTERGO', '絵画碁', 'paintergo'),
        K.params([
            { key: 'brush_dist', label: '筆が繋がる距離', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'brush_bonus', label: '連続筆ボーナス', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        // 連続筆ボーナス: 自分の直前の着手と8近傍で繋がれば+1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 絵画ルール: 自分の直前の石と8近傍以内に筆を繋ぐと+1目 (筆が連なった)
            {
                const own = pieces.filter(pc => pc.player === player);
                const cur = move.cells[0];
                if (own.length >= 2) {
                    const prev = own[own.length - 2].cells[0];
                    const __bd = P('brush_dist') || 1;
                    if (Math.abs(cur.x - prev.x) <= __bd && Math.abs(cur.y - prev.y) <= __bd) {
                        captures[player] += (P('brush_bonus') || 1);
                        const ci = cur.y * BOARD_SIZE + cur.x;
                        fxText(ci, '連続筆 +' + (P('brush_bonus') || 1), '#7c3aed', 1100);
                        fxGlow(ci, '#a78bfa', 700);
                    }
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 筆跡: 各プレイヤーの直近の着手間を淡い線で結ぶ (3手分だけ残る)
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                [1, 2].forEach(pl => {
                    const own = pieces.filter(pc => pc.player === pl);
                    const tail = own.slice(-4); // 直近4石分の筆跡
                    if (tail.length < 2) return;
                    ctx.strokeStyle = pl === 1 ? 'rgba(88, 60, 160, 0.55)' : 'rgba(150, 110, 220, 0.65)';
                    ctx.lineCap = 'round';
                    for (let i = 1; i < tail.length; i++) {
                        const a = tail[i - 1].cells[0], b = tail[i].cells[0];
                        ctx.lineWidth = cellSize * (0.16 + i * 0.05);
                        ctx.beginPath();
                        ctx.moveTo(padding + a.x * cellSize, padding + a.y * cellSize);
                        ctx.lineTo(padding + b.x * cellSize, padding + b.y * cellSize);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'筆跡は8近傍で繋げ' `),
        [K.ONE, K.INFO_ALGO, `            絵画碁: 前の自分の石と8近傍以内に筆を繋ぐと+1目。筆跡は盤上に残る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '絵を描くように着手する碁。自分の直前の石と8近傍以内に置くと筆が連なり+1目。',
            '筆跡は直近数手分だけ盤上に残る。離れすぎると筆が途切れる。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('初手はボーナスなし', captures[1] === 0);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('8近傍に繋ぐと+1', captures[1] === 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('遠いと筆が途切れる', captures[1] === 1);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
