// CLASSGO — 職業碁: 石に職業: 戦士(普通)/弓兵(3マス射抜き)/僧侶(不死)。Rキーで切替。
const K = require('../gen_kit.js');
module.exports = {
    file: 'classgo.html',
    en: 'CLASSGO',
    jp: '職業碁',
    prefix: 'classgo',
    desc: '石に職業: 戦士(普通)/弓兵(3マス射抜き)/僧侶(不死)。Rキーで切替。',
    kind: 'stone',
    spec: [
        ...K.rb('CLASSGO', '職業碁', 'classgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let classMap = {}; // 各石の兵種 idx→'W'|'A'|'M'
        let currentClass = 0; // 現在選択中の兵種 (CLASS_KEYSのindex)
        const CLASS_KEYS = ['W', 'A', 'M'];
        const CLASS_NAMES = { W: '戦士', A: '弓兵', M: '僧侶' };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            classMap = {};
            currentClass = 0;`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                classMap: { ...classMap },
                currentClass,
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            classMap = snap.classMap ? { ...snap.classMap } : {};
            currentClass = Number.isInteger(snap.currentClass) ? snap.currentClass : 0;`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    classMap,
                    currentClass,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            classMap = (s.classMap && typeof s.classMap === 'object') ? { ...s.classMap } : {};
            currentClass = Number.isInteger(s.currentClass) ? s.currentClass : 0;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                classMap,
                currentClass,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            classMap = (data.classMap && typeof data.classMap === 'object') ? { ...data.classMap } : {};
            currentClass = Number.isInteger(data.currentClass) ? data.currentClass : 0;`],
        [K.ONE, `            currentRot = (currentRot + 1) % list.length;`,
`            currentClass = (currentClass + 1) % CLASS_KEYS.length; // 兵種切替`],
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            move.cells.forEach(p => { classMap[p.y * BOARD_SIZE + p.x] = CLASS_KEYS[currentClass]; });`],
        [K.ONE, K.CAPTURE_BLOCK, `            // 僧侶('M')は包囲されても取れない
            const captured = getCapturedStones(board, opponent).filter(idx => classMap[idx] !== 'M');
            if (captured.length > 0) {
                captured.forEach(idx => { board[idx] = 0; delete classMap[idx]; });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }

            // 弓兵('A'): 4方向3マス以内の最初の敵石を射抜く
            {
                const p0 = move.cells[0];
                if (classMap[p0.y * BOARD_SIZE + p0.x] === 'A') {
                    let shot = 0;
                    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
                        for (let d = 1; d <= 3; d++) {
                            const nx = p0.x + dx * d, ny = p0.y + dy * d;
                            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) break;
                            const v = board[ny * BOARD_SIZE + nx];
                            if (v === 0) continue;
                            if (v === opponent) { board[ny * BOARD_SIZE + nx] = 0; delete classMap[ny * BOARD_SIZE + nx]; shot++; }
                            break;
                        }
                    });
                    if (shot > 0) { captures[player] += shot; cleanUpPieces(); }
                }
            }`],
        ...K.EVENT_CHIP_SPEC("'兵種 ' + CLASS_NAMES[CLASS_KEYS[currentClass]]"),
        ...K.STONE_MARKS_SPEC(`            // 兵種の文字印 (戦/弓/僧)
            {
                const marks = { W: '戦', A: '弓', M: '僧' };
                for (const k in classMap) {
                    const idx = +k;
                    const v = board[idx];
                    if (v !== 1 && v !== 2) continue;
                    const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.save();
                    ctx.fillStyle = v === 1 ? '#ffffff' : '#333333';
                    ctx.font = 'bold ' + Math.max(8, cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(marks[classMap[k]] || '', cx, cy);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.RV_ALGO, K.rv(['石には兵種がある: 戦士=通常の石 / 弓兵=配置時に4方向3マス以内の敵を射抜く / 僧侶=包囲されても取られない。','Rキー・右クリック・ホイールで置く兵種を切替 (ヘッダのチップに表示)。'])],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        currentClass = 1; // 弓兵
        board[2 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        assert('弓兵が敵を射抜く', board[2 * BOARD_SIZE + 5] === 0);
        board.fill(0);
        currentClass = 2; // 僧侶
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        board[4 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 4] = 1;
        executeMove({ cells: [{ x: 5, y: 6 }] }, 1); // 4方を包囲完成
        assert('僧侶は包囲でも取れない', board[5 * BOARD_SIZE + 5] === 2);
        currentClass = 0; // 戦士
        board.fill(0);
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('戦士はclassMap W', classMap[1 * BOARD_SIZE + 1] === 'W');
        
    `,
};
