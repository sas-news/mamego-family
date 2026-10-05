// STONEKICKGO — 石蹴碁: 置くと隣の味方石を蹴り飛ばす。盤端まで運ぶと+1点
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
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
const ST_INIT = `{ pts: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'stonekickgo.html',
    en: 'STONEKICKGO',
    jp: '石蹴碁',
    prefix: 'stonekickgo',
    desc: '置くと隣の味方石を蹴り飛ばす。盤端まで運ぶごとに+1点。',
    kind: 'stone',
    icon: 'stonekickgo',
    spec: [
        ...K.rb('STONEKICKGO', '石蹴碁', 'stonekickgo'),
        K.params([
            { key: 'kick_len', label: '石を蹴る距離', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'goal_pts', label: '盤端ゴールの得点', min: 0, max: 5, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        // 石蹴り: 隣の味方石を1マス蹴り飛ばす (盤端に着いたら+1)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 石蹴り: 隣接する味方石を着手石と反対方向へ1マス蹴る
            {
                const bc = move.cells[0];
                const kicks = [];
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const fx2 = bc.x + dx, fy = bc.y + dy;
                    const tx = bc.x + dx * (1 + (P('kick_len') || 1)), ty = bc.y + dy * (1 + (P('kick_len') || 1));
                    if (fx2 < 0 || fy < 0 || fx2 >= BOARD_SIZE || fy >= BOARD_SIZE) continue;
                    const fi = fy * BOARD_SIZE + fx2;
                    if (board[fi] !== player) continue;
                    if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) continue;
                    const ti = ty * BOARD_SIZE + tx;
                    if (board[ti] !== 0) continue;
                    kicks.push([fi, ti]);
                }
                kicks.forEach(([fi, ti]) => {
                    board[ti] = board[fi];
                    board[fi] = 0;
                    fxSlide(fi, ti, 360);
                    // 盤端まで運べたら得点
                    const tx = ti % BOARD_SIZE, ty = Math.floor(ti / BOARD_SIZE);
                    if (tx === 0 || ty === 0 || tx === BOARD_SIZE - 1 || ty === BOARD_SIZE - 1) {
                        st.pts[player] += (P('goal_pts') ?? 1);
                        fxText(ti, 'ゴール!', '#22c55e', 1000);
                    }
                });
                if (kicks.length > 0) {
                    cleanUpPieces();
                    // 蹴られた石が窒息しないか再確認 (双方)
                    [1, 2].forEach(pl => {
                        const dead = getCapturedStones(board, pl);
                        if (dead.length > 0) {
                            dead.forEach(i => board[i] = 0);
                            captures[pl === 1 ? 2 : 1] += dead.length;
                            cleanUpPieces();
                        }
                    });
                }
            }

            turn = opponent;`],
        // 得点を採点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.pts[1];
            const whiteTotal = territory.white + captures[2] + komi + st.pts[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒のゴール:</span> <strong>+\${st.pts[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白のゴール:</span> <strong>+\${st.pts[2]}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'ゴール 黒' + st.pts[1] + ' 白' + st.pts[2]`),
        [K.ONE, K.INFO_BASE, `            石蹴碁: 置くと隣の味方石を蹴り飛ばす。盤端まで運ぶごとに+1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を置くと、直交する味方石が着手石と反対方向へ1マス蹴り飛ばされる。',
            '蹴られた石が盤の縁に着くとゴール+1点。連続して蹴って運ぶ戦法がある。',
            '蹴りで窒息した石は取られる。蹴りの効果は両者対称。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pts = { 1: 0, 2: 0 };
        // 味方石を蹴る: 黒(4,4)の下に黒を置くと(4,4)が上へ蹴られる
        board[I(4, 4)] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('味方石が蹴られる', board[I(4, 3)] === 1 && board[I(4, 4)] === 0);
        // 端まで運ぶと得点
        board[I(6, 1)] = 1;
        executeMove({ cells: [{ x: 6, y: 2 }] }, 1);
        assert('盤端ゴールで+1', board[I(6, 0)] === 1 && st.pts[1] === 1);
        assert('敵石は蹴られない', (() => { board[I(8, 4)] = 2; executeMove({ cells: [{ x: 8, y: 5 }] }, 1); return board[I(8, 4)] === 2; })());
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 5 }], 2) === true);
    `,
};
