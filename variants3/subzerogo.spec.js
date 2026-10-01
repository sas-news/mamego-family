// SUBZEROGO — 氷点碁: 中央4x4の氷点下区域の石は凍結し、取られることも囲みとしても動かない
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
const ST_INIT = `{ frz: new Set() }`;
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { frz: [...st.frz] },
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? { frz: new Set(snap.st.frz || []) } : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st: { frz: [...st.frz] },
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? { frz: new Set(s.st.frz || []) } : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st: { frz: [...st.frz] },
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? { frz: new Set(data.st.frz || []) } : ${init};`],
];
module.exports = {
    file: 'subzerogo.html',
    en: 'SUBZEROGO',
    jp: '氷点碁',
    prefix: 'subzerogo',
    desc: '中央4x4の氷点下区域の石は凍結し、取られることも囲みとしても動かない。',
    kind: 'stone',
    icon: 'subzerogo',
    spec: [
        ...K.rb('SUBZEROGO', '氷点碁', 'subzerogo'),
        K.params([
            { key: 'zone_size', label: '氷点区域のサイズ', min: 2, max: 8, def: 4, unit: 'マス' },
        ]),
        ...ST(ST_INIT),
        // 氷点区域の判定と凍結処理 (helpers は関数宣言より先に挿入)
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        const frozenZone = (i) => {
            const mid = BOARD_SIZE / 2;
            const z = P('zone_size') || 4;
            const lo = Math.floor(mid) - Math.floor(z / 2);
            return (i % BOARD_SIZE) >= lo && (i % BOARD_SIZE) < lo + z
                && ((i / BOARD_SIZE) | 0) >= lo && ((i / BOARD_SIZE) | 0) < lo + z;
        };
        const refreshFreeze = () => {
            st.frz.clear();
            board.forEach((v, i) => { if (v !== 0 && frozenZone(i)) st.frz.add(i); });
        };
        function isValidPlacement(cells, player) {`],
        // 凍結石は取り判定・窒息判定の対象外 (永遠の呼吸点を持つ)
        [K.ONE, `            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {`,
`            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i] && !st.frz.has(i)) {`],
        // 凍結石は取れない
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            if (captured.length > 0) captured = captured.filter(i => !st.frz.has(i));
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }
            refreshFreeze();`],
        // 凍結石に氷の結晶の印
        ...K.STONE_MARKS_SPEC(`            st.frz.forEach(i => {
                const cx = padding + (i % BOARD_SIZE) * cellSize;
                const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(125,211,252,0.9)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                ctx.beginPath();
                for (let a = 0; a < 6; a++) {
                    const ang = a * Math.PI / 3;
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(ang) * cellSize * 0.3, cy + Math.sin(ang) * cellSize * 0.3);
                }
                ctx.stroke();
                ctx.restore();
            });`),
        // 氷点区域を淡い青で塗る
        K.CUE_GRID(`            {
                const z = P('zone_size') || 4;
                const lo = Math.floor(BOARD_SIZE / 2) - Math.floor(z / 2);
                ctx.save();
                ctx.fillStyle = 'rgba(125,211,252,0.10)';
                ctx.fillRect(padding + lo * cellSize, padding + lo * cellSize, cellSize * z, cellSize * z);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'氷結石 ' + st.frz.size + '個'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            氷点碁: 中央4x4の氷点下区域。区域内の石は凍結し、取られることがない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央4x4の氷点下区域に置かれた石は凍結する。',
            '凍結石は取られることがなく、恒久的な磐石として機能する。',
            '区域を巡る争いでは、先に凍結石を築いた側が砦を得る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.frz = new Set();
        const B = BOARD_SIZE;
        const lo = Math.floor(B / 2) - 2; // 9x9→2, 13x13→4
        const cx = lo + 1, cy = lo + 1; // 氷点区域内の点
        executeMove({ cells: [{ x: cx, y: cy }] }, 1); // 黒が区域内へ → 凍結
        assert('区域内の石は凍結', st.frz.has(cy * B + cx));
        // 周囲を白で囲んでも取れない
        board[(cy - 1) * B + cx] = 2; board[(cy + 1) * B + cx] = 2;
        board[cy * B + cx - 1] = 2; board[cy * B + cx + 1] = 2;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('凍結石は囲まれても取れない', board[cy * B + cx] === 1);
        assert('凍結は維持される', st.frz.has(cy * B + cx));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: B - 1 }], 1) === true);
    `,
};
