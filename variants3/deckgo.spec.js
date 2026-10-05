// DECKGO — 山札碁: 手番ごとに山札から1枚めくり、その配置効果を得る
const K = require('../gen_kit.js');
module.exports = {
    file: 'deckgo.html',
    en: 'DECKGO',
    jp: '山札碁',
    prefix: 'deckgo',
    desc: '手番ごとに山札をめくる: 複製/爆破/交換/援軍のカード効果が石に適用される。',
    kind: 'stone',
    icon: 'deckgo',
    spec: [
        ...K.rb('DECKGO', '山札碁', 'deckgo'),
        K.params([
            { key: 'norm_pct', label: '通常カードの出やすさ', min: 20, max: 90, def: 45, unit: '%' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { lastCard: '' }; // 直近にめくったカード`],
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
        // 山札ルール: 手数から決定論的にカードをめくる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 山札ルール: めくったカードが打った石に効果を与える
            {
                const n = history.length;
                const s = Math.sin(n * 57.3 + 7.9) * 43758.5453;
                const r = s - Math.floor(s);
                const n0 = (P('norm_pct') ?? 45) / 100, u = (r - n0) / Math.max(0.05, 1 - n0);
                const card = r < n0 ? 0 : u < 5 / 11 ? 1 : u < 8 / 11 ? 2 : 3; // 通常/複製/爆破/交換
                const names = ['通常', '複製', '爆破', '交換'];
                st.lastCard = names[card];
                const p0 = move.cells[0];
                const pi = p0.y * BOARD_SIZE + p0.x;
                if (card === 1) {
                    // 複製: 隣接する空点に自分の石を1つ複製する
                    const emp = getNeighbors(pi).filter(q => board[q] === 0);
                    if (emp.length > 0) {
                        board[emp[0]] = player;
                        fxGlow(emp[0], '#4ade80', 700);
                        fxText(emp[0], '複製', '#4ade80', 1100);
                    }
                } else if (card === 2) {
                    // 爆破: 隣接する敵石1つを爆破して取る
                    const foe = getNeighbors(pi).find(q => board[q] === opponent);
                    if (foe !== undefined) {
                        board[foe] = 0;
                        captures[player] += 1;
                        fxBurst(foe, '#f87171', 10, 1.5);
                        fxText(foe, '爆破 +1', '#f87171', 1100);
                        cleanUpPieces();
                    }
                } else if (card === 3) {
                    // 交換: 隣接する敵石1つを自分の石に変える
                    const foe = getNeighbors(pi).find(q => board[q] === opponent);
                    if (foe !== undefined) {
                        board[foe] = player;
                        const pc = pieces.find(x => x.cells.some(c => c.y * BOARD_SIZE + c.x === foe));
                        if (pc) pc.player = player;
                        fxGlow(foe, '#c084fc', 700);
                        fxText(foe, '交換', '#c084fc', 1100);
                    }
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.EVENT_CHIP_SPEC(`'山札: ' + (st.lastCard || '-') `),
        [K.ONE, K.INFO_BASE, `            山札碁: 手番ごとに山札をめくる。複製/爆破/交換/通常の効果が石に適用<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '手番ごとに山札からカードがめくられ、打った石に効果が適用される。',
            '複製: 隣の空点に自分の石を複製。爆破: 隣の敵石を1つ取る。交換: 隣の敵石を自分の石に変える。',
            'カードは手数で決まり両者に等しく巡る。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof executeMove === 'function');
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('カードがめくられる', st.lastCard !== '');
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        assert('カード名は既知のもの', ['通常', '複製', '爆破', '交換'].includes(st.lastCard));
        assert('盤面に石がある', board.filter(v => v !== 0).length >= 1);
    `,
};
