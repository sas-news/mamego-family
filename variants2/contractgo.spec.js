// CONTRACTGO — 請負碁: 各プレイヤーに秘密の請負目標。先に達成した側が勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'contractgo.html',
    en: 'CONTRACTGO',
    jp: '請負碁',
    prefix: 'contractgo',
    desc: '各陣営にランダムな秘密目標 (角3箇所/星3箇所/四辺制覇)。先に達成で即勝ち。',
    kind: 'contract',
    spec: [
        ...K.rb('CONTRACTGO', '請負碁', 'contractgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        const CONTRACT_TYPES = {
            corners: { name: '四隅請負', desc: '4隅のうち3箇所に自石を置く' },
            stars:   { name: '星請負',   desc: '星点のうち3箇所に自石を置く' },
            edges:   { name: '辺制覇請負', desc: '4辺すべてに自石を置く' },
        };
        let contractOf = { 1: null, 2: null }; // 各プレイヤーの請負目標`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            {
                const keys = Object.keys(CONTRACT_TYPES);
                contractOf = {
                    1: keys[Math.floor(Math.random() * keys.length)],
                    2: keys[Math.floor(Math.random() * keys.length)],
                };
            }`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                contractOf: { ...contractOf }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.contractOf) contractOf = { ...snap.contractOf };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    contractOf,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.contractOf) contractOf = s.contractOf;
            if (!contractOf[1] || !contractOf[2]) {
                const keys = Object.keys(CONTRACT_TYPES);
                contractOf = { 1: keys[0], 2: keys[1] };
            }`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                contractOf,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.contractOf) contractOf = data.contractOf;`],
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 請負目標の達成判定
        function contractMet(player) {
            const t = contractOf[player];
            const isP = (x, y) => board[y * BOARD_SIZE + x] === player;
            const m = BOARD_SIZE - 1;
            if (t === 'corners') {
                return [[0,0],[m,0],[0,m],[m,m]].filter(([x,y]) => isP(x,y)).length >= 3;
            }
            if (t === 'stars') {
                return getStarPoints(BOARD_SIZE).filter(pt => isP(pt.x, pt.y)).length >= 3;
            }
            if (t === 'edges') {
                let top = false, bot = false, left = false, right = false;
                for (let i = 0; i < BOARD_SIZE; i++) {
                    if (board[i] === player) top = true;
                    if (board[m * BOARD_SIZE + i] === player) bot = true;
                    if (board[i * BOARD_SIZE] === player) left = true;
                    if (board[i * BOARD_SIZE + m] === player) right = true;
                }
                return top && bot && left && right;
            }
            return false;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 請負ルール: 着手した側の秘密目標が達成されていれば即勝ち
            if (contractOf[player] && contractMet(player)) {
                const ci = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxGlow(ci, 'rgba(168,85,247,0.95)', 900);
                fxShake(5, 320);
                fxText(ci, '請負達成!', '#c084fc', 1200);
                winByRule(player, '請負達成勝ち', '請負目標「' + CONTRACT_TYPES[contractOf[player]].name + '」を達成しました'); return;
            }

            turn = opponent;`],
        // 自分の請負内容をヘッダチップに表示 (ローカルでは両者見える)
        ...K.EVENT_CHIP_SPEC(`'請負 黒:' + (contractOf[1] ? CONTRACT_TYPES[contractOf[1]].name : '?') + ' 白:' + (contractOf[2] ? CONTRACT_TYPES[contractOf[2]].name : '?')`),
        // 請負目標の座標を盤上に破線表示 (手番側の目標のみ)
        ...K.CUE_STARS(`            // 請負: 手番側の請負目標セルを破線で示す
            {
                const t = contractOf[turn];
                if (t && !gameOver) {
                    const m = BOARD_SIZE - 1;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(168,85,247,0.8)';
                    ctx.setLineDash([cellSize * 0.14, cellSize * 0.10]);
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    const ring = (x, y) => {
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize, cellSize * 0.42, 0, Math.PI * 2);
                        ctx.stroke();
                    };
                    if (t === 'corners') [[0,0],[m,0],[0,m],[m,m]].forEach(([x,y]) => ring(x,y));
                    else if (t === 'stars') getStarPoints(BOARD_SIZE).forEach(pt => ring(pt.x, pt.y));
                    else {
                        // 辺制覇: 四辺を一周する破線
                        const o = cellSize * 0.45;
                        ctx.strokeRect(padding - o, padding - o,
                            (BOARD_SIZE - 1) * cellSize + o * 2, (BOARD_SIZE - 1) * cellSize + o * 2);
                    }
                    ctx.restore();
                }
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーにランダムな請負目標が割り当てられる: 「四隅3箇所」「星3箇所」「四辺制覇」のいずれか。',
            '自分の目標を先に達成した側が即勝ち (チップに目標を表示)。達成できなければ通常の地取り勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        contractOf[1] = 'corners';
        const m = BOARD_SIZE - 1;
        board[0] = 1; board[m] = 1;
        executeMove({ cells: [{ x: 0, y: m }] }, 1);
        assert('角3箇所で請負達成', gameOver === true && gameResultData.title.includes('請負'));
        // 別契約の判定確認
        board.fill(0); gameOver = false;
        contractOf[2] = 'stars';
        const sp = getStarPoints(BOARD_SIZE);
        board[sp[0].y * BOARD_SIZE + sp[0].x] = 2;
        board[sp[1].y * BOARD_SIZE + sp[1].x] = 2;
        assert('星2箇所では未達', contractMet(2) === false);
        board[sp[2].y * BOARD_SIZE + sp[2].x] = 2;
        assert('星3箇所で達成', contractMet(2) === true);
    `,
};
