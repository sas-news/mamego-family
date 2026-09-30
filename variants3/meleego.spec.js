// MEELEGO — 組討碁: 組討ち(接触)した連同士が削り合い、接触石同士が1個ずつ脱落する
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'meleego.html',
    en: 'MEELEGO',
    jp: '組討碁',
    prefix: 'meleego',
    desc: '敵連に接触して置くと組討ち。接触する両連の石が1個ずつ削り合って脱落する。',
    kind: 'stone',
    icon: 'meleego',
    spec: [
        ...K.rb('MEELEGO', '組討碁', 'meleego'),
        // 組討ルール: 着手した連に接触する敵連ごとに、互いの接触石が1個ずつ脱落
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 組討: 着手した連に接触する敵連と削り合い — 互いの接触石が1個ずつ脱落
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (board[mi] === player) {
                    const myGroup = getConnectedGroup(mi, player);
                    // 接触する敵連を列挙 (重複なし)
                    const seenE = {};
                    const foeGroups = [];
                    myGroup.forEach(i => {
                        getNeighbors(i).forEach(n => {
                            if (board[n] === opponent && !seenE[n]) {
                                const g = getConnectedGroup(n, opponent);
                                const key = Math.min.apply(null, g);
                                if (!seenE['g' + key]) { seenE['g' + key] = true; foeGroups.push(g); }
                                g.forEach(j => { seenE[j] = true; });
                            }
                        });
                    });
                    foeGroups.forEach(g => {
                        // 敵連の脱落: 自連に最も近い接触石 (最小index)
                        const eContact = g.filter(i => getNeighbors(i).some(n => board[n] === player));
                        const eIdx = Math.min.apply(null, eContact);
                        board[eIdx] = 0;
                        captures[player]++;
                        fxBurst(eIdx, '#ef4444', 10, 1.6);
                        // 自連の脱落: その敵連に接触する自石 (最小index)
                        const mg = getConnectedGroup(mi, player);
                        const mContact = mg.filter(i => getNeighbors(i).some(n => n === eIdx || board[n] === opponent));
                        if (mContact.length) {
                            const mIdx = Math.min.apply(null, mContact);
                            board[mIdx] = 0;
                            captures[opponent]++;
                            fxBurst(mIdx, '#60a5fa', 10, 1.6);
                        }
                    });
                    if (foeGroups.length) {
                        fxText(mi, '組討ち!', '#f87171', 1200);
                        fxShake(5, 320);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'接触した連は削り合う'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            組討碁: 敵連に接触して置くと組討ち — 接触する両連の石が1個ずつ脱落する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した連に敵連が接触していると組討ちが始まる: 接触している敵連ごとに、互いの接触石が1個ずつ脱落する。',
            '敵石を1つ崩せるが自連も1つ削られる — 完全な対称。大きな連に組み付くか、散らすかの駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        board[4 * BOARD_SIZE + 5] = 2; // 敵石
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 敵に接触して着手 → 組討ち
        assert('敵の接触石が脱落', board[4 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        assert('自連の接触石も脱落', board[4 * BOARD_SIZE + 4] === 0 && captures[2] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 接触なし → 普通の着手
        assert('非接触なら削り合わない', board[0] === 1 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 2, y: 2 }], 2) === true);
    `,
};
