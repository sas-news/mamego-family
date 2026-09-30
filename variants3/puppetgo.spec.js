// PUPPETGO — 傀儡碁: 自分の手番では相手色の石を1つ置く (傀儡操作)。自分の色の石は置けない
const K = require('../gen_kit.js');
module.exports = {
    file: 'puppetgo.html',
    en: 'PUPPETGO',
    jp: '傀儡碁',
    prefix: 'puppetgo',
    desc: '自分の手番で相手色の石を置く傀儡操作。置いた石が自分色の連を刈り取る。',
    kind: 'mirror',
    icon: 'puppetgo',
    spec: [
        ...K.rb('PUPPETGO', '傀儡碁', 'puppetgo'),
        // 傀儡: 置くのは相手色の石 — 仮配置も相手色
        [K.ONE, `            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });`,
`            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player === 1 ? 2 : 1; });`],
        // 傀儡: 相手色の石で刈れるのは自分色の連。自殺判定は置いた色 (相手色) に対して
        [K.ONE, `            const captured = getCapturedStones(tempBoard, opponent);

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;`,
`            const captured = getCapturedStones(tempBoard, player); // 傀儡: 刈れるのは自分色の連

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 自殺手チェック: 置いた色 (相手色) の連が窒息するなら禁止
            if (getCapturedStones(after, opponent).length > 0) return false;`],
        // 傀儡: 盤に相手色の石を置く
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player === 1 ? 2 : 1; });`],
        // 傀儡: 取られた自分色の連は相手のアゲハマ
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, player); // 傀儡: 刈り取られるのは自分色の連
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[opponent] += captured.length; // 取った側 (傀儡石の色) のアゲハマ
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 傀儡糸: 直前に操られた石 (lastMove) から伸びる銀色の操り糸
            if (lastMove && lastMove.cells && lastMove.cells.length > 0) {
                const c = lastMove.cells[0];
                const cx = padding + c.x * cellSize, cy = padding + c.y * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(203,213,225,0.8)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.setLineDash([3, 4]);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.4);
                ctx.lineTo(cx, cy - cellSize * 1.1);
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '傀儡操作: 自分の手番で置くのは相手色の石。自分色の石を置くことはできない。',
            '置いた相手色の石は自分色の連を取れる (アゲハマは相手側に入る)。相手に弱い石を置かせよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('黒番は白石を置く', board[I(4, 4)] === 2);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2);
        assert('白番は黒石を置く', board[I(6, 6)] === 1);
        // 黒番が白石を置いて自分色 (黒) の連を刈る
        board[I(8, 8)] = 1;
        board[I(7, 8)] = 2; board[I(9, 8)] = 2; board[I(8, 7)] = 2;
        executeMove({ cells: [{ x: 8, y: 9 }] }, 1);
        assert('傀儡石で黒連が取られる', board[I(8, 8)] === 0);
        assert('アゲハマは相手 (白) 側', captures[2] === 1);
    `,
};
