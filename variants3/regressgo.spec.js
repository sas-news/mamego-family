// REGRESSGO — 後退碁: 30手ごとにルールが一段階ずつ崩壊していく。
// 段階1: コウ解禁 / 段階2: 自殺手解禁 / 段階3: アゲハマ2倍 / 段階4: 盤の崩壊=終局。
const K = require('../gen_kit.js');

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const VALID = `        function isValidPlacement(cells, player) {
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 仮配置
            const tempBoard = [...board];
            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });

            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 自殺手チェック: この手で自分の石(連)が窒息するなら禁止
            if (getCapturedStones(after, player).length > 0) return false;

            // コウ判定: 相手の直前の着手前と同一の盤面になる手は禁止
            if (captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;
        }`;

module.exports = {
    file: 'regressgo.html',
    en: 'REGRESSGO',
    jp: '後退碁',
    prefix: 'regressgo',
    desc: '30手ごとにルールが崩壊: コウ解禁→自殺手解禁→アゲハマ倍→崩壊終局。',
    kind: 'stone',
    icon: 'regressgo',
    spec: [
        ...K.rb('REGRESSGO', '後退碁', 'regressgo'),
        K.params([
            { key: 'stage_period', label: '崩壊段階の間隔', min: 10, max: 90, def: 30, unit: '手' },
            { key: 'cap_mult', label: '崩壊時のアゲハマ倍率', min: 1, max: 4, def: 2, unit: '倍' },
        ]),
        // 後退ルール: 段階に応じて自殺手・コウの禁止が外れる
        [K.ONE, VALID, `        function isValidPlacement(cells, player) {
            const stage = Math.floor(history.length / Math.max(1, P('stage_period') || 30));
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 仮配置
            const tempBoard = [...board];
            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });

            const opponent = player === 1 ? 2 : 1;
            const captured = getCapturedStones(tempBoard, opponent);

            // 相手石の捕獲を先に解決した後の盤面
            const after = [...tempBoard];
            captured.forEach(i => after[i] = 0);

            // 崩壊段階2以降: 自殺手も合法になる
            if (stage < 2 && getCapturedStones(after, player).length > 0) return false;

            // 崩壊段階1以降: コウの禁止は失われる
            if (stage < 1 && captured.length > 0 && prevBoard) {
                if (after.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;
        }`],
        // 崩壊段階3以降: アゲハマが2倍になる
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                const mult = Math.floor(history.length / Math.max(1, P('stage_period') || 30)) >= 3 ? Math.max(1, P('cap_mult') || 2) : 1;
                captures[player] += captured.length * mult;
                if (mult > 1) fxText(captured[0], '崩壊x' + mult, '#ef4444', 1100);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 崩壊段階4: 盤の崩壊で強制終局
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 崩壊段階4: 盤そのものが崩壊して強制終局
            if (Math.floor(history.length / Math.max(1, P('stage_period') || 30)) >= 4) {
                fxShake(10, 700);
                endGameByScore();
                return;
            }
            // 段階が上がった瞬間の報せ
            {
                const stage = Math.floor(history.length / Math.max(1, P('stage_period') || 30));
                if (stage > 0 && history.length % Math.max(1, P('stage_period') || 30) === 0) {
                    const names = ['', 'コウの戒律が崩れた', '自殺手の禁忌が崩れた', 'アゲハマの価値が倍増した', ''];
                    if (names[stage]) {
                        fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, names[stage], '#ef4444', 1600);
                        fxShake(6, 400);
                    }
                }
            }
            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { const per = Math.max(1, P('stage_period') || 30); const s = Math.floor(history.length / per); const left = per - history.length % per; const nm = ['通常','コウ解禁','自殺手解禁','アゲハマx2','崩壊']; return s >= 4 ? '崩壊' : '段階' + s + ' ' + nm[s] + ' 崩壊まで' + left + '手'; })()`),
        // 盤の段階に応じた危険色の縁
        ...K.STONE_MARKS_SPEC(`            {
                const stage = Math.floor(history.length / Math.max(1, P('stage_period') || 30));
                if (stage > 0) {
                    const now = fxNow();
                    const a = 0.10 + stage * 0.05 + 0.05 * Math.sin(now / 300);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(239,68,68,' + Math.min(0.6, a) + ')';
                    ctx.lineWidth = Math.max(2, cellSize * (0.05 + stage * 0.03));
                    ctx.strokeRect(padding - cellSize / 2, padding - cellSize / 2, cellSize * (BOARD_SIZE - 1) + cellSize, cellSize * (BOARD_SIZE - 1) + cellSize);
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_ALGO, `            後退碁: 30手ごとにルールが崩壊していく。崩壊の第4段階で盤が崩れ強制終局<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '30手ごとに碁の戒律が一段階ずつ崩れる: 1段階=コウ解禁、2段階=自殺手解禁、3段階=アゲハマ2倍。',
            '4段階目 (120手) で盤は完全に崩壊し、強制採点終局となる。',
            '早く決着をつけるか、崩壊後の無法地帯で稼ぐか — 時間との戦い。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        captures = { 1: 0, 2: 0 };
        // (0,0)は白(1,0)(0,1)に囲まれた自殺点
        board[1] = 2; board[BOARD_SIZE] = 2;
        assert('段階0: 自殺手は禁手', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        history.length = 60; // 段階2
        assert('段階2: 自殺手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        history.length = 90; // 段階3: アゲハマ倍
        board.fill(0); pieces = [];
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('段階3: アゲハマ2倍', captures[1] === 2);
        history.length = 119;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 120手目で崩壊
        assert('段階4: 崩壊で強制終局', gameOver === true);
    `,
};
