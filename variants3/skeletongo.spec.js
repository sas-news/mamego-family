// SKELETONGO — 骨格碁: 石は線分 (骨) として2連結で配置され、連の骨格が領地になる
const K = require('../gen_kit.js');
module.exports = {
    file: 'skeletongo.html',
    en: 'SKELETONGO',
    jp: '骨格碁',
    prefix: 'skeletongo',
    desc: '着手は2連結の「骨」ピース (回転ボタンで縦横)。終局時、石2個以上の連ごとに+2目。',
    kind: 'stone',
    icon: 'skeletongo',
    spec: [
        ...K.rb('SKELETONGO', '骨格碁', 'skeletongo'),
        K.params([
            { key: 'skeleton_pts', label: '骨格連1つの得点', min: 0, max: 6, def: 2, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.2, max: 1.0, def: 0.4, step: 0.05, hint: '交点数×倍率' },
        ]),
        // 骨ピース (2連結ドミノ) — 碁石を骨に差し替える
        [K.ONE, K.MOLECULES_ALGO, `        // 骨格碁の骨: 2連結した碁石 (ドミノ)
        const MOLECULES = {
            BONE: { name: '骨', iupac: '', formula: '', atoms: [[0,0],[1,0]] }
        };`],
        [K.ONE, K.OCNT_ALGO, '// 骨は2マス: 回転で縦横の区別あり (2パターン)'],
        [K.ONE, `let currentPieceType = 'ISOBUTANE';`, `let currentPieceType = 'BONE';`],
        [K.ONE, `? s.currentPieceType : 'BUTANE'`, `? s.currentPieceType : 'BONE'`],
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let skeletonDetail = { 1: 0, 2: 0 }; // 直近の終局で計上した骨格ボーナス`],
        // 終局スコアに骨格ボーナスを加算: 2石以上の連ごとに+2目
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 骨格ルール: 2石以上の連 (骨格) ごとに+2目
            skeletonDetail = { 1: 0, 2: 0 };
            {
                const visited = Array(board.length).fill(false);
                for (let i = 0; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && !visited[i]) {
                        const p = board[i];
                        let n = 0;
                        const q = [i]; visited[i] = true;
                        while (q.length) {
                            const c = q.pop(); n++;
                            getNeighbors(c).forEach(nb => {
                                if (board[nb] === p && !visited[nb]) { visited[nb] = true; q.push(nb); }
                            });
                        }
                        if (n >= 2) {
                            if (p === 1) { territory.black += (P('skeleton_pts') ?? 2); skeletonDetail[1]++; }
                            else { territory.white += (P('skeleton_pts') ?? 2); skeletonDetail[2]++; }
                        }
                    }
                }
            }`],
        // スコア内訳に骨格ボーナスを表示
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の骨格連:</span> <strong>\${skeletonDetail[1]}</strong></div>
                    <div class="flex justify-between"><span>白の骨格連:</span> <strong>\${skeletonDetail[2]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        // 骨の節目の描画 (同連内の隣接ペアを節線で繋ぐ)
        ...K.STONE_MARKS_SPEC(`            // 骨格: 同色隣接石を骨の節線で繋ぐ
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(226,232,240,0.5)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.08);
                ctx.lineCap = 'round';
                for (let i = 0; i < board.length; i++) {
                    const p = board[i];
                    if (p !== 1 && p !== 2) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    getNeighbors(i).forEach(n => {
                        if (n <= i || board[n] !== p) return;
                        ctx.beginPath();
                        ctx.moveTo(padding + x * cellSize, padding + y * cellSize);
                        ctx.lineTo(padding + (n % BOARD_SIZE) * cellSize, padding + Math.floor(n / BOARD_SIZE) * cellSize);
                        ctx.stroke();
                    });
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            骨格碁: 骨 (2連結石) を置く。連の骨格が領地に加算<br>
            PC: クリックで配置 / 回転=Rキー・回転ボタン<br>
            スマホ: 1タップ目プレビュー、2タップ目確定 (回転はボタン)`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手は2マス連結した「骨」ピース (ドミノ)。回転ボタンで縦横を切り替える。',
            '終局時、石2個以上からなる連 (骨格) ごとに+2目が加算される。窒息領域は2マス未満。',
        ])],
        // ルール文: 着手は骨1個 (RCM_ALGO を自前で差し替える)
        [K.ONE, K.RCM_ALGO, `        const RULES_COMMON = [
            '黒 (先手) と白が交互に着手。自分の手番では空いている2連結した交点に「骨」(2石1組) を1個置くか、パスを選ぶ。',
            '同じ色で隣接した石は「連」としてつながり、呼吸を共有する。骨の2マスは常に同一の連。',
            '連に隣接する空点は「呼吸点」。呼吸点が0になった連は取られ、相手のアゲハマになる。',
            '自殺手禁止: 着手の結果、自分の連の呼吸点が0になる場所には置けない (相手の連を取れる場合を除く)。',
            'コウ禁止: 相手の直前の着手前と同一の盤面を再現する手は打てない。',
            '窒息領域: 2マス未満の連結した空領域には骨が入らないため、呼吸点にも地にもならない。',
            '双方が連続でパスすると終局。地の数 + アゲハマ数 + 骨格ボーナス (+白はコミ6.5目) で勝敗を決める。',
        ];`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 骨2マス×0.8手で即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.4))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        // STONE_SPEC のうち分子定義系・ルール文 (上で自前差替済) を除く
        ...K.STONE_SPEC.filter(e => ![K.MOLECULES_ALGO, K.OCNT_ALGO, `let currentPieceType = 'ISOBUTANE';`, `? s.currentPieceType : 'BUTANE'`, K.RCM_ALGO].includes(e[1])),
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('骨ピースが定義される', typeof MOLECULES !== 'undefined' && MOLECULES.BONE && MOLECULES.BONE.atoms.length === 2);
        executeMove({ cells: [{ x: 2, y: 2 }, { x: 3, y: 2 }], type: 'BONE', rot: 0 }, 1);
        assert('骨は2マス埋まる', board[I(2, 2)] === 1 && board[I(3, 2)] === 1);
        // 骨格ボーナス: 黒に2石連がある
        endGameByScore();
        assert('骨格ボーナスが計上される', skeletonDetail[1] === 1);
        assert('終局', gameOver === true);
    `,
};
