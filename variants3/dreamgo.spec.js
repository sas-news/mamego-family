// DREAMGO — 夢幻碁: 10手ごとに現実盤と夢盤が入れ替わる
const K = require('../gen_kit.js');
module.exports = {
    file: 'dreamgo.html',
    en: 'DREAMGO',
    jp: '夢幻碁',
    prefix: 'dreamgo',
    desc: '10手ごとに現実盤と夢盤が入れ替わる。夢で取ったアゲハマは現実に持ち帰る。',
    kind: 'stone',
    icon: 'dreamgo',
    spec: [
        ...K.rb('DREAMGO', '夢幻碁', 'dreamgo'),
        K.params([
            { key: 'swap_interval', label: '入れ替え周期', min: 4, max: 30, def: 10, unit: '手' },
            { key: 'seed_dist', label: '夢の種石の距離', min: 1, max: 5, def: 3, hint: '中心からの距離' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 夢盤と夢の石 (最初から夢の石が1つずつ置かれている)
        let st = (() => {
            const c = Math.floor(BOARD_SIZE / 2), sd = P('seed_dist') || 3;
            const d = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            d[(c - sd) * BOARD_SIZE + (c - sd)] = 1;
            d[(c + sd) * BOARD_SIZE + (c + sd)] = 2;
            return { dream: d, dp: [
                { id: -1, player: 1, cells: [{ x: c - sd, y: c - sd }] },
                { id: -2, player: 2, cells: [{ x: c + sd, y: c + sd }] }
            ] };
        })();`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            {
                const c = Math.floor(BOARD_SIZE / 2), sd = P('seed_dist') || 3;
                const d = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
                d[(c - sd) * BOARD_SIZE + (c - sd)] = 1;
                d[(c + sd) * BOARD_SIZE + (c + sd)] = 2;
                st = { dream: d, dp: [
                    { id: -1, player: 1, cells: [{ x: c - sd, y: c - sd }] },
                    { id: -2, player: 2, cells: [{ x: c + sd, y: c + sd }] }
                ] };
            }`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { dream: [...st.dream], dp: JSON.parse(JSON.stringify(st.dp)) },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.st) {
                st.dream = [...snap.st.dream];
                st.dp = JSON.parse(JSON.stringify(snap.st.dp));
            }`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            if (s.st) {
                st.dream = [...s.st.dream];
                st.dp = JSON.parse(JSON.stringify(s.st.dp));
            }`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            if (data.st) {
                st.dream = [...data.st.dream];
                st.dp = JSON.parse(JSON.stringify(data.st.dp));
            }`],
        // 夢幻ルール: 10手ごとに現実盤と夢盤を丸ごと入れ替える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 夢幻ルール: N手ごとに現実盤と夢盤が入れ替わる (周期は設定で調整)
            if (history.length % Math.max(1, P('swap_interval') || 10) === 0) {
                const tmpB = board; board = st.dream; st.dream = tmpB;
                const tmpP = pieces; pieces = st.dp; st.dp = tmpP;
                fxShake(6, 500);
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '夢と覚醒が入れ替わった', '#a78bfa', 1600);
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 夢盤をモーダルで見せるボタン
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnDream" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-400/50 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm">
                夢盤
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnDream = document.getElementById('btnDream');`],
        [K.ONE, `        function updateUI() {`,
`        // 夢盤ビュー: もう一方の盤を拝見するモーダル
        function showDreamBoard() {
            const r = canvas.getBoundingClientRect();
            const md = document.createElement('div');
            md.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
            md.innerHTML = '<div class="bg-slate-800 border border-violet-400/50 rounded-2xl p-4 max-w-sm w-full">' +
                '<div class="text-violet-300 text-sm mb-2 text-center">夢盤 (' + st.dream.filter(v => v !== 0).length + '石)</div>' +
                '<canvas id="dreamCv" class="w-full rounded-lg"></canvas>' +
                '<button id="dreamClose" class="mt-3 w-full px-3 py-2 bg-violet-600 rounded-lg text-sm">閉じる</button></div>';
            document.body.appendChild(md);
            const cv = md.querySelector('#dreamCv');
            cv.width = cv.height = 400;
            const c2 = cv.getContext('2d');
            const pad = 20, cs = (400 - pad * 2) / (BOARD_SIZE - 1);
            c2.fillStyle = '#1e293b'; c2.fillRect(0, 0, 400, 400);
            c2.strokeStyle = '#475569';
            for (let i = 0; i < BOARD_SIZE; i++) {
                c2.beginPath(); c2.moveTo(pad, pad + i * cs); c2.lineTo(400 - pad, pad + i * cs); c2.stroke();
                c2.beginPath(); c2.moveTo(pad + i * cs, pad); c2.lineTo(pad + i * cs, 400 - pad); c2.stroke();
            }
            st.dream.forEach((v, i) => {
                if (v === 0) return;
                const x = pad + (i % BOARD_SIZE) * cs, y = pad + Math.floor(i / BOARD_SIZE) * cs;
                c2.beginPath(); c2.arc(x, y, cs * 0.42, 0, Math.PI * 2);
                c2.fillStyle = v === 1 ? '#171717' : '#fafaf9'; c2.fill();
                c2.strokeStyle = v === 1 ? '#a78bfa' : '#c084fc'; c2.stroke();
            });
            md.querySelector('#dreamClose').onclick = () => md.remove();
            md.onclick = (ev) => { if (ev.target === md) md.remove(); };
        }

        function updateUI() {`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnDream.addEventListener('click', () => showDreamBoard());`],
        ...K.EVENT_CHIP_SPEC(`'夢盤入替 あと' + ((P('swap_interval') || 10) - history.length % (P('swap_interval') || 10)) + '手'`),
        [K.ONE, K.INFO_BASE, `            夢幻碁: 10手ごとに現実盤と夢盤が入れ替わる。取った石は現実に持ち帰る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '10手ごとに「現実盤」と「夢盤」が丸ごと入れ替わる。',
            '夢盤で取ったアゲハマはそのまま現実のスコアに残る。',
            '「夢盤」ボタンで退避中のもう一方の盤をいつでも確認できる。',
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
        const c = Math.floor(BOARD_SIZE / 2);
        st.dream = Array(BOARD_SIZE * BOARD_SIZE).fill(0); st.dp = [];
        st.dream[(c - 3) * BOARD_SIZE + (c - 3)] = 1;
        st.dream[(c + 3) * BOARD_SIZE + (c + 3)] = 2;
        st.dp = [
            { id: -1, player: 1, cells: [{ x: c - 3, y: c - 3 }] },
            { id: -2, player: 2, cells: [{ x: c + 3, y: c + 3 }] }
        ];
        assert('起動', typeof st.dream !== 'undefined');
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        history.length = 9;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 10手目 → 入替
        assert('入替で夢の種石が現れる', board[(c - 3) * BOARD_SIZE + (c - 3)] === 1);
        assert('夢盤に打った2石が退避', st.dream.filter(v => v !== 0).length === 2);
        history.length = 19;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 20手目 → 逆戻り
        assert('逆戻りで石が帰る', board[3 * BOARD_SIZE + 3] === 1);
        assert('夢盤に種石と打った石が残る', st.dream.filter(v => v !== 0).length === 3);
    `,
};
