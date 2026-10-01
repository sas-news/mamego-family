// VOLCANGO — 噴火碁: 天元の火山は不変の火口。20手ごとに噴火し縦横どちらか一線の石を全て焼失
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
    file: 'volcango2.html',
    en: 'VOLCANGO',
    jp: '噴火碁',
    prefix: 'volcango2',
    desc: '天元の火山が20手ごとに噴火。溶岩流が一直線上の石を全て焼失する。',
    kind: 'weather',
    icon: 'volcango2',
    spec: [
        ...K.rb('VOLCANGO', '噴火碁', 'volcango2'),
        K.params([
            { key: 'eruption_interval', label: '噴火の間隔', min: 5, max: 60, def: 20, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 1.1 },
        ]),
        ...K.WALL_SPEC,
        // 火口: 天元は永久の壁 (石は置けず呼吸点にもならない)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            // 火口: 天元を永久の壁にする
            {
                const vc = Math.floor(BOARD_SIZE / 2);
                board[vc * BOARD_SIZE + vc] = 3;
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 噴火: 20手ごとに火口から縦/横どちらか一線に溶岩が流れ、経路上の石を全て焼失
            if (history.length % Math.max(1, P('eruption_interval') || 20) === 0) {
                const vc = Math.floor(BOARD_SIZE / 2);
                const horizontal = Math.random() < 0.5;
                const burnt = [];
                for (let k = 0; k < BOARD_SIZE; k++) {
                    const i = horizontal ? vc * BOARD_SIZE + k : k * BOARD_SIZE + vc;
                    if (board[i] === 1 || board[i] === 2) burnt.push(i);
                }
                // 全滅はさせない (盤上に必ず石が残る)
                if (burnt.length < board.filter(v => v === 1 || v === 2).length) {
                    burnt.forEach(i => { board[i] = 0; fxBurst(i, '#ef4444', 9, 1.6); });
                    cleanUpPieces();
                }
                fxShake(7, 420);
                fxText(vc * BOARD_SIZE + vc, '噴火!', '#ef4444', 1300);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 火口の煙と噴火カウント
            {
                const vc = Math.floor(BOARD_SIZE / 2);
                const cx = padding + vc * cellSize, cy = padding + vc * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(239,68,68,' + (0.5 + 0.4 * Math.sin(fxNow() / 300)).toFixed(2) + ')';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'噴火まで ' + (Math.max(1, P('eruption_interval') || 20) - (history.length % Math.max(1, P('eruption_interval') || 20))) + '手'`),
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は火山の火口 (永久の壁)。20手ごとに噴火し、火口から縦か横の一直線に溶岩が流れる。',
            '溶岩の経路上の石は全て焼失 (アゲハマにはならない)。噴火周期は両者共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const c = Math.floor(BOARD_SIZE / 2);
        board[I(c, c)] = 3; // resetGame相当の火口を手動配置
        assert('火口には置けない', isValidPlacement([{ x: c, y: c }], 1) === false);
        board[I(c, 3)] = 1; board[I(3, c)] = 2; // 火口の列と行に石
        board[I(0, 0)] = 1; // 安全地帯
        for (let k = 0; k < 20; k++) {
            executeMove({ cells: [{ x: c - 3, y: k % 9 }] }, k % 2 === 0 ? 1 : 2);
        }
        const burned = (board[I(c, 3)] === 0 && board[I(3, c)] === 2) || (board[I(c, 3)] === 1 && board[I(3, c)] === 0);
        assert('溶岩が片方の線を焼く', burned);
        assert('安全地帯の石は残る', board[I(0, 0)] === 1);
    `,
};
