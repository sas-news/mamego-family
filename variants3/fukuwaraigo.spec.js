// FUKUWARAIGO — 福笑碁: 盤に描かれた顔のパーツ位置に近い着手で完成度を稼ぐ。ピタリなら+2目
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
const ST_INIT = `{ claimed: {} }`;
module.exports = {
    file: 'fukuwaraigo.html',
    en: 'FUKUWARAIGO',
    jp: '福笑碁',
    prefix: 'fukuwaraigo',
    desc: '盤の顔パーツ (目・鼻・口) に近い場所へ置くと得点。ピタリ賞は+2目。',
    kind: 'stone',
    icon: 'fukuwaraigo',
    spec: [
        ...K.rb('FUKUWARAIGO', '福笑碁', 'fukuwaraigo'),
        K.params([
            { key: 'exact_pts', label: 'ピタリの得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'near_pts', label: '近いの得点', min: 1, max: 4, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        const FACE_PTS = () => {
    const c = Math.floor(BOARD_SIZE / 2);
    return [[c - 2, c - 2], [c + 2, c - 2], [c, c], [c - 1, c + 2], [c + 1, c + 2]];
};

        function executeMove(move, player) {`],

        // 福笑い: 顔パーツの的に近い着手で得点 (ピタリ+2、隣+1、各的1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 福笑碁: 顔パーツの位置に近い着手で完成度を稼ぐ
            {
                const bc = move.cells[0];
                FACE_PTS().forEach(([fx, fy]) => {
                    const fi = fy * BOARD_SIZE + fx;
                    if (st.claimed[fi]) return;
                    const d = Math.abs(bc.x - fx) + Math.abs(bc.y - fy);
                    if (d === 0) {
                        st.claimed[fi] = player;
                        captures[player] += (P('exact_pts') || 2);
                        fxGlow(fi, '#f472b6', 900);
                        fxText(fi, 'ピタリ +' + (P('exact_pts') || 2), '#f472b6', 1300);
                    } else if (d === 1) {
                        st.claimed[fi] = player;
                        captures[player] += (P('near_pts') || 1);
                        fxText(fi, '近い! +' + (P('near_pts') || 1), '#f9a8d4', 1100);
                    }
                });
            }

            turn = opponent;`],
        // 顔のガイド: 輪郭とパーツ位置を薄く描く
        K.CUE_STARS(`            // 福笑いの顔ガイド
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize, cy = padding + c * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(120,80,60,0.30)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.ellipse(cx, cy, cellSize * 3.1, cellSize * 3.6, 0, 0, Math.PI * 2);
                ctx.stroke();
                FACE_PTS().forEach(([fx, fy], i) => {
                    const px = padding + fx * cellSize, py = padding + fy * cellSize;
                    const owner = st.claimed[fy * BOARD_SIZE + fx];
                    ctx.strokeStyle = owner === 1 ? 'rgba(30,30,30,0.8)' : owner === 2 ? 'rgba(240,200,120,0.9)' : 'rgba(190,90,110,0.55)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    if (i < 2) { ctx.arc(px, py, cellSize * 0.30, 0, Math.PI * 2); } // 目
                    else if (i === 2) { ctx.moveTo(px, py - cellSize * 0.22); ctx.lineTo(px, py + cellSize * 0.22); } // 鼻
                    else { ctx.arc(px, py - cellSize * 0.1, cellSize * 0.28, Math.PI * 0.15, Math.PI * 0.85); } // 口
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            福笑碁: 盤の顔パーツ位置に近い着手で完成度を稼ぐ。ピタリ+2目、隣+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤には福笑いの顔ガイド。目2・鼻1・口2の計5ヶ所のパーツ位置がある。',
            'パーツの真上に置くと+2目、隣接で+1目。各パーツは最初に近付いた側が取る。',
            '目隠しなしでパーツを奪い合う福笑い。地取りと併せて完成度を競う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.claimed = {};
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c - 2, y: c - 2 }] }, 1); // 左目ピタリ
        assert('ピタリで+2目', captures[1] === 2);
        assert('パーツは埋まる', st.claimed[(c - 2) * BOARD_SIZE + (c - 2)] === 1);
        executeMove({ cells: [{ x: c + 1, y: c }] }, 2); // 鼻の隣
        assert('隣で+1目', captures[2] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('関係ない着手は得点なし', captures[1] === 2);
    `,
};
