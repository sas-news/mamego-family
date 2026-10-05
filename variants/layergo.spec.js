// LAYERGO — 層積碁: 盤は上下3層。どの層にも着手可、同座標の縦貫は近傍扱い
const K = require('../gen_kit.js');
module.exports = {
    file: 'layergo.html',
    en: 'LAYERGO',
    jp: '層積碁',
    prefix: 'layergo',
    desc: '盤は上下3層。層ボタンで層を選んで着手。同座標の縦貫は近傍扱い。',
    kind: 'stone',
    icon: 'layergo',
    spec: [
        ...K.rb('LAYERGO', '層積碁', 'layergo'),
        K.params([
            { key: 'layer_n', label: '層の数', min: 2, max: 6, def: 3, hint: '盤を何層にするか (変更時は新規対局から有効)' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×倍率' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let LV_N = Math.max(2, P('layer_n') || 3);
        let st = { layer: 1, lv: {} }; // lv[i] = 層ごとの色 (0=空)
        function initSt() { st = { layer: 1, lv: {} }; }
        function lvGet(lvm, i, z) { const c = lvm[i]; return c ? (c[z] || 0) : 0; }
        function lvSet(lvm, i, z, v) {
            let c = lvm[i];
            if (!c) c = lvm[i] = new Array(LV_N).fill(0);
            while (c.length <= z) c.push(0);
            c[z] = v;
        }
        function lvTop(lvm, i) {
            const c = lvm[i];
            if (!c) return 0;
            for (let z = LV_N - 1; z >= 0; z--) if (c[z] !== 0) return c[z];
            return 0;
        }
        function lvNeighbors(i, z) {
            const out = [];
            const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
            if (x > 0) out.push([i - 1, z]);
            if (x < BOARD_SIZE - 1) out.push([i + 1, z]);
            if (y > 0) out.push([i - BOARD_SIZE, z]);
            if (y < BOARD_SIZE - 1) out.push([i + BOARD_SIZE, z]);
            if (z > 0) out.push([i, z - 1]); // 縦貫
            if (z < LV_N - 1) out.push([i, z + 1]);
            return out;
        }
        function capturedLv(lvm, player) {
            const dead = [];
            const seen = new Set();
            for (const k in lvm) {
                const i = +k;
                for (let z = 0; z < LV_N; z++) {
                    const key = i * LV_N + z;
                    if (seen.has(key) || lvGet(lvm, i, z) !== player) continue;
                    const group = [];
                    let hasLib = false;
                    const q = [[i, z]];
                    seen.add(key);
                    while (q.length) {
                        const [ci, cz] = q.shift();
                        group.push([ci, cz]);
                        lvNeighbors(ci, cz).forEach(([ni, nz]) => {
                            const v = lvGet(lvm, ni, nz);
                            if (v === 0) hasLib = true;
                            else if (v === player && !seen.has(ni * LV_N + nz)) {
                                seen.add(ni * LV_N + nz);
                                q.push([ni, nz]);
                            }
                        });
                    }
                    if (!hasLib) dead.push(...group);
                }
            }
            return dead;
        }
        // 層ボタンを層数に合わせて生成・配線
        function rebuildLayerButtons() {
            const sel = document.getElementById('layerSel');
            if (!sel) return;
            sel.innerHTML = '';
            if (st.layer > LV_N) st.layer = LV_N;
            for (let z = 0; z < LV_N; z++) {
                const b = document.createElement('button');
                b.className = 'lvBtn flex-1 py-1.5 px-2 text-xs font-bold border rounded-xl transition-all';
                b.dataset.z = z;
                b.textContent = '層' + (z + 1);
                b.addEventListener('click', () => {
                    st.layer = +b.dataset.z + 1;
                    document.querySelectorAll('#layerSel .lvBtn').forEach(o => {
                        const on = +o.dataset.z + 1 === st.layer;
                        o.classList.toggle('bg-neutral-900', on);
                        o.classList.toggle('text-white', on);
                    });
                });
                sel.appendChild(b);
            }
            const _b0 = document.querySelectorAll('#layerSel .lvBtn')[st.layer - 1];
            if (_b0) { _b0.classList.add('bg-neutral-900'); _b0.classList.add('text-white'); }
        }
        rebuildLayerButtons();
        function onVariantParam(p) {
            if (p.key === 'layer_n') {
                LV_N = Math.max(2, P('layer_n') || 3);
                // 既存セルの天面を新しい層数で再計算して盤と整合させる
                for (const k in st.lv) { const i = +k; board[i] = lvTop(st.lv, i); }
                if (st.layer > LV_N) st.layer = LV_N;
                rebuildLayerButtons();
            }
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            initSt();`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { layer: 1, lv: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { layer: 1, lv: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { layer: 1, lv: {} };`],
        // 層選択UI
        [K.ONE, `            </button>
        </div>

        <!-- 死に石選択フェーズ用バナー -->`,
`            </button>
        </div>

        <!-- 層選択 (ボタンは層数に応じてJSで生成) -->
        <div id="layerSel" class="w-full flex justify-between items-center gap-2"></div>

        <!-- 死に石選択フェーズ用バナー -->`],
        // 着手判定: 選んだ層のスロットが空いているか (3Dスタックで自殺・コウ判定)
        [K.ONE, `        function isValidPlacement(cells, player) {
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
        }`,
`        function isValidPlacement(cells, player) {
            const z = st.layer - 1;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                const i = p.y * BOARD_SIZE + p.x;
                if (board[i] === 3) return false;
                if (lvGet(st.lv, i, z) !== 0) return false; // その層は埋まっている
            }

            // 仮配置 (3Dスタック)
            const tempLv = {};
            for (const k in st.lv) tempLv[k] = [...st.lv[k]];
            cells.forEach(p => { lvSet(tempLv, p.y * BOARD_SIZE + p.x, z, player); });

            const opponent = player === 1 ? 2 : 1;
            const captured = capturedLv(tempLv, opponent);
            captured.forEach(([ci, cz]) => { tempLv[ci][cz] = 0; });
            if (capturedLv(tempLv, player).length > 0) return false;

            // コウ判定: 取り後の天面が直前盤面と同じなら禁止
            if (captured.length > 0 && prevBoard) {
                const top = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
                for (let i = 0; i < top.length; i++) top[i] = lvTop(tempLv, i);
                if (top.every((v, i) => v === prevBoard[i])) return false;
            }
            return true;
        }`],
        // 3D版の取り判定
        [K.ONE, `        function getCapturedStones(boardState, player) {
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
        }`,
`        function getCapturedStones(boardState, player) {
            return [...new Set(capturedLv(st.lv, player).map(([i]) => i))];
        }`],
        [K.ONE, `        function getLiberties(boardState, idx) {
            const player = boardState[idx];
            if (player === 0) return 0;

            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const queue = [idx];
            visited[idx] = true;
            let liberties = 0;

            while (queue.length > 0) {
                const curr = queue.shift();
                const neighbors = getNeighbors(curr);
                neighbors.forEach(n => {
                    if (boardState[n] === 0 && !deadMask[n]) {
                        liberties++;
                    } else if (boardState[n] === player && !visited[n]) {
                        visited[n] = true;
                        queue.push(n);
                    }
                });
            }
            return liberties;
        }`,
`        function getLiberties(boardState, idx) {
            const cell = st.lv[idx];
            if (!cell) return 0;
            let z = -1;
            for (let z2 = LV_N - 1; z2 >= 0; z2--) if (cell[z2] !== 0) { z = z2; break; }
            if (z < 0) return 0;
            const player = cell[z];
            const seen = new Set();
            let libs = 0;
            const q = [[idx, z]];
            seen.add(idx * LV_N + z);
            while (q.length) {
                const [ci, cz] = q.shift();
                lvNeighbors(ci, cz).forEach(([ni, nz]) => {
                    const v = lvGet(st.lv, ni, nz);
                    if (v === 0) libs++;
                    else if (v === player && !seen.has(ni * LV_N + nz)) {
                        seen.add(ni * LV_N + nz);
                        q.push([ni, nz]);
                    }
                });
            }
            return libs;
        }`],
        // 層に石を置く (天面に反映)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            const LZ = st.layer - 1;
            move.cells.forEach(p => {
                const i = p.y * BOARD_SIZE + p.x;
                lvSet(st.lv, i, LZ, player);
                board[i] = lvTop(st.lv, i);
            });`],
        // 取りは3Dスタック全体に及ぶ
        [K.ONE, K.CAPTURE_BLOCK,
`                const captured3 = capturedLv(st.lv, opponent);
                if (captured3.length > 0) {
                    captured3.forEach(([ci, cz]) => {
                        st.lv[ci][cz] = 0;
                        board[ci] = lvTop(st.lv, ci);
                        fxBurst(ci, '#a78bfa', 6);
                    });
                    captures[player] += captured3.length;
                    soundManager.playCapture();
                    cleanUpPieces();
                } else {
                    soundManager.playPlace();
                }`],
        // 層の積み具合を描画
        ...K.STONE_MARKS_SPEC(`            for (const k in st.lv) {
                const i = +k;
                const col = st.lv[i];
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                for (let z = 0; z < LV_N; z++) {
                    if (col[z] === 0) continue;
                    ctx.fillStyle = col[z] === 1 ? '#1c1917' : '#fef3c7';
                    ctx.strokeStyle = col[z] === 1 ? '#000' : '#78350f';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.26 + z * cellSize * 0.26, cy + cellSize * 0.30, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                }
            }`),
        // 現在層チップ
        ...K.EVENT_CHIP_SPEC(`'層' + st.layer`),
        [K.ONE, K.INFO_BASE, `            層積碁: 盤は上下3層。層ボタンで層を選んで着手。同座標の縦貫は近傍扱い<br>
            PC: クリックで配置 (層ボタンで層を選択)<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各マスは層1-3のスロットを持つ。層ボタンで層を選んで着手。同座標の縦貫は近傍扱い。',
            '表示は各マスの最上層の石。下層に潜り込んで敵連を分断できる。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
        [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        pieces = [];
        resetGame();
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('層1に石がある', board[I(3, 3)] === 1 && st.lv[I(3, 3)][0] === 1);
        st.layer = 2;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('同座標の層2に積める', st.lv[I(3, 3)][1] === 2 && board[I(3, 3)] === 2);
        assert('埋まった層には置けない', isValidPlacement([{ x: 3, y: 3 }], 1) === false);
        st.layer = 1;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 3 }] }, 1);
        st.layer = 2;
        executeMove({ cells: [{ x: 3, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1);
        assert('縦貫連は繋がって呼吸', board[I(3, 3)] === 2);
    `,
};
