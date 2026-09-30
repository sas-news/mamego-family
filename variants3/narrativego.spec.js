// NARRATIVEGO — 物語碁: 12手ごとに「章」が刻まれ、章を多く綴った側に結末ボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'narrativego.html',
    en: 'NARRATIVEGO',
    jp: '物語碁',
    prefix: 'narrativego',
    desc: '12手ごとに章が刻まれる。各章はその間に多く取った側のもの。章×2目が結末で地に加わる。',
    kind: 'stone',
    icon: 'narrativego',
    spec: [
        ...K.rb('NARRATIVEGO', '物語碁', 'narrativego'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { chapters: [], capBase: { 1: 0, 2: 0 } }; // 物語碁: 刻まれた章と起点のアゲハマ`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { chapters: [], capBase: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { chapters: [], capBase: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { chapters: [], capBase: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { chapters: [], capBase: { 1: 0, 2: 0 } };`],
        // 章の区切り: 12手ごとに、その間により多く取った側の章を刻む
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 物語ルール: 12手ごとに章を刻む。期間中により多く取った側の章になる
            if (history.length % 12 === 0) {
                const d1 = captures[1] - st.capBase[1];
                const d2 = captures[2] - st.capBase[2];
                const owner = d1 > d2 ? 1 : d2 > d1 ? 2 : 0;
                const n = st.chapters.length + 1;
                st.chapters.push({ owner, n });
                st.capBase = { 1: captures[1], 2: captures[2] };
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxText(mi, '第' + n + '章: ' + (owner === 1 ? '黒の進撃' : owner === 2 ? '白の逆襲' : '静寂'), '#d97706', 1600);
                fxShake(4, 300);
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 結末: 自ら綴った章×2目が地に加わる
        [K.ONE, `        function endGameByScore() {`, `
        function chapterBonus(player) {
            return st.chapters.filter(c => c.owner === player).length * 2;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + chapterBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + chapterBonus(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の物語:</span> <strong>+\${chapterBonus(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の物語:</span> <strong>+\${chapterBonus(2)}</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'第' + (st.chapters.length + 1) + '章 黒:' + st.chapters.filter(c => c.owner === 1).length + ' 白:' + st.chapters.filter(c => c.owner === 2).length`),
        [K.ONE, K.INFO_ALGO, `            物語碁: 12手ごとに章が刻まれる。章を多く綴った側に結末ボーナス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '12手ごとに盤面に「章」が刻まれる。期間中により多くの石を取った側の章になる。',
            '終局時、自分の章の数×2目が地に加わる。均衡した期間は「静寂」で誰の章にもならない。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.chapters = []; st.capBase = { 1: 0, 2: 0 };
        assert('起動', typeof chapterBonus === 'function');
        captures[1] = 3;
        history.length = 11;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 12手目 → 章が刻まれる
        assert('章が刻まれた', st.chapters.length === 1);
        assert('多く取った黒の章', st.chapters[0].owner === 1);
        assert('章ボーナス2目', chapterBonus(1) === 2);
        // 均衡なら静寂
        st.capBase = { 1: captures[1], 2: captures[2] };
        history.length = 23;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('均衡は静寂', st.chapters[1].owner === 0);
        assert('白の章ボーナスは0', chapterBonus(2) === 0);
    `,
};
