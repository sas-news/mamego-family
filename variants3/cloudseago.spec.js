// CLOUDSEAGO — 雲海碁: 盤中央を雲の帯が漂う。雲に触れる連は
// 霧で呼吸し続け (取られない)、雲は7手ごとに上下へ移る。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

const GETCAP = `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`;

module.exports = {
    file: 'cloudseago.html',
    en: 'CLOUDSEAGO',
    jp: '雲海碁',
    prefix: 'cloudseago',
    desc: '中央を漂う雲の帯。雲に触れる連は霧で呼吸し取られない。雲は7手ごとに移動。',
    kind: 'stone',
    icon: 'cloudseago',
    spec: [
        ...K.rb('CLOUDSEAGO', '雲海碁', 'cloudseago'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 雲海: 7手ごとに中央を漂う雲の帯 (中心±1段)
        const cloudCenter = () => ((BOARD_SIZE / 2) | 0) + [-1, 0, 1][Math.floor(history.length / 7) % 3];
        const inCloud = (i) => Math.abs(((i / BOARD_SIZE) | 0) - cloudCenter()) <= 1;
        function isValidPlacement(cells, player) {`],
        // 雲ルール: 雲に触れる連は霧で呼吸する
        [K.ONE, GETCAP, `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        // 雲に触れる石の連は霧で呼吸する
                        if (inCloud(curr)) hasLiberty = true;
                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        // 雲海の帯の描画
        ...K.STONE_MARKS_SPEC(`            {
                const cc = cloudCenter();
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const d = Math.abs(y - cc);
                    if (d > 1) continue;
                    const a = (d === 0 ? 0.30 : 0.18) + 0.04 * Math.sin(now / 500 + y);
                    ctx.fillStyle = 'rgba(226,232,240,' + a + ')';
                    ctx.fillRect(padding - cellSize / 2, padding + y * cellSize - cellSize / 2, cellSize * (BOARD_SIZE - 1) + cellSize, cellSize);
                    // 雲のふちの揺らぎ
                    ctx.fillStyle = 'rgba(255,255,255,' + (a + 0.10) + ')';
                    for (let x = 0; x < BOARD_SIZE; x += 2) {
                        const wob = Math.sin(now / 700 + x * 1.7 + y) * cellSize * 0.15;
                        ctx.beginPath();
                        ctx.arc(padding + x * cellSize, padding + y * cellSize - cellSize / 2 + wob, cellSize * 0.22, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'雲 ' + (cloudCenter() + 1) + '段目 移動まで' + (7 - history.length % 7) + '手'`),
        [K.ONE, K.INFO_ALGO, `            雲海碁: 中央の雲の帯は7手ごとに上下へ漂う。雲に触れる連は霧で呼吸し取られない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央±1段を「雲の帯」が覆い、7手ごとに1段ずつ上下へ漂う。',
            '雲に触れる連は霧の中で呼吸し続ける — どんなに囲まれても取られない。',
            '雲が去った後の連は脆い。雲の移動を読んで山頂を残すか、雲の下を制するか。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const N = BOARD_SIZE;
        const cc = ((N / 2) | 0); // 雲中心 (floor(history/7)%3=0 → ±0 → 中央)
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 雲帯内の白石を黒で完全包囲しても霧で呼吸する
        const t = cc * N + 6;
        board[t] = 2;
        getNeighbors(t).forEach(n => { board[n] = 1; });
        assert('雲に触れる連は取られない', getCapturedStones(board, 2).length === 0);
        // 雲帯の外の同形は普通に取れる
        board.fill(0);
        board[0] = 2; board[1] = 1; board[N] = 1;
        assert('雲の外は通常どおり', getCapturedStones(board, 2).includes(0));
        // 雲は時間とともに移る
        history.length = 14;
        assert('雲が移動する', cloudCenter() !== cc);
    `,
};
