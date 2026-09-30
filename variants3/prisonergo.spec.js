// PRISONERGO — 逆領碁: 空点の地ではなく、敵石を「監禁」するのが得点。
// 敵の連の全呼吸点が自分の石に監視されていると、その連の石1つにつき+2。
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

const ENDSCORE = `        function endGameByScore() {
            gameOver = true;
            const territory = calculateTerritory();

            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;
            const diff = Math.abs(blackTotal - whiteTotal);

            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';

            gameResultData = {
                title: \`\${winnerTitle} (\${diff} 目差)\`,
                details: \`
                    <div class="flex justify-between"><span>黒の地:</span> <strong>\${territory.black}</strong></div>
                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>
                    <div class="my-1 border-b border-current/10"></div>
                    <div class="flex justify-between"><span>白の地:</span> <strong>\${territory.white}</strong></div>
                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>コミ:</span> <strong>\${komi}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                \`
            };

            soundManager.playWin();
            showResultModal();

            if (gameMode === 'online' && onlineRoomId) {
                syncOnlineState();
            }
            saveState();
        }`;

module.exports = {
    file: 'prisonergo.html',
    en: 'PRISONERGO',
    jp: '逆領碁',
    prefix: 'prisonergo',
    desc: '地は不要。敵の連を全呼吸点で監視して「監禁」すると石1つにつき+2。',
    kind: 'stone',
    icon: 'prisonergo',
    spec: [
        ...K.rb('PRISONERGO', '逆領碁', 'prisonergo'),
        // 逆領採点: 地を数えず、監禁した敵石とアゲハマで勝負
        [K.ONE, ENDSCORE, `        function endGameByScore() {
            gameOver = true;

            // 監禁判定: 敵の連の全呼吸点がこちらの石に隣接している
            const imprisoned = (captor, victim) => {
                let pts = 0;
                const seen = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== victim || seen.has(i)) continue;
                    const grp = getConnectedGroup(i, victim);
                    grp.forEach(g => seen.add(g));
                    const libs = new Set();
                    grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                    if (libs.size === 0) continue;
                    let watched = true;
                    libs.forEach(l => {
                        let ok = false;
                        getNeighbors(l).forEach(n => { if (board[n] === captor) ok = true; });
                        if (!ok) watched = false;
                    });
                    if (watched) pts += grp.length * 2;
                }
                return pts;
            };
            const prisB = imprisoned(1, 2), prisW = imprisoned(2, 1);
            const blackTotal = captures[1] + prisB;
            const whiteTotal = captures[2] + prisW + komi;
            const diff = Math.abs(blackTotal - whiteTotal);

            let winnerTitle = '';
            if (blackTotal > whiteTotal) winnerTitle = '黒の勝ち';
            else if (whiteTotal > blackTotal) winnerTitle = '白の勝ち';
            else winnerTitle = '引き分け';

            gameResultData = {
                title: \`\${winnerTitle} (\${diff} 目差)\`,
                details: \`
                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の監禁:</span> <strong>\${prisB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>
                    <div class="my-1 border-b border-current/10"></div>
                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の監禁:</span> <strong>\${prisW}</strong></div>
                    <div class="flex justify-between"><span>コミ:</span> <strong>\${komi}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                \`
            };

            soundManager.playWin();
            showResultModal();

            if (gameMode === 'online' && onlineRoomId) {
                syncOnlineState();
            }
            saveState();
        }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        // 監禁されている連には錠の印
        ...K.STONE_MARKS_SPEC(`            {
                const watched = (p) => {
                    const seen = new Set();
                    const marks = [];
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== p || seen.has(i)) continue;
                        const grp = getConnectedGroup(i, p);
                        grp.forEach(g => seen.add(g));
                        const libs = new Set();
                        grp.forEach(g => getNeighbors(g).forEach(n => { if (board[n] === 0) libs.add(n); }));
                        if (!libs.size) continue;
                        let ok2 = true;
                        libs.forEach(l => {
                            let ok = false;
                            getNeighbors(l).forEach(n => { if (board[n] === 3 - p) ok = true; });
                            if (!ok) ok2 = false;
                        });
                        if (ok2) marks.push(grp);
                    }
                    return marks;
                };
                ctx.save();
                [1, 2].forEach(p => watched(p).forEach(grp => {
                    grp.forEach(i => {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        // 錠前: 円+縦棒
                        ctx.strokeStyle = 'rgba(250,204,21,0.9)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.06, cellSize * 0.12, Math.PI, 0);
                        ctx.stroke();
                        ctx.fillStyle = 'rgba(250,204,21,0.85)';
                        ctx.fillRect(cx - cellSize * 0.13, cy - cellSize * 0.06, cellSize * 0.26, cellSize * 0.18);
                    });
                }));
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            逆領碁: 空点の地は数えない。敵の連を監禁 (全呼吸点を監視) すると1石+2<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '空点の地は得点にならない。アゲハマと「監禁」だけが得点。',
            '敵の連のすべての呼吸点が自分の石に隣接していると監禁成立: 連の石1つにつき+2。',
            '殺さずに生け捕りにする碁。囲いの外へ1点でも漏れると監禁は崩れる。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 }; komi = 6.5;
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 白石(0,0)を黒(1,0)(0,1)で囲み、唯一の呼吸点はなし… 監禁には呼吸点が必要
        // → (0,0)白 + 呼吸点(1,1) が黒(0,1)(1,0)(2,1)(1,2)に監視される形
        board[0] = 2;
        board[1] = 1; board[BOARD_SIZE] = 1;
        board[BOARD_SIZE + 1] = 1; board[BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 1] = 1;
        // 白(0,0)の呼吸点は… (1,0)=1,(0,1)=1 で塞がれているので死石。生きた監禁形を作る:
        board.fill(0);
        board[BOARD_SIZE + 1] = 2; // 白(1,1)
        board[0 * BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE + 1] = 1; board[BOARD_SIZE + 0] = 1; board[BOARD_SIZE + 3] = 1;
        board[BOARD_SIZE + 2] = 0;
        board[0 * BOARD_SIZE + 2] = 1; board[2 * BOARD_SIZE + 2] = 1; board[BOARD_SIZE + 4] = 1;
        // 白(1,1)の唯一の呼吸点は(2,1)。その隣は(1,1)自石、(3,1)=1,(2,0)=1,(2,2)=1 → 全監視
        endGameByScore();
        assert('監禁ボーナスが乗る', gameResultData.details.includes('黒の監禁:</span> <strong>2</strong>'));
        assert('地は数えない', !gameResultData.details.includes('の地:'));
    `,
};
