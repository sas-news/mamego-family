// ARMORGO — 鎧碁: 全ての石は装甲付き。1度目の包囲では装甲が剥がれるだけ。
const K = require('../gen_kit.js');
module.exports = {
    file: 'armorgo.html',
    en: 'ARMORGO',
    jp: '鎧碁',
    prefix: 'armorgo',
    desc: '全ての石は装甲付き。1度目の包囲では装甲が剥がれるだけ。',
    kind: 'stone',
    spec: [
        ...K.rb('ARMORGO', '鎧碁', 'armorgo'),
        K.params([
            { key: 'armor_layers', label: '装甲の枚数', min: 1, max: 3, def: 1, unit: '枚' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0, max: 400, def: 0, unit: '手', hint: '0=制限なし' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let armorMap = {}; // 装甲が残っている石 idx→1 (1度目の包囲では剥がれるだけ)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            armorMap = {};`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                armorMap: { ...armorMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            armorMap = snap.armorMap ? { ...snap.armorMap } : {};`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    armorMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            armorMap = (s.armorMap && typeof s.armorMap === 'object') ? { ...s.armorMap } : {};`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                armorMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            armorMap = (data.armorMap && typeof data.armorMap === 'object') ? { ...data.armorMap } : {};`],
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => { armorMap[p.y * BOARD_SIZE + p.x] = (P('armor_layers') || 1); });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                // 鎧碁: 装甲のある石は剥がれるだけで残る。装甲の無い石だけ取れる
                const removed = [];
                let peeled = 0;
                captured.forEach(idx => {
                    if (armorMap[idx]) {
                        armorMap[idx]--;
                        if (armorMap[idx] <= 0) delete armorMap[idx];
                        peeled++;
                        // 装甲が砕けて剥がれる演出
                        fxBurst(idx, '#93c5fd', 9, 1.3);
                        fxText(idx, '装甲!', '#bfdbfe', 800);
                    }
                    else removed.push(idx);
                });
                removed.forEach(idx => { board[idx] = 0; });
                if (removed.length > 0) {
                    captures[player] += removed.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }
            } else {
                soundManager.playPlace();
            }`],
        ...K.STONE_MARKS_SPEC(`            // 装甲が残る石に銀の外周リング
            for (const k in armorMap) {
                const idx = +k;
                const v = board[idx];
                if (v !== 1 && v !== 2) continue;
                const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.strokeStyle = v === 1 ? 'rgba(170,190,235,0.95)' : 'rgba(110,130,170,0.95)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.33, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv(['全ての石は配置時に装甲 (銀のリング) を持つ。','包囲された連は1度目は装甲が剥がれるだけで盤に残る。剥がれた後にもう一度包囲すると取れる。'])],
        // 打ち切り手数 (0=制限なし): 設定で有効化すると超過時に強制採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 設定で有効化した場合、長期戦は強制採点 (1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && (P('ply_cap') || 0) > 0 && history.length >= (P('ply_cap') || 0)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 白の装甲石
        assert('配置で装甲が付く', !!armorMap[I(5,5)]);
        board[I(4,5)] = 1; board[I(6,5)] = 1; board[I(5,4)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // 包囲完成
        assert('1度目は装甲だけ剥がれ石は残る', board[I(5,5)] === 2);
        assert('装甲が剥がれた', !armorMap[I(5,5)]);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1); // 無関係の手で再包囲判定
        assert('2度目で取れる', board[I(5,5)] === 0 && captures[1] === 1);
        
    `,
};
