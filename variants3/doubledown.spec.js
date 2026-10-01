// DOUBLEDOWN — 倍返碁: 各プレイヤー1回だけ「倍返し」— 初めてアゲハマを取った時、そのアゲハマが2倍になる
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

module.exports = {
    file: 'doubledown.html',
    en: 'DOUBLEDOWN',
    jp: '倍返碁',
    prefix: 'doubledown',
    desc: '各プレイヤーの最初の捕獲は「倍返し」となりアゲハマ2倍。',
    kind: 'rush',
    icon: 'doubledown',
    spec: [
        ...K.rb('DOUBLEDOWN', '倍返碁', 'doubledown'),
        K.params([
            { key: 'dd_mult', label: '倍返しの倍率', min: 1, max: 5, def: 2, unit: '倍' },
            { key: 'cap_pct', label: '打ち切り手数', min: 80, max: 150, def: 110, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...PERSIST('{ firstCap: { 1: false, 2: false } }'),
        // 倍返し: 各プレイヤー最初の捕獲のアゲハマを2倍にする (宣言不要・両者同条件)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                let got = captured.length;
                if (!st.firstCap[player]) {
                    st.firstCap[player] = true;
                    got *= (P('dd_mult') || 2);
                    fxText(captured[0], '倍返し!', '#fbbf24', 1200);
                    fxShake(5, 300);
                    captured.forEach(ci => fxBurst(ci, '#fbbf24', 6, 1.3));
                }
                captures[player] += got;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 110) / 100))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 倍返し待ち: 未使用プレイヤーの石に金色の爪マーク
            for (let i = 0; i < board.length; i++) {
                const v = board[i];
                if ((v !== 1 && v !== 2) || st.firstCap[v]) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(251,191,36,0.8)';
                ctx.beginPath();
                ctx.arc(cx + cellSize * 0.22, cy - cellSize * 0.22, cellSize * 0.07, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'倍返し ' + ((st.firstCap[1] ? '黒済' : '黒未') + '/' + (st.firstCap[2] ? '白済' : '白未'))`),
        [K.ONE, K.RV_ALGO, K.rv([
            '倍返し: 各プレイヤーがこの局で最初に石を取った時、そのアゲハマが2倍になる。',
            '発動は自動・両者同条件。最初の捕獲を誰がどの規模で取るかが勝負の分かれ目。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.firstCap = { 1: false, 2: false };
        board[I(1, 1)] = 2; board[I(0, 1)] = 1; board[I(1, 0)] = 1; board[I(1, 2)] = 1;
        executeMove({ cells: [{ x: 2, y: 1 }] }, 1);
        assert('白石が取られる', board[I(1, 1)] === 0);
        assert('倍返しでアゲハマ2', captures[1] === 2);
        // 白の最初の捕獲も倍返し
        board[I(4, 4)] = 1; board[I(3, 4)] = 2; board[I(5, 4)] = 2; board[I(4, 3)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2);
        assert('白の倍返しでアゲハマ2', captures[2] === 2);
        // 2度目は通常
        board[I(7, 7)] = 2; board[I(6, 7)] = 1; board[I(8, 7)] = 1; board[I(7, 6)] = 1;
        executeMove({ cells: [{ x: 7, y: 8 }] }, 1);
        assert('2度目は通常のアゲハマ', captures[1] === 3);
    `,
};
