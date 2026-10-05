// HENROGO — 遍路碁: 盤周の8札所を順に巡り、満願(8か所制覇)で即勝ち
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
const ST_INIT = `{ step: { 1: 0, 2: 0 } }`;
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
module.exports = {
    file: 'henrogo.html',
    en: 'HENROGO',
    jp: '遍路碁',
    prefix: 'henrogo',
    desc: '盤周の8札所を順に巡る遍路。8か所制覇 (満願) で即勝ち。',
    kind: 'stone',
    icon: 'henrogo',
    spec: [
        ...K.rb('HENROGO', '遍路碁', 'henrogo'),
        K.params([
            { key: 'win_sites', label: '満願に必要な札所数', min: 2, max: 8, def: 8, unit: 'か所' },
            { key: 'step_bonus', label: '札所1か所の得点', min: 0, max: 5, def: 1, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 札所一覧ヘルパー + winByRule
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `        // 札所: 盤周を時計回りに巡る8か所
        function henroSites() {
            const q = Math.max(2, Math.floor(BOARD_SIZE / 6));
            const m = (BOARD_SIZE - 1) / 2, e = BOARD_SIZE - 1 - q;
            return [
                { x: q, y: q }, { x: m, y: q }, { x: e, y: q }, { x: e, y: m },
                { x: e, y: e }, { x: m, y: e }, { x: q, y: e }, { x: q, y: m },
            ];
        }

        function endGameByScore() {`],
        // 採点に納札点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.step[1] * (P('step_bonus') || 1);
            const whiteTotal = territory.white + captures[2] + komi + st.step[2] * (P('step_bonus') || 1);`],
        // 遍路: 次の札所に打つと1つ進む。8か所で満願勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 遍路: 着手点が自分の次の札所なら1つ進む。8つ目で満願即勝ち
            {
                const sites = henroSites();
                const cell = move.cells[0];
                if (st.step[player] < Math.min(8, P('win_sites') || 8)) {
                    const nxt = sites[st.step[player]];
                    if (cell.x === nxt.x && cell.y === nxt.y) {
                        st.step[player]++;
                        const i = cell.y * BOARD_SIZE + cell.x;
                        fxGlow(i, '#fda4af', 900);
                        fxText(i, '第' + st.step[player] + '番', '#fb7185', 1200);
                        if (st.step[player] >= Math.min(8, P('win_sites') || 8)) {
                            winByRule(player, '満願勝ち', '8札所を全て巡り満願しました');
                            return;
                        }
                    }
                }
            }

            turn = opponent;`],
        // 札所に番号の小さな印を描く
        K.CUE_STARS(`            // 遍路: 札所に小さな番号印 (次の札所は強調)
            {
                const sites = henroSites();
                ctx.save();
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                sites.forEach((pt, k) => {
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    const next = st.step[turn] === k;
                    ctx.strokeStyle = next ? 'rgba(244,63,94,0.9)' : 'rgba(244,63,94,0.4)';
                    ctx.lineWidth = Math.max(1, cellSize * (next ? 0.07 : 0.04));
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(159,18,57,0.85)';
                    ctx.font = 'bold ' + Math.max(8, cellSize * 0.28) + 'px sans-serif';
                    ctx.fillText(String(k + 1), cx, cy);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'札所: 黒' + st.step[1] + '/' + Math.min(8, P('win_sites') || 8) + ' 白' + st.step[2] + '/' + Math.min(8, P('win_sites') || 8)`),
        [K.ONE, K.INFO_BASE, `            遍路碁: 盤周の8札所を1番から順に巡る。8か所制覇で満願即勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の周囲には1〜8番の札所がある。自分の次の番号の札所に石を置くと遍路が1つ進む。',
            '札所は順番通りにしか巡れない。先に8か所を巡った側は「満願」で即勝利。',
            '満願に届かなければ、進んだ札所の数もそのまま得点に加算される。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.step = { 1: 0, 2: 0 };
        const sites = henroSites();
        assert('札所は8か所', sites.length === 8);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: sites[0].x, y: sites[0].y }] }, 1); // 1番札所
        assert('1番札所で前進', st.step[1] === 1);
        executeMove({ cells: [{ x: sites[5].x, y: sites[5].y }] }, 1); // 順不同は駄目
        assert('順番通りでないと進まない', st.step[1] === 1);
        st.step[1] = 7; // あと1か所
        executeMove({ cells: [{ x: sites[7].x, y: sites[7].y }] }, 1);
        assert('8か所で満願即勝ち', gameOver === true && gameResultData.title.includes('満願'));
    `,
};
