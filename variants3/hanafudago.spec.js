// HANAFUDAGO — 花合碁: 盤の12箇所に月の札。札点に置くとその月を獲得。季節3枚そろいで+9
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ claim: {} }`;
const HANA_FN = `        // 花札の月: 盤の12箇所に1月〜12月の札点 (盤サイズから算出)
        function hanaCells() {
            const m = BOARD_SIZE - 1;
            const fr = [0.12, 0.28, 0.44, 0.60, 0.76, 0.90];
            return [
                [fr[0], 0.5], [fr[1], 0.18], [fr[2], 0.82], [fr[3], 0.18], [fr[4], 0.82], [fr[5], 0.5],
                [fr[1], 0.82], [fr[2], 0.18], [fr[3], 0.82], [fr[4], 0.18], [fr[5], 0.82], [fr[0], 0.18],
            ].map(([fx, fy]) => Math.round(fy * m) * BOARD_SIZE + Math.round(fx * m));
        }
`;
module.exports = {
    file: 'hanafudago.html',
    en: 'HANAFUDAGO',
    jp: '花合碁',
    prefix: 'hanafudago',
    desc: '12箇所の月の札点に置くとその札を獲得。札+1点・季節3枚そろいで+9点。',
    kind: 'stone',
    icon: 'hanafudago',
    spec: [
        ...K.rb('HANAFUDAGO', '花合碁', 'hanafudago'),
        ...ST(ST_INIT),
        [K.ONE, '        function updateUI() {', HANA_FN + `
        function updateUI() {`],
        // 札点に置くとその月を獲得 (石が取られても札は残る)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 花合: 札点に置くとその月の札を獲得する
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const mo = hanaCells().indexOf(mi);
                if (mo >= 0 && st.claim[mi] === undefined) {
                    st.claim[mi] = player;
                    fxText(mi, (mo + 1) + '月get!', '#fb7185', 1200);
                }
            }`],
        // 終局時: 札1枚+1点、季節 (3ヶ月連続) そろいで+9点
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const hanaI = hanaCells();
            let hanaB = 0, hanaW = 0;
            for (let m2 = 0; m2 < 12; m2++) {
                const ow = st.claim[hanaI[m2]];
                if (ow === 1) hanaB++; else if (ow === 2) hanaW++;
            }
            for (let s2 = 0; s2 < 4; s2++) {
                const set = [st.claim[hanaI[s2 * 3]], st.claim[hanaI[s2 * 3 + 1]], st.claim[hanaI[s2 * 3 + 2]]];
                if (set[0] !== undefined && set[0] === set[1] && set[1] === set[2]) {
                    if (set[0] === 1) hanaB += 9; else hanaW += 9;
                }
            }
            const blackTotal = territory.black + captures[1] + hanaB;
            const whiteTotal = territory.white + captures[2] + komi + hanaW;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="mt-1 text-xs">花札: 黒+\${hanaB} / 白+\${hanaW}</div>`],
        ...K.STONE_MARKS_SPEC(`            // 札点: 月の札 (白い短冊に月数字)
            {
                ctx.save();
                hanaCells().forEach((i, mo) => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const owned = st.claim[i];
                    ctx.fillStyle = owned === 1 ? 'rgba(28,25,23,0.85)' : (owned === 2 ? 'rgba(251,113,133,0.9)' : 'rgba(255,255,255,0.75)');
                    ctx.strokeStyle = 'rgba(146,64,14,0.8)';
                    ctx.lineWidth = 1;
                    ctx.fillRect(cx - cellSize * 0.18, cy - cellSize * 0.26, cellSize * 0.36, cellSize * 0.52);
                    ctx.strokeRect(cx - cellSize * 0.18, cy - cellSize * 0.26, cellSize * 0.36, cellSize * 0.52);
                    ctx.fillStyle = owned ? '#fef3c7' : '#78350f';
                    ctx.font = \`bold \${Math.max(7, cellSize * 0.18)}px sans-serif\`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(mo + 1), cx, cy);
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            花合碁: 12箇所の月の札点に置くと札を獲得。札+1点・季節3枚そろいで+9点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の12箇所に1月〜12月の「札点」。そこに自分の石を置くとその札を獲得する。',
            '終局時に札1枚+1点、さらに季節 (3ヶ月連続の3枚) を一人で集めると+9点。',
            '一度取った札は石が取られても残る。札を巡る陣取り合戦の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.claim = {};
        const hc = hanaCells();
        assert('札点は12箇所', hc.length === 12);
        // 黒が1〜3月の札点を占有 → 季節そろい
        executeMove({ cells: [{ x: hc[0] % BOARD_SIZE, y: Math.floor(hc[0] / BOARD_SIZE) }] }, 1);
        executeMove({ cells: [{ x: hc[1] % BOARD_SIZE, y: Math.floor(hc[1] / BOARD_SIZE) }] }, 1);
        executeMove({ cells: [{ x: hc[2] % BOARD_SIZE, y: Math.floor(hc[2] / BOARD_SIZE) }] }, 1);
        assert('札を3枚獲得', st.claim[hc[0]] === 1 && st.claim[hc[2]] === 1);
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('季節そろい+9+札3=+12が明記', gameResultData.details.includes('花札: 黒+12'));
    `,
};
