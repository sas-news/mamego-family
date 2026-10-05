// LEVELGO — 成長碁: 敵を取ると周りの自石がLvUP。終局時にレベルが目に加算。
const K = require('../gen_kit.js');
module.exports = {
    file: 'levelgo.html',
    en: 'LEVELGO',
    jp: '成長碁',
    prefix: 'levelgo',
    desc: '敵を取ると周りの自石がLvUP。終局時にレベルが目に加算。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('LEVELGO', '成長碁', 'levelgo'),
        K.params([
            { key: 'lv_gain', label: '成長量', min: 1, max: 3, def: 1, hint: '取った時に上がるレベル' },
            { key: 'lv_bonus', label: 'レベル加点係数', min: 0, max: 3, def: 1, step: 0.5, hint: '終局時 (Lv-1)×係数が目に加算' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let levelMap = {}; // 石のレベル idx→Lv (取ると隣接自石がLvUP)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            levelMap = {};`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                levelMap: { ...levelMap },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            levelMap = snap.levelMap ? { ...snap.levelMap } : {};`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    levelMap,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            levelMap = (s.levelMap && typeof s.levelMap === 'object') ? { ...s.levelMap } : {};`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                levelMap,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            levelMap = (data.levelMap && typeof data.levelMap === 'object') ? { ...data.levelMap } : {};`],
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => { levelMap[p.y * BOARD_SIZE + p.x] = 1; });`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete levelMap[idx]; });
                captures[player] += captured.length;
                // 成長: 取った石に接していた自分の石がLvUP
                captured.forEach(idx => {
                    getNeighbors(idx).forEach(n => {
                        if (board[n] === player) {
                            levelMap[n] = (levelMap[n] || 1) + (P('lv_gain') || 1);
                            fxGlow(n, 'rgba(245,215,110,0.95)', 700);
                            fxText(n, 'LvUP', '#eab308', 900);
                        }
                    });
                });
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const levelBonus = (p) => { let s = 0; for (const k in levelMap) { if (board[k] === p) s += ((levelMap[k] || 1) - 1) * (P('lv_bonus') || 1); } return s; };
            const blackTotal = territory.black + captures[1] + levelBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + levelBonus(2);`],
        ...K.STONE_MARKS_SPEC(`            // Lv2以上の石にレベル数を描く
            for (const k in levelMap) {
                const idx = +k;
                const v = board[idx];
                if (v !== 1 && v !== 2) continue;
                const lv = levelMap[k];
                if (!lv || lv < 2) continue;
                const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = v === 1 ? '#f5d76e' : '#b8860b';
                ctx.font = 'bold ' + Math.max(9, cellSize * 0.38) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(lv), cx, cy);
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv(['石にはレベルがある (初期Lv1)。敵連を取ると、取った石に接していた自石がLvUPする。','終局時、盤上の石の (Lv-1) の合計がその陣営の目に加算される。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('配置石はLv1', levelMap[0] === 1);
        board.fill(0); levelMap[0] = 1;
        board[I(5,5)] = 2;
        board[I(4,5)] = 1; board[I(6,5)] = 1; board[I(5,4)] = 1;
        levelMap[I(4,5)] = 1; levelMap[I(6,5)] = 1; levelMap[I(5,4)] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1);
        assert('敵を取れた', board[I(5,5)] === 0);
        assert('隣接自石がLv2に成長', levelMap[I(4,5)] === 2);
        
    `,
};
