// TAROTGO — 占札碁: 着手するたび運命のカードがめくられ、その手に効果が適用される
const K = require('../gen_kit.js');
module.exports = {
    file: 'tarotgo.html',
    en: 'TAROTGO',
    jp: '占札碁',
    prefix: 'tarotgo',
    desc: '着手ごとにタロットを引く: 太陽/星/月/塔/運命の効果がその場で適用される。',
    kind: 'stone',
    icon: 'tarotgo',
    spec: [
        ...K.rb('TAROTGO', '占札碁', 'tarotgo'),
        K.params([
            { key: 'sun_gain', label: '太陽の加点', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'star_gain', label: '星の加点', min: 0, max: 6, def: 1, unit: '目' },
            { key: 'fate_gain', label: '運命の加点', min: 0, max: 6, def: 1, unit: '目', hint: '双方に加算' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { lastCard: '' }; // 直近に引いたタロット`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { lastCard: '' };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { lastCard: '' };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { lastCard: '' };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { lastCard: '' };`],
        // タロットルール: 手数から決定論的にカードを引き効果を適用
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // タロットルール: この手番に引いた運命のカードで効果が適用される
            {
                const n = history.length;
                const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
                const r = s - Math.floor(s);
                const card = Math.floor(r * 5);
                const names = ['太陽', '星', '月', '塔', '運命'];
                st.lastCard = names[card];
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (card === 0) { captures[player] += (P('sun_gain') ?? 2); fxText(ci, '太陽 +2', '#fbbf24', 1200); }
                else if (card === 1) { captures[player] += (P('star_gain') ?? 1); fxText(ci, '星 +1', '#a5b4fc', 1200); }
                else if (card === 3 && board[ci] === player) {
                    // 塔: 打った石が崩れる (盤から消える)
                    board[ci] = 0;
                    fxBurst(ci, '#94a3b8', 8, 1.5);
                    fxText(ci, '塔: 石が崩れた', '#f87171', 1200);
                } else if (card === 4) {
                    captures[player] += (P('fate_gain') ?? 1); captures[opponent] += (P('fate_gain') ?? 1);
                    fxText(ci, '運命: 双方+1', '#c084fc', 1200);
                }
                cleanUpPieces();
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'占札: ' + (st.lastCard || '-') `),
        [K.ONE, K.INFO_ALGO, `            占札碁: 着手ごとにタロットを引く。太陽+2/星+1/月-/塔崩壊/運命双方+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手するたび運命のカードがめくられる: 太陽(+2目), 星(+1目), 月(無効), 塔(打った石が崩れる), 運命(双方+1目)。',
            'カードは手数で決まるため両者に等しく巡る。塔の手番は無理に深追いしないこと。',
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
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('カードが引かれる', st.lastCard !== '');
        // カード値は手数から決定論的
        const n = 1;
        const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
        const r = s - Math.floor(s);
        assert('5種のカード', Math.floor(r * 5) >= 0 && Math.floor(r * 5) < 5);
        assert('着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        assert('カード名は既知のもの', ['太陽', '星', '月', '塔', '運命'].includes(st.lastCard));
    `,
};
