// icon-draw.js — ゲームタイル/OGP共通アイコン描画 (index.html から分離)
// gen_wave3_index.js が wave3 アイコン case をこのファイルの WAVE3 ICONS マーカーに注入する。

        // ---- 共通描画 ----
        const P1 = '#1c1917', P1S = '#000000';
        const P2 = '#fef3c7', P2S = '#78350f';

        function gridLines(c, w, n) {
            const m = w / (n + 1);
            c.strokeStyle = 'rgba(62,34,17,0.35)';
            c.lineWidth = 1;
            for (let i = 1; i <= n; i++) {
                c.beginPath(); c.moveTo(m * i, m); c.lineTo(m * i, w - m); c.stroke();
                c.beginPath(); c.moveTo(m, m * i); c.lineTo(w - m, m * i); c.stroke();
            }
            return m;
        }

        function shade(hex, amt) {
            const n = parseInt(hex.slice(1), 16);
            const f = (v) => Math.round(v + ((amt > 0 ? 255 : 0) - v) * Math.abs(amt));
            return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
        }

        // 球棒モデル分子を任意の中心座標群で描画
        function drawMolecule(c, points, color, stroke, R) {
            const set = new Set(points.map(p => p.gx + ',' + p.gy));
            c.strokeStyle = shade(color, -0.15);
            c.lineWidth = R * 0.72;
            c.lineCap = 'round';
            c.beginPath();
            points.forEach(p => {
                [[1, 0], [0, 1]].forEach(([dx, dy]) => {
                    if (set.has((p.gx + dx) + ',' + (p.gy + dy))) {
                        c.moveTo(p.x, p.y);
                        c.lineTo(p.x + dx * p.cell, p.y + dy * p.cell);
                    }
                });
            });
            c.stroke();
            points.forEach(p => {
                const g = c.createRadialGradient(p.x - R * 0.38, p.y - R * 0.42, R * 0.08, p.x, p.y, R);
                g.addColorStop(0, shade(color, 0.55));
                g.addColorStop(0.65, color);
                g.addColorStop(1, shade(color, -0.25));
                c.fillStyle = g;
                c.beginPath(); c.arc(p.x, p.y, R, 0, Math.PI * 2); c.fill();
                c.strokeStyle = stroke; c.lineWidth = 1; c.stroke();
                c.fillStyle = 'rgba(255,255,255,0.45)';
                c.beginPath(); c.arc(p.x - R * 0.34, p.y - R * 0.38, R * 0.17, 0, Math.PI * 2); c.fill();
            });
        }

        function drawIcon(c, kind, W) {
            const ctx = c; // spec のアイコンコードは ctx 名を仮定しているため別名を用意
            const cell = gridLines(c, W, 6);
            const R = cell * 0.42;
            const at = (gx, gy) => ({ x: cell + gx * cell, y: cell + gy * cell });
            const dot = (gx, gy, fill, stroke, r = R, alpha = 1) => {
                const p = at(gx, gy);
                c.save(); c.globalAlpha = alpha;
                const g = c.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
                g.addColorStop(0, shade(fill, 0.4)); g.addColorStop(1, fill);
                c.fillStyle = g; c.strokeStyle = stroke; c.lineWidth = 1.2;
                c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill(); c.stroke();
                c.restore();
            };
            const bond = (x1, y1, x2, y2, w = 4) => {
                const p = at(x1, y1), q = at(x2, y2);
                c.strokeStyle = 'rgba(40,24,14,0.6)'; c.lineWidth = w; c.lineCap = 'round';
                c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
            };
            const blk = (gx, gy, fill, stroke) => {
                const s = cell * 0.86, p = at(gx, gy);
                c.fillStyle = fill; c.strokeStyle = stroke; c.lineWidth = 1.2;
                c.beginPath();
                if (c.roundRect) c.roundRect(p.x - s/2, p.y - s/2, s, s, s*0.18); else c.rect(p.x - s/2, p.y - s/2, s, s);
                c.fill(); c.stroke();
            };
            const mol = (atoms, fill, stroke) => {
                const pts = atoms.map(([x, y]) => ({ gx: x, gy: y, cell, x: cell + x * cell, y: cell + y * cell }));
                drawMolecule(c, pts, fill, stroke, cell * 0.42);
            };
            const ring = (gx, gy, r, stroke, w = 1.6) => {
                const p = at(gx, gy);
                c.strokeStyle = stroke; c.lineWidth = w;
                c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke();
            };
            const seg = (x1, y1, x2, y2, stroke, w = 1.6) => {
                const a = at(x1, y1), b = at(x2, y2);
                c.strokeStyle = stroke; c.lineWidth = w; c.lineCap = 'round';
                c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
            };
            const txt = (s, gx, gy, fill, h = cell * 1.1) => {
                const p = at(gx, gy);
                c.fillStyle = fill; c.font = `bold ${h}px sans-serif`;
                c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, p.x, p.y);
            };
            const tri = (gx, gy, r, fill, stroke, rot = -Math.PI / 2) => {
                const p = at(gx, gy);
                c.fillStyle = fill; c.strokeStyle = stroke; c.lineWidth = 1.2;
                c.beginPath();
                for (let i = 0; i < 3; i++) {
                    const a = rot + i * 2 * Math.PI / 3;
                    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
                    i ? c.lineTo(x, y) : c.moveTo(x, y);
                }
                c.closePath(); c.fill(); c.stroke();
            };

            switch (kind) {
                case 'tetromino': // Tテトロミノ + Lテトロミノ
                    [[0,0],[1,0],[2,0],[1,1]].forEach(([x,y]) => blk(0.6+x, 0.8+y, P1, P1S));
                    [[0,0],[0,1],[0,2],[1,2]].forEach(([x,y]) => blk(3.6+x, 2.4+y, P2, P2S));
                    break;
                case 'alkane': // 分子2つ
                    mol([[1,1],[2,1],[2,2],[3,2],[3,3],[2,0]], P1, P1S);
                    mol([[4,0],[4,1],[5,1],[5,2]], P2, P2S);
                    break;
                case 'mame': // ドミノ碁豆
                    dot(1.5,1.5,P1,P1S,cell*0.44); dot(2.5,1.5,P1,P1S,cell*0.44);
                    dot(4.5,3.0,P1,P1S,cell*0.44); dot(4.5,4.0,P1,P1S,cell*0.44);
                    dot(2.0,4.5,P2,P2S,cell*0.44); dot(3.0,4.5,P2,P2S,cell*0.44);
                    break;
                case 'pento': // Wペントミノ
                    [[1,1],[1,2],[2,2],[2,3],[3,3]].forEach(([x,y]) => blk(x, y, P1, P1S));
                    blk(4,4,P2,P2S); blk(5,4,P2,P2S); blk(5,5,P2,P2S); blk(6,5,P2,P2S);
                    break;
                case 'torus': // 端ループ矢印
                    [[2,2],[3,2],[2,3],[3,3]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    c.strokeStyle = P2S; c.lineWidth = 2; c.lineCap = 'round';
                    [[1.2,1.2,4.8,1.2],[4.8,4.8,1.2,4.8]].forEach(([a,b,d,e]) => {
                        c.beginPath(); c.moveTo(cell+a*cell, cell+b*cell); c.lineTo(cell+d*cell, cell+e*cell); c.stroke();
                    });
                    break;
                case 'decay': // 薄くなる石
                    dot(1.5,2,P1,P1S); dot(2.8,2,P1,P1S,R,0.55); dot(4.1,2,P1,P1S,R,0.22);
                    bond(4.6,4.2,5.6,4.2,3); dot(5.6,4.2,P2,P2S);
                    break;
                case 'life': // グライダー
                    [[2,1],[3,2],[1,3],[2,3],[3,3]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    break;
                case 'rush': // ストップウォッチ
                    c.strokeStyle = P1; c.lineWidth = 2.5;
                    c.beginPath(); c.arc(at(3,3.2).x, at(3,3.2).y, cell*1.5, 0, Math.PI*2); c.stroke();
                    c.beginPath(); c.moveTo(at(3,3.2).x, at(3,3.2).y); c.lineTo(at(3,2).x, at(3,2).y); c.stroke();
                    c.fillRect(cell*2.6, cell*0.7, cell*0.8, cell*0.35);
                    break;
                case 'cyclo': // シクロヘキサン環
                    bond(2,2,3,2); bond(3,2,4,2); bond(4,2,4,3); bond(4,3,3,3); bond(3,3,2,3); bond(2,3,2,2);
                    [[2,2],[3,2],[4,2],[4,3],[3,3],[2,3]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    break;
                case 'alkene': // 二重結合 (平行2本線)
                    [[2.2,2.4],[3.8,2.4]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    c.strokeStyle = 'rgba(40,24,14,0.7)'; c.lineWidth = 1.8; c.lineCap = 'round';
                    [-0.12,0.12].forEach(o => {
                        c.beginPath(); c.moveTo(at(2.2,2.4+o).x, at(2.2,2.4+o).y); c.lineTo(at(3.8,2.4+o).x, at(3.8,2.4+o).y); c.stroke();
                    });
                    bond(3.8,2.4,4.8,3.4,3); dot(4.8,3.4,P1,P1S);
                    break;
                case 'poly': // くねった鎖
                    [[1.5,4],[2,3],[3,3.4],[3.8,2.6],[4.6,2.8]].forEach((p,i,arr) => {
                        if (i) bond(arr[i-1][0], arr[i-1][1], p[0], p[1], 3);
                        dot(p[0], p[1], P1, P1S);
                    });
                    break;
                case 'd3': // 3層
                    for (let i = 0; i < 3; i++) {
                        const o = 1.6 + i * 0.9;
                        c.strokeStyle = i === 1 ? P1 : 'rgba(40,24,14,0.4)';
                        c.lineWidth = i === 1 ? 2 : 1.2;
                        c.strokeRect(cell*o, cell*o, cell*2.8, cell*2.8);
                    }
                    dot(3.4,3.4,P2,P2S);
                    break;
                case 'asym': // 半々
                    [[1.6,1.6],[2.6,1.6],[2.1,2.6]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    [[4.4,3.4],[3.4,4.4],[4.4,4.4],[5.4,3.4]].forEach(([x,y]) => dot(x, y, P2, P2S));
                    c.strokeStyle = 'rgba(62,34,17,0.5)'; c.lineWidth = 1.5;
                    c.setLineDash([3,3]); c.beginPath();
                    c.moveTo(W*0.15, W*0.85); c.lineTo(W*0.85, W*0.15); c.stroke(); c.setLineDash([]);
                    break;
                case 'draft': // ピック (指)
                    dot(2,2,P1,P1S); dot(2,3.6,P2,P2S); dot(4,2,P2,P2S); dot(4,3.6,P1,P1S);
                    c.strokeStyle = P2S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(4,2).x, at(4,2).y, cell*0.7, 0, Math.PI*2); c.stroke();
                    break;
                case 'graph': // 分子グラフ
                    [[1.6,1.6,3,1.6],[3,1.6,4.4,2.6],[3,1.6,3,3.2],[3,3.2,1.8,4],[3,3.2,4.2,4.4],[1.8,4,1.6,1.6]].forEach(([a,b,d,e]) => bond(a,b,d,e,2.5));
                    [[1.6,1.6],[3,1.6],[4.4,2.6],[3,3.2],[1.8,4],[4.2,4.4]].forEach(([x,y]) => dot(x, y, P1, P1S, cell*0.3));
                    break;
                case 'stone': // 通常の碁石2つ
                    dot(2.4,2.4,P1,P1S); dot(3.8,3.8,P2,P2S);
                    break;
                case 'diag': // 斜めに繋がる石
                    [[1.6,1.6],[2.6,2.6],[3.6,3.6]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    dot(4.6,4.6,P2,P2S);
                    c.strokeStyle = P1S; c.lineWidth = 1.5; c.setLineDash([4,3]);
                    c.beginPath(); c.moveTo(at(1.6,1.6).x, at(1.6,1.6).y); c.lineTo(at(3.6,3.6).x, at(3.6,3.6).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'wall': // 石+壁
                    dot(2,2,P1,P1S); dot(4.4,4.4,P2,P2S);
                    [[3.2,1.6],[3.2,2.6],[2.4,4.4],[3.4,3.4]].forEach(([x,y]) => {
                        const p = at(x,y), s = cell*0.5;
                        c.fillStyle = 'rgba(70,50,30,0.85)';
                        c.fillRect(p.x-s/2, p.y-s/2, s, s);
                        c.strokeStyle = 'rgba(30,20,10,0.9)'; c.lineWidth = 1.2;
                        c.strokeRect(p.x-s/2, p.y-s/2, s, s);
                    });
                    break;
                case 'grav': // 下に積まれる石
                    [[1.4,5],[2.4,5],[3.4,5],[4.4,5],[2.4,4],[3.4,4],[2.9,3]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    dot(5.4,4,P2,P2S);
                    break;
                case 'spawn': // 増殖する石
                    [[3,3],[2,3],[3,2],[4,3],[3,4]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    [[1.2,3],[3,1.2],[4.8,3],[3,4.8]].forEach(([x,y]) => dot(x, y, P1, P1S, R*0.7, 0.5));
                    break;
                case 'mirror': // 鏡像
                    dot(2.2,3,P1,P1S); dot(3.8,3,P1,P1S);
                    c.strokeStyle = 'rgba(62,34,17,0.6)'; c.lineWidth = 1.6; c.setLineDash([5,4]);
                    c.beginPath(); c.moveTo(at(3,0.8).x, at(3,0.8).y); c.lineTo(at(3,5.2).x, at(3,5.2).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'twice': // ×2石
                    dot(2.2,3,P1,P1S); dot(3.6,3,P1,P1S);
                    c.fillStyle = P1; c.font = `bold ${cell*0.9}px sans-serif`; c.textAlign = 'center';
                    c.fillText('×2', at(4.8,4.6).x, at(4.8,4.6).y + cell*0.3);
                    break;
                case 'king': // 王石
                    dot(3,3,P1,P1S,cell*0.48);
                    c.fillStyle = '#fbbf24'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1;
                    c.font = `bold ${cell*1.1}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
                    c.strokeText('♛', at(3,3).x, at(3,3).y + cell*0.08);
                    c.fillText('♛', at(3,3).x, at(3,3).y + cell*0.08);
                    break;
                case 'max': // アゲハマ先取
                    [[1.8,4.6],[2.8,4.6],[3.8,4.6]].forEach(([x,y]) => dot(x, y, P2, P2S, R*0.8, 0.85));
                    dot(4.6,2,P1,P1S);
                    c.fillStyle = P1; c.font = `bold ${cell*0.8}px sans-serif`; c.textAlign = 'center';
                    c.fillText('10先取', at(3,1).x, at(3,1).y);
                    break;
                case 'sand': // ハサミ
                    dot(1.8,3,P1,P1S); dot(4.2,3,P1,P1S); dot(3,3,P2,P2S);
                    bond(1.8,3,3,3,2); bond(3,3,4.2,3,2);
                    break;
                case 'push': // 押し出し矢印
                    dot(2,3,P1,P1S); dot(3,3,P2,P2S);
                    c.strokeStyle = P1; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(3.4,3).x, at(3.4,3).y); c.lineTo(at(4.8,3).x, at(4.8,3).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.4,2.7).x, at(4.4,2.7).y); c.lineTo(at(4.9,3).x, at(4.9,3).y); c.lineTo(at(4.4,3.3).x, at(4.4,3.3).y); c.stroke();
                    break;
                case 'pull': // 引き寄せ矢印
                    dot(2,3,P1,P1S); dot(4.4,3,P2,P2S);
                    c.strokeStyle = P2S; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(4,3).x, at(4,3).y); c.lineTo(at(2.8,3).x, at(2.8,3).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3.2,2.7).x, at(3.2,2.7).y); c.lineTo(at(2.7,3).x, at(2.7,3).y); c.lineTo(at(3.2,3.3).x, at(3.2,3.3).y); c.stroke();
                    break;
                case 'turn': // 回転矢印
                    dot(2.6,2.6,P1,P1S); dot(3.6,3.6,P2,P2S);
                    c.strokeStyle = P1; c.lineWidth = 2.2; c.lineCap = 'round';
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*1.7, -Math.PI*0.3, Math.PI*1.1); c.stroke();
                    c.beginPath(); c.moveTo(at(4.5,1.9).x, at(4.5,1.9).y); c.lineTo(at(4.6,2.7).x, at(4.6,2.7).y); c.lineTo(at(3.9,2.4).x, at(3.9,2.4).y); c.stroke();
                    break;
                case 'no': // 禁取
                    dot(2.6,3,P1,P1S); dot(3.8,3,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2.5;
                    c.beginPath(); c.arc(at(3.2,3).x, at(3.2,3).y, cell*1.9, 0, Math.PI*2); c.stroke();
                    c.beginPath(); c.moveTo(at(1.9,1.7).x, at(1.9,1.7).y); c.lineTo(at(4.5,4.3).x, at(4.5,4.3).y); c.stroke();
                    break;
                case 'limit': // 手詰み (石+囲い)
                    dot(3,3,P2,P2S);
                    [[2,2],[3,2],[4,2],[2,3],[4,3],[2,4],[3,4],[4,4]].forEach(([x,y]) => dot(x, y, P1, P1S, R*0.72));
                    break;
                case 'grow': // 増殖
                    [[2.4,3.6],[3.2,3.2],[4,2.8],[2,4.4],[3.6,4.2]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    [[1.6,3],[4.4,2.2],[4.8,3.8]].forEach(([x,y]) => dot(x, y, P1, P1S, R*0.65, 0.55));
                    break;
                case 'mole': // もぐら移動
                    dot(2,2.4,P1,P1S);
                    c.strokeStyle = P1S; c.lineWidth = 1.6; c.setLineDash([3,3]);
                    c.beginPath(); c.moveTo(at(2,2.4).x, at(2,2.4).y); c.quadraticCurveTo(at(3,1.4).x, at(3,1.4).y, at(4,2.4).x, at(4,2.4).y); c.stroke();
                    c.setLineDash([]);
                    dot(4,2.4,P1,P1S,R,0.5); dot(3.4,4.4,P2,P2S);
                    break;
                case 'blast': // 爆撃
                    dot(3,3,P1,P1S);
                    for (let i = 0; i < 8; i++) {
                        const a = i * Math.PI / 4;
                        c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.lineCap = 'round';
                        c.beginPath();
                        c.moveTo(at(3 + Math.cos(a) * 0.9, 3 + Math.sin(a) * 0.9).x, at(3 + Math.cos(a) * 0.9, 3 + Math.sin(a) * 0.9).y);
                        c.lineTo(at(3 + Math.cos(a) * 1.5, 3 + Math.sin(a) * 1.5).x, at(3 + Math.cos(a) * 1.5, 3 + Math.sin(a) * 1.5).y);
                        c.stroke();
                    }
                    break;
                case 'handi': // 置碁
                    [[1.6,4.4],[4.4,1.6],[4.4,4.4],[1.6,1.6]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    dot(3,3,P2,P2S);
                    break;
                case 'domino': // 碁豆 (2連ドミノ)
                    dot(2.4,3,P1,P1S); dot(3.6,3,P1,P1S); bond(2.4,3,3.6,3,2.4);
                    dot(3.4,1.8,P2,P2S); dot(3.4,4.2,P2,P2S); bond(3.4,1.8,3.4,4.2,0); // 縦置きは点線なし
                    break;
                case 'trio': // トリオミノ L字
                    dot(2,2,P1,P1S); dot(2,3,P1,P1S); dot(3,3,P1,P1S);
                    bond(2,2,2,3,2.4); bond(2,3,3,3,2.4);
                    dot(4,4.2,P2,P2S); dot(4.6,3.2,P2,P2S); dot(3.4,4.6,P2,P2S);
                    break;
                case 'iso': // 孤立 (非隣接の散らばり)
                    dot(1.8,1.8,P1,P1S); dot(4.2,2.2,P1,P1S); dot(2.6,4.4,P1,P1S);
                    dot(4.4,4.4,P2,P2S); dot(2.2,3.2,P2,P2S);
                    break;
                case 'ring': // 中央穴
                    for (let i = 0; i < 8; i++) {
                        const a = i * Math.PI / 4;
                        dot(3 + Math.cos(a) * 1.7, 3 + Math.sin(a) * 1.7, i % 2 ? P1 : P2, i % 2 ? P1S : P2S);
                    }
                    break;
                case 'cross': // 十字盤 (隅マス省略)
                    dot(3,1.6,P1,P1S); dot(3,4.4,P1,P1S); dot(1.6,3,P2,P2S); dot(4.4,3,P2,P2S); dot(3,3,P1,P1S);
                    break;
                case 'live': // 活き石カウント
                    dot(2.2,3.4,P1,P1S); dot(3,3.4,P1,P1S); dot(3.8,3.4,P1,P1S);
                    c.fillStyle = P1; c.font = `bold ${cell*0.85}px sans-serif`; c.textAlign = 'center';
                    c.fillText('×3', at(3,1.6).x, at(3,1.6).y);
                    break;
                case 'fuse': // 融合→中立ブロック
                    dot(2.2,3,P1,P1S); dot(3.8,3,P2,P2S);
                    c.fillStyle = 'rgba(60,42,25,0.9)';
                    c.fillRect(at(3,3).x - cell*0.28, at(3,3).y - cell*0.28, cell*0.56, cell*0.56);
                    c.strokeStyle = 'rgba(30,20,10,0.9)'; c.lineWidth = 1.4;
                    c.strokeRect(at(3,3).x - cell*0.28, at(3,3).y - cell*0.28, cell*0.56, cell*0.56);
                    break;
                case 'worm': // ワームホール◎
                    dot(3,2,P1,P1S);
                    c.strokeStyle = '#8b5cf6'; c.lineWidth = 2;
                    [[1.8,4],[4.2,4]].forEach(([x,y]) => {
                        c.beginPath(); c.arc(at(x,y).x, at(x,y).y, cell*0.42, 0, Math.PI*2); c.stroke();
                        c.beginPath(); c.arc(at(x,y).x, at(x,y).y, cell*0.14, 0, Math.PI*2); c.stroke();
                    });
                    c.setLineDash([3,3]); c.beginPath();
                    c.moveTo(at(1.8,4).x, at(1.8,4).y); c.lineTo(at(4.2,4).x, at(4.2,4).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'grave': // 墓標
                    c.fillStyle = 'rgba(60,42,25,0.9)';
                    [[2.2,2.4],[4,4]].forEach(([x,y]) => {
                        c.fillRect(at(x,y).x - cell*0.26, at(x,y).y - cell*0.3, cell*0.52, cell*0.6);
                    });
                    dot(2.4,4.2,P1,P1S); dot(3.4,2.4,P2,P2S);
                    break;
                case 'reap': // 連取 (石+二重矢印)
                    dot(2,3,P1,P1S); dot(4.4,3,P2,P2S);
                    c.strokeStyle = P1; c.lineWidth = 2; c.lineCap = 'round';
                    [[3.4,2.5,1],[3.6,3.5,-1]].forEach(([x,y,d]) => {
                        c.beginPath(); c.moveTo(at(x,y).x, at(x,y).y);
                        c.lineTo(at(x+1.1*d,y).x, at(x+1.1*d,y).y); c.stroke();
                        c.beginPath(); c.moveTo(at(x+0.7*d,y-0.25).x, at(x+0.7*d,y-0.25).y);
                        c.lineTo(at(x+1.15*d,y).x, at(x+1.15*d,y).y);
                        c.lineTo(at(x+0.7*d,y+0.25).x, at(x+0.7*d,y+0.25).y); c.stroke();
                    });
                    break;
                case 'quad': // 2x2ブロック
                    [[2.2,2.2],[3.4,2.2],[2.2,3.4],[3.4,3.4]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    dot(4.4,4.4,P2,P2S);
                    break;
                case 'circle': // 円形盤
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*2.2, 0, Math.PI*2); c.stroke();
                    dot(3,3,P1,P1S); dot(2.2,3.6,P2,P2S);
                    break;
                case 'lava': // 溶岩 (外周が炎色)
                    c.strokeStyle = '#dc2626'; c.lineWidth = 3;
                    c.strokeRect(at(1,1).x, at(1,1).y, cell*4, cell*4);
                    dot(3,3,P1,P1S); dot(3.8,2.4,P2,P2S);
                    break;
                case 'half': // 陣地分割
                    c.strokeStyle = P1S; c.lineWidth = 2; c.setLineDash([4,3]);
                    c.beginPath(); c.moveTo(at(3,1).x, at(3,1).y); c.lineTo(at(3,5).x, at(3,5).y); c.stroke();
                    c.setLineDash([]);
                    dot(1.8,2,P1,P1S); dot(2.2,4,P1,P1S); dot(4,2.6,P2,P2S); dot(4.4,4.4,P2,P2S);
                    break;
                case 'sparse': // 離散
                    dot(1.6,1.6,P1,P1S); dot(4.4,1.6,P2,P2S); dot(1.6,4.4,P2,P2S); dot(4.4,4.4,P1,P1S);
                    break;
                case 'first': // 一撃
                    dot(3,3,P1,P1S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2.4; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(1.8,1.8).x, at(1.8,1.8).y); c.lineTo(at(4.2,4.2).x, at(4.2,4.2).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.2,1.8).x, at(4.2,1.8).y); c.lineTo(at(1.8,4.2).x, at(1.8,4.2).y); c.stroke();
                    break;
                case 'treasure': // 宝◆
                    c.fillStyle = '#ca8a04';
                    [[3,2],[1.8,3.8],[4.2,3.8]].forEach(([x,y]) => {
                        const bx = at(x,y).x, by = at(x,y).y, ds = cell*0.3;
                        c.beginPath(); c.moveTo(bx, by-ds); c.lineTo(bx+ds, by);
                        c.lineTo(bx, by+ds); c.lineTo(bx-ds, by); c.closePath(); c.fill();
                    });
                    dot(3,4.4,P1,P1S);
                    break;
                case 'dark': // 暗闇 (中心だけ明るい)
                    const dg = c.createRadialGradient(at(3,3).x, at(3,3).y, cell*0.5, at(3,3).x, at(3,3).y, cell*2.6);
                    dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,0.85)');
                    dot(3,3,P1,P1S); dot(2.4,3.4,P1,P1S);
                    c.fillStyle = dg; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
                    break;
                case 'orbit': // 周回リング
                    c.strokeStyle = P1S; c.lineWidth = 1.8; c.setLineDash([4,4]);
                    c.strokeRect(at(1.4,1.4).x, at(1.4,1.4).y, cell*3.2, cell*3.2);
                    c.setLineDash([]);
                    dot(1.8,1.8,P1,P1S); dot(4.4,1.8,P2,P2S); dot(4.4,4.4,P1,P1S);
                    c.fillStyle = P1S; c.font = `bold ${cell*0.7}px sans-serif`;
                    c.fillText('↻', at(3,3).x, at(3,3).y + cell*0.25);
                    break;
                case 'self': // 自爆
                    dot(2.6,3,P1,P1S); dot(3.8,3,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(2.2,2.6).x, at(2.2,2.6).y); c.lineTo(at(3,3.4).x, at(3,3.4).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3,2.6).x, at(3,2.6).y); c.lineTo(at(2.2,3.4).x, at(2.2,3.4).y); c.stroke();
                    break;
                case 'star': // 十字形
                    [[3,1.8],[1.8,3],[3,3],[4.2,3],[3,4.2]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    dot(4.6,1.4,P2,P2S);
                    break;
                case 'big': // 3x3
                    [[1.8,1.8],[3,1.8],[4.2,1.8],[1.8,3],[3,3],[4.2,3],[1.8,4.2],[3,4.2],[4.2,4.2]]
                        .forEach(([x,y]) => dot(x, y, P1, P1S, R*0.7));
                    break;
                case 'connect': // 辺連結
                    c.strokeStyle = P1; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(3,1).x, at(3,1).y); c.lineTo(at(3,5).x, at(3,5).y); c.stroke();
                    dot(3,1,P1,P1S); dot(3,3,P1,P1S); dot(3,5,P1,P1S);
                    break;
                case 'cent': // 中心から拡大
                    c.strokeStyle = 'rgba(37,99,235,0.6)'; c.lineWidth = 1.8; c.setLineDash([4,3]);
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*1.4, 0, Math.PI*2); c.stroke();
                    c.setLineDash([]);
                    dot(3,3,P1,P1S); dot(4.4,1.8,P2,P2S,R,0.35);
                    break;
                case 'switch': // 色反転
                    dot(2,3,P1,P1S); dot(4,3,P2,P2S);
                    c.strokeStyle = P1S; c.lineWidth = 1.8;
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*1.5, -Math.PI*0.4, Math.PI*0.6); c.stroke();
                    break;
                case 'thunder': // 雷
                    c.fillStyle = '#eab308';
                    c.beginPath();
                    c.moveTo(at(3.4,1).x, at(3.4,1).y); c.lineTo(at(2.5,3.2).x, at(2.5,3.2).y);
                    c.lineTo(at(3.1,3.2).x, at(3.1,3.2).y); c.lineTo(at(2.5,5).x, at(2.5,5).y);
                    c.lineTo(at(3.8,2.7).x, at(3.8,2.7).y); c.lineTo(at(3.1,2.7).x, at(3.1,2.7).y);
                    c.closePath(); c.fill();
                    dot(4.4,4,P2,P2S,R,0.6);
                    break;
                case 'cyl': // 円筒
                    dot(1.4,3,P1,P1S); dot(4.6,3,P1,P1S);
                    c.strokeStyle = P1S; c.lineWidth = 1.8; c.setLineDash([3,3]);
                    c.beginPath(); c.moveTo(at(0.9,3).x, at(0.9,3).y);
                    c.quadraticCurveTo(at(3,1.2).x, at(3,1.2).y, at(5.1,3).x, at(5.1,3).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'moebius': // メビウス (∞)
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(2.3,3).x, at(2.3,3).y, cell*0.9, 0, Math.PI*2); c.stroke();
                    c.beginPath(); c.arc(at(3.7,3).x, at(3.7,3).y, cell*0.9, 0, Math.PI*2); c.stroke();
                    dot(3,3,P1,P1S);
                    break;
                case 'quarter': // 象限
                    c.fillStyle = 'rgba(37,99,235,0.25)';
                    c.fillRect(at(1,1).x, at(1,1).y, cell*2, cell*2);
                    dot(2,2,P1,P1S); dot(4,4,P2,P2S);
                    break;
                case 'escape': // 脱出 (辺までの線)
                    c.strokeStyle = P1; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(3,4.4).x, at(3,4.4).y); c.lineTo(at(3,1.4).x, at(3,1.4).y); c.stroke();
                    dot(3,4.4,P1,P1S); dot(3,1.4,P1,P1S); dot(3.9,3,P2,P2S);
                    break;
                case 'siphon': // 吸収 (色転換矢印)
                    dot(1.8,3,P2,P2S); dot(4.2,3,P1,P1S);
                    c.strokeStyle = P1; c.lineWidth = 1.8; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(2.4,3).x, at(2.4,3).y); c.lineTo(at(3.6,3).x, at(3.6,3).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3.2,2.7).x, at(3.2,2.7).y); c.lineTo(at(3.7,3).x, at(3.7,3).y); c.lineTo(at(3.2,3.3).x, at(3.2,3.3).y); c.stroke();
                    break;
                case 'mono': // 単石のみ
                    dot(3,3,P2,P2S); dot(4.4,4.4,P1,P1S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*0.7, 0, Math.PI*2); c.stroke();
                    break;
                case 'reg': // 上限3連
                    dot(1.8,3,P1,P1S); dot(3,3,P1,P1S); dot(4.2,3,P1,P1S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(4.6,2.6).x, at(4.6,2.6).y); c.lineTo(at(5.4,3.4).x, at(5.4,3.4).y); c.stroke();
                    c.beginPath(); c.moveTo(at(5.4,2.6).x, at(5.4,2.6).y); c.lineTo(at(4.6,3.4).x, at(4.6,3.4).y); c.stroke();
                    break;
                case 'antigrav': // 反重力↑
                    dot(3,1.6,P1,P1S); dot(3,2.8,P1,P1S);
                    c.fillStyle = P1S; c.font = `bold ${cell*0.9}px sans-serif`;
                    c.fillText('↑', at(3,4.6).x, at(3,4.6).y);
                    break;
                case 'four': // 四方回転矢印
                    c.fillStyle = P1S; c.font = `bold ${cell*0.55}px sans-serif`;
                    c.fillText('↓', at(3,4.8).x, at(3,4.8).y); c.fillText('←', at(1.4,3.2).x, at(1.4,3.2).y);
                    c.fillText('↑', at(3,1.5).x, at(3,1.5).y); c.fillText('→', at(4.6,3.2).x, at(4.6,3.2).y);
                    dot(3,3,P1,P1S);
                    break;
                case 'pushchain': // 連鎖押し
                    dot(1.6,3,P1,P1S); dot(2.7,3,P2,P2S); dot(3.8,3,P2,P2S);
                    c.strokeStyle = P1; c.lineWidth = 1.8; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(3,2.2).x, at(3,2.2).y); c.lineTo(at(4.8,2.2).x, at(4.8,2.2).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.4,1.9).x, at(4.4,1.9).y); c.lineTo(at(4.9,2.2).x, at(4.9,2.2).y); c.lineTo(at(4.4,2.5).x, at(4.4,2.5).y); c.stroke();
                    break;
                case 'twilight': // 昼夜
                    dot(2.6,3,P1,P1S); dot(4,3,P2,P2S);
                    c.fillStyle = '#ca8a04'; c.font = `bold ${cell*0.8}px sans-serif`;
                    c.fillText('☀', at(1.6,1.6).x, at(1.6,1.6).y);
                    c.fillStyle = '#64748b';
                    c.fillText('☾', at(4.4,1.6).x, at(4.4,1.6).y);
                    break;
                case 'hydra': // ヒドラ (分裂)
                    dot(2,4.2,P2,P2S);
                    c.strokeStyle = P2S; c.lineWidth = 1.6;
                    c.beginPath(); c.moveTo(at(2,4.2).x, at(2,4.2).y); c.lineTo(at(2.8,2.8).x, at(2.8,2.8).y); c.stroke();
                    c.beginPath(); c.moveTo(at(2.8,2.8).x, at(2.8,2.8).y); c.lineTo(at(2.2,1.8).x, at(2.2,1.8).y); c.stroke();
                    c.beginPath(); c.moveTo(at(2.8,2.8).x, at(2.8,2.8).y); c.lineTo(at(4,2).x, at(4,2).y); c.stroke();
                    dot(2.2,1.8,P2,P2S,R*0.7); dot(4,2,P2,P2S,R*0.7);
                    break;
                case 'ghost': // 幽霊 (破線丸)
                    c.strokeStyle = 'rgba(150,160,190,0.9)'; c.lineWidth = 2; c.setLineDash([3,3]);
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*0.75, 0, Math.PI*2); c.stroke();
                    c.setLineDash([]);
                    dot(2,4.4,P1,P1S);
                    break;
                case 'klein': // クライン瓶
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(2.5,3).x, at(2.5,3).y, cell*0.8, Math.PI*0.5, Math.PI*1.5); c.stroke();
                    c.beginPath(); c.arc(at(3.5,3).x, at(3.5,3).y, cell*0.8, -Math.PI*0.5, Math.PI*0.5); c.stroke();
                    c.beginPath(); c.moveTo(at(2.5,2.1).x, at(2.5,2.1).y); c.lineTo(at(3.5,3.9).x, at(3.5,3.9).y); c.stroke();
                    dot(4.6,4.4,P1,P1S);
                    break;
                case 'zombie': // ゾンビ (壁ブロック+石)
                    c.fillStyle = 'rgba(100,110,130,0.75)'; c.strokeStyle = 'rgba(60,68,84,0.9)'; c.lineWidth = 1.5;
                    c.beginPath(); c.roundRect(at(2,2).x, at(2,2).y, cell, cell, cell*0.2); c.fill(); c.stroke();
                    c.beginPath(); c.roundRect(at(3.4,3.4).x, at(3.4,3.4).y, cell, cell, cell*0.2); c.fill(); c.stroke();
                    dot(3.8,2.4,P1,P1S);
                    break;
                case 'relay': // 追撃 (矢印が石を追う)
                    dot(2,4.4,P2,P2S); dot(3.6,2.6,P1,P1S);
                    c.strokeStyle = P1; c.lineWidth = 1.8; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(2.5,3.9).x, at(2.5,3.9).y); c.lineTo(at(3.3,3.1).x, at(3.3,3.1).y); c.stroke();
                    c.beginPath(); c.moveTo(at(2.9,3.1).x, at(2.9,3.1).y); c.lineTo(at(3.4,3).x, at(3.4,3).y); c.lineTo(at(3.4,3.5).x, at(3.4,3.5).y); c.stroke();
                    break;
                case 'sum': // 実子 (石に+)
                    dot(2.4,3,P1,P1S); dot(3.6,3,P1,P1S);
                    c.fillStyle = P1S; c.font = `bold ${cell*0.7}px sans-serif`;
                    c.fillText('+', at(3,1.8).x, at(3,1.8).y); c.fillText('+', at(3,4.6).x, at(3,4.6).y);
                    break;
                case 'fuel': // 燃料 (メーター)
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(3,3.4).x, at(3,3.4).y, cell*1.1, Math.PI, 0); c.stroke();
                    c.strokeStyle = '#dc2626';
                    c.beginPath(); c.moveTo(at(3,3.4).x, at(3,3.4).y); c.lineTo(at(3.8,2.6).x, at(3.8,2.6).y); c.stroke();
                    dot(3,3.4,P1,P1S,R*0.5);
                    break;
                case 'stripe': // 縞 (交互線)
                    c.fillStyle = 'rgba(100,110,130,0.45)';
                    c.fillRect(at(0.4,1.4).x, at(0.4,1.4).y, cell*5.2, cell*0.7);
                    c.fillRect(at(0.4,2.9).x, at(0.4,2.9).y, cell*5.2, cell*0.7);
                    c.fillRect(at(0.4,4.4).x, at(0.4,4.4).y, cell*5.2, cell*0.7);
                    dot(3,2.5,P1,P1S);
                    break;
                case 'drift': // 漂流 (石+流れ矢印)
                    dot(2.4,2.4,P1,P1S); dot(3.6,3.6,P2,P2S);
                    c.strokeStyle = '#0284c7'; c.lineWidth = 1.8;
                    c.beginPath(); c.moveTo(at(4,1.4).x, at(4,1.4).y); c.lineTo(at(5,1.4).x, at(5,1.4).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.7,1.1).x, at(4.7,1.1).y); c.lineTo(at(5.1,1.4).x, at(5.1,1.4).y); c.lineTo(at(4.7,1.7).x, at(4.7,1.7).y); c.stroke();
                    c.beginPath(); c.moveTo(at(1.4,4.6).x, at(1.4,4.6).y); c.lineTo(at(0.6,4.6).x, at(0.6,4.6).y); c.stroke();
                    break;
                case 'last': // 終着 (旗)
                    dot(2,4.4,P1,P1S);
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(3.6,4.6).x, at(3.6,4.6).y); c.lineTo(at(3.6,1.6).x, at(3.6,1.6).y); c.stroke();
                    c.fillStyle = '#dc2626';
                    c.beginPath(); c.moveTo(at(3.6,1.7).x, at(3.6,1.7).y); c.lineTo(at(4.8,2.2).x, at(4.8,2.2).y); c.lineTo(at(3.6,2.8).x, at(3.6,2.8).y); c.fill();
                    break;
                case 'eye': // 眼 (囲まれた点)
                    dot(1.8,2.4,P1,P1S); dot(3,1.8,P1,P1S); dot(4.2,2.4,P1,P1S);
                    dot(1.8,3.6,P1,P1S); dot(3,4.2,P1,P1S); dot(4.2,3.6,P1,P1S);
                    c.strokeStyle = P2S; c.lineWidth = 1.8; c.setLineDash([3,3]);
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*0.35, 0, Math.PI*2); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'brawl': // 乱闘 (三方向矢印)
                    dot(3,3,P2,P2S); dot(1.6,3,P1,P1S); dot(4.4,3,P1,P1S); dot(3,1.6,P1,P1S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(3,4.4).x, at(3,4.4).y); c.lineTo(at(3,3.8).x, at(3,3.8).y); c.stroke();
                    break;
                case 'chain': // 連鎖爆発 (斜め伝播)
                    dot(1.8,1.8,P2,P2S); dot(3,3,P2,P2S); dot(4.2,4.2,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 1.8;
                    c.beginPath(); c.moveTo(at(2.2,2.2).x, at(2.2,2.2).y); c.lineTo(at(2.7,2.7).x, at(2.7,2.7).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3.4,3.4).x, at(3.4,3.4).y); c.lineTo(at(3.9,3.9).x, at(3.9,3.9).y); c.stroke();
                    dot(4.6,1.6,P1,P1S);
                    break;
                case 'finite': // 有限 (石+消える石)
                    dot(2,3,P1,P1S); dot(3,3,P1,P1S);
                    c.globalAlpha = 0.35; dot(4,3,P1,P1S); c.globalAlpha = 1;
                    c.fillStyle = P1S; c.font = `bold ${cell*0.6}px sans-serif`;
                    c.fillText('12', at(3,1.6).x, at(3,1.6).y);
                    break;
                case 'copy': // 模倣 (対称点)
                    dot(2,2,P1,P1S); dot(4,4,P2,P2S);
                    c.strokeStyle = '#ca8a04'; c.lineWidth = 1.6; c.setLineDash([2,3]);
                    c.beginPath(); c.moveTo(at(2,2).x, at(2,2).y); c.lineTo(at(4,4).x, at(4,4).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'swamp': // 沼 (緑枡+石)
                    c.fillStyle = 'rgba(101,163,13,0.35)';
                    c.fillRect(at(1.8,1.8).x, at(1.8,1.8).y, cell*1.4, cell*1.4);
                    c.fillRect(at(3.6,3.6).x, at(3.6,3.6).y, cell*1.4, cell*1.4);
                    dot(2.5,2.5,P1,P1S);
                    break;
                case 'tide': // 潮汐 (波線)
                    c.strokeStyle = '#0284c7'; c.lineWidth = 2; c.lineCap = 'round';
                    [2.2, 3.4].forEach(y => {
                        c.beginPath();
                        for (let x = 1; x <= 5; x += 0.25)
                            c.lineTo(at(x, y).x, at(x, y + Math.sin(x * 2) * 0.15).y);
                        c.stroke();
                    });
                    break;
                case 'pulse': // 脈動 (石+波紋)
                    dot(3,3,P1,P1S);
                    c.strokeStyle = P1S; c.lineWidth = 1.6;
                    [0.6, 1.0].forEach(rr => {
                        c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*rr, 0, Math.PI*2); c.globalAlpha = 1.3 - rr; c.stroke(); c.globalAlpha = 1;
                    });
                    break;
                case 'recycle': // 再生 (回転矢印)
                    c.strokeStyle = P1S; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*1.1, -0.4, Math.PI*1.4); c.stroke();
                    c.beginPath(); c.moveTo(at(4.1,2.6).x, at(4.1,2.6).y); c.lineTo(at(3.9,3.2).x, at(3.9,3.2).y); c.lineTo(at(4.5,3.1).x, at(4.5,3.1).y); c.stroke();
                    dot(3,3,P2,P2S,R*0.6);
                    break;
                case 'lib': // 呼吸 (石+呼吸点)
                    dot(3,3,P1,P1S);
                    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => {
                        const p = at(3 + dx * 1.1, 3 + dy * 1.1);
                        c.strokeStyle = '#16a34a'; c.lineWidth = 1.6;
                        c.beginPath(); c.arc(p.x, p.y, cell*0.16, 0, Math.PI*2); c.stroke();
                    });
                    break;
                case 'rain': // 石雨 (落下ブロック)
                    c.fillStyle = 'rgba(100,110,130,0.75)';
                    c.beginPath(); c.roundRect(at(1.6,1.4).x, at(1.6,1.4).y, cell*0.8, cell*0.8, cell*0.15); c.fill();
                    c.beginPath(); c.roundRect(at(3.6,2.2).x, at(3.6,2.2).y, cell*0.8, cell*0.8, cell*0.15); c.fill();
                    dot(2.6,4.4,P1,P1S);
                    break;
                case 'split': // 分裂 (半分敵化)
                    dot(1.8,3,P1,P1S); dot(2.8,3,P1,P1S); dot(3.8,3,P2,P2S); dot(4.8,3,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 1.6; c.setLineDash([2,2]);
                    c.beginPath(); c.moveTo(at(3.3,1.6).x, at(3.3,1.6).y); c.lineTo(at(3.3,4.4).x, at(3.3,4.4).y); c.stroke();
                    c.setLineDash([]);
                    break;
                case 'mini': // 少子 (小さい方勝ち)
                    c.fillStyle = P1S; c.font = `bold ${cell*1.3}px sans-serif`;
                    c.fillText('＜', at(3,3.2).x, at(3,3.2).y);
                    dot(1.6,3,P1,P1S,R*0.55); dot(4.4,3,P2,P2S);
                    break;
                case 'grenade': // 榴弾 (爆発)
                    dot(3,3,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.lineCap = 'round';
                    [[0,-1],[0.7,-0.7],[1,0],[0.7,0.7],[0,1],[-0.7,0.7],[-1,0],[-0.7,-0.7]].forEach(([dx,dy]) => {
                        const a = at(3 + dx * 0.9, 3 + dy * 0.9), b = at(3 + dx * 1.6, 3 + dy * 1.6);
                        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
                    });
                    break;
                case 'infect': // 感染 (色が伝播)
                    dot(2.2,3,P1,P1S); dot(3.8,3,P2,P2S);
                    c.strokeStyle = P1; c.lineWidth = 1.8; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(2.7,3).x, at(2.7,3).y); c.lineTo(at(3.3,3).x, at(3.3,3).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3,2.7).x, at(3,2.7).y); c.lineTo(at(3.4,3).x, at(3.4,3).y); c.lineTo(at(3,3.3).x, at(3,3.3).y); c.stroke();
                    break;
                case 'bond': // 結合 (手錠風に連結した異色)
                    dot(2.4,3,P1,P1S); dot(3.6,3,P2,P2S);
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.moveTo(at(2.4,3).x, at(2.4,3).y); c.lineTo(at(3.6,3).x, at(3.6,3).y); c.stroke();
                    break;
                case 'rim': // 淵 (外周強調)
                    c.strokeStyle = '#ca8a04'; c.lineWidth = 2.5;
                    c.strokeRect(at(0.8,0.8).x, at(0.8,0.8).y, cell*4.4, cell*4.4);
                    dot(3,3,P1,P1S); dot(1.4,1.4,P2,P2S);
                    break;
                case 'budget': // 手数 (時計)
                    c.strokeStyle = P1S; c.lineWidth = 2;
                    c.beginPath(); c.arc(at(3,3).x, at(3,3).y, cell*1.2, 0, Math.PI*2); c.stroke();
                    c.beginPath(); c.moveTo(at(3,3).x, at(3,3).y); c.lineTo(at(3,2.2).x, at(3,2.2).y); c.stroke();
                    c.beginPath(); c.moveTo(at(3,3).x, at(3,3).y); c.lineTo(at(3.7,3.4).x, at(3.7,3.4).y); c.stroke();
                    break;
                case 'front': // 前線 (進行する線)
                    c.strokeStyle = '#16a34a'; c.lineWidth = 2.5;
                    c.beginPath(); c.moveTo(at(0.8,2.4).x, at(0.8,2.4).y); c.lineTo(at(5.2,2.4).x, at(5.2,2.4).y); c.stroke();
                    c.fillStyle = '#16a34a';
                    c.beginPath(); c.moveTo(at(2.6,1.4).x, at(2.6,1.4).y); c.lineTo(at(3.4,1.4).x, at(3.4,1.4).y); c.lineTo(at(3,2.1).x, at(3,2.1).y); c.fill();
                    dot(2,4,P1,P1S); dot(4,4,P2,P2S);
                    break;
                case 'charge': // 溜め (雷マーク)
                    c.fillStyle = '#eab308';
                    c.beginPath(); c.moveTo(at(3.4,1.2).x, at(3.4,1.2).y); c.lineTo(at(2.4,3.2).x, at(2.4,3.2).y);
                    c.lineTo(at(3.1,3.2).x, at(3.1,3.2).y); c.lineTo(at(2.6,4.8).x, at(2.6,4.8).y);
                    c.lineTo(at(4,2.7).x, at(4,2.7).y); c.lineTo(at(3.3,2.7).x, at(3.3,2.7).y); c.fill();
                    break;
                case 'shuffle': // 混成 (シャッフル矢印)
                    c.strokeStyle = P1S; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(at(1.4,2).x, at(1.4,2).y); c.lineTo(at(4.6,4).x, at(4.6,4).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.2,3.6).x, at(4.2,3.6).y); c.lineTo(at(4.7,4).x, at(4.7,4).y); c.lineTo(at(4.2,4.4).x, at(4.2,4.4).y); c.stroke();
                    c.beginPath(); c.moveTo(at(4.6,2).x, at(4.6,2).y); c.lineTo(at(1.4,4).x, at(1.4,4).y); c.stroke();
                    break;
                case 'tax': // 関税 (¥マーク)
                    c.fillStyle = P1S; c.font = `bold ${cell*1.1}px sans-serif`;
                    c.fillText('¥', at(2.4,3.2).x, at(2.4,3.2).y);
                    dot(4.2,3,P2,P2S);
                    break;
                case 'crosswall': // 十字壁
                    for (let i = 0; i < 5; i++) { blk(i, 2, '#6b7280', '#4b5563'); blk(2, i, '#6b7280', '#4b5563'); }
                    dot(0.8,0.8,P1,P1S); dot(3.2,0.8,P2,P2S); dot(0.8,3.2,P2,P2S); dot(3.2,3.2,P1,P1S);
                    break;
                case 'polar': // 中央が壁・外周のみ
                    for (let i = 1; i < 4; i++) for (let j = 1; j < 4; j++) blk(i, j, '#6b7280', '#4b5563');
                    dot(0,2,P1,P1S); dot(4,2,P2,P2S); dot(2,0,P2,P2S); dot(2,4,P1,P1S);
                    break;
                case 'micro': // 細密5路
                    dot(2,2,P1,P1S); dot(2.7,2.7,P2,P2S); dot(1.5,2.5,P2,P2S,cell*0.3);
                    dot(3.3,2,P1,P1S,cell*0.3); dot(2,3.5,P1,P1S,cell*0.3); break;
                case 'jump': // 距離2ジャンプ
                    dot(1,2,P1,P1S);
                    c.strokeStyle = '#c9b96a'; c.lineWidth = 2; c.lineCap = 'round';
                    c.setLineDash([4,4]); c.beginPath();
                    { const p = at(1,2), q = at(3,2); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); }
                    c.stroke(); c.setLineDash([]);
                    dot(3,2,P1,P1S,cell*0.34); dot(3.5,3.5,P2,P2S); break;
                case 'noko': // コウ形
                    dot(2,1,P2,P2S); dot(1,2,P2,P2S); dot(3,2,P2,P2S);
                    dot(2,2,P1,P1S); dot(2,3,P1,P1S); dot(2,2.6,P1,P1S,cell*0.3); break;
                case 'chaos': // 混沌 (壁+石+爆発)
                    blk(1,1,'#6b7280','#4b5563'); blk(4,3.5,'#6b7280','#4b5563');
                    dot(2,2,P1,P1S); dot(2.8,2.5,P2,P2S); dot(1.2,3.5,P2,P2S);
                    c.fillStyle = '#e25555'; c.beginPath();
                    { const p = at(4,1); c.arc(p.x, p.y, cell*0.34, 0, Math.PI*2); }
                    c.fill(); break;
                case 'greed': // 強欲 (囲む矢印)
                    dot(3,3,P2,P2S);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 1.8; c.lineCap = 'round';
                    [[1.6,3],[4.4,3],[3,1.6],[3,4.4]].forEach(([x,y]) => {
                        c.beginPath(); c.moveTo(at(x,y).x, at(x,y).y);
                        const t = at(3 + (3-x)*0.25, 3 + (3-y)*0.25);
                        c.lineTo(t.x, t.y); c.stroke();
                    });
                    break;
                case 'sentry': // 番兵: 交互行で睨み合う二軍
                    [[1.6,2.2],[3,2.2],[4.4,2.2]].forEach(([x,y]) => dot(x, y, P1, P1S));
                    [[1.6,4.4],[3,4.4],[4.4,4.4]].forEach(([x,y]) => dot(x, y, P2, P2S));
                    seg(1.2,3.3,4.8,3.3,'rgba(217,119,6,0.7)',1.5);
                    break;
                case 'bank': // 銀行: 円コインと積立バー
                    ring(3,2.6,cell*1.05,'#b45309',cell*0.9);
                    c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(at(3,2.6).x, at(3,2.6).y, cell*0.9, 0, Math.PI*2); c.fill();
                    txt('¥', 3, 2.62, '#b45309');
                    c.fillStyle = '#b45309'; c.fillRect(at(1.9,4.3).x, at(1.9,4.3).y, cell*0.5, cell*0.45);
                    c.fillRect(at(2.8,4.0).x, at(2.8,4.0).y, cell*0.5, cell*0.75);
                    c.fillRect(at(3.7,3.7).x, at(3.7,3.7).y, cell*0.5, cell*1.05);
                    break;
                case 'bet': // 賭: カジノチップ
                    ring(3,3.3,cell*1.25,'#d97706',cell*0.55);
                    ring(3,3.3,cell*0.72,'#d97706',1.5);
                    [0,1,2,3].forEach(i => {
                        const a = i * Math.PI/2;
                        const p1 = at(3 + Math.cos(a)*1.15, 3.3 + Math.sin(a)*1.15);
                        const p2 = at(3 + Math.cos(a)*1.5, 3.3 + Math.sin(a)*1.5);
                        c.strokeStyle = '#d97706'; c.lineWidth = 2.5;
                        c.beginPath(); c.moveTo(p1.x,p1.y); c.lineTo(p2.x,p2.y); c.stroke();
                    });
                    break;
                case 'bingo': // ビンゴ: 5x5カードの斜めライン
                    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++)
                        dot(1.4 + i*0.85, 1.4 + j*0.85, (i===j) ? '#d97706' : '#a8926a', (i===j) ? '#92400e' : '#8a7455', cell*0.24);
                    seg(1.4,1.4,4.8,4.8,'#92400e',2);
                    break;
                case 'bishop': // 角行: 斜線の射程
                    seg(1.2,5.4,5.4,1.2,'rgba(217,119,6,0.8)',2);
                    dot(1.7,4.9,P1,P1S); dot(4.9,1.7,P2,P2S);
                    break;
                case 'blind': // 盲点: 見える石と見えない石
                    dot(2.4,3.3,P1,P1S);
                    c.setLineDash([4,3]); ring(4.7,3.3,R,'rgba(62,34,17,0.55)'); c.setLineDash([]);
                    break;
                case 'bomb': // 爆弾: 導火線付きの爆弾石
                    dot(2.9,3.9,P1,P1S,cell*0.95);
                    seg(3.5,3.0,4.1,2.1,P1S,2);
                    c.strokeStyle = '#f59e0b'; c.lineWidth = 2;
                    [[0,-0.5],[0.45,-0.15],[0.28,0.45],[-0.28,0.45],[-0.45,-0.15]].forEach(([dx,dy]) =>
                        seg(4.1+dx*0.5, 2.1+dy*0.5, 4.1+dx, 2.1+dy, '#f59e0b', 1.6));
                    break;
                case 'border': // 国境: 点線を挟んで接する両軍
                    c.setLineDash([3,3]); seg(3.3,0.8,3.3,5.8,'rgba(62,34,17,0.6)',1.5); c.setLineDash([]);
                    dot(2.6,2.6,P1,P1S); dot(2.6,4.0,P1,P1S);
                    dot(4.0,2.6,P2,P2S); dot(4.0,4.0,P2,P2S);
                    break;
                case 'bury': // 埋蔵: 半分埋まった石と「?」
                    dot(2.8,4.0,P1,P1S,cell*0.9);
                    seg(1.2,4.7,5.4,4.7,'rgba(62,34,17,0.8)',2.5);
                    txt('?', 4.4, 2.1, '#92400e', cell*1.5);
                    break;
                case 'camo': // 迷彩: 敵色に化ける石
                    dot(3.3,3.3,P2,P2S,cell*1.0);
                    c.save(); const cp = at(3.3,3.3);
                    c.beginPath(); c.arc(cp.x, cp.y, cell*1.0, Math.PI*0.5, Math.PI*1.5); c.closePath();
                    c.fillStyle = P1; c.fill(); c.restore();
                    break;
                case 'card': // 札: 一枚のカード
                    c.save(); c.translate(at(3.2,3.4).x, at(3.2,3.4).y); c.rotate(-0.25);
                    c.fillStyle = '#fef3c7'; c.strokeStyle = '#78350f'; c.lineWidth = 1.5;
                    if (c.roundRect) { c.beginPath(); c.roundRect(-cell*0.95, -cell*1.35, cell*1.9, cell*2.7, cell*0.2); c.fill(); c.stroke(); }
                    c.fillStyle = '#1c1917'; c.beginPath(); c.arc(0, 0, cell*0.4, 0, Math.PI*2); c.fill();
                    c.restore();
                    break;
                case 'crown': // 王冠: 王冠を被る石
                    dot(3.3,4.2,P1,P1S,cell*0.95);
                    c.fillStyle = '#fbbf24'; c.strokeStyle = '#b45309'; c.lineWidth = 1.3;
                    c.beginPath();
                    const cw = at(3.3,3.15);
                    c.moveTo(cw.x - cell*1.0, cw.y + cell*0.35);
                    c.lineTo(cw.x - cell*0.85, cw.y - cell*0.5);
                    c.lineTo(cw.x - cell*0.45, cw.y + cell*0.02);
                    c.lineTo(cw.x, cw.y - cell*0.75);
                    c.lineTo(cw.x + cell*0.45, cw.y + cell*0.02);
                    c.lineTo(cw.x + cell*0.85, cw.y - cell*0.5);
                    c.lineTo(cw.x + cell*1.0, cw.y + cell*0.35);
                    c.closePath(); c.fill(); c.stroke();
                    break;
                case 'cloak': // 隠密: 不可視の影
                    c.setLineDash([4,3]);
                    ring(2.6,3.1,R,'rgba(62,34,17,0.5)');
                    ring(4.2,4.1,R,'rgba(120,53,15,0.5)');
                    c.setLineDash([]);
                    dot(3.3,5.2,P1,P1S,R,0.35);
                    break;
                case 'clock': // 時計: 回る針と目盛
                    ring(3.3,3.3,cell*1.35,P1,2);
                    [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(a => {
                        const p1 = at(3.3+Math.cos(a)*1.18, 3.3+Math.sin(a)*1.18);
                        const p2 = at(3.3+Math.cos(a)*1.42, 3.3+Math.sin(a)*1.42);
                        c.strokeStyle=P1; c.lineWidth=2; c.beginPath(); c.moveTo(p1.x,p1.y); c.lineTo(p2.x,p2.y); c.stroke();
                    });
                    seg(3.3,3.3,3.3,2.15,P1,2.2); seg(3.3,3.3,4.15,3.75,P1,2.2);
                    break;
                case 'contract': // 請負: 契約書と印鑑
                    blk(2.9,3.1,'#fef3c7','#78350f');
                    seg(2.5,2.7,3.3,2.7,'#a8926a',1.4); seg(2.5,3.1,3.3,3.1,'#a8926a',1.4);
                    dot(4.4,4.4,'#dc2626','#7f1d1d',cell*0.55);
                    break;
                case 'core': // 内核: 中央の正方形核
                    c.fillStyle = 'rgba(217,119,6,0.25)';
                    c.fillRect(at(2.1,2.1).x, at(2.1,2.1).y, cell*2.4, cell*2.4);
                    c.strokeStyle = '#b45309'; c.lineWidth = 1.6;
                    c.strokeRect(at(2.1,2.1).x, at(2.1,2.1).y, cell*2.4, cell*2.4);
                    dot(3.3,3.3,P1,P1S);
                    [[1.1,1.1],[5.5,1.1],[1.1,5.5],[5.5,5.5]].forEach(([x,y]) => dot(x,y,'#a8926a','#8a7455',cell*0.22));
                    break;
                case 'corner': // 隅田川: 四隅から広がる
                    [[1.4,1.4],[5.2,1.4],[1.4,5.2],[5.2,5.2]].forEach(([x,y]) => dot(x,y,P1,P1S));
                    bond(1.4,1.4,2.6,2.6,3); bond(5.2,5.2,4.0,4.0,3);
                    dot(2.6,2.6,P2,P2S); dot(4.0,4.0,P2,P2S);
                    break;
                case 'dart': // 的: 同心円ターゲット
                    ring(3.3,3.3,cell*1.5,'#b45309',1.5);
                    ring(3.3,3.3,cell*0.95,'#b45309',1.5);
                    ring(3.3,3.3,cell*0.45,'#b45309',1.5);
                    dot(3.3,3.3,'#dc2626','#7f1d1d',cell*0.25);
                    break;
                case 'decoy': // 囮: 本物と消えゆく偽物
                    dot(2.5,3.2,P1,P1S);
                    dot(4.5,3.2,P1,P1S,R,0.3);
                    seg(4.2,2.9,4.8,3.5,'#dc2626',2); seg(4.8,2.9,4.2,3.5,'#dc2626',2);
                    break;
                case 'dice': // 賽: 五目の骰子
                    blk(3.2,3.3,'#fef3c7','#78350f');
                    [[-0.28,-0.28],[0.28,-0.28],[0,0],[-0.28,0.28],[0.28,0.28]].forEach(([dx,dy]) => {
                        const p = at(3.2+dx, 3.3+dy);
                        c.fillStyle = '#1c1917'; c.beginPath(); c.arc(p.x, p.y, cell*0.09, 0, Math.PI*2); c.fill();
                    });
                    break;
                case 'dusk': // 薄暮: 中央だけ明るい
                    dot(3.3,3.3,P1,P1S);
                    [[1.6,1.6],[5,1.6],[1.6,5],[5,5]].forEach(([x,y]) => dot(x,y,P1,P1S,R,0.28));
                    break;
                case 'dist': // 距離: 前進する石と矢印
                    [[2.2,4.8],[2.2,3.8],[2.2,2.8]].forEach(([x,y]) => dot(x,y,P1,P1S));
                    tri(4.6,1.6,cell*0.5,'#d97706','#92400e');
                    seg(4.6,5.2,4.6,2.2,'rgba(217,119,6,0.8)',2);
                    break;
                case 'dual': // 双王: 二つの王冠石
                    dot(2.5,3.8,P1,P1S,cell*0.8); dot(4.3,3.8,P2,P2S,cell*0.8);
                    tri(2.5,2.7,cell*0.45,'#fbbf24','#b45309');
                    tri(4.3,2.7,cell*0.45,'#fbbf24','#b45309');
                    break;
                case 'dynasty': // 王朝: 連続不敗の勢い
                    [[1.9,4.3],[3.3,4.3],[4.7,4.3]].forEach(([x,y]) => dot(x,y,P1,P1S));
                    c.strokeStyle='#fbbf24'; c.lineWidth=2.5; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.0).x, at(3.3,3.0).y, cell*1.35, Math.PI*1.15, Math.PI*1.85); c.stroke();
                    txt('×5', 4.6, 1.6, '#b45309', cell*0.8);
                    break;
                case 'echo': // 残響: 石から広がる波紋
                    dot(3.3,3.3,P1,P1S);
                    ring(3.3,3.3,cell*0.75,'rgba(217,119,6,0.75)',1.5);
                    ring(3.3,3.3,cell*1.2,'rgba(217,119,6,0.4)',1.3);
                    break;
                case 'edge': // 辺縁: 周縁帯だけの陣地
                    [[1.4,1.4],[3.3,1.4],[5.2,1.4],[1.4,3.3],[5.2,3.3],[1.4,5.2],[3.3,5.2],[5.2,5.2]].forEach(([x,y]) =>
                        dot(x,y,P1,P1S,cell*0.32));
                    c.strokeStyle='rgba(217,119,6,0.7)'; c.lineWidth=1.6; c.setLineDash([4,3]);
                    c.strokeRect(at(2.2,2.2).x, at(2.2,2.2).y, cell*2.2, cell*2.2); c.setLineDash([]);
                    break;
                case 'fade': // 褪色: 古いほど褪せる
                    dot(1.9,3.3,P1,P1S); dot(3.3,3.3,P1,P1S,R,0.55); dot(4.7,3.3,P1,P1S,R,0.2);
                    break;
                case 'fate': // 運命: 予告された運命の手
                    dot(3.0,3.8,P1,P1S);
                    txt('★', 4.3, 2.2, '#d97706', cell*1.1);
                    break;
                case 'flag': // 旗: 旗竿と旗石
                    seg(2.6,5.4,2.6,1.4,P1S,2.5);
                    c.fillStyle='#dc2626'; c.strokeStyle='#7f1d1d'; c.lineWidth=1.2;
                    c.beginPath(); const fp = at(2.6,1.7);
                    c.moveTo(fp.x,fp.y); c.lineTo(fp.x+cell*1.7,fp.y+cell*0.55); c.lineTo(fp.x,fp.y+cell*1.1);
                    c.closePath(); c.fill(); c.stroke();
                    dot(2.6,5.5,P1,P1S,cell*0.55);
                    break;
                case 'flank': // 側面: 十字の挟撃
                    dot(3.3,3.3,P2,P2S);
                    [[3.3,2.3],[3.3,4.3],[2.3,3.3],[4.3,3.3]].forEach(([x,y]) => dot(x,y,P1,P1S));
                    break;
                case 'gacha': // 抽選: ガチャカプセル
                    c.save();
                    const gp = at(3.3,3.3);
                    c.beginPath(); c.arc(gp.x, gp.y, cell*1.15, Math.PI, 0); c.fillStyle='#dc2626'; c.fill();
                    c.beginPath(); c.arc(gp.x, gp.y, cell*1.15, 0, Math.PI); c.fillStyle='#fef3c7'; c.fill();
                    c.strokeStyle='#78350f'; c.lineWidth=1.5; c.beginPath(); c.arc(gp.x, gp.y, cell*1.15, 0, Math.PI*2); c.stroke();
                    c.restore();
                    txt('SSR', 3.3, 3.35, '#78350f', cell*0.62);
                    break;
                case 'goal': // 得点: 中央ゴールと入った石
                    c.strokeStyle='#b45309'; c.lineWidth=1.8;
                    c.strokeRect(at(2.3,2.3).x, at(2.3,2.3).y, cell*2.0, cell*2.0);
                    dot(3.3,3.3,P1,P1S); txt('+1', 4.9, 1.7, '#d97706', cell*0.75);
                    break;
                case 'illusion': // 幻影: 敵色に見える石
                    dot(3.3,3.3,P1,P1S,cell*0.95,0.45);
                    dot(3.3,3.3,P2,P2S,cell*0.55);
                    break;
                case 'item': // 道具: 盤上の宝箱アイテム
                    blk(2.4,4.0,'#d97706','#92400e');
                    seg(2.4,3.6,2.4,4.4,'#92400e',1.4);
                    txt('★', 4.4, 2.3, '#d97706', cell*1.0);
                    dot(4.4,4.4,P1,P1S,R,0.9);
                    break;
                case 'jackpot': // 百倍: 倍率アップの7
                    txt('7', 2.2, 2.4, '#d97706', cell*1.5);
                    txt('7', 3.5, 3.4, '#b45309', cell*1.5);
                    txt('7', 4.8, 4.4, '#dc2626', cell*1.5);
                    break;
                case 'knight': // 桂馬: L字ジャンプ
                    dot(2.5,4.6,P1,P1S);
                    c.setLineDash([4,3]); seg(2.5,4.6,2.5,2.6,'rgba(217,119,6,0.9)',2); seg(2.5,2.6,4.5,2.6,'rgba(217,119,6,0.9)',2); c.setLineDash([]);
                    dot(4.5,2.6,P2,P2S);
                    break;
                case 'leash': // 繋留: 最古の石に繋がれた鎖
                    dot(1.8,4.6,P1,P1S);
                    c.setLineDash([3,3]); seg(1.8,4.6,4.4,2.6,'#b45309',2); c.setLineDash([]);
                    dot(4.4,2.6,P2,P2S); ring(4.4,2.6,cell*0.75,'rgba(62,34,17,0.5)',1.3);
                    break;
                case 'link': // 架橋: 辺を結ぶ石の橋
                    bond(2.0,1.2,3.2,2.6,3); bond(3.2,2.6,2.4,4.0,3); bond(2.4,4.0,4.4,5.4,3);
                    [[2.0,1.2],[3.2,2.6],[2.4,4.0],[4.4,5.4]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.38));
                    break;
                case 'loop': // 周回: 外周を回る環
                    c.strokeStyle='#b45309'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.3).x, at(3.3,3.3).y, cell*1.6, Math.PI*0.2, Math.PI*1.6); c.stroke();
                    tri(4.9,4.6,cell*0.4,'#b45309','#92400e',Math.PI*0.7);
                    dot(3.3,3.3,P1,P1S);
                    break;
                case 'market': // 相場: 乱高下のチャート
                    seg(1.4,4.6,2.4,2.8,'#dc2626',2); seg(2.4,2.8,3.2,3.8,'#dc2626',2);
                    seg(3.2,3.8,4.2,2.0,'#dc2626',2); seg(4.2,2.0,5.2,3.0,'#dc2626',2);
                    [[2.4,2.8],[3.2,3.8],[4.2,2.0],[5.2,3.0]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.28));
                    seg(1.2,5.2,5.4,5.2,'rgba(62,34,17,0.6)',1.5);
                    break;
                case 'mirage': // 蜃気楼: 揺らぐ幻影石
                    dot(3.3,3.3,P1,P1S,R,0.45);
                    c.strokeStyle='rgba(217,119,6,0.8)'; c.lineWidth=1.5; c.lineCap='round';
                    [[1.3],[3.3],[5.3]].forEach(([y]) => {
                        c.beginPath(); c.moveTo(at(1.3,y).x, at(1.3,y).y);
                        for (let x = 1.3; x <= 5.3; x += 0.5)
                            c.lineTo(at(x, y + Math.sin(x*2)*0.14).x, at(x, y + Math.sin(x*2)*0.14).y);
                        c.stroke();
                    });
                    break;
                case 'modulo': // 剰余: 周期で回る帯
                    [0,1,2].forEach(i => {
                        c.fillStyle = ['rgba(28,25,23,0.5)','rgba(217,119,6,0.45)','rgba(168,146,106,0.5)'][i];
                        c.fillRect(at(1.1,1.3+i*1.4).x, at(1.1,1.3+i*1.4).y, cell*4.4, cell*0.85);
                    });
                    dot(3.3,3.6,P2,P2S);
                    break;
                case 'number': // 数読: 呼吸点数が見える
                    dot(2.7,3.3,P1,P1S); txt('4', 1.7, 2.4, '#b45309', cell*0.8);
                    dot(4.5,4.1,P2,P2S); txt('1', 5.4, 3.3, '#dc2626', cell*0.8);
                    break;
                case 'over': // 大差: 圧倒的な勢力差
                    [[1.9,2.6],[2.9,2.6],[3.9,2.6],[1.9,3.6],[2.9,3.6],[3.9,3.6]].forEach(([x,y]) =>
                        dot(x,y,P1,P1S,cell*0.3));
                    dot(5.3,4.6,P2,P2S,cell*0.32);
                    break;
                case 'peace': // 平和: 手を取り合う陣地
                    dot(2.6,3.3,P1,P1S); dot(4.0,3.3,P2,P2S);
                    c.strokeStyle='#15803d'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(2.6,2.2).x, at(2.6,2.2).y);
                    c.quadraticCurveTo(at(3.3,1.4).x, at(3.3,1.4).y, at(4.0,2.2).x, at(4.0,2.2).y); c.stroke();
                    break;
                case 'parity': // 偶奇: 市松の染分け
                    blk(2.3,2.3,P1,P1S); blk(3.9,2.3,P2,P2S);
                    blk(2.3,3.9,P2,P2S); blk(3.9,3.9,P1,P1S);
                    break;
                case 'peak': // 高峰: 標高の山
                    c.fillStyle='rgba(168,146,106,0.7)'; c.strokeStyle='#8a7455'; c.lineWidth=1.4;
                    c.beginPath();
                    c.moveTo(at(1.0,5.4).x, at(1.0,5.4).y); c.lineTo(at(3.3,1.3).x, at(3.3,1.3).y);
                    c.lineTo(at(5.6,5.4).x, at(5.6,5.4).y); c.closePath(); c.fill(); c.stroke();
                    dot(3.3,2.6,P1,P1S,cell*0.3); dot(2.6,4.1,P2,P2S,cell*0.3); dot(4.0,4.1,P1,P1S,cell*0.3);
                    break;
                case 'penta': // 五連: 五つ並んだ石
                    [0,1,2,3,4].forEach(i => dot(1.3+i*1.0, 3.3, i===4?P2:P1, i===4?P2S:P1S, cell*0.4));
                    break;
                case 'pole': // 極軸: 中央十字軸
                    seg(3.3,0.9,3.3,5.7,'rgba(62,34,17,0.5)',1.8); seg(0.9,3.3,5.7,3.3,'rgba(62,34,17,0.5)',1.8);
                    dot(3.3,3.3,P1,P1S); dot(3.3,2.3,P2,P2S); dot(2.3,3.3,P2,P2S);
                    break;
                case 'pot': // 壺: アゲハマを蓄える壺
                    c.fillStyle='#a8926a'; c.strokeStyle='#6b5738'; c.lineWidth=1.5;
                    c.beginPath(); c.ellipse(at(3.3,4.0).x, at(3.3,4.0).y, cell*1.35, cell*1.15, 0, 0, Math.PI*2); c.fill(); c.stroke();
                    c.fillStyle='#6b5738'; c.fillRect(at(2.7,2.6).x, at(2.7,2.6).y, cell*1.2, cell*0.35);
                    [[2.9,3.8],[3.5,3.8],[3.2,4.3]].forEach(([x,y]) => dot(x,y,P2,P2S,cell*0.22));
                    break;
                case 'prime': // 素数: 疎らな星座
                    [[1.6,1.6],[3.3,2.4],[5.0,1.9],[2.2,4.6],[4.6,5.0]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.32));
                    bond(1.6,1.6,3.3,2.4,2); bond(3.3,2.4,5.0,1.9,2); bond(3.3,2.4,2.2,4.6,2); bond(2.2,4.6,4.6,5.0,2);
                    break;
                case 'meteor': // 預言: 落下する隕石
                    seg(5.3,1.1,3.6,2.8,'#dc2626',3); seg(5.0,1.5,4.5,2.0,'#f59e0b',4);
                    dot(3.3,3.1,P1,P1S,cell*0.6);
                    ring(3.3,4.6,cell*0.9,'rgba(62,34,17,0.6)',1.5);
                    ring(3.3,4.6,cell*1.35,'rgba(62,34,17,0.3)',1.2);
                    break;
                case 'radar': // 探知: レーダー掃引
                    ring(3.3,3.3,cell*1.55,'#15803d',1.6);
                    ring(3.3,3.3,cell*0.8,'#15803d',1.2);
                    c.fillStyle='rgba(21,128,61,0.25)';
                    c.beginPath(); c.moveTo(at(3.3,3.3).x, at(3.3,3.3).y);
                    c.arc(at(3.3,3.3).x, at(3.3,3.3).y, cell*1.55, -Math.PI/2, -Math.PI/6); c.closePath(); c.fill();
                    seg(3.3,3.3,4.6,2.1,'#15803d',2);
                    dot(2.3,4.2,'#dc2626','#7f1d1d',cell*0.22);
                    break;
                case 'rook': // 飛車: 縦横の射程
                    seg(3.3,0.9,3.3,5.7,'rgba(217,119,6,0.75)',2); seg(0.9,3.3,5.7,3.3,'rgba(217,119,6,0.75)',2);
                    dot(3.3,3.3,P1,P1S,cell*0.75);
                    break;
                case 'row': // 行進: 上から下へ回る対象行
                    c.fillStyle='rgba(217,119,6,0.3)'; c.fillRect(at(0.9,2.9).x, at(0.9,2.9).y, cell*4.8, cell*0.9);
                    [[1.5,3.3],[3.3,3.3],[5.1,3.3]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.36));
                    tri(5.6,4.9,cell*0.4,'#b45309','#92400e',Math.PI/2);
                    seg(1.5,4.9,5.0,4.9,'rgba(62,34,17,0.5)',1.4);
                    break;
                case 'scarce': // 寡占: 4個で閉鎖される行
                    [0,1,2,3].forEach(i => dot(1.5+i*0.95, 2.6, P1, P1S, cell*0.34));
                    seg(5.2,2.0,5.9,3.3,'#dc2626',2.2); seg(5.9,2.0,5.2,3.3,'#dc2626',2.2);
                    seg(1.2,4.4,5.4,4.4,'rgba(62,34,17,0.55)',1.6);
                    break;
                case 'scatter': // 散布: 中心から3マス環に撒く
                    dot(3.3,3.3,P1,P1S);
                    for (let i = 0; i < 6; i++) {
                        const a = i * Math.PI/3 + 0.3;
                        dot(3.3+Math.cos(a)*1.9, 3.3+Math.sin(a)*1.9, P2, P2S, cell*0.3);
                    }
                    c.setLineDash([3,3]); ring(3.3,3.3,cell*1.9,'rgba(62,34,17,0.35)',1.2); c.setLineDash([]);
                    break;
                case 'quantum': // 量子: 重ね合わせの二色石
                    dot(3.0,3.3,P1,P1S,cell*0.85,0.75);
                    dot(3.7,3.3,P2,P2S,cell*0.85,0.75);
                    txt('?', 3.35, 1.5, '#b45309', cell*0.9);
                    break;
                case 'scout': // 斥候: 双眼のレンズ
                    ring(2.7,3.1,cell*0.62,P1,2); ring(4.0,3.1,cell*0.62,P1,2);
                    seg(3.35,3.1,3.35,3.1,P1,2.5);
                    seg(2.7,3.7,2.7,4.5,P1,2); seg(4.0,3.7,4.0,4.5,P1,2);
                    dot(5.1,4.9,P1,P1S,cell*0.3);
                    break;
                case 'fan': // 回転扇: 回る扇区
                    [[-0.9,-0.5],[0.15,-1.05],[1.0,-0.35]].forEach(([rx,ry],i) => {
                        const a0 = Math.atan2(ry,rx), a1 = Math.atan2(ry*0.8+0.35, rx+0.1);
                        c.fillStyle=['rgba(217,119,6,0.55)','rgba(168,146,106,0.55)','rgba(28,25,23,0.45)'][i];
                        c.strokeStyle='#78350f'; c.lineWidth=1.2;
                        c.beginPath(); c.moveTo(at(3.3,3.6).x, at(3.3,3.6).y);
                        c.arc(at(3.3,3.6).x, at(3.3,3.6).y, cell*1.7, a0, a0+0.75); c.closePath(); c.fill(); c.stroke();
                    });
                    dot(3.3,3.6,P1,P1S,cell*0.35);
                    break;
                case 'slot': // 遊技: 3リールのスロット
                    [0,1,2].forEach(i => blk(2.0+i*1.3, 3.3, '#fef3c7', '#78350f'));
                    txt('7', 2.0, 3.3, '#dc2626', cell*0.7); txt('7', 3.3, 3.3, '#dc2626', cell*0.7); txt('7', 4.6, 3.3, '#dc2626', cell*0.7);
                    break;
                case 'sloth': // 遅滞: 封鎖された筋
                    dot(2.6,3.0,P1,P1S); dot(4.2,4.0,P2,P2S);
                    ring(2.6,3.0,cell*0.7,'#dc2626',2); seg(2.1,2.5,3.1,3.5,'#dc2626',2.2);
                    ring(4.2,4.0,cell*0.7,'#dc2626',2); seg(3.7,3.5,4.7,4.5,'#dc2626',2.2);
                    break;
                case 'smoke': // 煙幕: 上がる煙
                    [[2.5,4.3],[3.4,3.8],[4.3,4.4],[3.0,3.0]].forEach(([x,y],i) => {
                        c.fillStyle=`rgba(120,113,108,${0.55-i*0.1})`;
                        c.beginPath(); c.arc(at(x,y).x, at(x,y).y, cell*(0.75-i*0.08), 0, Math.PI*2); c.fill();
                    });
                    dot(2.4,5.2,P1,P1S,cell*0.3); dot(4.4,5.3,P2,P2S,cell*0.3);
                    break;
                case 'survey': // 測量: 囲んだ矩形のボーナス
                    c.setLineDash([4,3]); c.strokeStyle='#b45309'; c.lineWidth=1.8;
                    c.strokeRect(at(1.9,2.2).x, at(1.9,2.2).y, cell*2.8, cell*2.2); c.setLineDash([]);
                    [[1.9,2.2],[4.7,2.2],[1.9,4.4],[4.7,4.4]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.32));
                    txt('面積', 3.3, 3.3, '#92400e', cell*0.55);
                    break;
                case 'trap': // 罠: 空点に見える罠石
                    c.setLineDash([3,3]); ring(3.3,3.3,R,'rgba(62,34,17,0.5)'); c.setLineDash([]);
                    c.fillStyle='#dc2626'; c.strokeStyle='#7f1d1d'; c.lineWidth=1.2;
                    [[2.2,3.3,0],[4.4,3.3,Math.PI],[3.3,2.2,-Math.PI/2],[3.3,4.4,Math.PI/2]].forEach(([x,y,r]) =>
                        tri(x,y,cell*0.3,'#dc2626','#7f1d1d',r));
                    break;
                case 'triple': // 三手: 3石まとめて置く
                    [[2.6,3.6],[3.6,3.6],[3.1,2.7]].forEach(([x,y]) => dot(x,y,P1,P1S));
                    ring(3.1,3.35,cell*1.3,'rgba(217,119,6,0.6)',1.5);
                    txt('×3', 4.9, 1.9, '#b45309', cell*0.8);
                    break;
                case 'vote': // 選挙: 9区画の多数決
                    [[0,0,P1],[1,0,P2],[2,0,P1],[0,1,P1],[1,1,P2],[2,1,P1],[0,2,P2],[1,2,P1],[2,2,P2]].forEach(([i,j,f]) => {
                        c.fillStyle = f===P1?'rgba(28,25,23,0.7)':'rgba(254,243,199,0.9)';
                        c.strokeStyle='#78350f'; c.lineWidth=1;
                        c.fillRect(at(1.7+i*1.1,1.7+j*1.1).x, at(1.7+i*1.1,1.7+j*1.1).y, cell*0.95, cell*0.95);
                        c.strokeRect(at(1.7+i*1.1,1.7+j*1.1).x, at(1.7+i*1.1,1.7+j*1.1).y, cell*0.95, cell*0.95);
                    });
                    break;
                case 'xray': // 透視: X線の閃光
                    ring(3.3,3.3,cell*0.7,'#0e7490',1.8);
                    dot(3.3,3.3,'#0e7490','#155e75',cell*0.3);
                    [0,Math.PI/3,Math.PI*2/3,Math.PI,Math.PI*4/3,Math.PI*5/3].forEach(a =>
                        seg(3.3+Math.cos(a)*1.0, 3.3+Math.sin(a)*1.0, 3.3+Math.cos(a)*1.6, 3.3+Math.sin(a)*1.6, 'rgba(14,116,144,0.8)', 1.6));
                    break;
                case 'zip': // 縞封: 交互に食い違うジッパー
                    [0,1,2,3,4].forEach(i => dot(i%2?2.6:3.9, 1.4+i*0.95, i%2?P2:P1, i%2?P2S:P1S, cell*0.34));
                    seg(3.25,1.0,3.25,5.7,'rgba(62,34,17,0.4)',1.4);
                    break;
                case 'zone': // 区域: 9区画の制圧
                    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
                        const f = (i+j)%2 ? 'rgba(254,243,199,0.85)' : 'rgba(28,25,23,0.6)';
                        c.fillStyle=f; c.strokeStyle='#78350f'; c.lineWidth=1.2;
                        c.fillRect(at(1.55+i*1.2,1.55+j*1.2).x, at(1.55+i*1.2,1.55+j*1.2).y, cell*1.05, cell*1.05);
                        c.strokeRect(at(1.55+i*1.2,1.55+j*1.2).x, at(1.55+i*1.2,1.55+j*1.2).y, cell*1.05, cell*1.05);
                    }
                    dot(3.3,3.3,P2,P2S,cell*0.3);
                    break;
                case 'alchego': // 錬成: 弱い石が取跡へ転移
                    dot(2.3,3.3,P2,P2S,R,0.4);
                    seg(2.6,2.6,4.2,2.6,'#d97706',1.8); tri(4.5,2.6,cell*0.3,'#d97706','#92400e',Math.PI/2);
                    dot(4.6,3.8,P1,P1S);
                    break;
                case 'archergo': // 射手: 石から放たれる矢
                    dot(2.2,3.3,P1,P1S);
                    seg(2.9,3.3,5.0,3.3,'#92400e',2); tri(5.3,3.3,cell*0.4,'#92400e','#78350f',Math.PI/2);
                    seg(4.9,3.0,4.5,3.3,'#92400e',1.3); seg(4.9,3.6,4.5,3.3,'#92400e',1.3);
                    break;
                case 'archgo': // 橋: 石の上を渡る3連
                    dot(3.3,4.4,P1,P1S);
                    [[2.2,3.1],[3.3,2.6],[4.4,3.1]].forEach(([x,y]) => blk(x,y,P2,P2S));
                    break;
                case 'armorgo': // 装甲: 甲冑をまとう石
                    dot(3.3,3.3,P1,P1S); ring(3.3,3.3,cell*0.75,'#64748b',2.5);
                    break;
                case 'barbgo': // 槍: 1x5の長槍
                    [0,1,2,3,4].forEach(i => dot(1.3+i*0.95, 3.6, P1, P1S, cell*0.36));
                    tri(6.0,3.6,cell*0.45,'#92400e','#78350f',Math.PI/2); seg(5.0,3.6,6.0,3.6,'#92400e',2.5);
                    break;
                case 'billiardgo': // 撞球: 撞き飛ばす
                    dot(1.9,3.3,P1,P1S); seg(2.4,3.3,3.6,3.3,'rgba(62,34,17,0.6)',1.6); tri(3.7,3.3,cell*0.25,'#92400e','#78350f',Math.PI/2);
                    dot(4.9,3.3,P2,P2S); seg(4.9,3.3,5.6,2.4,'#78350f',1.5);
                    break;
                case 'blackjackgo': // 21: 二枚のカード
                    c.save(); c.translate(at(2.7,3.4).x,at(2.7,3.4).y); c.rotate(-0.2);
                    c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1.3;
                    c.beginPath(); c.roundRect?c.roundRect(-cell*0.6,-cell*0.85,cell*1.2,cell*1.7,cell*0.15):c.rect(-cell*0.6,-cell*0.85,cell*1.2,cell*1.7); c.fill(); c.stroke(); c.restore();
                    c.save(); c.translate(at(3.9,3.3).x,at(3.9,3.3).y); c.rotate(0.2);
                    c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1.3;
                    c.beginPath(); c.roundRect?c.roundRect(-cell*0.6,-cell*0.85,cell*1.2,cell*1.7,cell*0.15):c.rect(-cell*0.6,-cell*0.85,cell*1.2,cell*1.7); c.fill(); c.stroke(); c.restore();
                    txt('21',3.9,3.3,'#dc2626',cell*0.55);
                    break;
                case 'blockgo': // テトロ: 自由な4連
                    [[1.6,2.2],[2.5,2.2],[2.5,3.1],[3.4,3.1]].forEach(([x,y]) => blk(x,y,P1,P1S));
                    [[3.6,4.2],[4.5,4.2],[4.5,3.3],[5.4,3.3]].forEach(([x,y]) => blk(x,y,P2,P2S));
                    break;
                case 'bouncego': // 跳弾: 反射する軌道
                    seg(1.3,4.9,3.3,1.4,'#92400e',2); seg(3.3,1.4,5.2,3.8,'#92400e',2);
                    dot(1.3,4.9,P1,P1S,cell*0.5); dot(5.2,3.8,P2,P2S,cell*0.5);
                    break;
                case 'bridgego': // 海峡橋: 二つの陸と橋
                    [[1.6,3.0],[1.6,4.0]].forEach(([x,y]) => dot(x,y,P1,P1S,cell*0.4));
                    [[5.0,3.0],[5.0,4.0]].forEach(([x,y]) => dot(x,y,P2,P2S,cell*0.4));
                    bond(1.9,3.5,4.7,3.5,3);
                    seg(2.4,3.2,2.4,3.8,'rgba(62,34,17,0.6)',1.2); seg(4.2,3.2,4.2,3.8,'rgba(62,34,17,0.6)',1.2);
                    break;
                case 'cavego': // 洞窟: 石の周りだけ灯り
                    c.fillStyle='rgba(62,34,17,0.75)'; c.fillRect(cell*0.5,cell*0.5,cell*6,cell*6);
                    dot(3.3,3.3,P2,P2S);
                    ring(3.3,3.3,cell*1.3,'rgba(254,243,199,0.7)',2);
                    break;
                case 'cellgo': // 細胞: 7連ハニカム
                    [[0,0],[0.85,-0.5],[0.85,0.5],[1.7,-1],[1.7,0],[1.7,1],[2.55,0.5]].forEach(([dx,dy]) =>
                        dot(2.5+dx,3.4+dy,P1,P1S,cell*0.38));
                    break;
                case 'centrifugo': // 遠心: 外へ放たれる
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    [[1.5,1.5],[5.1,1.5],[1.5,5.1],[5.1,5.1]].forEach(([x,y]) => {
                        seg(3.3,3.3,x,y,'rgba(217,119,6,0.7)',1.4); dot(x,y,P2,P2S,cell*0.26);
                    });
                    break;
                case 'centripetgo': // 求心: 中心へ引かれる
                    dot(3.3,3.3,P1,P1S);
                    [[1.6,1.6],[5.0,1.6],[1.6,5.0],[5.0,5.0]].forEach(([x,y]) => {
                        seg(x,y,3.3+(3.3-x)*0.7,3.3+(3.3-y)*0.7,'rgba(217,119,6,0.7)',1.4);
                        dot(x,y,P2,P2S,cell*0.26);
                    });
                    break;
                case 'chambergo': // 4部屋: 十字隔壁
                    seg(3.3,0.8,3.3,5.8,'#6b5738',3); seg(0.8,3.3,5.8,3.3,'#6b5738',3);
                    [[2.2,2.2],[4.4,2.2],[2.2,4.4],[4.4,4.4]].forEach(([x,y],i) => dot(x,y,i%2?P2:P1,i%2?P2S:P1S,cell*0.34));
                    break;
                case 'checkergo': // 市松: 黒マス限定
                    for (let i=0;i<3;i++) for (let j=0;j<3;j++) {
                        c.fillStyle=(i+j)%2?'rgba(254,243,199,0.5)':'rgba(28,25,23,0.6)';
                        c.fillRect(at(1.7+i*1.1,1.7+j*1.1).x,at(1.7+i*1.1,1.7+j*1.1).y,cell,cell);
                    }
                    dot(2.2,2.2,P2,P2S,cell*0.32); dot(4.4,4.4,P2,P2S,cell*0.32);
                    break;
                case 'classgo': // 職業: 三種の兵
                    dot(1.8,3.6,P1,P1S,cell*0.4); txt('剣',1.8,2.4,'#92400e',cell*0.6);
                    dot(3.3,3.6,P1,P1S,cell*0.4); txt('弓',3.3,2.4,'#92400e',cell*0.6);
                    dot(4.8,3.6,P2,P2S,cell*0.4); txt('僧',4.8,2.4,'#92400e',cell*0.6);
                    break;
                case 'conveyorgo': // ベルト: 中央行の搬送
                    c.fillStyle='rgba(120,113,108,0.5)'; c.fillRect(at(0.9,2.9).x,at(0.9,2.9).y,cell*4.9,cell*0.9);
                    [0,1,2].forEach(i => tri(1.8+i*1.4,3.35,cell*0.28,'#57534e','#44403c',Math.PI/2));
                    dot(4.9,3.3,P1,P1S,cell*0.36);
                    break;
                case 'crumbgo': // 崩壊: 端から崩れる連
                    dot(2.2,3.3,P1,P1S); dot(3.3,3.3,P1,P1S,R,0.65);
                    dot(4.4,3.3,P1,P1S,R,0.3); dot(5.2,3.5,P1,P1S,cell*0.14,0.5);
                    break;
                case 'curlgo': // カーリング: ハウス中心へ
                    ring(4.4,4.4,cell*1.0,'#b45309',1.5); ring(4.4,4.4,cell*0.5,'#b45309',1.5);
                    dot(4.4,4.4,'#dc2626','#7f1d1d',cell*0.25);
                    dot(1.9,2.3,P2,P2S); seg(2.2,2.6,3.5,3.9,'rgba(62,34,17,0.5)',1.4);
                    break;
                case 'cursego': // 呪縛: 取跡にしか打てない
                    dot(3.3,3.3,P1,P1S);
                    seg(2.4,2.4,4.2,4.2,'#7c3aed',2.2); seg(4.2,2.4,2.4,4.2,'#7c3aed',2.2);
                    ring(3.3,3.3,cell*0.85,'rgba(124,58,237,0.6)',1.4);
                    break;
                case 'diadgo': // 斜めドミノ
                    dot(2.5,2.5,P1,P1S); dot(3.5,3.5,P1,P1S);
                    dot(4.4,4.4,P2,P2S); dot(5.3,5.3,P2,P2S,cell*0.3);
                    break;
                case 'dotgo': // 2点着手: 離れた2点
                    dot(2.2,2.2,P1,P1S); dot(4.6,4.6,P1,P1S);
                    ring(2.2,2.2,cell*0.7,'rgba(217,119,6,0.6)',1.3); ring(4.6,4.6,cell*0.7,'rgba(217,119,6,0.6)',1.3);
                    break;
                case 'elastgo': // 伸縮: バネ状ピース
                    c.strokeStyle='rgba(62,34,17,0.7)'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(1.6,3.4).x,at(1.6,3.4).y);
                    for(let i=0;i<6;i++) c.lineTo(at(1.6+i*0.65,3.4+(i%2?-0.35:0.35)).x,at(1.6+i*0.65,3.4+(i%2?-0.35:0.35)).y);
                    c.stroke();
                    dot(1.6,3.4,P1,P1S,cell*0.36); dot(5.0,3.4,P1,P1S,cell*0.36);
                    break;
                case 'escalgo': // 循環エスカレーター
                    seg(3.3,5.6,3.3,1.2,'rgba(217,119,6,0.8)',2.5); tri(3.3,1.0,cell*0.4,'#d97706','#92400e');
                    seg(4.6,1.2,4.6,5.6,'rgba(62,34,17,0.4)',1.5); tri(4.6,5.8,cell*0.35,'#a8926a','#8a7455',Math.PI/2+0.0);
                    dot(2.2,3.3,P1,P1S,cell*0.4);
                    break;
                case 'expandgo': // 拡大盤: 外へ広がる枠
                    c.strokeStyle='#92400e'; c.lineWidth=1.6;
                    c.strokeRect(at(2.4,2.4).x,at(2.4,2.4).y,cell*1.8,cell*1.8);
                    [[1.3,1.3],[5.3,1.3],[1.3,5.3],[5.3,5.3]].forEach(([x,y]) => {
                        const dx=x<3.3?-0.25:0.25, dy=y<3.3?-0.25:0.25;
                        seg(x-dx,y-dy,x+dx,y+dy,'#d97706',2); dot(x,y,P1,P1S,cell*0.26);
                    });
                    dot(3.3,3.3,P2,P2S,cell*0.3);
                    break;
                case 'fallgo': // 重力: 底へ積み上がる
                    seg(3.0,1.0,3.0,2.6,'#92400e',1.8); tri(3.0,3.0,cell*0.4,'#92400e','#78350f',Math.PI/2+0.0);
                    [[2.2,5.0],[3.3,5.0],[4.4,5.0],[3.3,4.0]].forEach(([x,y],i)=>dot(x,y,i<2?P1:P2,i<2?P1S:P2S));
                    break;
                case 'firego': // 火災: 角から燃え広がる
                    c.fillStyle='#dc2626';
                    c.beginPath(); c.moveTo(at(0.9,2.2).x,at(0.9,2.2).y);
                    c.quadraticCurveTo(at(1.1,1.2).x,at(1.1,1.2).y,at(1.7,0.8).x,at(1.7,0.8).y);
                    c.quadraticCurveTo(at(2.0,1.5).x,at(2.0,1.5).y,at(2.6,1.9).x,at(2.6,1.9).y);
                    c.quadraticCurveTo(at(1.9,2.5).x,at(1.9,2.5).y,at(0.9,2.2).x,at(0.9,2.2).y);
                    c.fill();
                    seg(1.5,2.4,5.4,4.8,'rgba(220,38,38,0.6)',1.6);
                    dot(4.4,4.4,P1,P1S,cell*0.4,0.7); dot(3.3,3.3,P1,P1S,cell*0.3,0.4);
                    break;
                case 'fishgo': // 釣り: 直線で釣り上げ
                    seg(1.2,1.2,4.2,4.2,'rgba(62,34,17,0.7)',1.6);
                    c.setLineDash([2,3]); seg(4.2,4.2,4.2,5.4,'#92400e',1.5); c.setLineDash([]);
                    dot(4.2,5.6,P2,P2S,cell*0.45);
                    dot(1.2,1.2,P1,P1S,cell*0.4);
                    break;
                case 'fissurego': // 亀裂: 走る裂け目
                    c.strokeStyle='#44403c'; c.lineWidth=2.2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(1.2,4.8).x,at(1.2,4.8).y);
                    c.lineTo(at(2.4,3.6).x,at(2.4,3.6).y); c.lineTo(at(3.0,4.4).x,at(3.0,4.4).y);
                    c.lineTo(at(4.0,2.6).x,at(4.0,2.6).y); c.lineTo(at(4.5,3.5).x,at(4.5,3.5).y);
                    c.lineTo(at(5.4,1.8).x,at(5.4,1.8).y); c.stroke();
                    dot(2.0,2.0,P1,P1S,cell*0.36); dot(4.9,4.9,P2,P2S,cell*0.36);
                    break;
                case 'flipgo': // 挟撃反転
                    dot(1.9,3.3,P1,P1S); dot(3.1,3.3,P1,P1S); dot(4.3,3.3,P2,P2S);
                    seg(4.6,2.9,5.2,2.9,'#dc2626',1.8); seg(5.2,3.7,4.6,3.7,'#dc2626',1.8);
                    break;
                case 'floatgo': // 浮力: 上へ浮く連
                    [[2.4,4.6],[3.4,4.6],[4.4,4.6]].forEach(([x,y])=>dot(x,y,P1,P1S,cell*0.38));
                    [0,1,2].forEach(i=>{ seg(2.4+i*1.0,3.9,2.4+i*1.0,2.5,'rgba(14,116,144,0.7)',1.5); tri(2.4+i*1.0,2.2,cell*0.28,'#0e7490','#155e75'); });
                    break;
                case 'flockgo': // 群れ: 全連が中心へ
                    dot(3.3,3.3,P1,P1S,cell*0.35);
                    [[1.4,1.4],[5.2,1.4],[1.4,5.2],[5.2,5.2]].forEach(([x,y])=>{
                        tri(x+(3.3-x)*0.22,y+(3.3-y)*0.22,cell*0.28,'#d97706','#92400e',Math.atan2(3.3-y,3.3-x));
                        dot(x,y,P2,P2S,cell*0.26);
                    });
                    break;
                case 'floodgo': // 水没: 上昇する水位
                    c.fillStyle='rgba(14,116,144,0.5)';
                    c.beginPath(); c.moveTo(at(0.8,4.6).x,at(0.8,4.6).y);
                    for(let x=0.8;x<=5.8;x+=0.5) c.lineTo(at(x,4.6+Math.sin(x*2.5)*0.12).x,at(x,4.6+Math.sin(x*2.5)*0.12).y);
                    c.lineTo(at(5.8,5.8).x,at(5.8,5.8).y); c.lineTo(at(0.8,5.8).x,at(0.8,5.8).y); c.closePath(); c.fill();
                    dot(2.4,3.2,P1,P1S); dot(4.2,2.6,P2,P2S,cell*0.36);
                    break;
                case 'fortgo': // 城塞: 取跡が城壁に
                    blk(3.0,3.6,'#78716c','#44403c');
                    [[2.6,3.0],[3.4,3.0]].forEach(([x,y])=>{ c.fillStyle='#78716c'; c.strokeStyle='#44403c';
                        c.fillRect(at(x,y).x-cell*0.15,at(x,y).y-cell*0.3,cell*0.3,cell*0.35); c.strokeRect(at(x,y).x-cell*0.15,at(x,y).y-cell*0.3,cell*0.3,cell*0.35); });
                    dot(4.7,2.3,P2,P2S,cell*0.3);
                    break;
                case 'fragilego': // 脆弱: 砕ける石
                    dot(2.9,3.5,P1,P1S,cell*0.8);
                    seg(3.3,3.9,4.0,4.6,'#44403c',1.5); seg(3.3,3.9,4.3,4.1,'#44403c',1.5); seg(3.3,3.9,3.9,3.0,'#44403c',1.5);
                    dot(4.6,5.0,P1,P1S,cell*0.18); dot(4.9,4.3,P1,P1S,cell*0.15);
                    break;
                case 'geargo': // 歯車: 逆回転の二輪
                    c.strokeStyle='#78716c'; c.lineWidth=2;
                    c.beginPath(); c.arc(at(2.6,3.3).x,at(2.6,3.3).y,cell*0.8,0.3,Math.PI*1.3); c.stroke();
                    tri(2.2,2.4,cell*0.25,'#78716c','#44403c',Math.PI*1.2);
                    c.beginPath(); c.arc(at(4.2,3.3).x,at(4.2,3.3).y,cell*0.8,Math.PI+0.3,Math.PI*2.3); c.stroke();
                    tri(4.6,4.2,cell*0.25,'#78716c','#44403c',Math.PI*0.2);
                    break;
                case 'gemgo': // 宝石化: 結晶の壁
                    c.fillStyle='#67e8f9'; c.strokeStyle='#0e7490'; c.lineWidth=1.4;
                    c.beginPath(); const gm=at(3.3,3.3);
                    c.moveTo(gm.x,gm.y-cell*1.1); c.lineTo(gm.x+cell*0.8,gm.y-cell*0.2);
                    c.lineTo(gm.x+cell*0.55,gm.y+cell*0.9); c.lineTo(gm.x-cell*0.55,gm.y+cell*0.9);
                    c.lineTo(gm.x-cell*0.8,gm.y-cell*0.2); c.closePath(); c.fill(); c.stroke();
                    seg(3.0,2.6,3.3,4.2,'rgba(255,255,255,0.8)',1.2);
                    break;
                case 'geysergo': // 間欠泉: 噴き上げる星
                    [[2.0,2.0],[4.6,2.0],[2.0,4.6],[4.6,4.6]].forEach(([x,y])=>{
                        seg(x,y+0.3,x,y-0.5,'#0e7490',2); tri(x,y-0.7,cell*0.3,'#0e7490','#155e75');
                    });
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    break;
                case 'glassgo': // 連鎖破裂
                    dot(3.3,3.3,P2,P2S);
                    for(let i=0;i<8;i++){ const a=i*Math.PI/4;
                        seg(3.3+Math.cos(a)*0.55,3.3+Math.sin(a)*0.55,3.3+Math.cos(a)*1.35,3.3+Math.sin(a)*1.35,'rgba(68,64,60,0.8)',1.3); }
                    break;
                case 'golfgo': // ホール: 旗と穴
                    seg(4.3,4.8,4.3,2.0,P1S,2);
                    c.fillStyle='#dc2626'; c.beginPath(); const gf=at(4.3,2.1);
                    c.moveTo(gf.x,gf.y); c.lineTo(gf.x-cell*1.1,gf.y+cell*0.4); c.lineTo(gf.x,gf.y+cell*0.8); c.closePath(); c.fill();
                    c.fillStyle='#44403c'; c.beginPath(); c.ellipse(at(4.3,5.0).x,at(4.3,5.0).y,cell*0.5,cell*0.28,0,0,Math.PI*2); c.fill();
                    dot(2.2,4.6,P2,P2S,cell*0.32);
                    break;
                case 'gomokugo': // 五目: 斜め5連
                    [0,1,2,3,4].forEach(i=>dot(1.4+i*0.95,1.4+i*0.95,i===3?P2:P1,i===3?P2S:P1S,cell*0.4));
                    break;
                case 'halogo': // 環: 中空3x3ピース
                    [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].forEach(([dx,dy])=>
                        blk(3.3+dx*0.95,3.3+dy*0.95,P1,P1S));
                    break;
                case 'harborgo': // 港: 辺から再入港
                    c.strokeStyle='#0e7490'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*1.5,-0.4,Math.PI*1.4); c.stroke();
                    tri(5.0,3.1,cell*0.32,'#0e7490','#155e75',Math.PI*0.35);
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    break;
                case 'heavygo': // 重量: 2倍で囲む塊
                    [[2.2,2.6],[3.0,2.6],[3.8,2.6],[2.2,3.6],[3.0,3.6],[3.8,3.6],[2.6,4.5],[3.4,4.5]].forEach(([x,y])=>
                        dot(x,y,P1,P1S,cell*0.3));
                    dot(4.9,3.2,P2,P2S,cell*0.28);
                    break;
                case 'hexgo': // 六角: 6方向近傍
                    dot(3.3,3.3,P1,P1S,cell*0.42);
                    for(let i=0;i<6;i++){ const a=i*Math.PI/3-Math.PI/2;
                        dot(3.3+Math.cos(a)*1.05,3.3+Math.sin(a)*1.05,P2,P2S,cell*0.34); }
                    break;
                case 'hexygo': // 六角辺倍: 六角+端の2倍
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    for(let i=0;i<6;i++){ const a=i*Math.PI/3-Math.PI/2;
                        dot(3.3+Math.cos(a)*1.05,3.3+Math.sin(a)*1.05,P2,P2S,cell*0.3); }
                    txt('x2',5.3,1.4,'#d97706',cell*0.6);
                    break;
                case 'holego': // 穴盤: ポツポツの欠損
                    [[1.8,1.8],[4.6,2.4],[2.4,4.8]].forEach(([x,y])=>{
                        c.fillStyle='#292524'; c.beginPath(); c.arc(at(x,y).x,at(x,y).y,cell*0.4,0,Math.PI*2); c.fill();
                        c.strokeStyle='#57534e'; c.lineWidth=1.2; c.stroke();
                    });
                    dot(3.4,3.2,P1,P1S,cell*0.36); dot(5.0,4.6,P2,P2S,cell*0.36);
                    break;
                case 'honeygo': // 巣房: 六角の小部屋
                    c.strokeStyle='#b45309'; c.lineWidth=1.8;
                    c.beginPath();
                    for(let i=0;i<=6;i++){ const a=Math.PI/6+i*Math.PI/3;
                        const x=at(3.3,3.3).x+Math.cos(a)*cell*1.5, y=at(3.3,3.3).y+Math.sin(a)*cell*1.5;
                        i?c.lineTo(x,y):c.moveTo(x,y); }
                    c.closePath(); c.stroke();
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    break;
                case 'hourgo': // 砂時計: 中央一点の咽喉
                    c.strokeStyle='#78350f'; c.lineWidth=1.8;
                    c.beginPath(); c.moveTo(at(1.4,0.9).x,at(1.4,0.9).y); c.lineTo(at(5.2,0.9).x,at(5.2,0.9).y);
                    c.lineTo(at(3.3,3.3).x,at(3.3,3.3).y); c.closePath(); c.stroke();
                    c.beginPath(); c.moveTo(at(1.4,5.7).x,at(1.4,5.7).y); c.lineTo(at(5.2,5.7).x,at(5.2,5.7).y);
                    c.lineTo(at(3.3,3.3).x,at(3.3,3.3).y); c.closePath(); c.stroke();
                    dot(3.3,3.3,P1,P1S,cell*0.28);
                    break;
                case 'icego': // 氷盤: 滑り続ける石
                    dot(1.9,4.4,P2,P2S,cell*0.4);
                    c.strokeStyle='rgba(14,116,144,0.7)'; c.lineWidth=1.6;
                    c.beginPath(); c.moveTo(at(2.4,4.1).x,at(2.4,4.1).y); c.lineTo(at(5.2,2.4).x,at(5.2,2.4).y); c.stroke();
                    tri(5.4,2.3,cell*0.35,'#0e7490','#155e75',Math.atan2(-0.6,1)+0.0);
                    seg(1.2,5.4,5.6,5.4,'rgba(14,116,144,0.4)',1.4);
                    break;
                case 'invadergo': // 侵攻: 上から降りる敵
                    [[2.0,1.2],[3.0,1.2],[4.0,1.2],[3.0,2.0]].forEach(([x,y])=>blk(x,y,'#dc2626','#7f1d1d'));
                    seg(3.0,2.5,3.0,3.4,'#dc2626',1.8); tri(3.0,3.6,cell*0.3,'#dc2626','#7f1d1d',Math.PI/2+0.0);
                    dot(3.0,5.2,P1,P1S,cell*0.36);
                    break;
                case 'islego': // 島々: 橋で繋ぐ3島
                    [[1.8,2.4],[4.8,2.4],[3.3,4.7]].forEach(([x,y])=>dot(x,y,P1,P1S,cell*0.5));
                    bond(2.3,2.4,4.3,2.4,2.5); bond(2.1,2.8,3.1,4.3,2.5); bond(4.5,2.8,3.6,4.3,2.5);
                    break;
                case 'isolatego': // 2重格子: 斜め/直交半々
                    bond(1.6,1.6,3.0,3.0,2); bond(3.0,1.6,1.6,3.0,2);
                    seg(4.2,3.8,5.4,3.8,'rgba(62,34,17,0.6)',2); seg(4.2,4.8,5.4,4.8,'rgba(62,34,17,0.6)',2);
                    dot(2.3,2.3,P1,P1S,cell*0.34); dot(4.8,4.3,P2,P2S,cell*0.34);
                    break;
                case 'kamigo': // 特攻: 囲まれた点への突撃
                    [[3.3,2.2],[3.3,4.4],[2.2,3.3],[4.4,3.3]].forEach(([x,y])=>dot(x,y,P2,P2S,cell*0.4));
                    txt('!?',3.3,3.3,'#dc2626',cell*0.8);
                    c.strokeStyle='#dc2626'; c.lineWidth=1.5;
                    c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*0.3,0,Math.PI*2); c.stroke();
                    break;
                case 'leechgo': // 吸収成長: 肥大する連
                    dot(2.6,4.2,P1,P1S,cell*0.85); dot(4.5,2.6,P1,P1S,cell*0.5);
                    seg(4.0,3.0,3.1,3.9,'rgba(217,119,6,0.7)',1.5); tri(3.0,4.0,cell*0.25,'#d97706','#92400e',Math.PI*0.75);
                    break;
                case 'levelgo': // レベル: 取るとLvUP
                    dot(2.6,3.6,P1,P1S);
                    txt('Lv',4.6,2.6,'#b45309',cell*0.6); txt('↑',4.6,3.4,'#d97706',cell*0.9);
                    dot(4.6,4.6,P2,P2S,cell*0.28);
                    break;
                case 'lgo': // L字3連
                    [[0,0],[0,1],[1,1]].forEach(([dx,dy])=>dot(2.4+dx*1.4,2.3+dy*1.4,P1,P1S));
                    [[0,0],[0,1],[1,1]].forEach(([dx,dy])=>dot(3.8+dx*1.4,3.2+dy*1.4,P2,P2S,cell*0.4));
                    break;
                case 'magego': // 魔導: 溜まる魔力と火球
                    dot(2.2,4.4,P1,P1S);
                    c.fillStyle='#dc2626'; c.beginPath(); c.arc(at(4.3,2.6).x,at(4.3,2.6).y,cell*0.75,0,Math.PI*2); c.fill();
                    c.fillStyle='#f59e0b'; c.beginPath(); c.arc(at(4.3,2.6).x,at(4.3,2.6).y,cell*0.4,0,Math.PI*2); c.fill();
                    seg(2.8,3.9,3.7,3.1,'rgba(220,38,38,0.7)',1.5);
                    break;
                case 'magnetgo': // 磁石: 反発と吸着
                    dot(2.4,3.3,P1,P1S); dot(4.2,3.3,P2,P2S);
                    c.fillStyle='#dc2626'; c.fillRect(at(2.9,3.1).x,at(2.9,3.1).y,cell*0.4,cell*0.4);
                    c.fillStyle='#2563eb'; c.fillRect(at(3.3,3.1).x,at(3.3,3.1).y,cell*0.4,cell*0.4);
                    seg(2.0,2.2,1.4,1.8,'rgba(217,119,6,0.7)',1.4); seg(4.6,2.2,5.2,1.8,'rgba(217,119,6,0.7)',1.4);
                    break;
                case 'mahjonggo': // 麻雀: 並びの役
                    [0,1,2].forEach(i=>{ c.save(); c.translate(at(2.2+i*1.15,3.3).x,at(2.2+i*1.15,3.3).y);
                        c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1.3;
                        c.beginPath(); c.roundRect?c.roundRect(-cell*0.42,-cell*0.62,cell*0.84,cell*1.24,cell*0.12):c.rect(-cell*0.42,-cell*0.62,cell*0.84,cell*1.24);
                        c.fill(); c.stroke(); c.restore(); });
                    txt('中',3.3,3.3,'#dc2626',cell*0.7);
                    break;
                case 'martyrgo': // 道連れ: 散る際に爆散
                    dot(3.3,3.3,P2,P2S);
                    for(let i=0;i<6;i++){ const a=i*Math.PI/3+0.2;
                        seg(3.3+Math.cos(a)*0.6,3.3+Math.sin(a)*0.6,3.3+Math.cos(a)*1.3,3.3+Math.sin(a)*1.3,'#dc2626',2); }
                    break;
                case 'matchgo': // 消去: 3連で消える
                    [0,1,2].forEach(i=>dot(2.0+i*1.1,3.6,P1,P1S,cell*0.42));
                    txt('✦',4.2,2.2,'#d97706',cell*0.9); txt('✦',2.3,2.0,'#f59e0b',cell*0.6);
                    break;
                case 'mazego': // 迷路盤
                    c.strokeStyle='#57534e'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(1.4,1.4).x,at(1.4,1.4).y); c.lineTo(at(4.4,1.4).x,at(4.4,1.4).y);
                    c.lineTo(at(4.4,3.0).x,at(4.4,3.0).y); c.lineTo(at(2.4,3.0).x,at(2.4,3.0).y);
                    c.lineTo(at(2.4,4.4).x,at(2.4,4.4).y); c.lineTo(at(5.2,4.4).x,at(5.2,4.4).y); c.stroke();
                    dot(1.4,1.4,P1,P1S,cell*0.3); dot(5.2,4.4,P2,P2S,cell*0.3);
                    break;
                case 'medigo': // 治癒: 緑十字の回復
                    dot(2.5,3.6,P1,P1S);
                    c.fillStyle='#15803d';
                    const md=at(4.4,2.8); c.fillRect(md.x-cell*0.15,md.y-cell*0.55,cell*0.3,cell*1.1);
                    c.fillRect(md.x-cell*0.55,md.y-cell*0.15,cell*1.1,cell*0.3);
                    dot(4.6,4.6,P1,P1S,cell*0.4,0.6);
                    break;
                case 'mergego': // 吸収併合: 色が染まる
                    dot(2.4,3.3,P1,P1S); dot(4.3,3.3,P2,P2S);
                    seg(3.5,3.0,4.0,2.6,'rgba(28,25,23,0.7)',1.8); seg(3.5,3.6,4.0,4.0,'rgba(28,25,23,0.7)',1.8);
                    c.save(); const mp2=at(4.3,3.3); c.beginPath(); c.arc(mp2.x,mp2.y,R,Math.PI*0.5,Math.PI*1.5); c.fillStyle=P1; c.fill(); c.restore();
                    break;
                case 'meteorgo': // 隕石: 十字クレーター
                    seg(5.2,1.0,3.8,2.4,'#dc2626',3);
                    dot(3.5,2.6,P1,P1S,cell*0.55);
                    c.strokeStyle='#44403c'; c.lineWidth=2.5;
                    seg(3.5,3.5,3.5,4.9,'#44403c',2.5); seg(2.8,4.2,4.2,4.2,'#44403c',2.5);
                    break;
                case 'minego': // 鉱山: 取跡の鉱石
                    dot(2.3,4.0,P1,P1S);
                    c.fillStyle='#fbbf24'; c.strokeStyle='#b45309'; c.lineWidth=1.2;
                    [[4.2,3.0],[4.8,3.6],[4.4,4.4],[3.7,3.8]].forEach(([x,y])=>{ c.beginPath();
                        c.arc(at(x,y).x,at(x,y).y,cell*0.22,0,Math.PI*2); c.fill(); c.stroke(); });
                    break;
                case 'moatsgo': // 堀: 環状の濠
                    ring(3.3,3.3,cell*1.5,'#0e7490',cell*0.5);
                    dot(3.3,3.3,P1,P1S,cell*0.4);
                    [[1.3,1.3],[5.3,1.3],[1.3,5.3],[5.3,5.3]].forEach(([x,y])=>dot(x,y,P2,P2S,cell*0.26));
                    break;
                case 'moldgo': // 黴: 孤立石の増殖
                    dot(2.8,3.5,P1,P1S);
                    dot(3.9,3.0,P1,P1S,cell*0.26,0.8); dot(4.5,3.5,P1,P1S,cell*0.18,0.6); dot(4.0,4.1,P1,P1S,cell*0.14,0.5);
                    break;
                case 'nexusgo': // 結節: 4盤を結ぶ一点
                    c.strokeStyle='#57534e'; c.lineWidth=2;
                    c.strokeRect(at(1.2,1.2).x,at(1.2,1.2).y,cell*1.7,cell*1.7);
                    c.strokeRect(at(3.8,1.2).x,at(3.8,1.2).y,cell*1.7,cell*1.7);
                    c.strokeRect(at(1.2,3.8).x,at(1.2,3.8).y,cell*1.7,cell*1.7);
                    c.strokeRect(at(3.8,3.8).x,at(3.8,3.8).y,cell*1.7,cell*1.7);
                    dot(3.3,3.3,'#dc2626','#7f1d1d',cell*0.45);
                    break;
                case 'omnigo': // 全能: 襲来イベント周期
                    dot(3.3,4.4,P1,P1S,cell*0.36);
                    txt('☄',2.2,2.2,'#dc2626',cell*0.7); txt('▲',3.4,1.6,'#44403c',cell*0.6); txt('⇄',4.6,2.2,'#7c3aed',cell*0.7);
                    break;
                case 'orbitalgo': // 衛星: 公転する石
                    c.setLineDash([3,3]); ring(3.3,3.3,cell*1.4,'rgba(62,34,17,0.5)',1.4); c.setLineDash([]);
                    dot(3.3,3.3,P1,P1S,cell*0.45);
                    dot(4.7,3.3,P2,P2S,cell*0.3); dot(3.3,1.9,P1,P1S,cell*0.28);
                    break;
                case 'ossugo': // 白骨: 残る骨
                    dot(2.4,4.4,P1,P1S,cell*0.34);
                    c.strokeStyle='#d6d3d1'; c.lineWidth=2.5; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(3.5,4.6).x,at(3.5,4.6).y); c.lineTo(at(5.0,3.1).x,at(5.0,3.1).y); c.stroke();
                    c.fillStyle='#e7e5e4'; c.strokeStyle='#a8a29e'; c.lineWidth=1.2;
                    [[3.35,4.75],[3.65,4.45],[4.85,3.35],[5.15,3.0]].forEach(([x,y])=>{
                        c.beginPath(); c.arc(at(x,y).x,at(x,y).y,cell*0.22,0,Math.PI*2); c.fill(); c.stroke(); });
                    break;
                case 'pacgo': // パック巡回
                    c.fillStyle='#fbbf24'; c.strokeStyle='#b45309'; c.lineWidth=1.3;
                    c.beginPath(); c.moveTo(at(3.0,3.3).x,at(3.0,3.3).y);
                    c.arc(at(3.0,3.3).x,at(3.0,3.3).y,cell*0.95,0.5,Math.PI*2-0.5); c.closePath(); c.fill(); c.stroke();
                    dot(5.0,2.2,P1,P1S,cell*0.26); dot(4.5,2.7,P2,P2S,cell*0.26);
                    break;
                case 'pairgo': // 桂馬ペア
                    dot(2.4,4.4,P1,P1S,cell*0.4); dot(4.0,2.6,P1,P1S,cell*0.4);
                    dot(4.8,4.8,P2,P2S,cell*0.3);
                    c.setLineDash([2,3]); bond(2.4,4.4,4.0,2.6,2); c.setLineDash([]);
                    break;
                case 'parasitego': // 寄生: 内側から侵食
                    dot(2.5,3.3,P1,P1S);
                    dot(3.6,3.3,P2,P2S); dot(4.7,3.3,P2,P2S);
                    c.save(); const pp=at(3.6,3.3); c.beginPath(); c.arc(pp.x,pp.y,R,Math.PI*0.5,Math.PI*1.5); c.fillStyle=P1; c.fill(); c.restore();
                    break;
                case 'pinogo': // ピン: 倒すと得点の瓶
                    c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1.3;
                    [[2.4,3.0],[3.3,2.6],[4.2,3.0]].forEach(([x,y])=>{
                        c.beginPath(); c.ellipse(at(x,y).x,at(x,y).y,cell*0.28,cell*0.5,0,0,Math.PI*2); c.fill(); c.stroke();
                        c.beginPath(); c.arc(at(x,y-0.42).x,at(x,y-0.42).y,cell*0.2,0,Math.PI*2); c.fill(); c.stroke();
                    });
                    dot(2.2,4.9,P1,P1S,cell*0.4);
                    break;
                case 'pinwheelgo': // 風車: 回転対称の地形
                    [[0,-1,0],[1,0,Math.PI/2],[0,1,Math.PI],[-1,0,-Math.PI/2]].forEach(([dx,dy,r])=>
                        tri(3.3+dx*1.1,3.3+dy*1.1,cell*0.55,'#d97706','#92400e',r+Math.PI/4));
                    dot(3.3,3.3,P1,P1S,cell*0.3);
                    break;
                case 'plaguego': // 疫地: 蝕まれる取跡
                    dot(3.3,3.3,P1,P1S);
                    c.fillStyle='rgba(124,58,237,0.3)'; c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*1.1,0,Math.PI*2); c.fill();
                    dot(4.6,4.4,P2,P2S,cell*0.28,0.5);
                    break;
                case 'poisongo': // 猛毒: 取ると自分も毒死
                    dot(2.5,3.4,P2,P2S);
                    c.fillStyle='#15803d';
                    [[3.9,2.8],[4.5,3.4],[4.0,4.0]].forEach(([x,y])=>{
                        c.beginPath(); c.arc(at(x,y).x,at(x,y).y,cell*0.3,0,Math.PI*2); c.fill(); });
                    seg(3.0,3.4,3.7,3.4,'rgba(21,128,61,0.7)',1.6);
                    break;
                case 'pokergo': // ポーカー: 役の列
                    [0,1,2,3,4].forEach(i=>{
                        c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1;
                        c.fillRect(at(1.35+i*0.85,2.9).x,at(1.35+i*0.85,2.9).y,cell*0.65,cell*0.9);
                        c.strokeRect(at(1.35+i*0.85,2.9).x,at(1.35+i*0.85,2.9).y,cell*0.65,cell*0.9);
                    });
                    txt('♠',2.0,3.35,'#1c1917',cell*0.4); txt('♥',2.85,3.35,'#dc2626',cell*0.4); txt('♦',3.7,3.35,'#dc2626',cell*0.4);
                    break;
                case 'pondgo': // 池: 中央の大きな池
                    c.fillStyle='rgba(14,116,144,0.55)'; c.strokeStyle='#155e75'; c.lineWidth=1.5;
                    c.beginPath(); c.ellipse(at(3.3,3.3).x,at(3.3,3.3).y,cell*1.35,cell*1.1,0,0,Math.PI*2); c.fill(); c.stroke();
                    for(let i=0;i<8;i++){ const a=i*Math.PI/4;
                        dot(3.3+Math.cos(a)*1.75,3.3+Math.sin(a)*1.55,P1,P1S,cell*0.2); }
                    break;
                case 'pyrago': // 3層ピラミッド
                    c.strokeStyle='#92400e'; c.lineWidth=1.6;
                    [0,1,2].forEach(i=>c.strokeRect(at(1.9+i*0.65,1.9+i*0.65).x,at(1.9+i*0.65,1.9+i*0.65).y,cell*(2.8-i*1.3),cell*(2.8-i*1.3)));
                    dot(3.3,3.3,P1,P1S,cell*0.3);
                    break;
                case 'quakego': // 地震: 散らばる石
                    dot(2.6,2.8,P1,P1S,cell*0.36); dot(3.9,3.0,P2,P2S,cell*0.36);
                    dot(2.7,4.3,P2,P2S,cell*0.36); dot(4.2,4.2,P1,P1S,cell*0.36);
                    [[1.5,1.5],[5.1,1.5],[1.5,5.1],[5.1,5.1]].forEach(([x,y])=>
                        seg(3.3+(x-3.3)*0.6,3.3+(y-3.3)*0.6,x,y,'rgba(62,34,17,0.4)',1.3));
                    break;
                case 'railgo': // 環状外周
                    [[1.6,1.6],[3.3,1.6],[5.0,1.6],[5.0,3.3],[5.0,5.0],[3.3,5.0],[1.6,5.0],[1.6,3.3]].forEach(([x,y])=>
                        dot(x,y,P1,P1S,cell*0.3));
                    c.strokeStyle='rgba(217,119,6,0.7)'; c.lineWidth=1.5;
                    c.strokeRect(at(1.45,1.45).x,at(1.45,1.45).y,cell*3.7,cell*3.7);
                    break;
                case 'returgo': // 帰還: 手元に戻る石
                    dot(4.4,2.4,P2,P2S);
                    c.strokeStyle='#b45309'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.6).x,at(3.3,3.6).y,cell*1.2,Math.PI*0.9,Math.PI*1.9); c.stroke();
                    tri(2.2,3.4,cell*0.35,'#b45309','#92400e',Math.PI*0.95);
                    dot(2.6,4.4,P1,P1S,cell*0.4);
                    break;
                case 'reversigo': // 反転: 直線挟み
                    dot(1.6,3.3,P1,P1S); dot(2.6,3.3,P2,P2S); dot(3.6,3.3,P2,P2S); dot(4.6,3.3,P1,P1S);
                    seg(5.0,2.8,5.5,2.8,'#dc2626',1.6); seg(5.5,3.8,5.0,3.8,'#dc2626',1.6);
                    break;
                case 'rivergo': // 大河: 流れる中央2行
                    c.strokeStyle='rgba(14,116,144,0.75)'; c.lineWidth=1.6; c.lineCap='round';
                    [2.6,3.8].forEach(y=>{
                        c.beginPath(); c.moveTo(at(0.8,y).x,at(0.8,y).y);
                        for(let x=0.8;x<=5.8;x+=0.5) c.lineTo(at(x,y+Math.sin(x*2)*0.1).x,at(x,y+Math.sin(x*2)*0.1).y);
                        c.stroke();
                    });
                    tri(5.5,3.2,cell*0.35,'#0e7490','#155e75',Math.PI/2);
                    dot(3.0,3.2,P2,P2S,cell*0.3);
                    break;
                case 'rollgo': // V字谷: 転がる斜面
                    seg(0.9,1.6,3.3,4.6,'#8a7455',2.5); seg(5.7,1.6,3.3,4.6,'#8a7455',2.5);
                    dot(3.3,3.4,P1,P1S,cell*0.42);
                    seg(3.7,3.0,3.4,3.6,'rgba(62,34,17,0.5)',1.4);
                    break;
                case 'rotatego': // 環流: 二重の回転
                    c.strokeStyle='#b45309'; c.lineWidth=1.8; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*1.5,0.3,Math.PI*1.2); c.stroke();
                    tri(5.0,4.3,cell*0.3,'#b45309','#92400e',Math.PI*0.6);
                    c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*0.8,Math.PI+0.3,Math.PI*2.2); c.stroke();
                    tri(2.6,2.6,cell*0.25,'#78716c','#44403c',Math.PI*1.1);
                    break;
                case 'roulettego': // 金色ボーナス区域
                    c.fillStyle='rgba(251,191,36,0.5)'; c.strokeStyle='#d97706'; c.lineWidth=1.6;
                    c.fillRect(at(2.2,2.2).x,at(2.2,2.2).y,cell*2.2,cell*2.2);
                    c.strokeRect(at(2.2,2.2).x,at(2.2,2.2).y,cell*2.2,cell*2.2);
                    dot(3.3,3.3,P1,P1S); txt('+2',4.9,1.6,'#b45309',cell*0.6);
                    break;
                case 'rustgo': // 錆: 端が錆びる連
                    dot(2.4,3.3,P1,P1S); dot(3.4,3.3,'#92400e','#78350f');
                    dot(4.3,3.3,'#92400e','#78350f',R,0.5); dot(5.0,3.5,'#92400e','#78350f',cell*0.16,0.5);
                    break;
                case 'shogigo': // 持駒: 打ち込む手駒
                    c.save(); c.translate(at(2.5,2.2).x,at(2.5,2.2).y);
                    c.fillStyle='#fef3c7'; c.strokeStyle='#78350f'; c.lineWidth=1.3;
                    c.beginPath(); c.moveTo(0,-cell*0.5); c.lineTo(cell*0.42,cell*0.15); c.lineTo(cell*0.26,cell*0.6);
                    c.lineTo(-cell*0.26,cell*0.6); c.lineTo(-cell*0.42,cell*0.15); c.closePath(); c.fill(); c.stroke();
                    c.restore();
                    seg(2.5,3.0,3.6,4.0,'#92400e',1.8); tri(3.8,4.2,cell*0.3,'#92400e','#78350f',Math.PI*0.6);
                    dot(4.4,4.8,P2,P2S,cell*0.36);
                    break;
                case 'slidego': // 滑り台: 斜めに滑る全石
                    seg(1.2,4.8,5.4,2.0,'rgba(168,146,106,0.6)',1.8);
                    dot(3.0,3.6,P1,P1S,cell*0.4);
                    seg(3.5,3.3,4.4,2.8,'rgba(217,119,6,0.7)',1.6); tri(4.6,2.7,cell*0.3,'#d97706','#92400e',-Math.PI/3+0.15);
                    break;
                case 'slinego': // 直線3連
                    [0,1,2].forEach(i=>dot(2.3+i*1.1,3.3,P1,P1S));
                    break;
                case 'slitgo': // 切れ目: 3帯分断
                    seg(0.9,2.4,5.7,2.4,'#44403c',2.5); seg(0.9,4.2,5.7,4.2,'#44403c',2.5);
                    dot(2.2,1.4,P1,P1S,cell*0.32); dot(3.3,3.3,P2,P2S,cell*0.32); dot(4.4,5.1,P1,P1S,cell*0.32);
                    break;
                case 'snakego': // 蛇: W字5連
                    [[1.6,4.6],[2.4,3.7],[3.2,4.6],[4.0,3.7],[4.8,4.6]].forEach(([x,y])=>dot(x,y,P1,P1S,cell*0.38));
                    dot(3.2,2.4,P2,P2S,cell*0.34);
                    break;
                case 'snatchgo': // 横取り: 呼吸点残しの奪取
                    dot(3.0,3.3,P2,P2S);
                    c.strokeStyle='#dc2626'; c.lineWidth=2;
                    c.beginPath(); c.arc(at(3.0,3.3).x,at(3.0,3.3).y,cell*0.75,-0.6,Math.PI*0.8); c.stroke();
                    tri(4.3,3.1,cell*0.28,'#dc2626','#7f1d1d',Math.PI*0.35);
                    dot(4.9,4.6,P1,P1S,cell*0.32);
                    break;
                case 'spinngo': // 自転: 90°回転する盤
                    c.strokeStyle='#92400e'; c.lineWidth=1.6;
                    c.strokeRect(at(2.0,2.0).x,at(2.0,2.0).y,cell*2.6,cell*2.6);
                    c.strokeStyle='#b45309'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.arc(at(3.3,3.3).x,at(3.3,3.3).y,cell*1.75,-0.5,0.9); c.stroke();
                    tri(5.15,3.6,cell*0.3,'#b45309','#92400e',Math.PI*0.55);
                    dot(3.3,2.4,P1,P1S,cell*0.36);
                    break;
                case 'spiralgo': // 螺旋: 1本道の通路
                    c.strokeStyle='#57534e'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath();
                    for(let t=0;t<Math.PI*3.4;t+=0.2){
                        const r=cell*(0.25+t*0.14), p=at(3.3,3.3);
                        const x=p.x+Math.cos(t)*r, y=p.y+Math.sin(t)*r*0.9;
                        t===0?c.moveTo(x,y):c.lineTo(x,y);
                    }
                    c.stroke();
                    dot(3.3,3.3,P1,P1S,cell*0.3);
                    break;
                case 'spongego': // 連打: 取ると即もう1手
                    dot(2.4,4.4,P1,P1S);
                    seg(2.9,4.0,3.8,3.4,'#d97706',1.8); tri(4.0,3.3,cell*0.3,'#d97706','#92400e',Math.PI*0.25);
                    dot(4.4,2.8,P1,P1S); dot(5.1,2.1,P1,P1S,cell*0.3,0.7);
                    break;
                case 'stairgo': // 階段: 右へ登る段
                    c.fillStyle='rgba(168,146,106,0.7)'; c.strokeStyle='#8a7455'; c.lineWidth=1.3;
                    [[1.3,4.4],[2.4,3.5],[3.5,2.6],[4.6,1.7]].forEach(([x,y])=>{
                        c.fillRect(at(x,y).x,at(x,y).y,cell*0.9,cell*0.9); c.strokeRect(at(x,y).x,at(x,y).y,cell*0.9,cell*0.9); });
                    dot(1.75,4.4,P1,P1S,cell*0.3);
                    break;
                case 'sugorokugo': // 双六: 螺旋の升目
                    c.strokeStyle='#8a7455'; c.lineWidth=1.4;
                    c.strokeRect(at(1.4,1.4).x,at(1.4,1.4).y,cell*3.8,cell*3.8);
                    c.strokeRect(at(2.3,2.3).x,at(2.3,2.3).y,cell*2.0,cell*2.0);
                    dot(1.9,1.9,P1,P1S,cell*0.3); dot(3.3,3.3,'#dc2626','#7f1d1d',cell*0.3);
                    break;
                case 'swapgo': // 交換: 位置入替
                    dot(2.4,2.6,P1,P1S); dot(4.2,4.4,P2,P2S);
                    seg(2.7,2.3,3.9,3.0,'#7c3aed',1.8); tri(4.1,3.1,cell*0.28,'#7c3aed','#4c1d95',Math.PI*0.3);
                    seg(3.9,4.7,2.7,4.0,'#7c3aed',1.8); tri(2.5,3.9,cell*0.28,'#7c3aed','#4c1d95',Math.PI*1.3);
                    break;
                case 'sweepergo': // 地雷: 数字と旗
                    dot(2.4,4.2,P1,P1S,cell*0.45);
                    txt('2',3.8,3.2,'#2563eb',cell*0.8);
                    seg(4.9,4.6,4.9,2.9,'#44403c',1.8);
                    c.fillStyle='#dc2626'; c.beginPath(); const sf=at(4.9,3.0);
                    c.moveTo(sf.x,sf.y); c.lineTo(sf.x-cell*0.8,sf.y+cell*0.3); c.lineTo(sf.x,sf.y+cell*0.6); c.closePath(); c.fill();
                    break;
                case 'tectogo': // 断層: 逆方向にずれる半盤
                    c.fillStyle='rgba(168,146,106,0.5)';
                    c.fillRect(at(0.9,1.2).x,at(0.9,1.2).y,cell*2.3,cell*4.2);
                    c.fillRect(at(3.5,1.9).x,at(3.5,1.9).y,cell*2.3,cell*4.2);
                    tri(2.1,1.5,cell*0.3,'#dc2626','#7f1d1d'); tri(4.7,5.9,cell*0.3,'#dc2626','#7f1d1d',Math.PI/2+0.0);
                    break;
                case 'tetrisgo': // 列消し: 埋まると消える
                    [0,1,2,3,4,5].forEach(i=>blk(1.1+i*0.85,4.4,i<5?P1:P2,i<5?P1S:P2S));
                    txt('✦',3.3,2.4,'#d97706',cell*1.1);
                    break;
                case 'tgo': // T字4連
                    [[0,0],[1,0],[2,0],[1,1]].forEach(([dx,dy])=>dot(2.4+dx*0.9,2.6+dy*0.9,P1,P1S,cell*0.42));
                    [[0,0],[1,0],[1,1],[1,2]].forEach(([dx,dy])=>dot(4.4+dx*0.75,3.4+dy*0.75,P2,P2S,cell*0.3));
                    break;
                case 'tornago': // 竜巻: 巡回する渦
                    c.strokeStyle='#57534e'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath();
                    for(let t=0;t<Math.PI*2.6;t+=0.25){
                        const p=at(3.3,3.3), r=cell*(0.3+t*0.17);
                        const x=p.x+Math.cos(t)*r, y=p.y+Math.sin(t)*r;
                        t===0?c.moveTo(x,y):c.lineTo(x,y);
                    }
                    c.stroke();
                    dot(4.8,4.8,P2,P2S,cell*0.28);
                    break;
                case 'towergo': // 塔: 3層水平
                    [0,1,2].forEach(i=>{
                        c.fillStyle=`rgba(168,146,106,${0.35+i*0.18})`; c.strokeStyle='#8a7455'; c.lineWidth=1.3;
                        c.fillRect(at(1.8+i*0.15,4.7-i*1.2).x,at(1.8+i*0.15,4.7-i*1.2).y,cell*(3.0-i*0.3),cell*0.9);
                        c.strokeRect(at(1.8+i*0.15,4.7-i*1.2).x,at(1.8+i*0.15,4.7-i*1.2).y,cell*(3.0-i*0.3),cell*0.9);
                    });
                    seg(3.3,2.3,3.3,4.6,'rgba(62,34,17,0.6)',1.6); dot(3.3,2.2,P1,P1S,cell*0.3);
                    break;
                case 'trigo': // 三角: 3方向格子
                    tri(3.3,3.5,cell*1.5,'rgba(217,119,6,0.3)','#b45309');
                    [[3.3,2.1],[2.2,4.1],[4.4,4.1]].forEach(([x,y])=>dot(x,y,P1,P1S,cell*0.36));
                    break;
                case 'twingo': // 双子盤: ワープ点
                    c.strokeStyle='#57534e'; c.lineWidth=1.6;
                    c.strokeRect(at(1.1,1.6).x,at(1.1,1.6).y,cell*1.9,cell*1.9);
                    c.strokeRect(at(3.7,3.1).x,at(3.7,3.1).y,cell*1.9,cell*1.9);
                    dot(3.3,3.5,'#7c3aed','#4c1d95',cell*0.4);
                    c.setLineDash([2,2]); seg(3.0,3.5,3.7,4.0,'#7c3aed',1.5); c.setLineDash([]);
                    break;
                case 'vampgo': // 吸血装甲
                    dot(3.3,3.3,P1,P1S); ring(3.3,3.3,cell*0.8,'#dc2626',2.2);
                    dot(4.7,4.5,P2,P2S,cell*0.3);
                    seg(4.3,4.1,3.8,3.8,'#dc2626',1.4);
                    break;
                case 'vortexgo': // 渦巻: 腕状の壁
                    c.strokeStyle='#44403c'; c.lineWidth=2.2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(3.3,3.3).x,at(3.3,3.3).y);
                    for(let t=0.5;t<Math.PI*2;t+=0.3){
                        const p=at(3.3,3.3), r=cell*t*0.28;
                        c.lineTo(p.x+Math.cos(t)*r,p.y+Math.sin(t)*r);
                    }
                    c.stroke();
                    dot(1.6,5.2,P1,P1S,cell*0.3);
                    break;
                case 'wheelgo': // 車輪: スポーク盤
                    ring(3.3,3.3,cell*1.5,'#44403c',2);
                    [0,1,2,3].forEach(i=>{ const a=i*Math.PI/4;
                        seg(3.3-Math.cos(a)*1.5,3.3-Math.sin(a)*1.5,3.3+Math.cos(a)*1.5,3.3+Math.sin(a)*1.5,'rgba(68,64,60,0.7)',1.6); });
                    dot(3.3,3.3,P1,P1S,cell*0.35);
                    break;
                case 'wildgo': // ワイルド: 連続2手
                    dot(2.6,3.4,P1,P1S); dot(3.6,4.2,P1,P1S,cell*0.85,0.85);
                    txt('W',4.5,2.0,'#7c3aed',cell*0.9);
                    break;
                case 'windgo': // 風: 全石が流れる
                    c.strokeStyle='rgba(14,116,144,0.7)'; c.lineWidth=1.7; c.lineCap='round';
                    [2.0,3.3,4.6].forEach(y=>{
                        c.beginPath(); c.moveTo(at(1.0,y).x,at(1.0,y).y);
                        for(let x=1.0;x<=4.6;x+=0.4) c.lineTo(at(x,y+Math.sin(x*1.8+y)*0.12).x,at(x,y+Math.sin(x*1.8+y)*0.12).y);
                        c.stroke();
                    });
                    tri(5.0,3.3,cell*0.4,'#0e7490','#155e75',Math.PI/2);
                    dot(3.3,3.3,P1,P1S,cell*0.28);
                    break;
                case 'winggo': // 翼: V字5連
                    [[0,0],[1,1],[2,2],[3,1],[4,0]].forEach(([dx,dy])=>dot(1.3+dx*1.0,1.9+dy*1.1,P1,P1S,cell*0.4));
                    dot(3.3,4.9,P2,P2S,cell*0.3);
                    break;
                case 'xgo': // X字5連
                    [[0,0],[1,1],[2,2],[3,3],[4,4]].forEach(([dx,dy])=>dot(1.5+dx*0.9,1.5+dy*0.9,P1,P1S,cell*0.38));
                    [[4,0],[3,1],[1,3],[0,4]].forEach(([dx,dy])=>dot(1.5+dx*0.9,1.5+dy*0.9,P2,P2S,cell*0.3));
                    break;
                case 'ziggo': // ジグザグ4連
                    [[0,0],[1,0],[1,1],[2,1]].forEach(([dx,dy])=>blk(1.7+dx*1.0,2.4+dy*1.0,P1,P1S));
                    [[1,0],[2,0],[0,1],[1,1]].forEach(([dx,dy])=>blk(3.2+dx*0.85,3.6+dy*0.85,P2,P2S));
                    break;
                case 'phoenixgo': // 不死鳥: 半分復活
                    dot(2.5,3.8,P1,P1S,R,0.35);
                    dot(3.8,3.4,P1,P1S);
                    c.strokeStyle='#f59e0b'; c.lineWidth=2; c.lineCap='round';
                    c.beginPath(); c.moveTo(at(2.9,3.7).x,at(2.9,3.7).y);
                    c.quadraticCurveTo(at(3.0,2.3).x,at(3.0,2.3).y,at(3.6,2.5).x,at(3.6,2.5).y); c.stroke();
                    tri(3.7,2.6,cell*0.25,'#f59e0b','#d97706',Math.PI*0.4);
                    break;
                case 'piecechaingo': // 鎖: 鎖で繋がる2石
                    dot(2.3,3.3,P1,P1S); dot(4.3,3.3,P1,P1S);
                    c.setLineDash([3,2.5]); bond(2.6,3.3,4.0,3.3,2.5); c.setLineDash([]);
                    break;
                case 'pinggo': // 乒乓: 跳ね回るボール
                    seg(1.3,4.6,3.0,2.0,'#92400e',2); seg(3.0,2.0,4.6,4.6,'#92400e',2);
                    dot(1.3,4.6,'#fef3c7','#b45309',cell*0.45);
                    dot(4.9,4.6,P1,P1S,cell*0.32); seg(4.4,4.6,4.75,4.6,'rgba(62,34,17,0.5)',1.4);
                    break;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                // == WAVE3 ICONS BEGIN ==
                case 'abyssgo': {
        tri(3, 4.4, cell * 1.3, '#475569', '#1e293b', 0);
        blk(2.6, 2.2, '#57534e', '#292524');
        ring(3, 1.4, cell * 0.3, '#67e8f9', 1.2);
        ring(3.8, 2, cell * 0.2, '#67e8f9', 1);
        dot(2, 4.6, P1, P1S, cell * 0.4);
                    break;
                }
                case 'accelgo': {
        seg(1, 2.4, 2.6, 2.4, '#f97316', 2.2);
        seg(1.4, 3, 2.6, 3, '#f97316', 2.2);
        seg(1, 3.6, 2.6, 3.6, '#f97316', 2.2);
        dot(3.8, 3, P1, P1S, cell * 0.5);
        tri(4.8, 3, cell * 0.32, '#f97316', '#c2410c', 0);
                    break;
                }
                case 'afterimagego': {
        dot(3, 3, P1, P1S);
        ring(3, 3, cell * 0.75, '#c084fc', 1.8);
        ring(3, 3, cell * 1.15, '#c084fc', 1.2);
        ring(3, 3, cell * 1.55, '#c084fc', 0.8);
                    break;
                }
                case 'agatego': {
        // 瑪瑙: 同心の縞模様
        dot(3, 3.2, P1, P1S);
        ring(3, 3.2, cell * 0.5, '#e879f9', 1.8);
        ring(3, 3.2, cell * 0.72, '#c084fc', 1.4);
        ring(3, 3.2, cell * 0.94, '#f0abfc', 1.1);
        dot(4.7, 1.6, P2, P2S, R * 0.6);
        ring(4.7, 1.6, cell * 0.44, '#e879f9', 1.1);
                    break;
                }
                case 'alluvialgo': {
        // 扇状地: 頂点から扇に広がる堆積帯と扇央の石
        tri(3, 0.9, cell * 0.4, '#a16207', '#713f12', 0);
        seg(3, 1.2, 1.1, 4.6, '#d9b25c', 2.2);
        seg(3, 1.2, 4.9, 4.6, '#d9b25c', 2.2);
        seg(3, 1.2, 3.0, 4.9, '#eab308', 2.2);
        dot(3, 2.6, P1, P1S);
                    break;
                }
                case 'ambergo': {
        // 琥珀: 金色の樹脂に封じられた石
        c.fillStyle = '#f59e0b'; c.strokeStyle = '#b45309'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(at(3,3.4).x, at(3,3.4).y, cell * 1.7, cell * 1.3, -0.2, 0, Math.PI * 2); c.fill(); c.stroke();
        dot(3, 3.4, P1, P1S, R * 0.8);
        c.fillStyle = 'rgba(255, 240, 180, 0.7)';
        c.beginPath(); c.ellipse(at(2.2,2.6).x, at(2.2,2.6).y, cell * 0.5, cell * 0.22, -0.5, 0, Math.PI * 2); c.fill();
        dot(4.8, 1.2, P2, P2S, R * 0.7);
                    break;
                }
                case 'ampgo': {
// 増幅器の三角記号と波形
ctx.strokeStyle='#a78bfa'; ctx.lineWidth=1.8;
ctx.beginPath();
ctx.moveTo(cell*1.4,cell*1.8);
ctx.lineTo(cell*1.4,cell*4.2);
ctx.lineTo(cell*4.2,cell*3);
ctx.closePath(); ctx.stroke();
seg(0.4,2.4,1.4,2.4,'#a78bfa',1.4);
seg(0.4,3.6,1.4,3.6,'#a78bfa',1.4);
seg(4.2,3,5.6,3,'#facc15',1.6);
seg(5.6,3,5.9,2.4,'#facc15',1.4);
seg(5.6,3,5.9,3.6,'#facc15',1.4);
                    break;
                }
                case 'antcolonygo': {
        dot(2.2, 3.6, '#78350f', '#451a03');
        dot(2.9, 3.4, '#78350f', '#451a03');
        dot(3.6, 3.2, '#78350f', '#451a03');
        seg(2.9, 3.4, 2.9, 2.6, '#451a03', 1.2);
        seg(3.2, 3.3, 3.4, 2.6, '#451a03', 1.2);
        dot(4.6, 1.8, '#fbbf24', '#b45309');
                    break;
                }
                case 'antiquego': {
        dot(3, 3.1, P1, P1S);
        ring(3, 3.1, cell * 0.55, "#facc15", 1.5);
        ring(3, 3.1, cell * 0.95, "#facc15", 1.2);
        txt("古", 4.5, 1.4, "#d97706", cell * 0.9);
        dot(1.6, 4.4, P2, P2S, R * 0.7);
        ring(1.6, 4.4, cell * 0.45, "#facc15", 1.1);
                    break;
                }
                case 'apiarygo': {
        // 採蜜: 巣箱と花と蜂
        blk(4.4, 1.8, '#f59e0b', '#92400e');
        seg(4.05, 1.8, 4.75, 1.8, '#92400e', 1.4);
        c.fillStyle = '#f472b6';
        [[2.2,3.4],[1.8,3.8],[2.6,3.8],[2,3],[2.4,3]].forEach(([x,y]) => {
            const p = at(x, y); c.beginPath(); c.arc(p.x, p.y, cell * 0.18, 0, Math.PI * 2); c.fill();
        });
        dot(2.2, 3.4, '#fbbf24', '#b45309', cell * 0.14);
        dot(3.4, 2.6, P1, P1S, cell * 0.2);
        dot(4, 3.6, P1, P1S, cell * 0.2);
                    break;
                }
                case 'archedbeamgo': {
        // 虹梁: 弧を描く梁と柱
        bond(1.0, 4.6, 1.0, 2.4, 4);
        bond(5.0, 4.6, 5.0, 2.4, 4);
        seg(1.0, 2.4, 3.0, 1.0, '#b45309', 4);
        seg(3.0, 1.0, 5.0, 2.4, '#b45309', 4);
        dot(3.0, 2.0, P1, P1S, cell * 0.3);
                    break;
                }
                case 'archipelagogo': {
        dot(1.4, 1.5, "#84cc16", "#3f6212", cell * 0.5);
        dot(4.6, 1.8, "#84cc16", "#3f6212", cell * 0.5);
        dot(1.8, 4.4, "#84cc16", "#3f6212", cell * 0.5);
        dot(4.4, 4.6, "#84cc16", "#3f6212", cell * 0.5);
        seg(1.4, 1.5, 4.6, 1.8, "#38bdf8", 1.4);
        seg(1.4, 1.5, 1.8, 4.4, "#38bdf8", 1.4);
        seg(4.6, 1.8, 4.4, 4.6, "#38bdf8", 1.4);
        seg(1.8, 4.4, 4.4, 4.6, "#38bdf8", 1.4);
        dot(1.4, 1.5, P1, P1S, R * 0.55);
        dot(4.4, 4.6, P2, P2S, R * 0.55);
                    break;
                }
                case 'arcirisgo': {
// 虹の弧と両端の石
ctx.strokeStyle='rgba(248,113,113,0.85)'; ctx.lineWidth=2.0;
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*3.0,Math.PI,0); ctx.stroke();
ctx.strokeStyle='rgba(251,191,36,0.85)';
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*2.4,Math.PI,0); ctx.stroke();
ctx.strokeStyle='rgba(74,222,128,0.85)';
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*1.8,Math.PI,0); ctx.stroke();
dot(0.6,4.6,P1,P1S,cell*0.45,1);
dot(5.4,4.6,P1,P1S,cell*0.45,1);
dot(3,1.7,P2,P2S,cell*0.4,1);
                    break;
                }
                case 'arithmeticgo': {
        // 等差: 等間隔の珠
        dot(1, 3.6, P1, P1S, cell * 0.3);
        dot(3, 3.6, P1, P1S, cell * 0.3);
        dot(5, 3.6, P1, P1S, cell * 0.3);
        seg(1, 2.2, 5, 2.2, '#64748b', 1.2);
        txt('d', 4, 1.6, '#92400e', cell * 0.7);
        txt('d', 2, 1.6, '#92400e', cell * 0.7);
                    break;
                }
                case 'armillarygo': {
        // 渾天儀: 2環と経緯
        ring(3.0, 3.0, cell * 1.4, '#b45309', 2);
        ring(3.0, 3.0, cell * 2.2, '#b45309', 2);
        seg(0.6, 3.0, 5.4, 3.0, '#78716c', 2);
        seg(3.0, 0.6, 3.0, 5.4, '#78716c', 2);
        dot(3.0, 3.0, P1, P1S, cell * 0.3);
                    break;
                }
                case 'assaultgo': {
        tri(1.8, 3, cell * 0.55, P1, P1S);
        tri(4.2, 3, cell * 0.55, P2, P2S);
        seg(2.6, 3, 3.4, 3, "#f97316", 2.5);
        txt("✕", 3, 3.35, "#f97316", 10);
                    break;
                }
                case 'atollgo': {
        ring(3, 3, 2.2, "#0ea5e9", 2.4);
        ring(3, 3, 1.0, "#38bdf8", 1.6);
        dot(3, 3, "#7dd3fc", "#38bdf8", cell * 0.34, 0.7);
        dot(1.6, 1.8, P1, P1S, R * 0.8);
        dot(4.4, 2.2, P2, P2S, R * 0.8);
        dot(3.2, 4.6, P1, P1S, R * 0.8);
                    break;
                }
                case 'aurorago': {
        seg(1, 1.6, 5, 2.2, '#34d399', 1.8);
        seg(1, 2.4, 5, 1.8, '#a78bfa', 1.8);
        seg(1, 3, 5, 2.6, 'rgba(52,211,153,0.5)', 1.2);
        dot(3, 4, P1, P1S);
                    break;
                }
                case 'baggo': {
        tri(3, 3.6, cell * 1.8, '#a16207', '#713f12', 0);
        seg(2.4, 1.9, 3.6, 1.9, '#713f12', 1.8);
        seg(3, 1.9, 3, 1.2, '#713f12', 1.6);
        dot(2.6, 3.2, P1, P1S, cell * 0.3);
        dot(3.5, 3.6, P2, P2S, cell * 0.3);
        dot(3, 4.2, P1, P1S, cell * 0.3);
                    break;
                }
                case 'balltossgo': {
        // 玉入: 籠 + 投げ込まれる玉
        blk(3, 4.2, '#b45309', '#78350f');
        seg(1.8, 3.6, 4.2, 3.6, '#78350f', 2.2);
        dot(2.2, 1.6, P2, P2S, cell * 0.4);
        dot(3.6, 2.1, P2, P2S, cell * 0.4);
        seg(1.4, 0.9, 2.0, 1.3, '#94a3b8', 1.4);
                    break;
                }
                case 'bankedturngo': {
        blk(2.2, 3, P1, P1S);
        blk(3.8, 3, P1, P1S);
        dot(3, 2, '#facc15', '#ca8a04', R * 0.7);
        txt('貯', 3, 2, '#713f12', cell * 0.5);
        seg(2.4, 4.2, 3.6, 4.2, '#facc15', 1.6);
                    break;
                }
                case 'barrelgo': {
        dot(3, 3, '#a16207', '#713f12', R * 1.15);
        seg(2.2, 2.6, 3.8, 2.6, '#fde68a', 1.4);
        seg(2.2, 3.4, 3.8, 3.4, '#fde68a', 1.4);
        ring(3, 3, cell * 0.62, '#eab308', 1.6);
                    break;
                }
                case 'barriergo': {
        dot(1.6, 1.6, '#60a5fa', '#1e3a8a');
        dot(4.4, 1.6, '#60a5fa', '#1e3a8a');
        dot(3.0, 4.2, '#60a5fa', '#1e3a8a');
        seg(1.6, 1.6, 4.4, 1.6, '#93c5fd', 1.6);
        seg(4.4, 1.6, 3.0, 4.2, '#93c5fd', 1.6);
        seg(3.0, 4.2, 1.6, 1.6, '#93c5fd', 1.6);
                    break;
                }
                case 'basaltgo': {
        // 玄武: 柱状節理の六角柱
        seg(2.0, 4.4, 2.0, 2.6, '#57534e', 5);
        seg(3.0, 4.6, 3.0, 2.2, '#44403c', 5);
        seg(4.0, 4.4, 4.0, 2.8, '#57534e', 5);
        tri(3.0, 1.9, cell * 0.5, '#a8a29e', '#57534e', -Math.PI / 2);
                    break;
                }
                case 'basingo': {
        // 窪地: 水の溜まった盆地と溺れる石
        c.fillStyle = 'rgba(30, 110, 170, 0.5)';
        c.beginPath(); c.ellipse(at(3,4.4).x, at(3,4.4).y, cell * 2.4, cell * 1.1, 0, 0, Math.PI * 2); c.fill();
        seg(1.2, 3.4, 3, 5.2, '#78716c', 2.4);
        seg(4.8, 3.4, 3, 5.2, '#78716c', 2.4);
        dot(3, 4.2, P1, P1S, R * 0.8);
        dot(1.4, 2.2, P2, P2S, R * 0.85);
        dot(4.6, 2.2, P2, P2S, R * 0.85);
                    break;
                }
                case 'batterygo': {
        dot(2.2, 3, P1, P1S);
        blk(4, 1.6, "#facc15", "#a16207");
        blk(4, 2.8, "#facc15", "#a16207");
        seg(4.5, 1.2, 4.5, 0.7, "#facc15", 2);
                    break;
                }
                case 'battledorego': {
        // 羽根: 羽根球 + 打ち面
        dot(3.6, 2.2, P2, P2S, cell * 0.42);
        tri(3.6, 3.4, cell * 0.7, '#f87171', '#b91c1c', Math.PI / 2);
        seg(1.6, 4.6, 2.9, 3.3, '#92400e', 3.2);
        blk(2.0, 4.5, '#fbbf24', '#b45309');
        seg(4.6, 1.4, 5.2, 1.0, '#94a3b8', 1.5);
                    break;
                }
                case 'battlelinego': {
        // 陣形: 槍の列と方陣
        seg(1.6, 1.8, 1.6, 4.6, '#78716c', 1.8);          // 槍1
        tri(1.6, 1.6, cell * 0.22, '#a8a29e', '#57534e'); // 穂先1
        seg(2.6, 1.8, 2.6, 4.6, '#78716c', 1.8);          // 槍2
        tri(2.6, 1.6, cell * 0.22, '#a8a29e', '#57534e'); // 穂先2
        seg(3.6, 1.8, 3.6, 4.6, '#78716c', 1.8);          // 槍3
        tri(3.6, 1.6, cell * 0.22, '#a8a29e', '#57534e'); // 穂先3
        blk(4.4, 3.8, '#b45309', '#78350f');             // 方陣ブロック
        dot(4.4, 3.8, '#fbbf24', '#b45309', cell * 0.2);  // 陣の核
                    break;
                }
                case 'baygo': {
        // 湾岸: 海と斜めの海岸線、船着き場の石
        c.fillStyle = '#0ea5e9'; c.globalAlpha = 0.5;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(cell * 3.6, 0); c.lineTo(0, cell * 3.6); c.closePath(); c.fill();
        c.globalAlpha = 1;
        seg(0.4, 3.6, 3.6, 0.4, '#fde68a', 2.6);
        blk(4.6, 4.6, '#b45309', '#78350f');
        dot(3.4, 3.4, P1, P1S, R * 0.85);
        dot(4.8, 2.2, P2, P2S, R * 0.85);
                    break;
                }
                case 'begomago': {
        // ベーゴマ: ぶつかる二つの独楽と衝撃
        tri(2.0, 3.4, cell * 0.7, '#dc2626', '#7f1d1d', Math.PI / 2);
        tri(4.2, 2.8, cell * 0.7, '#e2e8f0', '#64748b', Math.PI / 2);
        seg(2.0, 2.4, 2.0, 2.9, '#7f1d1d', 1.8);
        seg(4.2, 1.8, 4.2, 2.3, '#64748b', 1.8);
        seg(3.1, 2.6, 3.4, 1.8, '#facc15', 1.8);
        seg(3.1, 3.6, 3.4, 4.4, '#facc15', 1.8);
        seg(2.8, 3.1, 3.8, 3.1, '#facc15', 1.8);
                    break;
                }
                case 'bellgo': {
        ring(3, 3.2, cell * 1.7, '#7c5a2e', 1.8);
        seg(1.8, 4.8, 4.2, 4.8, '#7c5a2e', 2);
        dot(3, 3.1, '#7c5a2e', '#503a1a', cell * 0.9);
        dot(3, 4.6, '#44403c', '#292524', cell * 0.3);
        ring(3, 1, cell * 0.35, '#7c5a2e', 1.4);
                    break;
                }
                case 'bentogo': {
        blk(1.4, 1.8, "rgba(217,119,6,0.25)", "#92400e"); blk(2.4, 1.8, "rgba(217,119,6,0.25)", "#92400e");
        blk(3.4, 1.8, "rgba(217,119,6,0.25)", "#92400e"); blk(4.4, 1.8, "rgba(217,119,6,0.25)", "#92400e");
        blk(1.4, 2.8, "rgba(217,119,6,0.25)", "#92400e"); blk(2.4, 2.8, "rgba(217,119,6,0.25)", "#92400e");
        blk(3.4, 2.8, "rgba(217,119,6,0.25)", "#92400e"); blk(4.4, 2.8, "rgba(217,119,6,0.25)", "#92400e");
        dot(2.4, 4.4, P1, P1S, cell * 0.28); dot(4.4, 4.4, P2, P2S, cell * 0.28);
                    break;
                }
                case 'bidgo': {
        ring(3, 2.4, R * 1.5, '#f59e0b', 2);
        txt('¥', 3, 2.4, '#b45309', cell * 0.9);
        dot(1.8, 4, P1, P1S);
        dot(4.2, 4, P2, P2S);
                    break;
                }
                case 'biidamago': {
        // ビー玉: 穴に落ちるガラス玉と穴
        ring(3, 4.0, cell * 0.7, '#0f172a', 2.6);
        dot(3, 2.6, '#a5f3fc', '#0891b2');
        ring(3.25, 2.35, cell * 0.16, '#ffffff', 1.2);
        seg(3, 3.0, 3, 3.6, '#67e8f9', 1.4);
                    break;
                }
                case 'bingolinego': {
        // 釣合(ビンゴ): 斜めの5連ライン
        [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(([x, y], i) => {
            dot(x, y, i === 4 ? P2 : P1, i === 4 ? P2S : P1S);
        });
        c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1, 1).x, at(1, 1).y); c.lineTo(at(5, 5).x, at(5, 5).y); c.stroke();
        txt('B', 5, 1, '#f59e0b', cell * 0.8);
    
                    break;
                }
                case 'blindspotgo': {
        dot(3, 3, P1, P1S);
        ring(3, 3, R * 1.7, '#8b5cf6', 1.6);
        seg(2.4, 2.4, 3.6, 3.6, '#8b5cf6', 1.6);
        seg(3.6, 2.4, 2.4, 3.6, '#8b5cf6', 1.6);
                    break;
                }
                case 'blockcitygo': {
        seg(0.8, 3, 5.2, 3, "#57534e", 3.2);
        seg(3, 0.8, 3, 5.2, "#57534e", 3.2);
        blk(1.7, 1.7, "#d6d3d1", "#78716c");
        blk(4.3, 1.7, "#d6d3d1", "#78716c");
        blk(1.7, 4.3, "#d6d3d1", "#78716c");
        dot(4.3, 4.3, P1, P1S, R * 0.8);
        dot(1.7, 1.7, P2, P2S, R * 0.7);
                    break;
                }
                case 'bloomgo': {
        dot(3, 3, P1, P1S, R * 0.8);
        dot(3, 2.1, "#f9a8d4", "#ec4899", R * 0.45);
        dot(4, 2.7, "#f9a8d4", "#ec4899", R * 0.45);
        dot(3.8, 3.9, "#f9a8d4", "#ec4899", R * 0.45);
        dot(2.2, 3.9, "#f9a8d4", "#ec4899", R * 0.45);
        dot(2, 2.7, "#f9a8d4", "#ec4899", R * 0.45);
        dot(3, 3, "#fde047", "#eab308", R * 0.35);
                    break;
                }
                case 'bluffgo': {
        // 詐称: 大きく見せた石と看破マーク
        dot(2, 3, P1, P1S, cell * 0.42);
        ring(2, 3, cell * 0.85, '#f87171', 2);
        txt('!', 2, 3, '#fef3c7', cell * 0.7);
        // 見抜く目
        c.strokeStyle = '#0ea5e9'; c.lineWidth = 1.8;
        c.beginPath(); c.ellipse(at(4.4, 2.6).x, at(4.4, 2.6).y, cell * 0.7, cell * 0.42, 0, 0, Math.PI * 2); c.stroke();
        dot(4.4, 2.6, '#0284c7', '#0369a1', cell * 0.2);
        dot(4.4, 4.6, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'bonsaigo': {
        dot(2.5, 1.7, P1, P1S, R * 0.8);
        dot(1.8, 2.4, P1, P1S, R * 0.6);
        dot(3.2, 2.4, P1, P1S, R * 0.6);
        seg(2.5, 2.5, 2.5, 3.3, "#78350f", 2);
        blk(2.5, 3.7, "#92400e", "#451a03");
                    break;
                }
                case 'bonshogo': {
        // 鐘撞: 梵鐘と撞木、音波
        c.fillStyle = '#a16207'; c.strokeStyle = '#713f12'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(at(3.4,2.6).x, at(3.4,2.6).y, cell * 1.1, Math.PI, 0);
        c.rect(at(3.4,2.6).x - cell * 1.1, at(3.4,2.6).y, cell * 2.2, cell * 1.1); c.fill(); c.stroke(); // 鐘
        seg(0.9, 2.6, 2.1, 2.6, '#78350f', cell * 0.34); // 撞木
        ring(3.4, 3.2, cell * 1.7, 'rgba(161,98,7,0.5)', 1.4); // 音波
        ring(3.4, 3.2, cell * 2.2, 'rgba(161,98,7,0.3)', 1.2);
        dot(3.4, 2.1, '#fde047', '#eab308', R * 0.3); // 撞座
                    break;
                }
                case 'borego': {
        // 削岩機: 岩塊+ドリル+岩屑
        blk(4.0, 3.4, '#78716c', '#44403c');
        tri(2.0, 3.4, cell * 0.4, '#a8a29e', '#57534e', Math.PI);
        seg(1.0, 3.4, 1.8, 3.4, '#57534e', 3);
        dot(3.6, 2.4, '#d6d3d1', '#a8a29e', cell * 0.12);
        dot(4.6, 2.6, '#d6d3d1', '#a8a29e', cell * 0.1);
                    break;
                }
                case 'borrowturngo': {
        dot(2, 2.4, P1, P1S);
        dot(4, 3.8, P2, P2S);
        seg(2.8, 2.8, 3.6, 3.4, '#38bdf8', 1.8);
        tri(3.7, 3.5, cell * 0.15, '#38bdf8', '#38bdf8', Math.PI / 3);
        txt('借', 3, 1.4, '#38bdf8', cell * 0.8);
                    break;
                }
                case 'bouncygo': {
        // 弾み: 弾む石 + 跳ね返り弧 + 押される石
        dot(2.2, 1.6, P1, P1S, cell * 0.46);
        seg(1.0, 3.0, 2.8, 3.0, '#f59e0b', 2.0);
        ring(2.9, 3.0, cell * 0.62, '#f59e0b', 1.6);
        dot(4.2, 3.0, P2, P2S, cell * 0.4);
        seg(4.6, 2.6, 5.3, 2.3, '#94a3b8', 1.5);
                    break;
                }
                case 'boundarygo': {
        // 境界碁: 境の杭と対峙する石
        seg(3.0, 0.8, 3.0, 5.4, '#57534e', 3);
        dot(1.8, 3.0, P1, P1S);
        dot(4.2, 3.0, P2, P2S);
        seg(2.2, 1.4, 2.2, 2.4, '#a16207', 3);
        seg(3.8, 3.8, 3.8, 4.8, '#a16207', 3);
                    break;
                }
                case 'boushugo': {
// 大地に蒔かれる種と芽
ctx.fillStyle='rgba(120,80,40,0.5)';
ctx.fillRect(0,cell*3.8,cell*6,cell*2.2);
seg(0.6,3.8,5.4,3.8,'rgba(90,60,30,0.8)',1.4);
dot(1.6,4.4,'#a16207','#713f12',cell*0.24,1);
dot(3.1,4.6,'#a16207','#713f12',cell*0.24,1);
dot(4.5,4.4,'#a16207','#713f12',cell*0.24,1);
seg(3.1,3.8,3.1,2.8,'#65a30d',1.8);
seg(3.1,2.8,2.5,2.2,'#65a30d',1.6);
seg(3.1,2.8,3.7,2.2,'#65a30d',1.6);
dot(2.45,2.15,'#86efac','#166534',cell*0.16,1);
dot(3.75,2.15,'#86efac','#166534',cell*0.16,1);
                    break;
                }
                case 'branchgo': {
        dot(2.5, 3.5, P1, P1S);
        seg(2.5, 3.5, 1.5, 2.1, "#92400e", 2);
        seg(2.5, 3.5, 2.5, 1.6, "#92400e", 2);
        seg(2.5, 3.5, 3.6, 2.2, "#92400e", 2);
        dot(1.5, 2.1, P2, P2S, R * 0.7);
        dot(3.6, 2.2, P2, P2S, R * 0.7);
                    break;
                }
                case 'brewgo': {
        // 醸造: 仕込み樽と酒の滴
        blk(2.6, 3.6, '#92400e', '#451a03');
        seg(1.8, 3.2, 3.4, 3.2, '#451a03', 1.8);
        seg(1.8, 4, 3.4, 4, '#451a03', 1.8);
        c.fillStyle = '#fbbf24';
        c.beginPath(); c.moveTo(at(4.4,1.6).x, at(4.4,1.6).y); c.quadraticCurveTo(at(5,2.7).x, at(5,2.7).y, at(4.4,2.9).x, at(4.4,2.9).y); c.quadraticCurveTo(at(3.8,2.7).x, at(3.8,2.7).y, at(4.4,1.6).x, at(4.4,1.6).y); c.fill();
        dot(4.6, 4.8, P1, P1S, R * 0.75);
                    break;
                }
                case 'brushgo': {
        // 筆造: 筆の穂先と軸、書き跡の墨線
        seg(4.6, 1.0, 3.4, 2.6, '#8a5a2b', 2.6);
        tri(3.0, 3.2, cell * 0.55, '#1c1917', '#0c0a09', Math.PI * 1.25);
        seg(1.4, 4.6, 4.4, 4.9, '#1c1917', 2.0);
        seg(1.6, 4.2, 2.4, 4.35, '#1c1917', 1.4);
                    break;
                }
                case 'bulletgo': {
        // 弾丸: 発射する弾 + 貫通線 + 撃たれる敵石
        dot(1.2, 4.6, P1, P1S, cell * 0.4);
        seg(1.8, 4.2, 4.4, 2.2, '#fbbf24', 2.2);
        tri(4.7, 2.0, cell * 0.32, '#fbbf24', '#b45309', Math.PI / 3);
        dot(4.6, 1.2, P2, P2S, cell * 0.34, 0.55);
        dot(5.1, 0.9, P2, P2S, cell * 0.28, 0.35);
                    break;
                }
                case 'bumpygo': {
        // 凸凹: 段差地形を滑り落ちる石
        blk(1.2, 2, '#a8a29e', '#57534e');
        blk(2.8, 2.6, '#78716c', '#57534e');
        blk(4.4, 3.2, '#57534e', '#44403c');
        dot(1.2, 1, P1, P1S, R * 0.85);
        dot(4.4, 4.6, P2, P2S, R * 0.85);
        seg(2, 1.6, 3.8, 3.6, '#f59e0b', 1.6);
                    break;
                }
                case 'bunkergo': {
        // 地下壕: レンガの壁に囲まれた暗い壕
        blk(2, 2, '#57534e', '#292524'); blk(4, 2, '#57534e', '#292524');
        blk(2, 4, '#57534e', '#292524'); blk(4, 4, '#57534e', '#292524');
        c.fillStyle = '#0c0a09';
        c.fillRect(cell * 2.3, cell * 2.3, cell * 1.4, cell * 1.4);
        dot(3, 3, P1, P1S, R * 0.75);
        dot(1, 5, P2, P2S, R * 0.75);
        dot(5, 5, P2, P2S, R * 0.75);
                    break;
                }
                case 'burialgo': {
        blk(2.5, 3.5, "#292524", "#0c0a09");
        dot(2.5, 1.9, P1, P1S, R * 0.75);
        seg(2.5, 2.4, 2.5, 3.0, "#78716c", 1.6);
        dot(4.1, 3.5, P2, P2S, R * 0.6);
                    break;
                }
                case 'byakuyago': {
// 白夜の太陽と消えた夜帯
ctx.fillStyle='rgba(30,27,75,0.35)';
ctx.fillRect(0,0,cell*6,cell*1.6);
dot(3,0.9,'#fde68a','#d97706',cell*0.55,1);
seg(1,0.9,5,0.9,'rgba(253,224,71,0.7)',1.4);
dot(1.5,3.6,P1,P1S,cell*0.5,1);
dot(3.4,3.8,P2,P2S,cell*0.5,1);
dot(5.0,3.4,P1,P1S,cell*0.42,1);
                    break;
                }
                case 'byoubugo': {
        // 屏風: 折り曲がった金屏風
        seg(1.4, 2.2, 2.5, 1.8, '#d4af37', 2.6);   // 折線1上
        seg(2.5, 1.8, 3.5, 2.2, '#d4af37', 2.6);   // 折線2上
        seg(3.5, 2.2, 4.6, 1.8, '#d4af37', 2.6);   // 折線3上
        seg(1.4, 4.8, 2.5, 4.4, '#b8960b', 2.6);   // 折線1下
        seg(2.5, 4.4, 3.5, 4.8, '#b8960b', 2.6);   // 折線2下
        seg(3.5, 4.8, 4.6, 4.4, '#b8960b', 2.6);   // 折線3下
        seg(2.5, 1.8, 2.5, 4.4, '#8a6d0b', 1.2);   // 折り目1
        seg(3.5, 2.2, 3.5, 4.8, '#8a6d0b', 1.2);   // 折り目2
        dot(3, 3.4, '#dc2626', '#991b1b', cell * 0.3); // 松の絵付
                    break;
                }
                case 'calligraphygo': {
        seg(1.4, 1.3, 2.2, 2.5, "#1c1917", 3);
        seg(2.2, 2.5, 3.0, 3.7, "#1c1917", 3);
        seg(3.0, 3.7, 3.9, 4.2, "#1c1917", 2.2);
        dot(3.9, 4.2, P1, P1S, R * 0.6);
        dot(1.4, 1.3, P2, P2S, R * 0.5);
                    break;
                }
                case 'camelliago': {
        // 椿: 落ちた椿と残る花影
        dot(2.6, 2.6, '#dc2626', '#991b1b');
        ring(2.6, 2.6, cell * 0.6, '#f87171', 1.5);
        dot(2.6, 2.6, '#fbbf24', '#d97706', R * 0.3);
        dot(4.2, 4.2, 'rgba(248,113,113,0.7)', '#ef4444', R * 0.45);
        dot(3.4, 4.6, 'rgba(254,202,202,0.7)', '#f87171', R * 0.35);
                    break;
                }
                case 'candlego': {
        // 蝋燭: 蝋の身と燃える炎
        blk(2.7, 2.8, '#fef3c7', '#d6c48a');
        tri(3, 2.0, cell * 0.4, '#fb923c', '#ea580c', 0);
        dot(3, 2.05, '#fde047', '#f59e0b', cell * 0.12);
        seg(2.5, 4.9, 3.5, 4.9, '#a16207', 1.6);
                    break;
                }
                case 'candygo': {
        dot(1.7, 3, "#f472b6", "#be185d", R * 0.9);
        dot(3, 3, "#f472b6", "#be185d", R * 0.9);
        dot(4.3, 3, "#f472b6", "#be185d", R * 0.9);
        seg(1.1, 3, 0.7, 3, "#fbcfe8", 2.2);
        seg(4.9, 3, 5.3, 3, "#fbcfe8", 2.2);
        txt("✦", 1.4, 1.3, "#fbbf24", cell * 0.9);
        txt("✦", 4.7, 4.7, "#fbbf24", cell * 0.7);
                    break;
                }
                case 'capego': {
        // 岬: 海に突き出た岬と頂上の白旗、周りの波
        mol([[0.8, 4.8], [3, 1.4], [5.2, 4.8]], '#4d7c0f', '#365314');
        seg(3, 1.4, 3, 0.5, '#e2e8f0', 1.6);
        tri(3.45, 0.75, cell * 0.35, '#f8fafc', '#94a3b8', Math.PI / 2);
        seg(0.9, 5.3, 5.1, 5.3, '#38bdf8', 1.8);
                    break;
                }
                case 'capsulego': {
                    // カプセルと中身
                    c.save();
                    c.fillStyle = '#93c5fd'; c.strokeStyle = '#1d4ed8'; c.lineWidth = 1.4;
                    // カプセル外形 (丸角長方形)
                    c.beginPath();
                    c.moveTo(at(2, 1.6).x, at(2, 1.6).y);
                    c.arc(at(2, 2.6).x, at(2, 2.6).y, cell, -Math.PI / 2, Math.PI / 2, false);
                    c.lineTo(at(4, 3.6).x, at(4, 3.6).y);
                    c.arc(at(4, 2.6).x, at(4, 2.6).y, cell, Math.PI / 2, Math.PI * 1.5, false);
                    c.closePath(); c.fill(); c.stroke();
                    c.restore();
                    dot(4, 2.6, P1, P1S, cell * 0.42);
                    dot(1.4, 4.9, P1, P1S); dot(4.6, 5, P2, P2S, cell * 0.34);
                    break;
                }
                case 'carbongo': {
        // 炭素: 高圧でダイヤに変わる石炭
        dot(1.6, 4, '#44403c', '#1c1917', R * 0.9);
        seg(2.4, 3.6, 3.4, 2.6, '#f59e0b', 2);
        c.fillStyle = '#7dd3fc'; c.strokeStyle = '#0284c7'; c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(at(4.2,1.4).x, at(4.2,1.4).y); c.lineTo(at(5,2.4).x, at(5,2.4).y);
        c.lineTo(at(4.2,4).x, at(4.2,4).y); c.lineTo(at(3.4,2.4).x, at(3.4,2.4).y);
        c.closePath(); c.fill(); c.stroke();
        dot(1.6, 1.6, P2, P2S, R * 0.7);
                    break;
                }
                case 'caromgo': {
        // 撞球: 手球が敵球をポケットへ
        dot(1.4, 2.2, P1, P1S, cell * 0.44);
        dot(3.2, 3.0, P2, P2S, cell * 0.42);
        ring(5.0, 5.0, cell * 0.6, '#1c1917', 3.0);
        seg(3.6, 3.4, 4.6, 4.4, '#94a3b8', 1.6);
                    break;
                }
                case 'cartgo': {
        // 荷車: 荷台と車輪、積荷
        blk(2.2, 2.9, '#d6a85c', '#a16207');             // 荷台左
        blk(3.4, 2.9, '#d6a85c', '#a16207');             // 荷台右
        dot(2.6, 2.6, '#f59e0b', '#b45309', cell * 0.35); // 積荷1
        dot(3.4, 2.6, '#f59e0b', '#b45309', cell * 0.35); // 積荷2
        ring(2.5, 4.1, cell * 0.5, '#57534e', 2.2);       // 左車輪
        ring(3.5, 4.1, cell * 0.5, '#57534e', 2.2);       // 右車輪
        dot(2.5, 4.1, '#292524', '#000', cell * 0.1);     // 左軸
        dot(3.5, 4.1, '#292524', '#000', cell * 0.1);     // 右軸
        seg(3.8, 2.9, 4.7, 2.3, '#78350f', 2);            // 轅 (引き棒)
        seg(1.4, 4.9, 4.6, 4.9, '#a8a29e', 1.4);          // 轍
                    break;
                }
                case 'castego': {
        dot(2.5, 3.1, P1, P1S);
        ring(2.5, 3.1, cell * 0.6, "#facc15", 1.5);
        tri(2.5, 1.7, cell * 0.5, "#facc15", "#b45309");
        dot(4.2, 4.0, P2, P2S, R * 0.7);
        dot(1.0, 4.2, P2, P2S, R * 0.55);
                    break;
                }
                case 'castleholdgo': {
        // 篭城: 石垣の城と天守
        seg(1.4, 4.6, 4.6, 4.6, '#57534e', 3);            // 石垣基壇
        seg(1.8, 4.6, 1.8, 3.0, '#78716c', 2.4);          // 左壁
        seg(4.2, 4.6, 4.2, 3.0, '#78716c', 2.4);          // 右壁
        seg(1.8, 3.0, 4.2, 3.0, '#78716c', 2.4);          // 城壁
        tri(3, 2.0, cell * 0.6, '#38bdf8', '#0369a1');    // 天守
        dot(3, 3.7, '#292524', '#000', cell * 0.28);      // 城門
        seg(2.2, 1.6, 2.2, 2.4, '#57534e', 1.6);          // 左隅櫓竿
        tri(2.2, 1.5, cell * 0.25, '#f59e0b', '#b45309'); // 左隅櫓
                    break;
                }
                case 'catalystgo': {
        ring(2.6, 3, cell * 0.75, "#c084fc", 2.2);
        dot(2.6, 3, P1, P1S, R * 0.85);
        dot(4.3, 2.2, P2, P2S, R * 0.7);
        seg(3.3, 2.7, 4, 2.35, "#c084fc", 1.7);
        dot(4.3, 4.2, P2, P2S, R * 0.7);
        seg(3.3, 3.4, 4, 3.9, "#c084fc", 1.7);
        txt("6", 1.2, 1.2, "#a855f7", cell * 0.9);
                    break;
                }
                case 'catcradlego': {
        // あやとり: 交差する糸と両手の指
        seg(1.2, 1.8, 4.6, 4.4, '#f472b6', 1.8);
        seg(4.6, 1.8, 1.2, 4.4, '#f472b6', 1.8);
        seg(1.2, 3.1, 4.6, 3.1, '#f472b6', 1.8);
        dot(1.2, 3.1, P1, P1S, cell * 0.3);
        dot(4.6, 3.1, P2, P2S, cell * 0.3);
                    break;
                }
                case 'chabakogo': {
        // 茶箱: 葛籠の箱と持ち手、茶碗
        seg(1.8, 2.6, 4.2, 2.6, '#92600e', 2);     // 箱上縁
        seg(1.8, 4.6, 4.2, 4.6, '#92600e', 2);     // 箱下縁
        seg(1.8, 2.6, 1.8, 4.6, '#92600e', 2);     // 左縁
        seg(4.2, 2.6, 4.2, 4.6, '#92600e', 2);     // 右縁
        c.beginPath(); c.arc(at(3, 2.6).x, at(3, 2.6).y - cell * 0.15, cell * 0.5, Math.PI, Math.PI * 2); c.strokeStyle = '#713f12'; c.lineWidth = 2; c.stroke(); // 持ち手
        dot(3, 3.7, '#166534', '#14532d', cell * 0.45); // 中の茶碗
                    break;
                }
                case 'chainreact': {
                    // 連鎖爆発: 繋がった石と爆発の火花
                    bond(1.2, 4.4, 2.6, 4.4, '#57534e'); bond(2.6, 4.4, 4, 4.4, '#57534e');
                    dot(1.2, 4.4, P2, P2S); dot(2.6, 4.4, P2, P2S); dot(4, 4.4, P2, P2S);
                    // 爆発の火花 (上側)
                    c.strokeStyle = '#fb923c'; c.lineWidth = 1.6;
                    [[3, 1.6, 3, 0.7], [2.1, 2, 1.5, 1.2], [3.9, 2, 4.5, 1.2], [2.4, 2.7, 1.8, 2.4], [3.6, 2.7, 4.2, 2.4]]
                        .forEach(([x1, y1, x2, y2]) => seg(x1, y1, x2, y2, '#fb923c', 1.6));
                    dot(3, 3.1, '#fdba74', '#ea580c', cell * 0.4);
                    break;
                }
                case 'channelgo': {
        dot(1.2, 1.4, P1, P1S);
        dot(4.0, 3.8, P1, P1S);
        seg(1.2, 1.4, 4.0, 3.8, "#a855f7", 1.4);
        ring(1.2, 1.4, cell * 0.55, "#c084fc", 1.2);
        ring(4.0, 3.8, cell * 0.55, "#c084fc", 1.2);
                    break;
                }
                case 'chefgo': {
        // 料理: 鍋と食材の石
        dot(2, 2, P1, P1S); dot(4, 2, P2, P2S);
        // フライパン
        c.strokeStyle = '#78350f'; c.lineWidth = cell * 0.22; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3.2, 4.2).x, at(3.2, 4.2).y); c.lineTo(at(4.8, 4.2).x, at(4.8, 4.2).y); c.stroke();
        c.fillStyle = '#f97316'; c.strokeStyle = '#c2410c'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(at(2.8, 4).x, at(2.8, 4).y, cell * 0.9, 0, Math.PI * 2); c.fill(); c.stroke();
        txt('♨', 2.8, 4, '#fef3c7', cell * 0.9);
    
                    break;
                }
                case 'chickengo': {
        ring(3, 2.2, cell * 0.55, '#d97706', 1.8);
        dot(3, 2.2, P1, P1S, R * 0.75);
        dot(2.2, 4.2, '#fef3c7', '#d97706', R * 0.55);
        dot(3.8, 4.4, '#fef3c7', '#d97706', R * 0.55);
                    break;
                }
                case 'chisengo': {
        // 池泉: 青い池と景石、水辺の草
        dot(3, 3.6, '#0ea5e9', '#0369a1', cell * 1.4, 0.85);
        ring(3, 3.6, cell * 0.7, '#bae6fd', 1.2);
        dot(1.6, 4.6, '#78716c', '#44403c', cell * 0.5);
        dot(4.6, 4.4, '#57534e', '#44403c', cell * 0.4);
        seg(4.9, 2.4, 5.1, 3.2, '#16a34a', 1.4);
                    break;
                }
                case 'ciphergo': {
        txt('1', 1.8, 2.0, '#38bdf8', cell * 0.7);
        txt('2', 3.2, 3.4, '#38bdf8', cell * 0.7);
        txt('?', 4.4, 1.6, '#64748b', cell * 0.7);
        dot(2.6, 4.2, P1, P1S);
                    break;
                }
                case 'circle2go': {
                    // 環: 石の輪と内側の得点
                    [[2, 1.6], [4, 1.6], [4.8, 2.6], [4.8, 4], [4, 4.8], [2, 4.8], [1.2, 4], [1.2, 2.6]]
                        .forEach(([x, y]) => dot(x, y, P1, P1S, cell * 0.34));
                    txt('+', 3, 3.2, '#8b5cf6', cell * 1.3);
                    break;
                }
                case 'circuitgo': {
// 中央コアと回路配線
ctx.strokeStyle='rgba(74,222,128,0.9)'; ctx.lineWidth=1.8;
ctx.strokeRect(cell*1.6,cell*1.6,cell*2.8,cell*2.8);
dot(3,3,'#4ade80','#166534',cell*0.45,1);
seg(0.4,3,1.6,3,'#4ade80',1.6);
seg(4.4,3,5.6,3,'#4ade80',1.6);
seg(3,0.4,3,1.6,'#4ade80',1.6);
seg(3,4.4,3,5.6,'#4ade80',1.6);
dot(0.4,3,P1,P1S,cell*0.3,1);
dot(5.6,3,P2,P2S,cell*0.3,1);
                    break;
                }
                case 'cliffgo': {
        seg(0.7, 2.4, 5.3, 2.4, "#57534e", 2.4);
        seg(0.9, 2.4, 0.9, 3.2, "#78716c", 1.4);
        seg(2.6, 2.4, 2.6, 3.4, "#78716c", 1.4);
        seg(4.3, 2.4, 4.3, 3.0, "#78716c", 1.4);
        dot(2.6, 1.7, P1, P1S, R * 0.8);
        seg(2.6, 2.5, 2.6, 3.7, "#0ea5e9", 1.6);
        dot(2.6, 4.5, P1, P1S, R * 0.8);
        dot(4.4, 4.5, P2, P2S, R * 0.8);
                    break;
                }
                case 'cloudgo': {
        dot(1.7, 2.4, "#f0f9ff", "#7dd3fc", cell * 0.75);
        dot(4.3, 2.2, "#f0f9ff", "#7dd3fc", cell * 0.75);
        dot(3, 4.4, "#f0f9ff", "#7dd3fc", cell * 0.75);
        seg(2.4, 2.3, 3.6, 2.2, "#94a3b8", 1.2);
                    break;
                }
                case 'cloudseago': {
        seg(1.2, 3.0, 4.8, 3.0, '#cbd5e1', 4.0);
        seg(1.6, 3.9, 4.4, 3.9, '#e2e8f0', 3.4);
        dot(3, 1.9, P1, P1S);
        tri(4.3, 2.3, cell * 0.4, '#94a3b8', '#475569');
                    break;
                }
                case 'coalminego': {
        blk(2, 3.4, '#44403c', '#1c1917');
        blk(3, 3.8, '#292524', '#1c1917');
        blk(3.6, 3.2, '#44403c', '#1c1917');
        seg(2.2, 1.6, 4.6, 3, '#a16207', 1.8);
        seg(4, 1.2, 4.8, 2.4, '#a16207', 1.8);
        dot(2.8, 2.4, '#fbbf24', '#b45309', cell * 0.24);
                    break;
                }
                case 'cobwebgo': {
        ring(3, 3, cell * 0.9, "#e2e8f0", 1.2);
        ring(3, 3, cell * 1.9, "#e2e8f0", 1.2);
        seg(3, 0.9, 3, 5.1, "#e2e8f0", 1.1);
        seg(0.9, 3, 5.1, 3, "#e2e8f0", 1.1);
        seg(1.5, 1.5, 4.5, 4.5, "#e2e8f0", 1.1);
        seg(4.5, 1.5, 1.5, 4.5, "#e2e8f0", 1.1);
        dot(3, 3, P1, P1S, R * 0.7);
        dot(3.95, 3, P2, P2S, R * 0.6);
                    break;
                }
                case 'collidego': {
                    // 衝突: 滑る石→衝突星→止まる石
                    dot(0.9, 3, P1, P1S);
                    seg(1.6, 3, 3, 3, '#57534e', 1.8);
                    tri(3.15, 3, cell * 0.3, '#57534e', '#292524', 0);
                    c.strokeStyle = '#fbbf24'; c.lineWidth = 1.5;
                    [[4, 2.2, 4, 1.6], [4, 3.8, 4, 4.4], [3.2, 3, 2.6, 3], [4.8, 3, 5.4, 3], [3.5, 2.5, 3.1, 2.1], [4.5, 3.5, 4.9, 3.9]]
                        .forEach(([x1, y1, x2, y2]) => seg(x1, y1, x2, y2, '#fbbf24', 1.4));
                    dot(4, 3, P2, P2S, cell * 0.4);
                    break;
                }
                case 'colonygo': {
                    // 3x3区域グリッドと2色の領有
                    c.strokeStyle = '#92610e'; c.lineWidth = 1.2;
                    for (let i = 1; i < 3; i++) {
                        seg(i * 2, 0.6, i * 2, 5.4, '#92610e', 1.2);
                        seg(0.6, i * 2, 5.4, i * 2, '#92610e', 1.2);
                    }
                    dot(1.4, 1.4, P1, P1S, cell * 0.5); dot(0.8, 0.8, P1, P1S);
                    dot(4.4, 1.4, P2, P2S, cell * 0.5); dot(5.2, 0.8, P2, P2S);
                    dot(1.4, 4.6, P2, P2S); dot(4.4, 4.6, P1, P1S);
                    break;
                }
                case 'compassgo': {
        // 方位: 羅針盤の針とN極印
        ring(3, 3, cell * 1.85, '#0369a1', 2); // 盤
        ring(3, 3, cell * 1.5, 'rgba(3,105,161,0.4)', 1.2);
        for (let k = 0; k < 8; k++) { // 方位目盛
            const a = k * Math.PI / 4;
            seg(3 + Math.cos(a) * 1.55, 3 + Math.sin(a) * 1.55,
                3 + Math.cos(a) * (k % 2 === 0 ? 1.35 : 1.45),
                3 + Math.sin(a) * (k % 2 === 0 ? 1.35 : 1.45), '#0369a1', k % 2 === 0 ? 2 : 1.2);
        }
        tri(3, 2.0, cell * 0.6, '#ef4444', '#991b1b'); // 北針
        tri(3, 4.0, cell * 0.6, '#e2e8f0', '#64748b', Math.PI / 2); // 南針
        dot(3, 3, '#f8fafc', '#0369a1', R * 0.3);
        txt('N', 3, 0.7, '#0369a1', cell * 0.6);
                    break;
                }
                case 'condensergo': {
// コンデンサと放電
seg(1,2.4,4.8,2.4,'#facc15',2.4);
seg(1.6,3.6,4.4,3.6,'#facc15',2.4);
seg(0.6,1.4,2.4,2.4,'rgba(250,204,21,0.8)',1.4);
seg(3.6,3.6,5.4,4.6,'rgba(250,204,21,0.8)',1.4);
seg(3,2.4,2.6,1.4,'#fde68a',1.4);
seg(2.6,1.4,3.2,0.9,'#fde68a',1.4);
dot(1,5.2,P1,P1S,cell*0.35,1);
dot(5.2,0.9,P2,P2S,cell*0.35,1);
                    break;
                }
                case 'conductgo': {
        seg(0.8, 1, 0.8, 5, "#facc15", 3.4);
        seg(5.2, 1, 5.2, 5, "#facc15", 3.4);
        txt("+", 0.8, 0.6, "#eab308", cell * 0.7);
        txt("−", 5.2, 0.6, "#eab308", cell * 0.7);
        dot(1.6, 3, P1, P1S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.8);
        dot(4.4, 3, P1, P1S, R * 0.8);
        seg(1.6, 3, 4.4, 3, "#fbbf24", 1.8);
        txt("⚡", 3, 1.8, "#facc15", cell * 0.9);
                    break;
                }
                case 'corridorgo': {
        // 渡廊: 二つの庭を結ぶ細い廊下
        c.fillStyle = 'rgba(74, 160, 80, 0.45)';
        c.fillRect(cell * 0.3, cell * 0.3, cell * 2, cell * 4.4);
        c.fillRect(cell * 3.7, cell * 0.3, cell * 2, cell * 4.4);
        seg(2.3, 3, 3.7, 3, '#b45309', 3);
        dot(1.3, 1.6, P1, P1S, R * 0.8);
        dot(4.7, 4.4, P2, P2S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.7);
                    break;
                }
                case 'counterpointgo': {
        // 対位: 絡み合う二本の旋律線
        seg(1.2, 2.4, 2.4, 2.0, '#38bdf8', 1.8);          // 旋律A-1
        seg(2.4, 2.0, 3.6, 2.6, '#38bdf8', 1.8);          // 旋律A-2
        seg(3.6, 2.6, 4.8, 2.2, '#38bdf8', 1.8);          // 旋律A-3
        seg(1.2, 4.4, 2.4, 4.8, '#c084fc', 1.8);          // 旋律B-1
        seg(2.4, 4.8, 3.6, 4.2, '#c084fc', 1.8);          // 旋律B-2
        seg(3.6, 4.2, 4.8, 4.6, '#c084fc', 1.8);          // 旋律B-3
        dot(2.4, 2.0, '#38bdf8', '#0369a1', cell * 0.18); // 音A
        dot(3.6, 4.2, '#c084fc', '#7e22ce', cell * 0.18); // 音B
        ring(3, 3.4, cell * 0.4, 'rgba(168,85,247,0.5)', 1.2); // 輪唱の輪
                    break;
                }
                case 'covego': {
        tri(2, 3.6, cell * 0.55, "#38bdf8", "#0369a1");
        ring(3.4, 4.2, 1.1, "#38bdf8", 1.4);
        dot(4.2, 2.4, P1, P1S);
                    break;
                }
                case 'cremationgo': {
        // 荼毘の炎と灰
        tri(3, 2.4, cell * 0.8, '#f97316', '#c2410c');
        tri(3, 3, cell * 0.45, '#fbbf24', '#d97706');
        tri(3, 4.9, cell * 0.7, '#d6d3d1', '#a8a29e');
        dot(1.4, 4.9, '#a8a29e', '#78716c', cell * 0.16);
                    break;
                }
                case 'crevicego': {
        // 亀裂: 盤を縦断するギザ裂け目 + 分断される石
        seg(3.0, 0.6, 2.4, 1.8, '#1c1917', 3.0);
        seg(2.4, 1.8, 3.4, 2.8, '#1c1917', 3.0);
        seg(3.4, 2.8, 2.6, 3.9, '#1c1917', 3.0);
        seg(2.6, 3.9, 3.2, 5.2, '#1c1917', 3.0);
        dot(1.6, 2.6, P1, P1S, cell * 0.4);
        dot(4.4, 2.6, P2, P2S, cell * 0.4);
                    break;
                }
                case 'crisisgo': {
        dot(3, 3.2, P1, P1S);
        tri(3, 1.6, cell * 0.5, '#f59e0b', '#b45309', -Math.PI / 2);
        tri(2.2, 2.2, cell * 0.32, '#fbbf24', '#f59e0b', -Math.PI / 2);
        tri(3.8, 2.2, cell * 0.32, '#fbbf24', '#f59e0b', -Math.PI / 2);
        ring(3, 3.2, cell * 0.6, 'rgba(245,158,11,0.8)', 1.8);
                    break;
                }
                case 'crown2go': {
                    // 王冠
                    c.fillStyle = '#facc15'; c.strokeStyle = '#a16207'; c.lineWidth = 1.4;
                    c.beginPath();
                    c.moveTo(at(1.4, 4.4).x, at(1.4, 4.4).y);
                    c.lineTo(at(1.4, 2.4).x, at(1.4, 2.4).y);
                    c.lineTo(at(2.5, 3.2).x, at(2.5, 3.2).y);
                    c.lineTo(at(3, 1.8).x, at(3, 1.8).y);
                    c.lineTo(at(3.5, 3.2).x, at(3.5, 3.2).y);
                    c.lineTo(at(4.6, 2.4).x, at(4.6, 2.4).y);
                    c.lineTo(at(4.6, 4.4).x, at(4.6, 4.4).y);
                    c.closePath(); c.fill(); c.stroke();
                    dot(1.4, 2.1, '#fde68a', '#a16207', cell * 0.16); dot(3, 1.5, '#fde68a', '#a16207', cell * 0.16); dot(4.6, 2.1, '#fde68a', '#a16207', cell * 0.16);
                    dot(3, 5.1, P1, P1S, cell * 0.3);
                    break;
                }
                case 'crowngo2': {
        tri(1.7, 2.4, cell * 0.55, "#fbbf24", "#b45309");
        tri(3, 1.9, cell * 0.55, "#fbbf24", "#b45309");
        tri(4.3, 2.4, cell * 0.55, "#fbbf24", "#b45309");
        blk(1.5, 3.4, "#fbbf24", "#b45309");
                    break;
                }
                case 'crystalgo': {
        mol([[3, 1.3], [1.4, 3], [4.6, 3], [3, 4.7]], "#67e8f9", "#0891b2");
        ring(3, 3, 2.5, "rgba(34,211,238,0.45)", 1.4);
                    break;
                }
                case 'currentgo': {
        seg(1.2, 1.8, 4.8, 1.8, '#22d3ee', 1.8);
        seg(1.2, 3, 4.8, 3, '#22d3ee', 1.8);
        seg(1.2, 4.2, 4.8, 4.2, '#22d3ee', 1.8);
        dot(3.1, 3, P1, P1S, cell * 0.38);
        tri(5, 1.8, cell * 0.2, '#22d3ee', '#22d3ee', 0);
        tri(1, 4.2, cell * 0.2, '#22d3ee', '#22d3ee', Math.PI);
                    break;
                }
                case 'cylindergo': {
        // 中空: 左右が繋がる筒 (両端の繋ぎ矢印)
        c.strokeStyle = '#0ea5e9'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(at(3,1.1).x, at(3,1.1).y, cell * 2, cell * 0.55, 0, 0, Math.PI * 2); c.stroke();
        seg(1, 1.1, 1, 4.9, '#0ea5e9', 2);
        seg(5, 1.1, 5, 4.9, '#0ea5e9', 2);
        c.beginPath(); c.ellipse(at(3,4.9).x, at(3,4.9).y, cell * 2, cell * 0.55, 0, 0, Math.PI); c.stroke();
        dot(1, 3, P1, P1S, R * 0.8);
        dot(5, 3, P2, P2S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.8);
                    break;
                }
                case 'daikango': {
// 氷に閉じた石と融け出す石
ctx.fillStyle='rgba(186,230,253,0.6)';
ctx.fillRect(cell*1.2,cell*2.4,cell*1.8,cell*1.8);
ctx.strokeStyle='#38bdf8'; ctx.lineWidth=1.6;
ctx.strokeRect(cell*1.2,cell*2.4,cell*1.8,cell*1.8);
dot(2.1,3.3,P1,P1S,cell*0.38,1);
dot(4.3,3.4,P2,P2S,cell*0.5,1);
seg(4.3,2.4,4.3,1.6,'#fbbf24',1.6);
seg(4.0,1.9,4.3,1.6,'#fbbf24',1.6);
seg(4.6,1.9,4.3,1.6,'#fbbf24',1.6);
                    break;
                }
                case 'darwingo': {
        // 淘汰: 生き残る連と消える弱い石
        dot(2.2, 2.2, P1, P1S, cell * 0.4);
        dot(3.0, 3.0, P1, P1S, cell * 0.4);
        dot(3.8, 3.8, P1, P1S, cell * 0.4);
        dot(4.8, 1.8, '#d4d4d4', '#a3a3a3', cell * 0.26, 0.55);
        seg(4.5, 1.5, 5.1, 2.1, '#ef4444', 1.6);
        seg(5.1, 1.5, 4.5, 2.1, '#ef4444', 1.6);
                    break;
                }
                case 'dashigo': {
        // 出汁: 旨味の溜まり (菱形の区域) と湯気
        mol([[2, 1.4], [3.2, 2.6], [2, 3.8], [0.8, 2.6]], 'rgba(251,191,36,0.5)', '#d97706');
        mol([[4.4, 2.6], [5.4, 3.6], [4.4, 4.6], [3.4, 3.6]], 'rgba(251,191,36,0.35)', '#d97706');
        seg(2, 4.6, 2, 5.4, '#f59e0b', 1.4);
        seg(3.2, 4.4, 3.6, 5.2, '#f59e0b', 1.2);
        dot(2, 2.6, P1, P1S, cell * 0.28);
        dot(4.4, 3.6, P2, P2S, cell * 0.24);
                    break;
                }
                case 'daynightgo': {
        dot(2, 2.2, '#fde047', '#d97706', cell * 0.52);
        dot(4.1, 3.7, '#e0e7ff', '#6366f1', cell * 0.5);
        dot(4.35, 3.5, '#312e81', '#312e81', cell * 0.4);
        seg(1.2, 4.6, 4.8, 1.4, '#78350f', 1.2);
                    break;
                }
                case 'debtgo': {
        ring(2.5, 2.6, cell * 0.75, '#10b981', 2);
        seg(2.5, 2.6, 2.5, 1.9, '#10b981', 2);
        seg(2.5, 2.6, 3.05, 2.6, '#10b981', 2);
        dot(4.3, 4, '#facc15', '#a16207', cell * 0.45);
        txt('+', 4.3, 4, '#78350f', cell * 0.7);
                    break;
                }
                case 'deckgo': {
        // 山札: 扇状の3枚のカードと石
        c.save();
        [[-0.3, 2.2, 3.6], [0, 3, 3.4], [0.3, 3.8, 3.6]].forEach(([rot, x, y]) => {
            const p = at(x, y);
            c.save(); c.translate(p.x, p.y); c.rotate(rot);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#92400e'; c.lineWidth = 1.4;
            c.fillRect(-cell * 0.5, -cell * 0.8, cell, cell * 1.6);
            c.strokeRect(-cell * 0.5, -cell * 0.8, cell, cell * 1.6);
            c.restore();
        });
        c.restore();
        txt('♠', 3, 3.4, '#1c1917', cell * 0.7);
        dot(5, 1.4, P1, P1S, cell * 0.32); dot(1.2, 1.4, P2, P2S, cell * 0.32);
    
                    break;
                }
                case 'decomposego': {
        // 土に芽
        tri(3, 4.4, cell * 1.1, '#92600e', '#5c3d0b');
        seg(3, 4.2, 3, 3, '#84cc16', 2.2);
        seg(3, 3.4, 2.5, 2.9, '#84cc16', 1.8);
        seg(3, 3.4, 3.5, 2.9, '#84cc16', 1.8);
        dot(4.6, 1.8, P1, P1S, cell * 0.3, 0.7);
                    break;
                }
                case 'deergo': {
        // 鹿: 枝角と苑の柵
        dot(3, 3.7, '#a16207', '#713f12', cell * 0.8);    // 鹿の頭
        seg(2.4, 3.2, 1.9, 2.0, '#d6a85c', 2.2);          // 左角主軸
        seg(2.2, 2.6, 1.6, 2.3, '#d6a85c', 2);            // 左角枝
        seg(2.2, 2.5, 2.5, 2.1, '#d6a85c', 2);            // 左角枝2
        seg(3.6, 3.2, 4.1, 2.0, '#d6a85c', 2.2);          // 右角主軸
        seg(3.8, 2.6, 4.4, 2.3, '#d6a85c', 2);            // 右角枝
        seg(3.8, 2.5, 3.5, 2.1, '#d6a85c', 2);            // 右角枝2
        dot(3, 3.8, '#292524', '#000', cell * 0.13);      // 鼻
        seg(1.5, 4.8, 4.5, 4.8, '#78716c', 2);            // 苑の柵
                    break;
                }
                case 'defergo': {
        seg(1.8, 1.4, 4.2, 1.4, '#34d399', 1.8);
        seg(1.8, 4.6, 4.2, 4.6, '#34d399', 1.8);
        seg(1.8, 1.4, 4.2, 4.6, '#34d399', 1.4);
        seg(4.2, 1.4, 1.8, 4.6, '#34d399', 1.4);
        dot(3, 3.6, '#34d399', '#059669', R * 0.35);
                    break;
                }
                case 'delaygo': {
        dot(2, 3, P1, P1S, cell * 0.34, 0.45);
        dot(4, 3, P1, P1S);
        ring(4, 3, cell * 0.6, 'rgba(165,180,252,0.9)', 1.8);
        seg(4, 3, 4, 1.6, '#a5b4fc', 1.8);
        tri(4, 1.5, cell * 0.18, '#a5b4fc', '#6366f1', -Math.PI / 2);
                    break;
                }
                case 'densitygo': {
        // 相転移: 密な区域
        blk(1.4, 1.4, '#fde68a', '#d97706');
        dot(1.4, 1.4, P1, P1S, cell * 0.28);
        dot(0.9, 1.9, P1, P1S, cell * 0.28);
        dot(1.9, 0.9, P1, P1S, cell * 0.28);
        dot(4.4, 4.2, P2, P2S, cell * 0.3);
        dot(4.9, 3.6, P2, P2S, cell * 0.3);
        seg(0.4, 4.8, 5.6, 0.8, '#94a3b8', 1.2);
                    break;
                }
                case 'detectivego': {
        // 推理: 虫眼鏡と?マーク
        dot(2, 2, P1, P1S);
        ring(3.8, 2.6, cell * 0.85, '#0ea5e9', 2.2);
        seg(4.5, 3.4, 5.4, 4.3, '#0369a1', cell * 0.2);
        txt('?', 3.8, 2.6, '#0284c7', cell * 0.9);
        dot(2, 4.6, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'dewgo': {
        dot(3, 3.2, P1, P1S);
        tri(2, 1.6, cell * 0.22, '#7dd3fc', '#38bdf8', Math.PI);
        tri(4, 1.8, cell * 0.22, '#7dd3fc', '#38bdf8', Math.PI);
        tri(3.4, 4.5, cell * 0.22, '#7dd3fc', '#38bdf8', Math.PI);
                    break;
                }
                case 'dicebuildgo': {
        // 骰子建築: サイコロと積まれた石
        const p = at(2, 2);
        c.fillStyle = '#fef3c7'; c.strokeStyle = '#1c1917'; c.lineWidth = 1.6;
        c.beginPath();
        if (c.roundRect) c.roundRect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4, cell * 0.2); else c.rect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4);
        c.fill(); c.stroke();
        [[-0.35, -0.35], [0.35, -0.35], [0, 0], [-0.35, 0.35], [0.35, 0.35]].forEach(([ox, oy]) => {
            c.fillStyle = '#1c1917';
            c.beginPath(); c.arc(p.x + ox * cell, p.y + oy * cell, cell * 0.11, 0, Math.PI * 2); c.fill();
        });
        // 積まれた石
        dot(4.4, 4.6, P1, P1S, cell * 0.3); dot(4.4, 3.7, P1, P1S, cell * 0.3); dot(4.4, 2.8, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'digitgo': {
        // 位取り: 桁の柱
        blk(1, 4.2, '#e7e5e4', '#a8a29e');
        blk(3, 3.4, '#fde68a', '#d97706');
        blk(5, 2.6, '#fbbf24', '#b45309');
        txt('1', 1, 4.2, '#57534e', cell * 0.7);
        txt('2', 3, 3.4, '#92400e', cell * 0.7);
        txt('3', 5, 2.6, '#78350f', cell * 0.7);
                    break;
                }
                case 'dilemmago': {
        dot(2, 3, P1, P1S, cell * 0.5);
        dot(4, 3, P2, P2S, cell * 0.5);
        seg(2.5, 1.8, 3.5, 1.8, '#f59e0b', 1.6);
        seg(2.5, 4.2, 3.5, 4.2, '#ef4444', 1.6);
                    break;
                }
                case 'dischargego': {
// 稲妻と打たれる石
ctx.fillStyle='#facc15';
ctx.beginPath();
ctx.moveTo(cell*3.4,cell*0.4);
ctx.lineTo(cell*2.2,cell*2.6);
ctx.lineTo(cell*3.1,cell*2.6);
ctx.lineTo(cell*2.0,cell*4.6);
ctx.lineTo(cell*3.9,cell*2.0);
ctx.lineTo(cell*3.0,cell*2.0);
ctx.closePath(); ctx.fill();
dot(1.4,4.8,P1,P1S,cell*0.42,1);
dot(4.6,4.9,P2,P2S,cell*0.42,1);
                    break;
                }
                case 'divego': {
                    // 水面と潜る石
                    c.strokeStyle = '#0ea5e9'; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath();
                    for (let i = 0; i <= 6; i++) {
                        const px = cell * (0.4 + i * 0.9);
                        const py = cell * 2.2 + Math.sin(i * 1.4) * cell * 0.18;
                        i ? c.lineTo(px, py) : c.moveTo(px, py);
                    }
                    c.stroke();
                    dot(3, 3.8, P1, P1S, R, 0.55);
                    dot(1.6, 1.2, P2, P2S);
                    ring(3, 3.8, cell * 0.62, '#38bdf8', 1.4);
                    break;
                }
                case 'dividergo': {
// 分圧回路の分岐点
seg(1,1,3,3,'#38bdf8',1.8);
seg(3,3,5,1,'#38bdf8',1.8);
seg(3,3,5,5,'#38bdf8',1.8);
seg(3,3,1,5,'#38bdf8',1.8);
dot(3,3,'#7dd3fc','#0284c7',cell*0.4,1);
dot(1,1,P1,P1S,cell*0.35,1);
dot(5,1,P2,P2S,cell*0.35,1);
dot(1,5,P2,P2S,cell*0.35,1);
dot(5,5,P1,P1S,cell*0.35,1);
                    break;
                }
                case 'dohyogo': {
        // 土俵: 俵の輪と向かい合う力士石
        ring(3.0, 3.0, cell * 2.0, '#b45309', 3.0);
        dot(2.4, 3.0, P1, P1S, cell * 0.5);
        dot(3.6, 3.0, P2, P1S, cell * 0.5);
        seg(4.8, 1.8, 5.4, 1.2, '#f59e0b', 1.6);
        seg(4.8, 4.2, 5.4, 4.8, '#f59e0b', 1.6);
                    break;
                }
                case 'domgo': {
        blk(1, 4.4, "#92400e", "#451a03");
        ring(3, 3.4, 1.6, "#fdba74", 1.6);
        dot(3, 3, P1, P1S);
                    break;
                }
                case 'dominiongo': {
                    // 大きな連結領土 vs 小さな領土
                    [[1.2, 1.6], [2.2, 1.6], [3.2, 1.6], [1.2, 2.6], [2.2, 2.6], [1.2, 3.6], [2.2, 3.6]]
                        .forEach(([x, y]) => dot(x, y, P1, P1S));
                    bond(1.2, 1.6, 3.2, 1.6, '#57534e'); bond(1.2, 1.6, 1.2, 3.6, '#57534e'); bond(1.2, 3.6, 2.2, 3.6, '#57534e');
                    dot(4.4, 4.4, P2, P2S); dot(5, 4.4, P2, P2S, cell * 0.32);
                    break;
                }
                case 'dominogo': {
        // 骨牌: 倒れゆくドミノ3枚
        [[1.2, 2.2, 0], [2.8, 2.6, 0.5], [4.4, 3.6, 1.1]].forEach(([x, y, rot]) => {
            const p = at(x, y);
            c.save(); c.translate(p.x, p.y); c.rotate(rot);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#1c1917'; c.lineWidth = 1.4;
            c.fillRect(-cell * 0.28, -cell * 1, cell * 0.56, cell * 2);
            c.strokeRect(-cell * 0.28, -cell * 1, cell * 0.56, cell * 2);
            c.beginPath(); c.moveTo(-cell * 0.28, 0); c.lineTo(cell * 0.28, 0); c.stroke();
            c.restore();
        });
        dot(1.2, 1.4, P1, P1S, cell * 0.24); dot(5.4, 4.6, P2, P2S, cell * 0.24);
    
                    break;
                }
                case 'dorodangogo': {
        // 泥団子: 磨かれた茶玉と艶のハイライトと飛ぶ泥
        dot(3.0, 3.4, '#92603a', '#5b3a1e', cell * 1.0);
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath(); c.arc(cell * 3.7, cell * 3.1, cell * 0.18, 0, Math.PI * 2); c.fill();
        dot(1.6, 2.0, '#a16207', '#713f12', cell * 0.16);
        dot(4.6, 1.8, '#a16207', '#713f12', cell * 0.12);
                    break;
                }
                case 'doubledown': {
        dot(2.2, 2.6, P1, P1S);
        dot(3.8, 2.6, P1, P1S);
        txt('x2', 3, 4.4, '#fbbf24', cell * 1.0);
        seg(1.8, 1.4, 4.2, 1.4, '#fbbf24', 2);
        tri(4.2, 1.4, cell * 0.2, '#fbbf24', '#d97706', 0);
                    break;
                }
                case 'dragon2go': {
        // 竜巻: 渦を巻く竜巻と吹き飛ぶ石
        c.strokeStyle = '#94a3b8'; c.lineWidth = cell * 0.26; c.lineCap = 'round';
        c.beginPath();
        for (let t = 0; t <= 1; t += 0.05) {
            const r = 2.2 - t * 1.6;
            const a = t * Math.PI * 3.4;
            const x = 3 + Math.cos(a) * r * 0.6;
            const y = 1 + t * 4;
            t === 0 ? c.moveTo(at(x, y).x, at(x, y).y) : c.lineTo(at(x, y).x, at(x, y).y);
        }
        c.stroke();
        dot(5, 2, P1, P1S, cell * 0.26); dot(5.2, 3.4, P2, P2S, cell * 0.26); dot(0.9, 1.4, P1, P1S, cell * 0.26);
    
                    break;
                }
                case 'dreamgo': {
        // 夢幻: 二つの盤が入れ替わる + 月
        c.strokeStyle = '#a78bfa'; c.lineWidth = 2;
        c.strokeRect(at(1, 1).x - cell * 0.4, at(1, 1).y - cell * 0.4, cell * 2.4, cell * 2.4);
        c.strokeStyle = 'rgba(167,139,250,0.45)'; c.setLineDash([3, 3]);
        c.strokeRect(at(3.6, 3.4).x - cell * 0.4, at(3.6, 3.4).y - cell * 0.4, cell * 2.4, cell * 2.4);
        c.setLineDash([]);
        dot(2, 2, P1, P1S, cell * 0.34); dot(4.6, 4.6, P2, P2S, cell * 0.34);
        // 交換の矢
        c.strokeStyle = '#c4b5fd'; c.lineWidth = 1.8; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(2.6, 1.4).x, at(2.6, 1.4).y); c.quadraticCurveTo(at(4.6, 1).x, at(4.6, 1).y, at(5.4, 2.6).x, at(5.4, 2.6).y); c.stroke();
        c.beginPath(); c.arc(at(1.2, 4.8).x, at(1.2, 4.8).y, cell * 0.55, 0.6, Math.PI * 1.7); c.stroke();
    
                    break;
                }
                case 'dropletgo': {
        dot(3, 3.6, '#38bdf8', '#0369a1', cell * 0.85);
        tri(3, 1.8, cell * 0.8, '#38bdf8', '#0369a1', 0);
        dot(4.6, 4.4, '#7dd3fc', '#0284c7', cell * 0.4);
        dot(1.5, 4.6, '#7dd3fc', '#0284c7', cell * 0.3);
        ring(2.4, 3.2, cell * 0.3, '#bae6fd', 1);
                    break;
                }
                case 'droughtgo': {
        dot(3, 3, '#38bdf8', '#0284c7', cell * 0.34);
        ring(3, 3, cell * 1.5, 'rgba(212,163,115,0.85)', 2);
        seg(1.6, 4.4, 2.4, 4.0, '#d4a373', 1.8);
        seg(2.4, 4.0, 3.0, 4.6, '#d4a373', 1.8);
        seg(3.0, 4.6, 3.8, 4.1, '#d4a373', 1.8);
        dot(4.6, 2.2, P1, P1S, cell * 0.26, 0.5);
                    break;
                }
                case 'dualphasego': {
        blk(2, 2, "rgba(255,255,255,0.85)", "#a8a29e");
        blk(3, 2, "#3f3f46", "#18181b");
        blk(2, 3, "#3f3f46", "#18181b");
        blk(3, 3, "rgba(255,255,255,0.85)", "#a8a29e");
        dot(2, 2, P1, P1S, R * 0.7);
        dot(3, 3, P2, P2S, R * 0.7);
        txt("2x", 4.3, 1.6, "#0ea5e9", cell * 0.9);
        txt("½", 4.3, 4.4, "#f59e0b", cell * 0.9);
                    break;
                }
                case 'dunego': {
        // 砂丘: 三日月形の砂丘と風紋、流れる砂
        mol([[1.1, 4.6], [3, 2.2], [4.9, 4.6]], '#d9b25c', '#a16207');
        seg(1.4, 3.6, 4.6, 3.9, '#f5e0a0', 1.6);
        seg(1.6, 4.2, 4.4, 4.4, '#f5e0a0', 1.4);
        dot(4.9, 2.2, '#eab308', '#a16207', cell * 0.10, 0.9);
        dot(5.4, 1.5, '#eab308', '#a16207', cell * 0.07, 0.7);
                    break;
                }
                case 'dungo': {
        dot(3, 2, P1, P1S);
        seg(3, 2.7, 3, 3.9, "#78716c", 1.4);
        dot(3, 4.5, "#44403c", "#292524", cell * 0.7);
                    break;
                }
                case 'dustbombgo': {
        // 粉塵爆発: 塵の雲+中心の閃光
        dot(2.0, 3.6, '#ca8a04', '#a16207', cell * 0.2);
        dot(3.8, 3.4, '#ca8a04', '#a16207', cell * 0.24);
        dot(2.6, 4.2, '#ca8a04', '#a16207', cell * 0.16);
        tri(3.0, 2.0, cell * 0.5, '#fbbf24', '#f97316');
        seg(1.6, 1.6, 4.4, 1.6, '#f97316', 1.4);
                    break;
                }
                case 'dynamitego': {
        // ダイナマイト: 束+導火線+火花
        seg(2.0, 3.4, 3.8, 3.4, '#dc2626', 4);
        seg(2.0, 3.9, 3.8, 3.9, '#dc2626', 4);
        seg(3.8, 3.4, 4.6, 2.6, '#78716c', 1.6);
        seg(4.6, 2.6, 5.0, 2.0, '#facc15', 1.6);
        dot(5.0, 1.9, '#facc15', '#f97316', cell * 0.18);
                    break;
                }
                case 'echo2go': {
        dot(2.4, 2.4, P1, P1S);
        ring(3.6, 3.6, cell * 0.5, 'rgba(56,189,248,0.8)', 2);
        ring(3.6, 3.6, cell * 0.85, 'rgba(56,189,248,0.45)', 1.6);
        ring(3.6, 3.6, cell * 1.2, 'rgba(56,189,248,0.25)', 1.2);
                    break;
                }
                case 'eclipsego': {
        ring(3, 2.8, cell * 0.85, '#f97316', 2.6);
        dot(3.3, 2.8, '#1c1917', '#0c0a09', cell * 0.72);
        dot(1.4, 4.4, P1, P1S, cell * 0.3);
        dot(4.6, 4.4, P2, P2S, cell * 0.3);
                    break;
                }
                case 'ehogo': {
        // 恵方: 恵方巻きと恵方の方角矢印
        c.fillStyle = '#1c1917'; // 海苔巻き
        c.save(); c.translate(at(3.4,3.6).x, at(3.4,3.6).y); c.rotate(-0.5);
        c.beginPath(); c.ellipse(0, 0, cell * 0.6, cell * 1.5, 0, 0, Math.PI * 2); c.fill(); c.restore();
        c.fillStyle = '#fef3c7'; // 断面
        c.save(); c.translate(at(2.7,4.3).x, at(2.7,4.3).y); c.rotate(-0.5);
        c.beginPath(); c.ellipse(0, 0, cell * 0.55, cell * 0.34, 0, 0, Math.PI * 2); c.fill(); c.restore();
        dot(2.62, 4.25, '#f43f5e', '#9f1239', R * 0.22); // 具
        dot(2.82, 4.38, '#4ade80', '#15803d', R * 0.22);
        seg(3.6, 2.6, 4.9, 1.3, '#fb923c', cell * 0.3); // 恵方矢印
        tri(5.05, 1.15, cell * 0.42, '#fb923c', '#c2410c', Math.PI / 4.6);
                    break;
                }
                case 'ekidengo': {
        dot(2, 3, P1, P1S);
        seg(1.65, 3.35, 2.35, 2.65, '#0ea5e9', cell * 0.16);
        dot(4, 3, P2, P2S);
        seg(3.65, 3.35, 4.35, 2.65, '#0ea5e9', cell * 0.16);
        seg(2.5, 4.4, 3.5, 4.4, '#0ea5e9', 2);
                    break;
                }
                case 'electiongo': {
        blk(2.5, 3.1, "#3b82f6", "#1e40af");
        txt("選", 2.5, 3.1, "#eff6ff", cell * 0.75);
        dot(1.4, 1.6, P1, P1S, R * 0.7);
        dot(3.6, 1.6, P2, P2S, R * 0.7);
                    break;
                }
                case 'elementgo': {
        dot(1.9, 3, '#e0f2fe', '#0284c7');
        dot(4.1, 3, '#fee2e2', '#b91c1c');
        txt('H', 1.9, 3.02, '#0284c7', cell * 0.55);
        txt('O', 4.1, 3.02, '#b91c1c', cell * 0.55);
        bond(2.45, 3, 3.55, 3, 1.8);
                    break;
                }
                case 'embergo': {
        dot(3, 3.6, P1, P1S);
        tri(3, 2.2, cell * 0.5, "#f97316", "#c2410c");
        dot(4.3, 4.4, "#fb923c", "#9a3412", cell * 0.28);
                    break;
                }
                case 'embroiderygo': {
        // 刺繍: 図案枠 (点線) と縫い取った石
        seg(1, 1, 5, 1, '#a21caf', 1.2);
        seg(5, 1, 5, 5, '#a21caf', 1.2);
        seg(5, 5, 1, 5, '#a21caf', 1.2);
        seg(1, 5, 1, 1, '#a21caf', 1.2);
        dot(3, 3, P1, P1S);
        seg(3.6, 2.4, 4.8, 1.2, '#dc2626', 1.8);
                    break;
                }
                case 'emergego': {
        dot(1.9, 3.5, P1, P1S, R * 0.85);
        tri(3.1, 1.9, cell * 0.5, "#a5f3fc", "#0891b2", -Math.PI / 3);
        tri(3.9, 2.3, cell * 0.5, "#a5f3fc", "#0891b2", -Math.PI / 3);
        seg(2.2, 3.2, 3.3, 2.4, "#67e8f9", 1.3);
        dot(4.4, 4.2, P2, P2S, R * 0.6);
                    break;
                }
                case 'encorego': {
        // 完奏: 連符の音符2つ
        dot(2.0, 3.8, '#a855f7', '#7e22ce', cell * 0.26);
        dot(3.8, 3.6, '#a855f7', '#7e22ce', cell * 0.26);
        seg(2.2, 3.7, 2.2, 1.8, '#a855f7', 1.8);
        seg(4.0, 3.5, 4.0, 1.6, '#a855f7', 1.8);
        seg(2.2, 1.8, 4.0, 1.6, '#a855f7', 2.2);
                    break;
                }
                case 'erosiongo': {
        // 流れに攫われる岸の石
        seg(0.8, 1.6, 5.2, 1.6, '#38bdf8', 2);
        seg(0.8, 4.4, 5.2, 4.4, '#38bdf8', 2);
        dot(2, 1.6, P1, P1S, cell * 0.3, 0.85);
        dot(4, 4.4, P2, P2S, cell * 0.3, 0.85);
        seg(4.6, 2.6, 5.4, 3.4, '#0284c7', 1.8);
        tri(5.5, 3.5, cell * 0.2, '#0284c7', '#075985', Math.PI / 4);
                    break;
                }
                case 'escapego2': {
                    // 縦断する黒の一筋と白の妨害
                    dot(3, 1, P1, P1S); dot(3, 2.2, P1, P1S); dot(3, 3.4, P1, P1S); dot(3, 4.6, P1, P1S);
                    bond(3, 1, 3, 4.6, 3);
                    dot(4.4, 2.6, P2, P2S);
                    txt('↕', 1.4, 3, '#dc2626', cell * 1.4);
                    break;
                }
                case 'etogo': {
        // 干支: 十二支の環と中心の石
        ring(3, 3, cell * 1.9, '#b45309', 1.6); // 干支環
        for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6 - Math.PI / 2;
            dot(3 + Math.cos(a) * 1.9, 3 + Math.sin(a) * 1.9,
                k % 3 === 0 ? '#fbbf24' : '#94a3b8', '#78350f', cell * 0.16);
        }
        dot(3, 3, P1, P1S, R * 0.8); // 中心の石
        txt('子', 3, 1.35, '#78350f', cell * 0.55);
                    break;
                }
                case 'evacgo': {
        tri(3, 1.6, cell * 0.7, "#22c55e", "#14532d");
        blk(2.5, 2.4, "#22c55e", "#14532d"); blk(3.5, 2.4, "#22c55e", "#14532d");
        dot(1.6, 4.4, P1, P1S, cell * 0.3);
        seg(2.2, 4.4, 3.4, 3.4, "#f97316", 2);
                    break;
                }
                case 'excavatego': {
        blk(2.4, 3.8, "#78350f", "#451a03"); blk(3.4, 3.8, "#78350f", "#451a03");
        dot(3.4, 3.8, "#facc15", "#a16207", cell * 0.3);
        seg(4.2, 1.4, 4.9, 2.8, "#78716c", 3);
        seg(4.9, 2.8, 4.4, 3.4, "#78350f", 3);
                    break;
                }
                case 'exchangego': {
        dot(3, 1.6, P1, P1S, R);
        seg(2.5, 2.4, 1.8, 3.1, '#f59e0b', 1.6);
        seg(3.5, 2.4, 4.2, 3.1, '#f59e0b', 1.6);
        dot(1.7, 3.8, P1, P1S, R * 0.6);
        dot(3, 4.1, P1, P1S, R * 0.6);
        dot(4.3, 3.8, P1, P1S, R * 0.6);
                    break;
                }
                case 'factorizego': {
        dot(1.6, 1.6, '#a78bfa', '#6d28d9', cell * 0.34);
        dot(3, 3, '#a78bfa', '#6d28d9', cell * 0.34);
        dot(4.4, 4.4, '#a78bfa', '#6d28d9', cell * 0.34);
        txt('素', 2.3, 4.6, '#a78bfa', cell * 0.9);
                    break;
                }
                case 'fakego': {
        dot(2.4, 3.4, P1, P1S);
        dot(3.6, 2.6, P1, P1S, R, 0.45);
        txt('?', 3.6, 2.6, '#fbbf24', cell * 0.8);
                    break;
                }
                case 'fastingo': {
        // 斎戒: 清めの白環と縁だけの石
        ring(3, 3, cell * 1.3, '#e7e5e4', 2.2);
        dot(1, 3, P1, P1S, cell * 0.3);
        dot(5, 3, P1, P1S, cell * 0.3);
        txt('斎', 3, 3, '#a8a29e', cell * 1.2);
                    break;
                }
                case 'faultgo': {
        // 断層: 中央の割れ目とずれた地盤
        seg(3, 0.8, 2.6, 1.8, '#3f2d20', 2.0);
        seg(2.6, 1.8, 3.4, 2.8, '#3f2d20', 2.0);
        seg(3.4, 2.8, 2.7, 3.9, '#3f2d20', 2.0);
        seg(2.7, 3.9, 3.1, 5.0, '#3f2d20', 2.0);
        dot(1.6, 2.4, P1, P1S);
        dot(4.3, 3.4, P2, P2S);
                    break;
                }
                case 'feintgo': {
        dot(2.3, 3, P1, P1S, R, 0.3);
        txt('?', 2.3, 3, '#e879f9', cell * 0.7);
        dot(4, 3, P1, P1S);
        seg(3.2, 4.3, 4.8, 4.3, '#e879f9', 1.6);
                    break;
                }
                case 'fengshuigo': {
        ring(3, 3, cell * 1.1, "#34d399", 2);
        ring(3, 3, cell * 0.6, "#34d399", 2);
        dot(3, 3, P1, "#34d399", cell * 0.3);
        seg(1.2, 4.6, 2.2, 4.2, "#34d399", 2); seg(4.8, 1.4, 3.8, 1.8, "#34d399", 2);
                    break;
                }
                case 'fermentgo': {
        dot(2.5, 3.1, P1, P1S);
        ring(1.9, 2.0, cell * 0.28, "#a3e635", 1.4);
        ring(3.0, 1.7, cell * 0.2, "#a3e635", 1.2);
        ring(3.5, 2.6, cell * 0.24, "#65a30d", 1.3);
        dot(4.2, 4.2, P2, P2S, R * 0.6);
                    break;
                }
                case 'ferrygo': {
        // 渡船: 川を渡る舟と両岸
        seg(1.2, 4.0, 4.8, 4.0, 'rgba(56,189,248,0.7)', 2.4); // 川の流れ1
        seg(1.6, 4.5, 4.4, 4.5, 'rgba(56,189,248,0.5)', 1.8); // 川の流れ2
        tri(3, 3.6, cell * 0.7, '#a16207', '#713f12');    // 舟体
        seg(3, 2.2, 3, 3.2, '#57534e', 1.8);              // 帆柱
        tri(3.5, 2.5, cell * 0.4, '#fef3c7', '#d6a85c');  // 帆
        seg(1.2, 3.2, 2.0, 3.6, '#78716c', 2);            // 左岸
        seg(4.0, 3.6, 4.8, 3.2, '#78716c', 2);            // 右岸
        dot(1.6, 2.9, P1, P1S, cell * 0.3);               // 岸の石
        dot(4.4, 2.9, P1, P1S, cell * 0.3);               // 対岸の石
                    break;
                }
                case 'fibogo': {
        ring(3.4, 3.4, cell * 1.5, '#4ade80', 1.4);
        ring(2.7, 2.7, cell * 0.95, '#4ade80', 1.3);
        ring(2.35, 2.35, cell * 0.55, '#4ade80', 1.2);
        dot(2.2, 2.2, P1, P1S, cell * 0.28);
                    break;
                }
                case 'fireattackgo': {
        // 火計: 燃え上がる炎と火矢
        tri(3, 2.2, cell * 0.85, '#f97316', '#c2410c');   // 外炎
        tri(3, 2.8, cell * 0.5, '#fbbf24', '#f59e0b');    // 内炎
        tri(3.1, 3.3, cell * 0.28, '#fef3c7', '#fbbf24'); // 心炎
        seg(1.4, 4.4, 3.6, 4.9, '#78350f', 2.2);          // 火矢の柄
        tri(3.9, 4.95, cell * 0.3, '#f97316', '#c2410c'); // 火矢の穂
        dot(4.6, 3.6, '#fbbf24', '#f59e0b', cell * 0.14); // 火の粉1
        dot(4.2, 2.6, '#f97316', '#c2410c', cell * 0.12); // 火の粉2
                    break;
                }
                case 'firewatchgo': {
        // 鎮火: 炎+水しぶき
        tri(3.4, 3.4, cell * 0.5, '#f97316', '#dc2626');
        tri(3.4, 3.0, cell * 0.28, '#facc15', '#f97316');
        dot(1.8, 2.4, '#38bdf8', '#0369a1', cell * 0.18);
        dot(1.4, 3.0, '#38bdf8', '#0369a1', cell * 0.14);
        dot(2.2, 3.2, '#38bdf8', '#0369a1', cell * 0.12);
                    break;
                }
                case 'fiveplanetgo': {
        // 五星: 五行の色の連なり
        dot(1.0, 4.6, '#16a34a', '#14532d', cell * 0.28);
        dot(2.0, 3.4, '#dc2626', '#7f1d1d', cell * 0.28);
        dot(3.0, 2.6, '#a16207', '#713f12', cell * 0.28);
        dot(4.0, 3.4, '#d4d4d8', '#71717a', cell * 0.28);
        dot(5.0, 4.6, '#0ea5e9', '#0c4a6e', cell * 0.28);
        bond(1.0, 4.6, 5.0, 4.6, 2);
                    break;
                }
                case 'flag2go': {
                    // 3本の旗
                    [1.4, 3, 4.6].forEach((fx, i) => {
                        c.strokeStyle = '#57534e'; c.lineWidth = 1.6;
                        c.beginPath(); c.moveTo(at(fx, 4.6).x, at(fx, 4.6).y); c.lineTo(at(fx, 1.8).x, at(fx, 1.8).y); c.stroke();
                        tri(fx + 0.38, 2.0, cell * 0.34, i === 1 ? '#ef4444' : P1, i === 1 ? '#b91c1c' : P1S, Math.PI / 2);
                    });
                    dot(2, 4.9, P2, P2S);
                    break;
                }
                case 'floatislego': {
        blk(1, 1.2, '#65a30d', '#3f6212');
        blk(4, 1.2, '#65a30d', '#3f6212');
        blk(1, 4.2, '#65a30d', '#3f6212');
        blk(4, 4.2, '#65a30d', '#3f6212');
        seg(2.2, 3, 3.8, 3, '#38bdf8', 2);
        dot(2.5, 2, P1, P1S, cell * 0.4);
        dot(3.7, 4, P2, P2S, cell * 0.4);
                    break;
                }
                case 'fluidgo': {
        dot(3, 1.6, P2, P2S, R * 0.85);
        seg(3, 2.2, 3, 3.4, "#38bdf8", 2);
        tri(3, 3.6, cell * 0.24, "#38bdf8", "#0284c7", 0);
        dot(3, 4.5, P2, P2S, R * 0.85);
        dot(2, 4.7, P2, P2S, R * 0.7);
        dot(4, 4.7, P2, P2S, R * 0.7);
                    break;
                }
                case 'foggo2': {
        dot(1.6, 3, P1, P1S);
        dot(4.4, 3, P2, P2S, cell * 0.4, 0.35);
        seg(3, 0.8, 3, 5, 'rgba(226,232,240,0.95)', 14);
        seg(3.4, 1.2, 3.4, 4.8, 'rgba(148,163,184,0.5)', 2);
        seg(2.7, 2, 3.3, 2, 'rgba(148,163,184,0.6)', 1.6);
        seg(2.7, 3.6, 3.3, 3.6, 'rgba(148,163,184,0.6)', 1.6);
                    break;
                }
                case 'foodchaingo': {
        // 食物連鎖: 草→虫→鳥→獣
        dot(1, 4.6, '#65a30d', '#3f6212', cell * 0.3);
        dot(2.6, 4.6, '#a16207', '#713f12', cell * 0.3);
        dot(4.2, 4.6, '#0284c7', '#075985', cell * 0.3);
        dot(5.4, 4.6, '#dc2626', '#991b1b', cell * 0.34);
        seg(1.3, 3.8, 5.4, 3.8, '#57534e', 1.4);
        tri(5.4, 3.8, cell * 0.18, '#57534e', '#44403c', 0);
                    break;
                }
                case 'foresightgo': {
        ring(3, 2.6, cell * 0.9, '#a78bfa', 1.8);
        dot(3, 2.6, P1, P1S, R * 0.5);
        seg(1.6, 4.2, 4.4, 4.2, '#a78bfa', 1.4);
        txt('?', 3, 4.2, '#c4b5fd', cell * 0.9);
                    break;
                }
                case 'forkgo': {
        seg(3, 4.8, 3, 3.1, "#57534e", 2);
        seg(3, 3.1, 1.6, 1.4, "#57534e", 2);
        seg(3, 3.1, 4.4, 1.4, "#57534e", 2);
        dot(3, 3.1, "#f59e0b", "#b45309", cell * 0.5);
                    break;
                }
                case 'formationgo': {
        dot(2.3, 2.3, P1, P1S); dot(3.7, 2.3, P1, P1S);
        dot(2.3, 3.7, P1, P1S); dot(3.7, 3.7, P1, P1S);
        ring(3, 3, cell * 1.35, "#facc15", 1.5);
                    break;
                }
                case 'formularygo': {
        // 処方: 3連の処方線 + 上下の治癒対象
        dot(1.6, 3, P1, P1S); dot(3, 3, P1, P1S); dot(4.4, 3, P1, P1S);
        seg(1.6, 3, 4.4, 3, '#0d9488', 1.6);
        dot(3, 1.4, P2, P2S); dot(3, 4.6, P2, P2S);
        ring(3, 1.4, cell * 0.6, '#0d9488', 1.4);
        ring(3, 4.6, cell * 0.6, '#0d9488', 1.4);
                    break;
                }
                case 'fortressgo': {
        blk(2.4, 2.4, '#78716c', '#44403c');
        blk(3, 2.4, '#78716c', '#44403c');
        blk(3.6, 2.4, '#78716c', '#44403c');
        tri(3.3, 1.7, cell * 0.5, '#44403c', '#292524', 0);
        seg(2.2, 4.6, 4.4, 4.6, '#57534e', 2);
        dot(3, 4.9, P1, P1S, cell * 0.4);
                    break;
                }
                case 'fractalgo': {
        tri(3, 3.2, cell * 1.7, 'rgba(74,222,128,0.25)', '#4ade80');
        tri(3, 2.5, cell * 0.75, '#4ade80', '#166534');
        tri(2.15, 3.9, cell * 0.55, '#4ade80', '#166534');
        tri(3.85, 3.9, cell * 0.55, '#4ade80', '#166534');
                    break;
                }
                case 'framego': {
        seg(1.6, 0.8, 1.6, 4.5, "#94a3b8", 2.4);
        seg(0.8, 1.9, 4.4, 1.9, "#94a3b8", 2.4);
        seg(3.5, 1.2, 3.5, 4.5, "#94a3b8", 2);
        dot(1.6, 1.9, P1, P1S);
        dot(3.5, 3.3, P2, P2S);
        tri(2.6, 1.0, cell * 0.38, "#facc15", "#b45309");
                    break;
                }
                case 'freezetaggo': {
        // 氷鬼: 氷の鬼面と凍った石
        blk(1.6, 2.2, '#7dd3fc', '#0284c7');
        seg(2.0, 2.2, 1.8, 1.2, '#0284c7', 1.8);
        seg(3.6, 2.2, 3.8, 1.2, '#0284c7', 1.8);
        dot(4.3, 4.3, '#bae6fd', '#38bdf8');
        seg(1.0, 5.2, 5.0, 5.2, '#bae6fd', 1.4);
                    break;
                }
                case 'frictiongo': {
// 摩擦する2石と静電火花
dot(2.4,3,P1,P1S,cell*0.55,1);
dot(3.7,3,P2,P2S,cell*0.55,1);
seg(3.0,2.0,3.1,1.4,'#fbbf24',1.5);
seg(3.1,1.4,2.9,1.6,'#fbbf24',1.3);
seg(3.05,2.2,3.3,1.9,'#fde68a',1.2);
dot(3.05,2.2,'#fde68a','#f59e0b',cell*0.12,1);
                    break;
                }
                case 'frostpillargo': {
        dot(3, 2.2, P1, P1S);
        seg(2.4, 4.4, 2.4, 3.2, '#7dd3fc', 2);
        tri(2.4, 3.0, cell * 0.18, '#7dd3fc', '#7dd3fc', -Math.PI / 2);
        seg(3.6, 4.4, 3.6, 3.2, '#7dd3fc', 2);
        tri(3.6, 3.0, cell * 0.18, '#7dd3fc', '#7dd3fc', -Math.PI / 2);
                    break;
                }
                case 'fuhyogo': {
        dot(2, 4.2, P1, P1S, cell * 0.42);
        dot(4, 1.8, P1, '#fbbf24', cell * 0.42);
        dot(4, 1.8, '#fbbf24', '#b45309', cell * 0.16);
                    break;
                }
                case 'fukango': {
        // 封緘: 手紙に押された赤い蝋印
        blk(3.0, 3.2, '#fef3c7', '#d6d3d1');
        seg(1.9, 2.4, 3.0, 3.4, '#d6d3d1', 1.2);
        seg(4.1, 2.4, 3.0, 3.4, '#d6d3d1', 1.2);
        dot(3.0, 3.5, '#dc2626', '#7f1d1d', cell * 0.42);
        ring(3.0, 3.5, cell * 0.5, '#991b1b', 1.4);
                    break;
                }
                case 'fukuwaraigo': {
        // 福笑い: 顔の輪郭+ずれた目と口
        ring(2.9, 3.0, cell * 1.5, '#d4a373', 2);
        dot(2.3, 2.6, '#1c1917', '#1c1917', cell * 0.14);
        dot(3.6, 2.9, '#1c1917', '#1c1917', cell * 0.14);
        seg(2.4, 3.9, 3.3, 3.7, '#dc2626', 2);
        seg(2.2, 1.8, 2.5, 2.0, '#1c1917', 1.6);
                    break;
                }
                case 'fulcrumgo': {
        // 梃子: 支点 + 竿 + 跳ね飛ぶ敵石
        tri(2.6, 4.2, cell * 0.55, '#57534e', P1S, -Math.PI / 2);
        seg(1.0, 3.4, 5.0, 2.0, '#92400e', 3.0);
        dot(1.0, 3.1, P1, P1S, cell * 0.4);
        dot(4.9, 1.5, P2, P2S, cell * 0.4);
        seg(4.6, 1.9, 5.2, 1.5, '#f97316', 1.8);
                    break;
                }
                case 'fusebombgo': {
        dot(2.4, 3.4, P1, P1S);
        seg(2.7, 2.9, 3.4, 2.1, "#f97316", 2);
        tri(3.7, 1.9, cell * 0.28, "#fbbf24", "#f97316", 0.4);
        seg(1.3, 4.6, 3.5, 4.6, "#f97316", 1.4);
        dot(4.4, 4.6, P2, P2S, R * 0.7);
        txt("5", 1.2, 1.3, "#f97316", cell * 0.9);
                    break;
                }
                case 'fusekigo': {
        dot(1.3, 1.3, P1, P1S, cell * 0.38);
        dot(4.7, 1.3, P1, P1S, cell * 0.38);
        dot(1.3, 4.7, P2, P2S, cell * 0.38);
        dot(4.7, 4.7, P1, P1S, cell * 0.38);
        dot(3, 3, '#f59e0b', '#b45309', cell * 0.3);
                    break;
                }
                case 'fusumago': {
        // 襖: 両開きの襖と引き手
        blk(1.6, 2.2, '#fde68a', '#b45309');
        blk(4.4, 2.2, '#fde68a', '#b45309');
        blk(1.6, 4.4, '#fde68a', '#b45309');
        blk(4.4, 4.4, '#fde68a', '#b45309');
        dot(2.8, 3.3, '#78350f', '#451a03', cell * 0.16);
                    break;
                }
                case 'gagakugo': {
        // 雅楽: 笙の竹管の束と雅の印
        seg(2.0, 2.0, 2.0, 4.4, '#4d7c0f', 2.2);          // 笙の管1
        seg(2.5, 1.7, 2.5, 4.4, '#65a30d', 2.2);          // 笙の管2
        seg(3.0, 1.5, 3.0, 4.4, '#4d7c0f', 2.2);          // 笙の管3
        seg(3.5, 1.9, 3.5, 4.4, '#65a30d', 2.2);          // 笙の管4
        seg(4.0, 2.3, 4.0, 4.4, '#4d7c0f', 2.2);          // 笙の管5
        dot(3.0, 4.7, '#a16207', '#713f12', cell * 0.5);  // 笙の斗
        txt('雅', 4.9, 1.8, '#fbbf24', cell * 0.55);      // 雅の印
                    break;
                }
                case 'galaxygo': {
        dot(3, 3, '#312e81', '#a5b4fc');
        ring(3, 3, cell * 0.6, '#818cf8', 1.4);
        ring(3, 3, cell * 0.95, '#6366f1', 1.0);
        dot(1.7, 3, '#fbbf24', '#92400e');
        dot(4.3, 3, '#fbbf24', '#92400e');
                    break;
                }
                case 'galego': {
        seg(1.4, 2.2, 4.2, 2.2, '#94a3b8', 2);
        seg(4.2, 2.2, 3.6, 1.8, '#94a3b8', 2);
        seg(4.2, 2.2, 3.6, 2.6, '#94a3b8', 2);
        dot(3.4, 3.8, P1, P1S, R * 0.85);
        seg(1.6, 4.0, 2.6, 4.0, '#cbd5e1', 1.6);
                    break;
                }
                case 'garapongo': {
        // ガラポン: 抽選器+飛び出す玉
        ring(2.9, 2.9, cell * 0.85, '#78716c', 2.2);
        ring(2.9, 2.9, cell * 0.5, '#a8a29e', 1.4);
        seg(2.9, 3.8, 2.9, 4.6, '#78716c', 2.2);
        dot(4.3, 1.7, '#facc15', '#a16207', cell * 0.28);
        dot(1.6, 1.9, '#dc2626', '#991b1b', cell * 0.24);
                    break;
                }
                case 'genjitsugo': {
// 対蹠の2つの幻日
dot(1.4,1.4,'#fde68a','#d97706',cell*0.55,1);
dot(4.6,4.6,'#fde68a','#d97706',cell*0.55,1);
dot(3,3,'#fef3c7','#fbbf24',cell*0.4,1);
ctx.strokeStyle='rgba(251,191,36,0.7)'; ctx.lineWidth=1.3;
ctx.beginPath(); ctx.arc(cell*3,cell*3,cell*1.9,0,Math.PI*2); ctx.stroke();
dot(3.6,4.6,P1,P1S,cell*0.4,1);
dot(1.4,2.6,P2,P2S,cell*0.4,1);
                    break;
                }
                case 'geshigo': {
// 太陽と盤に伸びる影
dot(3,1.6,'#fde68a','#d97706',cell*0.7,1);
seg(1.2,1.6,4.8,1.6,'rgba(217,119,6,0.6)',1.2);
seg(3,0.2,3,3,'rgba(217,119,6,0.6)',1.2);
dot(3,4.2,P1,P1S,cell*0.5,1);
ctx.fillStyle='rgba(0,0,0,0.35)';
ctx.beginPath();
ctx.moveTo(cell*3,cell*4.4);
ctx.lineTo(cell*4.6,cell*5.4);
ctx.lineTo(cell*2.6,cell*5.6);
ctx.closePath(); ctx.fill();
                    break;
                }
                case 'getsureigo': {
// 月齢と夜の帯
ctx.fillStyle='rgba(30,27,75,0.75)';
ctx.fillRect(0,0,cell*6,cell*2.2);
dot(4.6,1.1,'#fde68a','#d97706',cell*0.55,1);
dot(4.85,0.9,'rgba(30,27,75,0.9)','rgba(30,27,75,0.9)',cell*0.5,1);
dot(1.5,3.4,P1,P1S,cell*0.5,1);
dot(3.2,3.6,P2,P2S,cell*0.5,1);
dot(4.9,3.8,P1,P1S,cell*0.4,1);
dot(1.2,1.0,'#e0e7ff','#818cf8',cell*0.08,1);
dot(2.2,1.6,'#e0e7ff','#818cf8',cell*0.06,1);
                    break;
                }
                case 'ghostgo2': {
        ring(3, 3, 1.7, "rgba(168,85,247,0.85)", 2.4);
        dot(3, 3, "rgba(196,181,253,0.55)", "#a855f7");
        dot(3.7, 4.4, "rgba(216,180,254,0.7)", "#a855f7", cell * 0.3);
                    break;
                }
                case 'glaciergo': {
        blk(3, 1, "#bae6fd", "#38bdf8");
        seg(0.8, 1.6, 5.2, 1.6, "#7dd3fc", 2.6);
        seg(1.4, 1.6, 1.4, 2.5, "#e0f2fe", 1.4);
        seg(3, 1.6, 3, 2.7, "#e0f2fe", 1.4);
        seg(4.6, 1.6, 4.6, 2.4, "#e0f2fe", 1.4);
        dot(3, 3.4, P1, P1S, R * 0.8);
        dot(3, 4.6, P1, P1S, R * 0.7);
        seg(3, 2.9, 3, 3.2, "#38bdf8", 1.8);
                    break;
                }
                case 'glasswarego': {
        // 硝子: 透明な石 (輪郭と光の筋だけ)
        ring(2.2, 2.4, cell * 0.42, '#93c5fd', 2.2);
        seg(1.9, 2, 2.3, 2.4, '#e0f2fe', 1.6);
        ring(4, 3.8, cell * 0.42, '#93c5fd', 2.2);
        seg(3.7, 3.4, 4.1, 3.8, '#e0f2fe', 1.6);
        dot(4.2, 1.4, P2, P2S, R * 0.7);
        dot(1.4, 4.6, P1, P1S, R * 0.7);
                    break;
                }
                case 'glazego': {
        // 釉薬: 窯の炎と釉がかった石
        tri(3, 4.9, cell * 1.5, '#c2410c', '#7c2d12', Math.PI / 2);
        c.fillStyle = '#fb923c';
        c.beginPath(); c.moveTo(at(3,4.2).x, at(3,4.2).y); c.lineTo(at(2.4,5.2).x, at(2.4,5.2).y); c.lineTo(at(3.6,5.2).x, at(3.6,5.2).y); c.closePath(); c.fill();
        dot(2.2, 2, P1, P1S, R * 0.85);
        dot(4, 1.6, P2, P2S, R * 0.85);
        ring(4, 1.6, cell * 0.34, '#7dd3fc', 1.6);
                    break;
                }
                case 'glowgo': {
        dot(3, 2.5, P1, P1S);
        ring(3, 2.5, cell * 0.62, 'rgba(253,224,71,0.9)', 2.4);
        ring(3, 2.5, cell * 0.88, 'rgba(253,224,71,0.5)', 1.6);
        dot(1.2, 1.5, P1, P1S, cell * 0.3);
        dot(4.8, 1.5, P2, P2S, cell * 0.3);
                    break;
                }
                case 'gnomongo': {
        // 圭表: 表(石柱)と伸びる影
        seg(3.0, 1.0, 3.0, 4.2, '#57534e', 5);
        seg(3.0, 4.2, 5.2, 4.9, '#a8a29e', 4);
        dot(3.0, 1.0, P1, P1S, cell * 0.26);
        tri(1.4, 4.9, cell * 0.35, '#57534e', '#292524', Math.PI);
                    break;
                }
                case 'goheigo': {
        // 御幣: 幣束の棒と白い紙垂
        seg(3, 1, 3, 4.6, '#92400e', 2.6);
        seg(2.2, 2.2, 3.8, 2.2, '#f8fafc', 2.2);
        seg(2.4, 2.2, 2.8, 3.4, '#f8fafc', 2);
        seg(2.8, 3.4, 2.4, 4.2, '#f8fafc', 2);
        seg(3.6, 2.2, 3.2, 3.4, '#f8fafc', 2);
        seg(3.2, 3.4, 3.6, 4.2, '#f8fafc', 2);
                    break;
                }
                case 'goldenrepairgo': {
        dot(2.5, 2.8, P1, P1S);
        seg(2.0, 2.2, 2.4, 2.6, "#facc15", 1.7);
        seg(2.4, 2.6, 2.2, 3.0, "#facc15", 1.7);
        seg(2.2, 3.0, 2.9, 3.4, "#facc15", 1.7);
        ring(2.5, 2.8, cell * 0.62, "#fde68a", 1.1);
                    break;
                }
                case 'gomago': {
        // 護摩: 護摩壇の炎と護摩木
        seg(1.6, 4.6, 4.4, 4.6, '#b45309', cell * 0.55); // 壇
        seg(2.0, 4.6, 4.0, 4.6, '#92400e', cell * 0.4);
        seg(2.3, 4.3, 3.0, 3.5, '#78350f', cell * 0.2); // 護摩木
        seg(3.7, 4.3, 3.0, 3.5, '#78350f', cell * 0.2);
        tri(3.0, 2.5, cell * 1.0, '#f97316', '#c2410c'); // 炎
        tri(3.0, 2.75, cell * 0.5, '#fde047', '#eab308');
        ring(3, 2.5, cell * 1.55, 'rgba(249,115,22,0.45)', 1.2); // 祈りの輪
                    break;
                }
                case 'goshuingo': {
        seg(2.4, 2.4, 3.6, 2.4, '#dc2626', 1.8);
        seg(3.6, 2.4, 3.6, 3.6, '#dc2626', 1.8);
        seg(3.6, 3.6, 2.4, 3.6, '#dc2626', 1.8);
        seg(2.4, 3.6, 2.4, 2.4, '#dc2626', 1.8);
        dot(3, 3, '#dc2626', '#991b1b', R * 0.5);
                    break;
                }
                case 'gotego': {
        ring(3, 2.2, cell * 0.55, '#34d399', 1.6);
        dot(3, 2.2, P2, P2S, cell * 0.34);
        seg(1.8, 4.4, 4.2, 4.4, '#34d399', 1.8);
        seg(1.8, 4.4, 1.8, 4, '#34d399', 1.8);
        seg(4.2, 4.4, 4.2, 4, '#34d399', 1.8);
                    break;
                }
                case 'gradientgo': {
        // 転がり落ちる珠
        dot(1, 1, P1, P1S, cell * 0.3);
        seg(1.4, 1.4, 4.4, 4.4, '#94a3b8', 1.4);
        tri(4.7, 4.7, cell * 0.22, '#64748b', '#475569', Math.PI * 0.75);
        dot(4.8, 4.8, P2, P2S, cell * 0.3);
        dot(2.6, 2.6, P1, P1S, cell * 0.2, 0.5);
                    break;
                }
                case 'graffitigo': {
        // 落書き: クレヨンの走り書き+消し跡
        seg(1.2, 2.4, 4.6, 2.0, '#38bdf8', 2);
        seg(1.4, 3.2, 4.2, 3.4, '#f472b6', 2);
        seg(1.8, 4.0, 4.8, 3.8, '#facc15', 2);
        seg(3.4, 4.4, 4.6, 4.2, '#e7e5e4', 4);
                    break;
                }
                case 'gravwellgo': {
        ring(3, 3, 2.1, "#7c3aed", 1.6);
        ring(3, 3, 1.1, "#a78bfa", 1.4);
        dot(3, 3, "#1e1b4b", "#312e81", cell * 0.34);
        dot(1.2, 1.4, P1, P1S, R * 0.8);
        dot(4.8, 4.4, P2, P2S, R * 0.8);
        seg(1.5, 1.6, 2.3, 2.2, "#a78bfa", 2);
        seg(4.5, 4.2, 3.7, 3.7, "#a78bfa", 2);
                    break;
                }
                case 'greenflashgo': {
// 落日のグリーンフラッシュ
ctx.fillStyle='rgba(30,58,95,0.9)';
ctx.fillRect(0,cell*3.4,cell*6,cell*2.6);
ctx.fillStyle='#fb923c';
ctx.beginPath(); ctx.arc(cell*3,cell*3.4,cell*1.3,Math.PI,0); ctx.fill();
ctx.fillStyle='#4ade80';
ctx.fillRect(cell*2.2,cell*2.0,cell*1.6,cell*0.28);
dot(1.2,4.6,P1,P1S,cell*0.4,1);
dot(4.8,4.8,P2,P2S,cell*0.4,1);
                    break;
                }
                case 'grovego': {
        tri(1.4, 1.8, cell * 0.55, "#16a34a", "#14532d");
        tri(1.4, 2.4, cell * 0.45, "#15803d", "#14532d");
        tri(4.6, 1.6, cell * 0.55, "#16a34a", "#14532d");
        tri(4.6, 2.2, cell * 0.45, "#15803d", "#14532d");
        tri(3, 4.2, cell * 0.55, "#16a34a", "#14532d");
        dot(2.6, 2.9, P1, P1S, R * 0.8);
        dot(3.6, 3.4, P2, P2S, R * 0.8);
                    break;
                }
                case 'grudgego': {
        dot(3, 3.4, P2, P2S);
        txt('怨', 3, 3.35, '#7e22ce', cell * 0.75);
        ring(3, 3.4, cell * 0.55, '#a855f7', 1.6);
                    break;
                }
                case 'guerrillago': {
        dot(2.4, 3.6, P1, P1S, undefined, 0.55);
        seg(3.8, 4.6, 3.8, 1.6, "#44403c", 2);
        tri(4.4, 2.1, cell * 0.55, "#dc2626", "#7f1d1d");
                    break;
                }
                case 'hakubogo': {
// 薄暮の空と霞む石
ctx.fillStyle='rgba(167,139,250,0.35)';
ctx.fillRect(0,0,cell*6,cell*6);
dot(3,1.4,'#fb923c','#ea580c',cell*0.55,1);
dot(2,3.6,P1,P1S,cell*0.5,0.55);
dot(4,3.8,P2,P2S,cell*0.5,0.55);
seg(0.6,2.6,5.4,2.6,'rgba(196,181,253,0.6)',1.2);
seg(0.8,3.0,5.2,3.0,'rgba(196,181,253,0.45)',1.0);
                    break;
                }
                case 'hakurogo': {
// 露の滴と濡れた石
dot(2,3.6,P1,P1S,cell*0.55,1);
dot(4,3.6,P2,P2S,cell*0.55,1);
dot(2,1.8,'#bfdbfe','#3b82f6',cell*0.22,0.95);
dot(4,1.6,'#bfdbfe','#3b82f6',cell*0.22,0.95);
dot(3.1,2.4,'#dbeafe','#60a5fa',cell*0.14,0.9);
seg(2,1.35,2,1.6,'#93c5fd',1.2);
seg(4,1.15,4,1.38,'#93c5fd',1.2);
                    break;
                }
                case 'hanafudago': {
        blk(2.2, 3, '#ffffff', '#78350f');
        dot(2.2, 2.8, '#fb7185', '#be123c', cell * 0.14);
        dot(2.05, 3.05, '#fb7185', '#be123c', cell * 0.14);
        dot(2.35, 3.05, '#fb7185', '#be123c', cell * 0.14);
        dot(2.2, 3.2, '#fb7185', '#be123c', cell * 0.14);
        blk(4.2, 3.1, '#fb7185', '#be123c');
        txt('月', 4.2, 3.1, '#fff1f2', cell * 0.5);
                    break;
                }
                case 'handcuffgo': {
        dot(3, 3, P1, P1S);
        ring(2.2, 3, cell * 0.5, '#f59e0b', 2.4);
        ring(3.8, 3, cell * 0.5, '#f59e0b', 2.4);
        seg(2.7, 3, 3.3, 3, '#f59e0b', 1.6);
                    break;
                }
                case 'handovergo': {
        dot(1.8, 1.8, P1, P1S);
        dot(4.2, 4.2, P2, P2S);
        seg(2.4, 1.8, 3.9, 3.3, '#a78bfa', 2.2);
        seg(3.6, 1.8, 2.1, 3.3, '#a78bfa', 2.2);
        tri(3.9, 3.3, cell * 0.2, '#a78bfa', '#7c3aed', Math.PI * 0.75);
        tri(2.1, 3.3, cell * 0.2, '#a78bfa', '#7c3aed', -Math.PI * 0.25);
                    break;
                }
                case 'handrankgo': {
        blk(1.9, 3, '#ffffff', '#78350f');
        blk(3, 3, '#ffffff', '#78350f');
        blk(4.1, 3, '#ffffff', '#78350f');
        txt('三', 1.9, 3, '#dc2626', cell * 0.5);
        txt('四', 3, 3, '#dc2626', cell * 0.5);
        txt('五', 4.1, 3, '#dc2626', cell * 0.5);
                    break;
                }
                case 'hanego': {
        dot(1.7, 3, P2, P2S, cell * 0.45);
        dot(4.3, 3, P2, P2S, cell * 0.45);
        dot(3, 3, P1, P1S, cell * 0.5);
        tri(3, 1.6, cell * 0.4, '#f472b6', '#be185d');
                    break;
                }
                case 'harikyugo': {
        // 鍼灸: ツボの点に刺さる鍼
        ring(3, 3.4, cell * 1.1, '#dc2626', 1.6);   // 経穴の輪
        seg(3, 3.4, 3, 1.9, '#a8a29e', 1.6);        // 鍼
        seg(2.6, 1.9, 3.4, 1.9, '#57534e', 1.6);    // 鍼の柄頭
        dot(1.8, 4.4, '#dc2626', '#991b1b', cell * 0.2); // ツボ1
        dot(4.4, 4.4, '#dc2626', '#991b1b', cell * 0.2); // ツボ2
        seg(4.6, 4.2, 4.9, 3.6, '#a8a29e', 1.4);    // もう一本の鍼
                    break;
                }
                case 'harmonygo': {
        // 和声: 縦に重なる和音の音玉
        dot(3, 4.2, '#4ade80', '#166534', cell * 0.45);   // 和音根音
        dot(3, 3.2, '#4ade80', '#166534', cell * 0.45);   // 和音三度
        dot(3, 2.2, '#4ade80', '#166534', cell * 0.45);   // 和音五度
        bond(3, 4.2, 3, 3.2, 2);                          // 結び1
        bond(3, 3.2, 3, 2.2, 2);                          // 結び2
        seg(3.6, 1.6, 3.6, 4.4, '#166534', 1.8);          // 符杆
        txt('♪', 4.6, 1.6, '#f59e0b', cell * 0.55);       // 響き
        ring(1.6, 4.4, cell * 0.35, 'rgba(248,113,113,0.6)', 1.4); // 不協和の兆し
                    break;
                }
                case 'harvestgo': {
        seg(2, 4.6, 2, 1.6, "#eab308", 2.5);
        seg(2, 2.6, 1.4, 2, "#eab308", 2); seg(2, 2.6, 2.6, 2, "#eab308", 2);
        seg(2, 3.6, 1.4, 3, "#eab308", 2); seg(2, 3.6, 2.6, 3, "#eab308", 2);
        blk(3.4, 1.8, "rgba(234,179,8,0.35)", "#a16207");
                    break;
                }
                case 'hashirago': {
        // 柱間: 2本の柱と間の梁
        bond(1.6, 1.2, 1.6, 5.0, 5);
        bond(4.4, 1.2, 4.4, 5.0, 5);
        seg(1.6, 1.8, 4.4, 1.8, '#b45309', 3);
        seg(1.6, 4.4, 4.4, 4.4, '#b45309', 3);
        dot(3.0, 3.1, P2, P2S, cell * 0.22);
                    break;
                }
                case 'hatchgo': {
        dot(2.5, 2.8, P2, P2S, R * 1.15);
        txt("孵", 2.5, 2.8, "#92400e", cell * 0.9);
        ring(2.5, 2.8, cell * 0.85, "#fbbf24", 1.3);
        tri(4.1, 1.5, cell * 0.35, "#fbbf24", "#b45309");
                    break;
                }
                case 'helixgo': {
        ring(3, 3, cell * 1.9, '#94a3b8', 1.4);
        ring(3, 3, cell * 1.2, '#94a3b8', 1.4);
        seg(3, 1.1, 3, 4.9, '#64748b', 1.4);
        dot(3.9, 2.1, P1, P1S, cell * 0.38);
        dot(2.3, 3.6, P2, P2S, cell * 0.38);
                    break;
                }
                case 'henrogo': {
        // 遍路: 菅笠・金剛杖・巡る道
        tri(2.6, 2.0, cell * 0.9, '#d4a017', '#92600a'); // 菅笠
        seg(2.6, 2.5, 2.6, 4.8, '#78350f', cell * 0.16); // 金剛杖
        ring(2.6, 1.05, cell * 0.2, '#92600a', 1.4);
        seg(0.9, 5.2, 5.1, 5.2, '#a16207', 1.4); // 道
        [[1.2,'#f43f5e'],[2.6,'#f43f5e'],[4.0,'#f43f5e'],[5.0,'#cbd5e1']].forEach(([x,col]) =>
            dot(x, 5.2, col, '#7f1d1d', R * 0.34)); // 札所の点
                    break;
                }
                case 'herbalistgo': {
        // 本草: 薬草の葉十字と薬壺の石
        seg(1.8, 2.2, 1.8, 4.4, '#16a34a', 2.4);
        seg(1.8, 2.8, 1.0, 2.2, '#16a34a', 2.2);
        seg(1.8, 2.8, 2.6, 2.2, '#16a34a', 2.2);
        seg(1.8, 3.6, 1.0, 3.0, '#15803d', 2.2);
        seg(1.8, 3.6, 2.6, 3.0, '#15803d', 2.2);
        dot(4.3, 3.4, P2, P2S);
        ring(4.3, 3.4, cell * 0.62, '#d97706', 1.8);
                    break;
                }
                case 'higanbanago': {
        // 彼岸花: 紅い放射状の花弁と茎
        seg(3, 4.9, 3, 3.4, '#16a34a', 2);
        seg(3, 3.2, 3, 1.6, '#dc2626', 1.8);
        seg(3, 3.2, 4.4, 2.2, '#dc2626', 1.8);
        seg(3, 3.2, 1.6, 2.2, '#dc2626', 1.8);
        seg(3, 3.2, 4.0, 1.5, '#ef4444', 1.4);
        seg(3, 3.2, 2.0, 1.5, '#ef4444', 1.4);
        dot(3, 3.2, '#fbbf24', '#d97706', R * 0.35);
                    break;
                }
                case 'hijackgo': {
        seg(1.4, 4.4, 4.4, 1.6, '#fb923c', 2);
        tri(4.5, 1.5, cell * 0.18, '#fb923c', '#fb923c', -Math.PI / 4);
        dot(1.8, 1.8, P2, P2S, R * 0.8);
        dot(4.2, 4.2, P1, P1S, R * 0.8);
                    break;
                }
                case 'hikiyamago': {
        // 山車: 大きな屋根付き車体と車輪、沿道の客石
        seg(1.4, 1.6, 4.6, 1.6, '#b45309', 2.2);
        tri(3.0, 1.1, cell * 0.5, '#dc2626', '#7f1d1d');
        blk(3.0, 3.0, '#b91c1c', '#7f1d1d');
        dot(2.2, 4.6, P1, P1S, cell * 0.34);
        dot(3.8, 4.6, P1, P1S, cell * 0.34);
        dot(0.9, 5.0, P2, P1S, cell * 0.2);
        dot(5.1, 5.0, P2, P1S, cell * 0.2);
                    break;
                }
                case 'hilbertgo': {
        seg(1.4, 1.4, 2.6, 1.4, '#34d399', 1.8);
        seg(2.6, 1.4, 2.6, 2.6, '#34d399', 1.8);
        seg(2.6, 2.6, 1.4, 2.6, '#34d399', 1.8);
        seg(3.4, 2.6, 4.6, 2.6, '#34d399', 1.8);
        seg(3.4, 2.6, 3.4, 4.0, '#34d399', 1.8);
        dot(1.4, 1.4, P1, P1S);
                    break;
                }
                case 'himonogo': {
        // 干場: 物干し竿に吊るした干物
        seg(0.8, 1.6, 5.2, 1.6, '#78350f', 1.8);
        seg(2, 1.6, 2, 2.4, '#a8a29e', 1);
        seg(4, 1.6, 4, 2.4, '#a8a29e', 1);
        tri(2, 3.2, cell * 0.55, '#94a3b8', '#64748b', Math.PI / 2);
        tri(4, 3.2, cell * 0.55, '#cbd5e1', '#64748b', Math.PI / 2);
        seg(2.9, 3.4, 3.1, 3.4, '#64748b', 1);
        dot(1.8, 3, '#f8fafc', '#64748b', cell * 0.1);
                    break;
                }
                case 'hinadango': {
        // 雛壇: 三段の壇と上段の二雛
        seg(0.8, 4.9, 5.2, 4.9, '#be185d', cell * 0.5); // 下段
        seg(1.4, 3.8, 4.6, 3.8, '#db2777', cell * 0.5); // 中段
        seg(2.0, 2.7, 4.0, 2.7, '#f472b6', cell * 0.5); // 上段
        dot(2.5, 2.0, P1, P1S, R * 0.8); // 内裏
        dot(3.5, 2.0, P2, P2S, R * 0.8); // 雛
        dot(3.0, 3.4, P2, P2S, R * 0.55); // 官女
                    break;
                }
                case 'hishago': {
        dot(3, 3, P1, '#ef4444', cell * 0.55);
        seg(1.4, 3, 4.6, 3, '#ef4444', 1.6);
        seg(3, 1.4, 3, 4.6, '#ef4444', 1.6);
                    break;
                }
                case 'hoistgo': {
        // クレーン: 腕+ワイヤー+吊り上げた石
        seg(1.4, 4.6, 1.4, 1.4, '#f59e0b', 3);
        seg(1.4, 1.4, 4.2, 1.4, '#f59e0b', 3);
        seg(4.2, 1.4, 4.2, 2.8, '#78716c', 1.6);
        dot(4.2, 3.1, P2, P2S, cell * 0.34);
        seg(3.9, 2.9, 4.5, 2.9, '#78716c', 1.6);
                    break;
                }
                case 'homeportgo': {
        seg(1, 4.4, 5, 4.4, '#0ea5e9', 1.6);
        seg(1.4, 4.8, 4.6, 4.8, '#38bdf8', 1.2);
        dot(3, 3.2, P1, P1S);
        tri(3, 2.1, R * 0.7, '#0ea5e9', '#0369a1', -Math.PI / 2);
                    break;
                }
                case 'hominggo': {
        // 巣へ帰る矢
        ring(3, 3, cell * 0.7, '#f97316', 2.4);
        dot(3, 3, '#f97316', '#c2410c', cell * 0.22);
        seg(1, 1, 2.2, 2.2, '#57534e', 1.8);
        tri(2.4, 2.4, cell * 0.2, '#57534e', '#44403c', Math.PI / 4);
        dot(0.8, 0.8, P1, P1S, cell * 0.28);
                    break;
                }
                case 'horagaigo': {
        // 法螺貝: 渦巻く貝殻と吹き口
        c.beginPath(); c.arc(at(3.1, 3.4).x, at(3.1, 3.4).y, cell * 1.05, Math.PI * 0.4, Math.PI * 1.95); c.strokeStyle = '#ea580c'; c.lineWidth = 2.4; c.stroke();
        c.beginPath(); c.arc(at(3.1, 3.4).x, at(3.1, 3.4).y, cell * 0.6, Math.PI * 0.4, Math.PI * 1.9); c.strokeStyle = '#c2410c'; c.lineWidth = 2; c.stroke();
        dot(3.3, 3.3, '#fdba74', '#ea580c', cell * 0.26); // 貝の芯
        seg(1.6, 3.9, 2.4, 3.6, '#9a3412', 2.2);   // 吹き口
        dot(1.6, 4, '#78350f', '#451a03', cell * 0.22);
                    break;
                }
                case 'hoshitorigo': {
        // 星取表: 星の帯と増える星
        seg(0.8, 2.2, 5.2, 2.2, '#94a3b8', 1.4);
        seg(0.8, 4.0, 5.2, 4.0, '#94a3b8', 1.4);
        dot(1.6, 3.1, '#facc15', '#a16207', cell * 0.26);
        dot(2.8, 3.1, '#facc15', '#a16207', cell * 0.26);
        dot(4.0, 3.1, '#facc15', '#a16207', cell * 0.26);
        tri(4.9, 3.1, cell * 0.3, '#fde047', '#a16207');
                    break;
                }
                case 'hotarubigo': {
        // 蛍火: 暗がりに瞬く小光点
        c.fillStyle = '#1e293b'; c.fillRect(0, 0, W, W);
        dot(2.0, 2.4, '#d9f99d', '#65a30d', cell * 0.2);
        dot(3.6, 3.2, '#d9f99d', '#65a30d', cell * 0.24);
        dot(4.4, 1.8, '#d9f99d', '#65a30d', cell * 0.16);
        dot(2.6, 4.4, '#d9f99d', '#65a30d', cell * 0.18);
        ring(3.6, 3.2, cell * 0.5, 'rgba(217,249,157,0.5)', 1.2);
                    break;
                }
                case 'hueshiftgo': {
        dot(1.8, 3.4, '#f9a8d4', '#db2777');
        dot(3, 3.4, '#86efac', '#16a34a');
        dot(4.2, 3.4, '#fdba74', '#ea580c');
                    break;
                }
                case 'hungergo': {
        dot(3, 3, '#1c0a0a', '#dc2626');
        tri(2.2, 2.0, cell * 0.22, '#e5e7eb', '#9ca3af');
        tri(3.0, 1.8, cell * 0.22, '#e5e7eb', '#9ca3af');
        tri(3.8, 2.0, cell * 0.22, '#e5e7eb', '#9ca3af');
                    break;
                }
                case 'hurdlego': {
        // 跳欄: 石を飛び越える軌跡
        dot(1.4, 3.8, P1, P1S); dot(4.8, 3.8, P2, P2S);
        // ハードル (中間の石)
        blk(3.1, 3.8, '#fca5a5', '#b91c1c');
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.lineCap = 'round';
        c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(at(1.4, 3.8).x, at(1.4, 3.8).y); c.quadraticCurveTo(at(3.1, 1.4).x, at(3.1, 1.4).y, at(4.8, 3.8).x, at(4.8, 3.8).y); c.stroke();
        c.setLineDash([]);
        tri(4.8, 3.4, cell * 0.3, '#38bdf8', '#0369a1', Math.PI / 2);
    
                    break;
                }
                case 'iaidogo': {
        // 居合: 抜刀の一閃
        seg(1.4, 4.6, 4.6, 1.4, '#e2e8f0', 3.4);
        seg(1.4, 4.6, 2.0, 4.0, '#78350f', 3);
        tri(4.7, 1.3, cell * 0.28, '#f8fafc', '#94a3b8', -Math.PI / 2 + 0.78);
        seg(3.4, 3.6, 4.4, 4.6, '#f59e0b', 1.6);
        dot(4.8, 4.9, '#fbbf24', '#f59e0b', R * 0.3);
                    break;
                }
                case 'iciclego': {
        // 氷柱: 陽に溶けるつらら
        ring(4.6, 1.4, cell * 0.6, '#fbbf24', 2.4);
        seg(3.8, 0.7, 4.2, 1, '#fbbf24', 1.8);
        seg(5.4, 0.7, 5, 1, '#fbbf24', 1.8);
        c.fillStyle = '#bae6fd'; c.strokeStyle = '#38bdf8'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(at(1.6,1.4).x, at(1.6,1.4).y); c.lineTo(at(2.6,1.4).x, at(2.6,1.4).y); c.lineTo(at(2.1,4.6).x, at(2.1,4.6).y); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(at(3,2).x, at(3,2).y); c.lineTo(at(3.6,2).x, at(3.6,2).y); c.lineTo(at(3.3,4).x, at(3.3,4).y); c.closePath(); c.fill(); c.stroke();
        dot(1.4, 5, P1, P1S, R * 0.7);
                    break;
                }
                case 'ignitiongo': {
        // 点火: 聖火台の炎 + 台座
        tri(3, 1.6, cell * 0.6, '#f97316', '#c2410c', -Math.PI / 2);
        tri(3, 2.4, cell * 0.45, '#fbbf24', '#d97706', -Math.PI / 2);
        seg(2.2, 3.4, 3.8, 3.4, '#57534e', 2.6);
        seg(2.5, 3.4, 2.3, 4.8, '#57534e', 2.6);
        seg(3.5, 3.4, 3.7, 4.8, '#57534e', 2.6);
                    break;
                }
                case 'ikebanago': {
        seg(3, 4.8, 3, 2, "#4d7c0f", 2.5);
        seg(2.2, 4.8, 2.2, 3, "#4d7c0f", 2); seg(3.8, 4.8, 3.8, 3.4, "#4d7c0f", 2);
        tri(3, 1.7, cell * 0.4, "#f9a8d4", "#be185d");
        dot(2.2, 2.6, "#f9a8d4", "#be185d", cell * 0.25); dot(3.8, 3, "#fda4af", "#be185d", cell * 0.25);
                    break;
                }
                case 'indigogo': {
        // 藍染: 藍甕と濃淡3段の染まり
        tri(3, 1.6, cell * 0.5, '#1e40af', '#1e3a8a', Math.PI);
        dot(1.6, 4.0, '#93c5fd', '#3b82f6', cell * 0.34);
        dot(3.0, 4.0, '#3b82f6', '#1d4ed8', cell * 0.34);
        dot(4.4, 4.0, '#1e3a8a', '#172554', cell * 0.34);
                    break;
                }
                case 'indivisiblego': {
        // 素数: 割れない塊
        dot(3, 3, P1, P1S, cell * 0.62);
        ring(3, 3, cell * 0.95, '#fbbf24', 2);
        txt('7', 3, 3, '#fde68a', cell * 0.8);
        seg(1, 1, 2, 2, '#94a3b8', 1.4);
        seg(5, 5, 4.2, 4.2, '#94a3b8', 1.4);
                    break;
                }
                case 'inductiongo': {
// コイルと引き寄せられる石
ctx.strokeStyle='#c084fc'; ctx.lineWidth=1.6;
ctx.beginPath(); ctx.arc(cell*1.6,cell*3,cell*0.9,0,Math.PI*2); ctx.stroke();
ctx.beginPath(); ctx.arc(cell*2.6,cell*3,cell*0.9,0,Math.PI*2); ctx.stroke();
dot(1.6,3,P1,P1S,cell*0.4,1);
dot(2.6,3,P1,P1S,cell*0.4,1);
dot(5.0,3,P2,P2S,cell*0.45,1);
seg(4.4,3,3.9,3,'#c084fc',1.8);
seg(4.1,2.8,3.9,3,'#c084fc',1.6);
seg(4.1,3.2,3.9,3,'#c084fc',1.6);
                    break;
                }
                case 'inkgo': {
        // 墨染: 石の周りに滲みが広がる
        const p = at(3, 3);
        const g = c.createRadialGradient(p.x, p.y, cell * 0.2, p.x, p.y, cell * 2);
        g.addColorStop(0, 'rgba(15,23,42,0.85)'); g.addColorStop(1, 'rgba(15,23,42,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, cell * 2, 0, Math.PI * 2); c.fill();
        dot(3, 3, P1, P1S);
        dot(1.2, 4.4, P2, P2S, cell * 0.34);
        dot(4.8, 4.8, P1, P1S, cell * 0.3, 0.5);
    
                    break;
                }
                case 'inletgo': {
        // 入江: 陸地の凹部に入る海と係留ブイ
        blk(0.8, 0.8, '#4d7c0f', '#365314');
        mol([[2.0, 0.8], [3, 2.6], [4.0, 0.8]], '#1a5d8f', '#0b3450');
        ring(3, 3.4, cell * 0.22, '#f8fafc', 1.8);
        dot(3, 3.4, '#ef4444', '#b91c1c', cell * 0.08);
                    break;
                }
                case 'inoshishigo': {
        // 野猪: 突進する猪と牙、掘り起こす轍
        dot(3, 3.4, '#57534e', '#292524', cell * 1.0);    // 猪の体
        dot(3, 3.8, '#44403c', '#292524', cell * 0.45);   // 鼻面
        seg(2.3, 4.0, 1.7, 4.4, '#fef3c7', 2.4);          // 左牙
        seg(3.7, 4.0, 4.3, 4.4, '#fef3c7', 2.4);          // 右牙
        dot(2.5, 2.9, '#ef4444', '#7f1d1d', cell * 0.12); // 左目
        dot(3.5, 2.9, '#ef4444', '#7f1d1d', cell * 0.12); // 右目
        seg(1.2, 4.9, 2.8, 4.7, '#a16207', 1.6);          // 轍1
        seg(3.2, 4.7, 4.8, 4.9, '#a16207', 1.6);          // 轍2
        seg(4.0, 2.0, 4.6, 1.6, '#fbbf24', 2);            // 突進の気配
                    break;
                }
                case 'inougo': {
        // 伊能図: 歩測の足跡と地図の行
        dot(1.2, 1.4, P1, P1S, cell * 0.26);
        dot(2.2, 2.4, P1, P1S, cell * 0.26);
        dot(3.2, 3.4, P1, P1S, cell * 0.26);
        dot(4.2, 4.4, P1, P1S, cell * 0.26);
        seg(0.8, 5.4, 5.2, 5.4, '#0ea5e9', 3);
                    break;
                }
                case 'insectgo': {
        dot(1.8, 4, P2, P2S, cell * 0.3);
        ring(3, 3.2, cell * 0.42, "#e7e5e4", 2);
        dot(4.3, 2, P1, "#fbbf24", cell * 0.35);
        seg(4.3, 2, 4.9, 1.4, "#fbbf24", 1.8); seg(4.3, 2, 4.9, 2.6, "#fbbf24", 1.8);
                    break;
                }
                case 'insulatorgo': {
// 白い陶器の絶縁石と電流の分断
dot(3,3,P1,P1S,cell*0.55,1);
ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=2.2;
ctx.beginPath(); ctx.arc(cell*3,cell*3,cell*0.85,0,Math.PI*2); ctx.stroke();
seg(0.5,1.2,2.0,1.2,'#facc15',1.5);
seg(4.0,1.2,5.5,1.2,'#facc15',1.5);
seg(2.0,1.2,2.0,2.2,'#facc15',1.5);
seg(4.0,1.2,4.0,2.2,'#facc15',1.5);
                    break;
                }
                case 'insurego': {
        tri(3, 3.4, cell * 0.95, '#38bdf8', '#0369a1', Math.PI / 2);
        dot(3, 3.1, P1, P1S, cell * 0.36);
        dot(4.7, 1.8, P2, P2S, cell * 0.3);
        ring(4.7, 1.8, cell * 0.5, '#38bdf8', 1.4);
                    break;
                }
                case 'inversiongo': {
        dot(2, 3, P1, P1S);
        dot(4, 3, P2, P2S);
        txt('⇅', 3, 3, '#dc2626', cell * 1.6);
        seg(1.2, 4.6, 4.8, 4.6, '#78350f', 1.4);
                    break;
                }
                case 'irisgo': {
        // 菖蒲: 水辺の剣葉と紫の花
        seg(1.2, 5.0, 4.8, 5.0, '#38bdf8', 3);
        seg(2.2, 4.8, 2.4, 2.2, '#16a34a', 2.6);
        seg(3.0, 4.8, 2.8, 2.0, '#22c55e', 2.2);
        dot(2.6, 1.9, '#8b5cf6', '#6d28d9', R * 0.75);
        dot(4.2, 3.0, '#a78bfa', '#7c3aed', R * 0.5);
                    break;
                }
                case 'ishidorogo': {
        // 灯籠: 石灯籠と灯る火
        seg(1.9, 2.2, 4.1, 2.2, '#57534e', 2);       // 笠
        tri(3, 1.6, cell * 0.5, '#57534e', '#44403c'); // 宝形
        seg(2.4, 2.4, 2.4, 3.6, '#78716c', 2);        // 柱左
        seg(3.6, 2.4, 3.6, 3.6, '#78716c', 2);        // 柱右
        seg(2.4, 3.6, 3.6, 3.6, '#57534e', 2);        // 中台
        dot(3, 3, '#fbbf24', '#d97706', cell * 0.4);  // 火袋の灯り
        seg(2.6, 3.8, 2.6, 4.9, '#57534e', 2.4);      // 竿
        seg(1.9, 4.9, 3.9, 4.9, '#44403c', 2.4);      // 基壇
                    break;
                }
                case 'ittango': {
        // 一反木綿: 白い布が敵石を包んで運ぶ
        seg(1.2, 1.6, 4.8, 1.2, '#f8fafc', 3.4);
        seg(1.6, 2.4, 4.4, 2.0, '#e2e8f0', 3.0);
        dot(3.4, 3.6, P2, '#94a3b8', cell * 0.5);
        dot(3.4, 3.6, P1, P1S, cell * 0.3);
        seg(2.6, 3.2, 4.2, 4.0, '#f8fafc', 2.4);
                    break;
                }
                case 'iwatogo': {
        // 天岩戸: 岩戸の隙間から漏れる御光
        blk(2.0, 3.0, '#57534e', '#292524');
        blk(4.0, 3.0, '#44403c', '#292524');
        seg(3.0, 0.8, 3.0, 5.2, '#fde047', 3.0);
        dot(3.0, 0.6, '#facc15', '#b45309', cell * 0.3);
        seg(2.4, 5.0, 3.6, 5.0, '#fde68a', 1.6);
                    break;
                }
                case 'jadego': {
        // 翡翠: 深緑の磨かれた石と光沢
        dot(3, 3.2, '#059669', '#047857');
        ring(3, 3.2, cell * 0.62, '#34d399', 1.6);
        seg(2.4, 2.6, 3.0, 2.2, '#a7f3d0', 1.6);
        dot(4.6, 1.6, '#10b981', '#047857', R * 0.55);
        seg(4.2, 1.4, 4.9, 1.2, '#d1fae5', 1.2);
                    break;
                }
                case 'jengago': {
        // 抜積: 積み木の塔と抜き出し中の1個
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
            if (x === 1 && y === 1) continue;
            blk(1.6 + x * 1, 1.8 + y * 1, '#fcd34d', '#b45309');
        }
        const p = at(4.9, 2.8);
        c.fillStyle = '#fbbf24'; c.strokeStyle = '#b45309'; c.lineWidth = 1.2;
        c.fillRect(p.x - cell * 0.43, p.y - cell * 0.43, cell * 0.86, cell * 0.86);
        c.strokeRect(p.x - cell * 0.43, p.y - cell * 0.43, cell * 0.86, cell * 0.86);
        seg(3.7, 2.8, 4.4, 2.8, '#b45309', 2);
    
                    break;
                }
                case 'jibikigo': {
        // 地引網: 引き上げた網と獲物の魚群
        seg(0.8, 1.4, 5.2, 1.4, '#78350f', 1.8);
        mol([[1.4, 1.8], [2.6, 3.4], [3.4, 3.4], [4.6, 1.8]], 'rgba(56,189,248,0.35)', '#0369a1');
        tri(2.2, 3, cell * 0.4, '#38bdf8', '#0369a1', Math.PI / 2);
        tri(3.6, 3.2, cell * 0.4, '#7dd3fc', '#0369a1', Math.PI / 2);
        dot(2, 4.6, '#bae6fd', '#0369a1', cell * 0.16);
                    break;
                }
                case 'jittego': {
        // 十手: 鉄の棒と鍔元の鉤 + 挟まれた敵石
        seg(3, 1, 3, 4.6, '#475569', 3);
        seg(3, 1.8, 4.0, 2.6, '#475569', 2.4);
        dot(1.4, 3.2, P2, P2S, cell * 0.3);
        dot(4.6, 4.4, P2, P2S, cell * 0.3);
                    break;
                }
                case 'jochigo': {
        // 定置網: 網目とかかった魚
        seg(1, 1, 5, 1, '#57534e', 1.4);
        seg(1, 1, 1, 5, '#57534e', 1.4);
        seg(1, 1, 5, 5, '#78716c', 1.2);
        seg(5, 1, 1, 5, '#78716c', 1.2);
        tri(3.4, 3, cell * 0.55, '#38bdf8', '#0369a1', Math.PI / 2);
        dot(4.2, 3, '#f8fafc', '#0369a1', cell * 0.1);
                    break;
                }
                case 'josekigo': {
        dot(1.4, 1.4, P1, P1S, cell * 0.42);
        dot(2.6, 1.4, P2, P2S, cell * 0.42);
        dot(1.4, 2.6, P1, P1S, cell * 0.42);
        seg(1, 4.4, 4.8, 4.4, '#f59e0b', 1.8);
        tri(4.4, 4.4, cell * 0.4, '#f59e0b', '#b45309');
                    break;
                }
                case 'joyago': {
        // 除夜: 除夜の鐘と響き
        c.fillStyle = '#78350f';
        c.beginPath(); c.arc(at(3,3).x, at(3,3).y - cell * 0.1, cell * 0.95, Math.PI, 0);
        c.rect(at(3,3).x - cell * 0.95, at(3,3).y - cell * 0.1, cell * 1.9, cell * 0.9); c.fill(); // 鐘
        c.fillStyle = '#fde047'; c.fillRect(at(3,3).x - cell * 0.12, at(3,3).y - cell * 0.7, cell * 0.24, cell * 0.4); // 撞座
        ring(3, 3, cell * 1.5, 'rgba(180,83,9,0.7)', 1.4); // 響き
        ring(3, 3, cell * 2.0, 'rgba(180,83,9,0.4)', 1.2);
        txt('108', 3, 5.1, '#b45309', cell * 0.6);
                    break;
                }
                case 'judogo': {
        // 柔道: 巴投げの弧
        dot(2.4, 4.0, P1, P1S, R * 0.8);
        dot(4.0, 2.6, P2, P2S, R * 0.8);
        ring(3.0, 3.4, cell * 1.0, '#3b82f6', 1.6);
        seg(3.0, 3.4, 4.0, 2.6, '#93c5fd', 1.8);
        tri(4.4, 2.0, cell * 0.3, '#60a5fa', '#3b82f6', -Math.PI / 4);
                    break;
                }
                case 'jumpropego': {
        // 縄跳び: 跳ぶ石 + 縄の弧
        dot(3, 1.6, P1, P1S, cell * 0.5);
        ring(3, 3.0, cell * 1.9, '#38bdf8', 2.0);
        seg(1.2, 4.9, 4.8, 4.9, '#38bdf8', 2.0);
        dot(0.9, 1.4, '#94a3b8', '#64748b', cell * 0.14);
        dot(5.1, 1.4, '#94a3b8', '#64748b', cell * 0.14);
                    break;
                }
                case 'kadomatsugo': {
        // 門松: 三本の竹と松の葉
        [[1.6,'#16a34a'],[2.4,'#15803d'],[3.2,'#16a34a']].forEach(([gx,col],k) => {
            seg(gx, 4.4 - k * 0.2, gx, 1.4 + k * 0.5, col, cell * 0.34);
        });
        seg(4.4, 4.6, 4.4, 2.6, '#78350f', cell * 0.3); // 松の幹
        [[3.9,2.4],[4.4,1.8],[4.9,2.4]].forEach(([x,y]) => dot(x, y, '#166534', '#14532d', R * 0.7));
        dot(2.4, 4.9, P1, P1S, R * 0.5);
                    break;
                }
                case 'kagogo': {
        // 駕籠: 担ぎ棒と籠体、要人の印
        seg(1.2, 2.2, 4.8, 2.2, '#a16207', 2.4);          // 担ぎ棒
        seg(2.2, 2.2, 2.2, 2.8, '#78350f', 1.8);          // 左吊り縄
        seg(3.8, 2.2, 3.8, 2.8, '#78350f', 1.8);          // 右吊り縄
        blk(2.6, 2.8, '#fbbf24', '#b45309');             // 籠体左
        blk(3.4, 2.8, '#fbbf24', '#b45309');             // 籠体右
        tri(3, 2.6, cell * 0.55, '#fde68a', '#b45309');   // 籠の屋根
        dot(3, 3.6, '#78350f', '#451a03', cell * 0.3);    // 窓の要人
        txt('要', 3, 3.62, '#fef3c7', cell * 0.32);       // 要人印
                    break;
                }
                case 'kagurago': {
        // 神楽: 扇を翳す巫女の舞と神の光輪
        c.fillStyle = '#f43f5e'; c.strokeStyle = '#9f1239'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(at(2.4,4.2).x, at(2.4,4.2).y);
        c.arc(at(2.4,4.2).x, at(2.4,4.2).y, cell * 1.15, -Math.PI * 0.85, -Math.PI * 0.15);
        c.closePath(); c.fill(); c.stroke(); // 扇
        seg(2.4, 4.2, 1.7, 3.3, '#9f1239', 1.2);
        seg(2.4, 4.2, 2.4, 3.05, '#9f1239', 1.2);
        seg(2.4, 4.2, 3.1, 3.3, '#9f1239', 1.2);
        dot(2.4, 4.6, P1, P1S, R * 0.5); // 舞手の石
        ring(4.4, 1.8, cell * 0.7, 'rgba(251,191,36,0.9)', 2); // 神の輪
        dot(4.4, 1.8, '#fde68a', '#d97706', R * 0.5, 0.9);
                    break;
                }
                case 'kaikigo': {
        // 回忌: 位牌と線香の煙
        blk(3, 3.4, '#164e63', '#0e7490'); // 位牌
        seg(2.5, 4.6, 3.5, 4.6, '#164e63', cell * 0.3); // 台
        txt('徳', 3, 3.35, '#a5f3fc', cell * 0.8);
        c.strokeStyle = 'rgba(148,163,184,0.8)'; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1.6,5).x, at(1.6,5).y);
        c.quadraticCurveTo(at(1.3,3.6).x, at(1.3,3.6).y, at(1.9,2.4).x, at(1.9,2.4).y); c.stroke(); // 煙
        c.beginPath(); c.moveTo(at(4.4,5).x, at(4.4,5).y);
        c.quadraticCurveTo(at(4.7,3.6).x, at(4.7,3.6).y, at(4.1,2.4).x, at(4.1,2.4).y); c.stroke();
        dot(1.6, 5.1, '#f97316', '#c2410c', R * 0.3); // 線香火
                    break;
                }
                case 'kajigo': {
        // 加持: 祈りの連と結界の光
        seg(1.4, 4.2, 4.6, 1.8, '#f59e0b', 1.6);
        dot(1.4, 4.2, P1, P1S, cell * 0.3);
        dot(3.0, 3.0, P1, P1S, cell * 0.3);
        dot(4.6, 1.8, P1, P1S, cell * 0.3);
        dot(2.2, 3.6, P1, P1S, cell * 0.3);
        ring(3.0, 3.0, cell * 1.9, '#fbbf24', 1.2);
                    break;
                }
                case 'kajirigo': {
        // 祝由: 呪の環と祓の字 + 消える敵石
        ring(3, 3, cell * 0.9, '#7c3aed', 2.4);
        txt('祓', 3, 3, '#7c3aed', cell * 1.4);
        dot(1.2, 1.2, P2, P2S, cell * 0.28, 0.5);
        dot(4.8, 4.8, P2, P2S, cell * 0.28, 0.5);
                    break;
                }
                case 'kakinego': {
        // 垣根: 竹垣の縦格子と横桟
        seg(1.8, 1.6, 1.8, 4.8, '#a16207', 1.8);
        seg(2.6, 1.6, 2.6, 4.8, '#ca8a04', 1.8);
        seg(3.4, 1.6, 3.4, 4.8, '#a16207', 1.8);
        seg(4.2, 1.6, 4.2, 4.8, '#ca8a04', 1.8);
        seg(1.4, 2.6, 4.6, 2.6, '#713f12', 1.4);
        seg(1.4, 3.8, 4.6, 3.8, '#713f12', 1.4);
                    break;
                }
                case 'kakugyogo': {
        dot(3, 3, P1, '#8b5cf6', cell * 0.55);
        seg(1.7, 1.7, 4.3, 4.3, '#8b5cf6', 1.6);
        seg(4.3, 1.7, 1.7, 4.3, '#8b5cf6', 1.6);
                    break;
                }
                case 'kanjigo': {
        dot(2.0, 3, P1, P1S);
        dot(4.0, 3, P1, P1S);
        txt('火', 2.0, 3.05, '#fef3c7', cell * 0.6);
        txt('山', 4.0, 3.05, '#fef3c7', cell * 0.6);
        bond(2.5, 3, 3.5, 3, 1.6);
                    break;
                }
                case 'kappago': {
        // 河童: 緑の顔に頭の皿と水、くちばし
        dot(3.0, 3.0, '#65a30d', '#365314', cell * 0.95);
        ring(3.0, 2.2, cell * 0.42, '#bae6fd', 2.4);
        dot(3.0, 2.2, '#7dd3fc', '#0284c7', cell * 0.26);
        tri(3.0, 3.4, cell * 0.28, '#fbbf24', '#b45309', Math.PI / 2);
        seg(0.8, 5.0, 5.2, 5.0, '#38bdf8', 2.0);
        seg(1.4, 5.5, 4.6, 5.5, '#38bdf8', 1.6);
                    break;
                }
                case 'karesansuigo': {
        // 枯山水: 砂紋の同心弧と立石
        ring(3, 3, cell * 2.2, '#a8a29e', 1.1);
        ring(3, 3, cell * 1.6, '#a8a29e', 1.1);
        ring(3, 3, cell * 1.0, '#a8a29e', 1.1);
        tri(3, 3, cell * 0.55, '#57534e', '#44403c');
        dot(4.9, 4.7, '#78716c', '#57534e', cell * 0.4);
                    break;
                }
                case 'karutago': {
        blk(2.2, 1.6, "#fde047", "#854d0e"); blk(2.2, 2.6, "#fde047", "#854d0e");
        blk(2.2, 3.6, "#fde047", "#854d0e");
        txt("あ", 3, 3.1, "#854d0e", 9);
        dot(4.3, 3.6, P1, P1S, cell * 0.3);
                    break;
                }
                case 'katsujigo': {
        // 活字: 型に入った字と石のブロック
        blk(1.2, 1.2, P1, P1S);
        blk(2.4, 1.2, P1, P1S);
        blk(1.2, 2.4, P1, P1S);
        blk(2.4, 2.4, P1, P1S);
        txt('活', 4.2, 3.6, '#44403c', cell * 1.8);
                    break;
                }
                case 'keepsakego': {
        // 形見の五輪塔
        dot(3, 1.4, '#e7e5e4', '#a8a29e', cell * 0.24);
        blk(3, 2.5, '#e7e5e4', '#a8a29e');
        tri(3, 3.9, cell * 0.55, '#e7e5e4', '#a8a29e', Math.PI);
        blk(3, 5, '#d6d3d1', '#a8a29e');
        ring(3, 3.2, cell * 1.5, 'rgba(251,191,36,0.7)', 1.4);
                    break;
                }
                case 'keichitsugo': {
// 土から目覚める蟲と伏せ石
ctx.fillStyle='rgba(110,80,50,0.75)';
ctx.beginPath(); ctx.arc(cell*2,cell*4.6,cell*1.7,Math.PI,0); ctx.fill();
ctx.beginPath(); ctx.arc(cell*4.2,cell*4.8,cell*1.3,Math.PI,0); ctx.fill();
dot(2,3.4,P1,P1S,cell*0.5,1);
dot(4.2,3.9,P2,P2S,cell*0.45,1);
seg(2.6,1.6,3.6,1.2,'#4ade80',1.6);
seg(3.6,1.2,4.4,2.0,'#4ade80',1.6);
seg(3.6,1.2,3.4,2.3,'#4ade80',1.6);
dot(3.7,1.1,'#4ade80','#166534',cell*0.18,1);
                    break;
                }
                case 'keimago': {
        dot(2, 4.4, P1, P1S, cell * 0.45);
        dot(3.5, 2, P1, P1S, cell * 0.45);
        seg(2.4, 4.1, 3.2, 2.4, '#4ade80', 1.5);
        tri(3.5, 1.5, cell * 0.32, '#4ade80', '#166534');
                    break;
                }
                case 'keirakugo': {
        // 経絡: 経穴を繋ぐ気の流れ線
        seg(1.6, 4.6, 2.5, 3.4, '#16a34a', 1.8);
        seg(2.5, 3.4, 3.4, 3.9, '#16a34a', 1.8);
        seg(3.4, 3.9, 4.2, 2.6, '#16a34a', 1.8);
        seg(4.2, 2.6, 4.7, 1.7, '#16a34a', 1.8);
        dot(1.6, 4.6, '#dc2626', '#991b1b', cell * 0.24); // 経穴1
        dot(2.5, 3.4, '#dc2626', '#991b1b', cell * 0.24); // 経穴2
        dot(3.4, 3.9, '#dc2626', '#991b1b', cell * 0.24); // 経穴3
        dot(4.2, 2.6, '#dc2626', '#991b1b', cell * 0.24); // 経穴4
        dot(4.7, 1.7, '#dc2626', '#991b1b', cell * 0.24); // 経穴5
                    break;
                }
                case 'keisugo': {
        // 磬子: 吊るされた磬(曲玉形の鉦)と撞木
        seg(2, 1.6, 4, 1.6, '#57534e', 1.6);       // 吊り紐横
        seg(3, 1.6, 3, 2.3, '#57534e', 1.6);       // 吊り紐
        c.beginPath(); c.arc(at(3, 3.7).x, at(3, 3.7).y, cell * 1.15, Math.PI * 1.05, Math.PI * 1.95); c.strokeStyle = '#a16207'; c.lineWidth = 2.4; c.stroke(); // 磬の湾曲
        seg(2.1, 3.5, 3.9, 3.5, '#a16207', 2.4);   // 磬の弦
        seg(4.5, 3.9, 5, 4.4, '#44403c', 1.8);     // 撞木
        dot(3, 4.4, '#d4af37', '#92600e', cell * 0.28); // 撞座
                    break;
                }
                case 'kemarigo': {
        // 蹴鞠: 二色の革鞠と蹴り上げの軌道
        dot(3, 3.6, '#d97706', '#78350f', cell * 0.8);
        seg(3, 2.8, 3, 4.4, '#fde68a', 2);
        seg(1.4, 1.2, 2.4, 1.8, '#a8a29e', 1.4);
        seg(2.4, 1.8, 2.8, 2.6, '#a8a29e', 1.4);
        tri(4.8, 1.4, cell * 0.3, P2, P2S, Math.PI / 2);
                    break;
                }
                case 'kendamago': {
        // けん玉: 十字のけん+糸+玉
        seg(2.9, 1.4, 2.9, 4.2, '#b45309', 2.4);
        seg(2.1, 2.6, 3.7, 2.6, '#b45309', 2.4);
        seg(2.9, 1.4, 4.3, 3.6, '#78716c', 1.2);
        dot(4.4, 3.7, '#dc2626', '#991b1b');
        dot(4.55, 3.55, '#1c1917', '#1c1917', cell * 0.06);
                    break;
                }
                case 'kendogo': {
        // 剣道: 竹刀と面
        ring(2.4, 2.6, cell * 0.7, '#1e3a8a', 2.6);
        seg(2.0, 2.6, 2.8, 2.6, '#dbeafe', 1.4);
        seg(2.4, 2.1, 2.4, 3.1, '#dbeafe', 1.4);
        seg(4.8, 1.6, 2.6, 4.6, '#d4d4d4', 2.6);
        seg(4.9, 1.5, 4.4, 1.1, '#78350f', 1.8);
                    break;
                }
                case 'kenzokugo': {
        dot(3, 2.8, P1, P1S);
        dot(2.6, 2.6, '#fbbf24', '#b45309');
        dot(3.4, 2.6, '#fbbf24', '#b45309');
        seg(1.6, 4.4, 3.0, 4.4, '#f59e0b', 1.6);
        seg(3.0, 4.4, 4.4, 4.4, '#f59e0b', 1.6);
                    break;
                }
                case 'kigogo': {
        // 揮毫: 勢いのある一画と落款
        seg(1.0, 5.0, 2.6, 1.4, '#1c1917', 6);
        seg(2.6, 1.4, 4.4, 2.6, '#1c1917', 5);
        blk(4.6, 4.6, '#b91c1c', '#7f1d1d');
        dot(2.0, 4.6, P1, P1S, cell * 0.3);
                    break;
                }
                case 'kikogo': {
        // 紀行: 名所の鳥居と旅の石
        seg(1.4, 1.8, 4.6, 1.8, '#dc2626', 2);
        seg(1.8, 2.4, 4.2, 2.4, '#dc2626', 1.6);
        seg(2.2, 1.8, 2.2, 4, '#dc2626', 1.6);
        seg(3.8, 1.8, 3.8, 4, '#dc2626', 1.6);
        dot(3, 5, P1, P1S, cell * 0.28);
                    break;
                }
                case 'kilngo': {
        // 登窯: 階段状の窯と焔
        blk(1.2, 4.2, '#9a3412', '#7c2d12');
        blk(2.4, 3.4, '#c2410c', '#9a3412');
        blk(3.6, 2.6, '#ea580c', '#c2410c');
        tri(4.6, 1.6, cell * 0.4, '#f97316', '#c2410c');
                    break;
                }
                case 'kingeneralgo': {
        dot(3, 3, P1, P1S, cell * 0.5);
        ring(3, 3, cell * 0.78, '#fbbf24', 2.2);
        dot(3, 1.4, P1, P1S, cell * 0.28);
        dot(1.4, 3, P1, P1S, cell * 0.28);
        dot(4.6, 3, P1, P1S, cell * 0.28);
                    break;
                }
                case 'kingyogo': {
        // 金魚: 体+尾びれ+目、右上に掬い網
        tri(1.6, 3.1, cell * 0.3, '#fb923c', '#c2410c', Math.PI);
        dot(2.6, 3.1, '#f97316', '#c2410c');
        dot(2.9, 3.0, '#1c1917', '#1c1917', cell * 0.06);
        ring(4.1, 1.9, cell * 0.5, '#38bdf8', 1.6);
        seg(4.5, 2.4, 5.1, 3.2, '#92400e', 1.8);
                    break;
                }
                case 'kingyosukuigo': {
        // 金魚すくい: 金魚とポイの輪
        ring(2.0, 4.0, cell * 0.7, '#e2e8f0', 2.2);
        dot(3.9, 2.6, '#f97316', '#c2410c', cell * 0.42);
        tri(4.6, 2.6, cell * 0.30, '#f97316', '#c2410c', 0);
        dot(3.7, 2.4, '#fff7ed', '#7c2d12', cell * 0.07);
        seg(1.4, 3.3, 2.6, 4.7, '#93c5fd', 1.4);
                    break;
                }
                case 'kitamaego': {
        // 北前: 帆掛船と波
        tri(3, 2.2, cell * 0.55, '#f8fafc', '#94a3b8', -Math.PI / 2);
        seg(3, 2.2, 3, 3.6, '#92400e', 2);
        seg(1.6, 3.8, 4.4, 3.8, '#78350f', 3);
        seg(0.8, 4.6, 2.0, 4.4, '#0284c7', 2);
        seg(3.4, 4.6, 5.0, 4.4, '#0284c7', 2);
                    break;
                }
                case 'kitchengo': {
        tri(2.0, 3.4, cell * 0.8, '#f97316', '#c2410c');
        dot(4.0, 2.4, P1, P1S);
        dot(4.6, 3.4, P1, P1S);
        seg(1.4, 4.4, 4.6, 4.4, '#78716c', 2.2);
                    break;
                }
                case 'kiteflygo': {
        // 凧揚: 菱形の凧 + 糸 + 尾
        blk(3.2, 1.8, '#ef4444', '#991b1b');
        seg(2.0, 1.8, 4.4, 1.8, '#991b1b', 1.6);
        seg(3.2, 0.6, 3.2, 3.0, '#991b1b', 1.6);
        seg(3.2, 3.0, 2.2, 4.6, '#94a3b8', 1.4);
        seg(2.2, 4.6, 3.0, 5.2, '#f59e0b', 1.4);
                    break;
                }
                case 'kitsunego': {
        // 狐: 三角の耳と面、化ける尾
        tri(2.2, 2.0, cell * 0.5, '#ea580c', '#9a3412');  // 左耳
        tri(3.8, 2.0, cell * 0.5, '#ea580c', '#9a3412');  // 右耳
        dot(3, 3.3, '#f97316', '#c2410c', cell * 0.85);   // 面
        seg(2.4, 3.3, 2.7, 3.2, '#292524', 2);            // 左目筋
        seg(3.6, 3.3, 3.3, 3.2, '#292524', 2);            // 右目筋
        dot(3, 3.9, '#292524', '#000', cell * 0.12);      // 鼻
        seg(4.4, 4.4, 5.2, 4.0, '#fdba74', 2.6);          // 化け尾
                    break;
                }
                case 'knight2go': {
        // 跳馬: 桂馬の跳び筋と石
        dot(1.6, 3.6, P1, P1S);
        c.strokeStyle = '#34d399'; c.lineWidth = 2; c.lineCap = 'round';
        c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(at(1.6, 3.6).x, at(1.6, 3.6).y); c.lineTo(at(3.6, 2.6).x, at(3.6, 2.6).y); c.stroke();
        c.setLineDash([]);
        tri(3.6, 2.6, cell * 0.32, '#34d399', '#047857', Math.PI / 4);
        dot(4.8, 1.6, P2, P2S, cell * 0.3);
        txt('桂', 4.8, 4.6, '#047857', cell * 1.1);
    
                    break;
                }
                case 'koango': {
        // 公案: 円相と問いの形 (2x2の枡)
        ring(3.0, 3.0, cell * 1.7, '#1c1917', 2.6);
        blk(2.4, 2.4, P1, P1S); blk(3.4, 2.4, P2, P1S);
        blk(2.4, 3.4, P2, P1S); blk(3.4, 3.4, P1, P1S);
                    break;
                }
                case 'kochugo': {
        // 講中: 結び目のように連なる講の環
        bond(1.6, 2.4, 4.4, 2.4, 3);
        bond(1.6, 3.6, 4.4, 3.6, 3);
        bond(1.6, 2.4, 1.6, 3.6, 3);
        bond(4.4, 2.4, 4.4, 3.6, 3);
        dot(1.6, 2.4, P1, P1S); dot(4.4, 2.4, P1, P1S);
        dot(1.6, 3.6, P1, P1S); dot(4.4, 3.6, P1, P1S);
        ring(3, 3, cell * 0.5, '#fbbf24', 2); // 結び印
        dot(3, 3, '#fbbf24', '#b45309', R * 0.35);
                    break;
                }
                case 'kohaigo': {
        // 光背: 仏の石と後光の光背
        ring(3, 3.2, cell * 1.5, '#eab308', 2);    // 頭光
        ring(3, 3.2, cell * 1.05, '#facc15', 1.4); // 身光
        dot(3, 3, '#57534e', '#292524', cell * 0.6); // 仏の石
        seg(2.2, 4.6, 3.8, 4.6, '#78716c', 2);     // 台座
        seg(3, 4.6, 3, 4.2, '#78716c', 1.6);
                    break;
                }
                case 'koinoborigo': {
        // 鯉幟: 泳ぐ鯉と吹き流し
        seg(2.8, 3.0, 4.9, 3.0, '#0284c7', cell * 0.8); // 鯉の胴
        tri(5.3, 3.0, cell * 0.62, '#0284c7', '#075985', 0); // 尾
        dot(2.55, 2.85, '#f8fafc', '#075985', R * 0.42); // 目
        dot(3.6, 3.0, '#38bdf8', '#075985', R * 0.3);
        seg(1.8, 1.6, 1.8, 4.6, '#78350f', 1.6); // ポール
        seg(1.8, 1.7, 3.4, 1.2, '#f43f5e', cell * 0.3); // 吹き流し
        seg(1.8, 2.3, 3.2, 1.9, '#38bdf8', cell * 0.3);
                    break;
                }
                case 'kokuugo': {
// 雨と育つ苗石
seg(1,0.8,0.4,2.2,'#60a5fa',1.4);
seg(3,0.6,2.4,2.0,'#60a5fa',1.4);
seg(5,0.8,4.4,2.2,'#60a5fa',1.4);
dot(2,3.6,P1,P1S,cell*0.5,1);
dot(3.6,4.2,P2,P2S,cell*0.5,1);
seg(2,3.4,2.2,2.4,'#4ade80',1.6);
seg(3.6,4.0,3.8,3.0,'#4ade80',1.6);
dot(2.25,2.3,'#86efac','#166534',cell*0.16,1);
dot(3.85,2.9,'#86efac','#166534',cell*0.16,1);
                    break;
                }
                case 'komago': {
        // 独楽: 回転する独楽本体 + 回転弧 + 軸
        dot(3, 2.6, P1, P1S, cell * 0.6);
        tri(3, 3.9, cell * 0.55, '#57534e', P1S, Math.PI / 2);
        seg(3, 1.1, 3, 2.0, P1S, 2.4);
        ring(3, 2.9, cell * 0.95, '#38bdf8', 1.4);
        seg(1.5, 4.3, 2.3, 4.7, '#38bdf8', 1.6);
        seg(3.7, 4.7, 4.5, 4.3, '#38bdf8', 1.6);
                    break;
                }
                case 'kyokusuigo': {
        // 曲水: 流れる盃と岸の詠み手
        seg(0.8, 2, 2, 2.8, '#a78bfa', 1.8);
        seg(2, 2.8, 4, 3.2, '#a78bfa', 1.8);
        seg(4, 3.2, 5.2, 4, '#a78bfa', 1.8);
        dot(3, 3, '#e9d5ff', '#7c3aed', cell * 0.3);
        dot(1.4, 4.8, P1, P1S, cell * 0.28);
        dot(4.6, 1.2, P2, P2S, cell * 0.28);
                    break;
                }
                case 'kyoshago': {
        dot(3, 4, P1, '#f97316', cell * 0.5);
        seg(3, 3.5, 3, 1.8, '#f97316', 1.8);
        tri(3, 1.4, cell * 0.45, '#f97316', '#c2410c');
                    break;
                }
                case 'kyudogo': {
        // 弓道: 弓と的を射る矢
        ring(1.6, 3.0, cell * 1.3, '#92400e', 2.2);
        seg(2.0, 1.9, 2.0, 4.1, '#a8a29e', 1.2);
        seg(1.8, 3.0, 4.6, 3.0, '#f59e0b', 2);
        tri(4.9, 3.0, cell * 0.3, '#fbbf24', '#d97706', 0);
        dot(4.6, 3.0, '#fef3c7', '#f59e0b', R * 0.3);
                    break;
                }
                case 'kyuseigo': {
        // 九星: 八方位に散る星と中央の一白水星
        for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4;
            dot(3 + Math.cos(a) * 1.85, 3 + Math.sin(a) * 1.85,
                k % 2 === 0 ? '#fde047' : '#a5b4fc', '#713f12', cell * 0.3);
        }
        dot(3, 3, '#f8fafc', '#38bdf8', R * 0.75); // 一白水星
        ring(3, 3, cell * 1.15, 'rgba(165,180,252,0.5)', 1.2);
                    break;
                }
                case 'labyrinthgo': {
        seg(1, 1.4, 5, 1.4, '#57534e', 1.8);
        seg(1, 2.8, 4.2, 2.8, '#57534e', 1.8);
        seg(1.8, 4.2, 5, 4.2, '#57534e', 1.8);
        seg(1, 5.4, 5, 5.4, '#57534e', 1.8);
        blk(4.4, 2.6, '#dc2626', '#7f1d1d');
        dot(2.4, 2.1, P1, P1S, cell * 0.4);
                    break;
                }
                case 'lacquergo': {
        // 漆器: 塗り重ねの輪が重なる石
        dot(3, 3.4, P1, P1S, R * 1.1);
        ring(3, 3.4, cell * 0.62, '#fbbf24', 2);
        ring(3, 3.4, cell * 0.78, '#d97706', 1.6);
        ring(3, 3.4, cell * 0.94, '#92400e', 1.4);
        dot(4.6, 1.4, P2, P2S, R * 0.8);
        ring(4.6, 1.4, cell * 0.5, '#fbbf24', 1.4);
                    break;
                }
                case 'lampgo': {
        ring(3, 3, cell * 1.9, '#fbbf24', 1.2);
        ring(3, 3, cell * 1.2, '#fde68a', 1.2);
        dot(3, 3.1, '#fbbf24', '#b45309', cell * 0.45);
        blk(2.8, 3.9, '#57534e', '#292524');
        seg(3, 1.2, 3, 2, '#fbbf24', 1.4);
        seg(1.8, 4.6, 4.2, 4.6, '#292524', 1.6);
                    break;
                }
                case 'lanternloopgo': {
        ring(3, 3, R * 2, '#fbbf24', 1.4);
        dot(1.8, 2.2, P2, P2S, R * 0.5);
        dot(4.2, 2.2, P2, P2S, R * 0.5);
        tri(3, 3.2, R * 0.8, '#fbbf24', '#d97706', Math.PI);
        dot(3, 4.4, P1, P1S, R * 0.5);
                    break;
                }
                case 'lavaflowgo': {
        // 溶岩: 灼熱の流れと冷えた岩盤
        dot(2.2, 2.2, '#f97316', '#ea580c');
        ring(2.2, 2.2, cell * 0.62, '#fdba74', 1.5);
        seg(2.6, 2.7, 3.6, 3.6, '#fb923c', 3);
        seg(3.6, 3.6, 4.4, 4.4, '#78716c', 3);
        blk(4.5, 4.5, '#57534e', '#44403c');
                    break;
                }
                case 'layergo': {
        blk(1.1, 1.3, "#fef3c7", "#a8a29e");
        blk(1.55, 2.5, "#d6d3d1", "#78716c");
        blk(2, 3.7, "#a8a29e", "#57534e");
        dot(2.4, 2.4, P1, P1S);
                    break;
                }
                case 'leafallgo': {
        dot(3, 1.8, P1, P1S);
        seg(3, 2.4, 3, 4.6, '#92400e', 2);
        tri(2.1, 3.4, cell * 0.3, '#d97706', '#b45309', Math.PI / 2);
        tri(3.9, 4.0, cell * 0.3, '#f59e0b', '#b45309', -Math.PI / 2);
                    break;
                }
                case 'levergo': {
                    // 梃子: 支点の上の傾いた棒と両端の石
                    tri(3, 3.4, cell * 0.7, '#d97706', '#92610e', Math.PI);
                    seg(0.9, 2.1, 5.1, 3.5, '#78716c', 2.2);
                    dot(0.9, 1.8, P1, P1S); dot(5.1, 3.8, P2, P2S);
                    seg(0.7, 5, 5.3, 5, '#57534e', 1.6);
                    break;
                }
                case 'librarygo': {
        blk(1.4, 1.2, '#b45309', '#78350f');
        blk(2.2, 1.2, '#0ea5e9', '#0c4a6e');
        blk(3.0, 1.2, '#16a34a', '#14532d');
        blk(1.8, 3.0, '#dc2626', '#7f1d1d');
        blk(2.6, 3.0, '#eab308', '#713f12');
        seg(1.2, 2.7, 4.4, 2.7, '#57534e', 2.0);
                    break;
                }
                case 'limestonego': {
        // 石灰: 泉に溶けて垂れる鍾乳石
        dot(3, 1.6, '#7dd3fc', '#38bdf8', R * 0.7);
        tri(2.4, 3.4, cell * 0.6, '#d6d3d1', '#a8a29e', Math.PI / 2);
        tri(3.6, 3.6, cell * 0.5, '#e7e5e4', '#a8a29e', Math.PI / 2);
        seg(2.4, 4.2, 2.4, 4.8, '#7dd3fc', 1.4);
        dot(3.6, 4.6, '#7dd3fc', '#38bdf8', R * 0.3);
                    break;
                }
                case 'liondancego': {
        // 獅子舞: 獅子頭 (大口) + 噛まれる敵石
        dot(2.4, 2.4, '#dc2626', '#7f1d1d', cell * 0.75);
        dot(1.9, 2.0, '#fef3c7', '#78350f', cell * 0.16);
        dot(2.9, 2.0, '#fef3c7', '#78350f', cell * 0.16);
        seg(1.7, 3.1, 3.1, 3.1, '#fef3c7', 2.2);
        dot(4.4, 4.4, P2, P2S, cell * 0.4);
        seg(3.4, 3.6, 4.0, 4.0, '#f87171', 1.8);
                    break;
                }
                case 'lodestonego': {
        // 磁針: 羅針盤と北を指す針
        ring(3.0, 3.0, cell * 2.0, '#57534e', 2);
        tri(3.0, 2.0, cell * 0.5, '#dc2626', '#991b1b', -Math.PI / 2);
        tri(3.0, 4.0, cell * 0.5, '#e7e5e4', '#a8a29e', Math.PI / 2);
        dot(3.0, 3.0, P1, P1S, cell * 0.18);
                    break;
                }
                case 'longlinego': {
        // 延縄: 幹縄に下がる釣針
        seg(0.6, 2, 5.4, 2, '#0369a1', 2);
        seg(1.6, 2, 1.6, 3.2, '#38bdf8', 1.2);
        seg(3, 2, 3, 3.4, '#38bdf8', 1.2);
        seg(4.4, 2, 4.4, 3, '#38bdf8', 1.2);
        ring(1.6, 3.4, cell * 0.18, '#0c4a6e', 1.2);
        ring(3, 3.6, cell * 0.18, '#0c4a6e', 1.2);
        ring(4.4, 3.2, cell * 0.18, '#0c4a6e', 1.2);
        tri(3, 4.8, cell * 0.4, '#fbbf24', '#b45309', Math.PI / 2);
                    break;
                }
                case 'loomgo': {
        seg(1.4, 0.8, 1.4, 4.4, "#d946ef", 1.8);
        seg(2.5, 0.8, 2.5, 4.4, "#d946ef", 1.8);
        seg(3.6, 0.8, 3.6, 4.4, "#d946ef", 1.8);
        seg(0.8, 1.9, 4.4, 1.9, "#f0abfc", 2.4);
        seg(0.8, 3.2, 4.4, 3.2, "#f0abfc", 2.4);
                    break;
                }
                case 'lotterygo': {
        // 宝籤: 福引きのガラポンと当たりの石
        const p = at(3, 3);
        c.fillStyle = '#fbbf24'; c.strokeStyle = '#b45309'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(p.x, p.y, cell * 1.3, 0, Math.PI * 2); c.fill(); c.stroke();
        txt('吉', 3, 3, '#7c2d12', cell * 0.9);
        dot(1.4, 5, P1, P1S, cell * 0.3); dot(4.6, 5, P2, P2S, cell * 0.3);
        seg(4, 1.4, 5.2, 0.8, '#b45309', cell * 0.14);
    
                    break;
                }
                case 'lotusgo': {
        // 蓮: 泥の中から咲く花
        c.fillStyle = 'rgba(120,113,108,0.7)';
        c.beginPath(); c.ellipse(at(3,4.4).x, at(3,4.4).y, cell * 1.9, cell * 0.6, 0, 0, Math.PI * 2); c.fill();
        dot(2.6, 3.2, '#f0abfc', '#d946ef', R * 0.6);
        dot(3.4, 3.2, '#f0abfc', '#d946ef', R * 0.6);
        dot(3, 2.4, '#f5d0fe', '#e879f9', R * 0.7);
        seg(3, 3.0, 3, 4.2, '#4ade80', 1.6);
                    break;
                }
                case 'lumengo': {
        dot(3, 3, '#fde68a', '#f59e0b');
        seg(3, 1.0, 3, 1.7, '#fbbf24', 1.8);
        seg(3, 4.3, 3, 5.0, '#fbbf24', 1.8);
        seg(1.0, 3, 1.7, 3, '#fbbf24', 1.8);
        seg(4.3, 3, 5.0, 3, '#fbbf24', 1.8);
        ring(3, 3, cell * 0.55, '#fcd34d', 1.4);
                    break;
                }
                case 'lungego': {
        // 突撃: 接する敵を押し返す
        dot(2, 3, P1, P1S); dot(3, 3, P2, P2S);
        c.strokeStyle = '#f97316'; c.lineWidth = 2.4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3.4, 3).x, at(3.4, 3).y); c.lineTo(at(5.2, 3).x, at(5.2, 3).y); c.stroke();
        tri(5.3, 3, cell * 0.36, '#f97316', '#c2410c', Math.PI / 2);
        dot(2, 1.6, P2, P2S, cell * 0.28); dot(1, 4.6, P1, P1S, cell * 0.28);
    
                    break;
                }
                case 'lurego': {
        seg(2.2, 0.8, 2.2, 1.7, "#38bdf8", 1.8);
        ring(2.2, 2.2, cell * 0.42, "#38bdf8", 1.8);
        dot(3.8, 3.5, P2, P2S, R * 0.8);
        seg(4.4, 3.5, 4.8, 3.1, "#78350f", 1.4);
        seg(4.4, 3.5, 4.8, 3.9, "#78350f", 1.4);
                    break;
                }
                case 'magnetgo2': {
        dot(1.7, 3, "#ef4444", "#7f1d1d");
        txt("N", 1.7, 3, "#fff", cell * 0.9);
        dot(4.3, 3, "#3b82f6", "#1e3a8a");
        txt("S", 4.3, 3, "#fff", cell * 0.9);
                    break;
                }
                case 'magnetpolego': {
// N極とS極の磁石
ctx.fillStyle='#ef4444';
ctx.fillRect(cell*1.4,cell*2.0,cell*1.6,cell*0.9);
ctx.fillStyle='#3b82f6';
ctx.fillRect(cell*3.0,cell*2.0,cell*1.6,cell*0.9);
txt('N',2.2,2.15,'#fff',cell*0.7);
txt('S',3.8,2.15,'#fff',cell*0.7);
seg(1.4,4.4,4.6,4.4,'rgba(120,120,120,0.7)',1.2);
seg(2.0,4.4,2.0,3.6,'rgba(120,120,120,0.7)',1.2);
seg(4.0,4.4,4.0,3.6,'rgba(120,120,120,0.7)',1.2);
dot(1.0,4.4,P1,P1S,cell*0.35,1);
dot(5.0,4.4,P2,P2S,cell*0.35,1);
                    break;
                }
                case 'magnetstormgo': {
        dot(2.2, 2.4, P1, P1S);
        dot(2.2, 3.6, P2, P2S);
        ring(3.9, 3, cell * 0.9, '#c084fc', 2.6);
        seg(3.9, 2.1, 3.9, 3.9, '#c084fc', 2.6);
        txt('±', 3.9, 0.9, '#c084fc', cell * 0.9);
                    break;
                }
                case 'magnifygo': {
        ring(2.6, 2.6, R * 1.5, '#38bdf8', 2);
        seg(3.7, 3.7, 4.7, 4.7, '#0369a1', 2.4);
        dot(2.6, 2.6, P1, P1S, R * 0.7);
                    break;
                }
                case 'makiego': {
        // 蒔絵: 金地に蒔いた粉の文様 (枝と花)
        blk(3.0, 3.0, '#a16207', '#713f12');
        seg(1.8, 3.9, 4.2, 2.1, '#fde047', 1.6);
        dot(4.2, 2.0, '#fbbf24', '#b45309', cell * 0.22);
        dot(3.3, 2.7, '#fbbf24', '#b45309', cell * 0.14);
        dot(2.4, 3.3, '#fbbf24', '#b45309', cell * 0.14);
                    break;
                }
                case 'mandalago': {
        // 曼荼羅: 中心+四方の配置と外陣
        ring(3.0, 3.0, cell * 1.8, '#fbbf24', 1.6);
        dot(3.0, 3.0, '#f59e0b', '#b45309', cell * 0.42);
        dot(3.0, 1.8, '#fbbf24', '#b45309', cell * 0.24);
        dot(3.0, 4.2, '#fbbf24', '#b45309', cell * 0.24);
        dot(1.8, 3.0, '#fbbf24', '#b45309', cell * 0.24);
        dot(4.2, 3.0, '#fbbf24', '#b45309', cell * 0.24);
                    break;
                }
                case 'mangekyogo': {
        // 万華鏡: 三角の鏡筒に映る対称の石
        tri(3.0, 3.0, cell * 2.2, 'rgba(125,211,252,0.25)', '#0ea5e9');
        dot(3.0, 3.0, P1, P1S, cell * 0.28);
        dot(4.1, 2.3, '#f472b6', '#be185d', cell * 0.22);
        dot(1.9, 2.3, '#f472b6', '#be185d', cell * 0.22);
        dot(3.0, 4.4, '#f472b6', '#be185d', cell * 0.22);
                    break;
                }
                case 'marblego': {
                    // 転がる玉石と底に集まる玉
                    c.strokeStyle = '#78716c'; c.lineWidth = 1.4; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(1.4, 1).x, at(1.4, 1).y); c.lineTo(at(1.4, 4).x, at(1.4, 4).y); c.stroke();
                    c.setLineDash([]);
                    dot(1.4, 1, P2, P2S);
                    dot(1.4, 4.5, P1, P1S); dot(3, 4.5, P1, P1S); dot(4.6, 4.5, P2, P2S);
                    seg(0.5, 5.3, 5.5, 5.3, '#57534e', 1.8);
                    break;
                }
                case 'maskgo': {
        dot(3, 3, P1, P1S);
        seg(2.35, 2.75, 3.65, 2.75, '#57534e', cell * 0.34);
        txt('?', 3, 3.45, '#fef3c7', cell * 0.65);
        dot(4.6, 4.5, P2, P2S, cell * 0.35);
                    break;
                }
                case 'meleego': {
        // 組討: 組み合う二つの連、削れる石
        dot(2.2, 3.4, P1, P1S, cell * 0.62);              // 黒の連
        dot(3.8, 3.4, P2, P2S, cell * 0.62);              // 白の連
        bond(2.2, 3.4, 3.8, 3.4, 1.6);                    // 接触
        seg(1.4, 2.2, 2.4, 3.0, '#78716c', 2);            // 組む腕1
        seg(4.6, 2.2, 3.6, 3.0, '#78716c', 2);            // 組む腕2
        seg(2.6, 1.9, 3.4, 1.9, 'rgba(0,0,0,0.35)', 1.4); // 削れる屑1
        dot(4.6, 4.4, '#a8a29e', '#78716c', cell * 0.18); // 削れた石
                    break;
                }
                case 'memorialgo': {
        blk(2.4, 3.2, "#a8a29e", "#57534e");
        tri(2.4, 1.6, cell * 0.45, "#a78bfa", "#7c3aed");
        ring(3.8, 3.6, cell * 0.4, "#c4b5fd", 1.4);
        dot(3.8, 1.6, P2, P2S, R * 0.5);
                    break;
                }
                case 'menkogo': {
        // 面子: 裏返る2枚の面 (表と裏)
        dot(2.2, 3.4, P2, P2S);
        dot(3.9, 3.4, P1, P1S);
        seg(3.05, 2.2, 3.05, 4.6, '#8a5a2b', 1.6);
        tri(3.05, 1.8, cell * 0.3, '#f59e0b', '#b45309', 0);
                    break;
                }
                case 'meteoritego': {
        // 隕鉄: 鈍い金属石と磁力線
        blk(3, 3.2, '#64748b', '#475569');
        seg(2.2, 2.2, 3.8, 4.2, '#94a3b8', 1.4);
        ring(3, 3.2, cell * 0.85, '#cbd5e1', 1.2);
        ring(3, 3.2, cell * 1.1, '#e2e8f0', 0.9);
        dot(4.8, 1.4, '#94a3b8', '#64748b', R * 0.45);
                    break;
                }
                case 'meteorshowergo': {
        seg(1.2, 0.9, 2.2, 2, "#fb923c", 2.4);
        seg(3.4, 0.7, 4.1, 1.5, "#fb923c", 2.4);
        seg(4.9, 1.1, 5.3, 1.9, "#fb923c", 2.4);
        tri(2.3, 2.1, cell * 0.2, "#fbbf24", "#f97316", 0.8);
        ring(2.8, 4.2, cell * 0.55, "#f97316", 1.8);
        dot(2.8, 4.2, "#44403c", "#292524", R * 0.7);
        dot(4.4, 4.4, P1, P1S, R * 0.6);
                    break;
                }
                case 'miaigo': {
        dot(3, 3, '#a78bfa', '#6d28d9', cell * 0.3);
        tri(1.8, 1.8, cell * 0.55, P1, P1S);
        tri(4.2, 4.2, cell * 0.55, P2, P2S);
        seg(1.9, 1.9, 4.1, 4.1, '#a78bfa', 1.2);
                    break;
                }
                case 'migrationgo': {
        // 渡り鳥の編隊と南への矢
        seg(1.2, 1.8, 1.9, 1.3, '#0c4a6e', 2);
        seg(1.9, 1.3, 2.6, 1.8, '#0c4a6e', 2);
        seg(3.2, 1.4, 3.8, 1, '#0c4a6e', 2);
        seg(3.8, 1, 4.4, 1.4, '#0c4a6e', 2);
        seg(4.8, 2.2, 4.8, 4.6, '#0284c7', 2);
        tri(4.8, 5, cell * 0.24, '#0284c7', '#075985', Math.PI / 2);
                    break;
                }
                case 'mikoshigo': {
        // 神輿: 屋根 + 担ぎ棒 + 揺れ弧
        tri(3, 1.4, cell * 0.9, '#fbbf24', '#b45309', -Math.PI / 2);
        blk(3, 2.6, '#dc2626', '#991b1b');
        seg(1.0, 3.6, 5.0, 3.6, '#92400e', 3.0);
        dot(1.6, 4.4, P1, P1S, cell * 0.34);
        dot(4.4, 4.4, P2, P2S, cell * 0.34);
                    break;
                }
                case 'mimicrygo': {
        // 擬態: 敵色に紛れる紫の環
        dot(1.6, 3, P2, P2S, cell * 0.36);
        dot(4.4, 3, P2, P2S, cell * 0.36);
        dot(3, 3, P1, P1S, cell * 0.36);
        ring(3, 3, cell * 0.6, '#a78bfa', 1.8);
        seg(2.6, 1.4, 3.4, 1.4, '#a78bfa', 1.4);
                    break;
                }
                case 'mindreadgo': {
        ring(2.7, 2.7, cell * 0.7, '#f472b6', 2);
        dot(2.7, 2.7, '#f472b6', '#be185d', cell * 0.26);
        seg(3.4, 3.4, 4.5, 4.5, '#f472b6', 1.5);
        dot(4.5, 4.5, P1, P1S, cell * 0.38);
                    break;
                }
                case 'mirage2go': {
        dot(2.2, 3, P1, P1S);
        dot(3.4, 3, P1, P1S, cell * 0.38, 0.35);
        ring(3.4, 3, cell * 0.5, 'rgba(125,211,252,0.7)', 1.4);
        dot(4.4, 1.8, P2, P2S, cell * 0.3);
        dot(5.3, 1.8, P2, P2S, cell * 0.26, 0.3);
                    break;
                }
                case 'mirrorcraftgo': {
        // 鏡磨: 銀の鏡面と磨きの輝き
        ring(3, 3, cell * 1.5, '#cbd5e1', 3.0);
        dot(3, 3, '#e2e8f0', '#94a3b8', cell * 0.9);
        seg(3.8, 1.9, 4.5, 1.2, '#f8fafc', 1.6);
        dot(4.7, 1.0, '#ffffff', '#e2e8f0', cell * 0.10);
                    break;
                }
                case 'mirrorgo': {
        seg(3, 1, 3, 5, "#94a3b8", 1.4);
        dot(1.8, 3, P1, P1S);
        dot(4.2, 3, P1, P1S);
                    break;
                }
                case 'mirrorstonego': {
        dot(1.5, 2.5, P1, P1S);
        dot(4.5, 2.5, P2, P2S);
        seg(3, 0.8, 3, 4.2, 'rgba(186,230,253,0.9)', 2.5);
        seg(2.6, 0.6, 3.4, 0.6, 'rgba(186,230,253,0.9)', 2);
        ring(4.5, 2.5, cell * 0.62, 'rgba(125,211,252,0.7)', 1.4);
                    break;
                }
                case 'misogo': {
        // 味噌樽: 箍のある木樽と味噌玉
        blk(1.6, 1.4, '#a16207', '#713f12');
        blk(4.4, 3.6, '#a16207', '#713f12');
        seg(1.4, 2.2, 4.6, 2.2, '#713f12', 1.6);
        seg(1.4, 4.4, 4.6, 4.4, '#713f12', 1.6);
        dot(3, 3, '#78350f', '#451a03', cell * 0.5);
        dot(4.6, 1.4, P1, P1S, cell * 0.22);
                    break;
                }
                case 'missiongo': {
        dot(1.8, 3, P1, P1S);
        seg(2.6, 3, 3.4, 3, "#22d3ee", 2.5);
        dot(4.2, 3, P2, P2S);
        ring(4.2, 3, cell * 0.55, "#22d3ee", 2);
                    break;
                }
                case 'mitatego': {
        // 見立て: L字の曲がり角と見る目
        bond(2, 4.4, 2, 2.4, 3);
        bond(2, 2.4, 4, 2.4, 3);
        dot(2, 4.4, P1, P1S, cell * 0.3);
        dot(2, 2.4, P1, P1S, cell * 0.3);
        dot(4, 2.4, P1, P1S, cell * 0.3);
        ring(4.4, 4.4, cell * 0.5, '#0ea5e9', 1.8);
        dot(4.4, 4.4, '#0ea5e9', '#0369a1', cell * 0.2);
                    break;
                }
                case 'moatgo': {
        // 内堀: 城を囲む四角い堀
        blk(3, 3, '#a8a29e', '#57534e');
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2.6;
        c.strokeRect(cell * 1.1, cell * 1.1, cell * 3.8, cell * 3.8);
        dot(1.6, 1.6, P1, P1S, R * 0.7);
        dot(4.4, 4.4, P2, P2S, R * 0.7);
        txt('天', 3, 3, '#292524', cell * 0.7);
                    break;
                }
                case 'mobiusgo': {
        ring(2.4, 3, cell * 0.55, '#38bdf8', 2.2);
        ring(3.6, 3, cell * 0.55, '#818cf8', 2.2);
        seg(2.95, 2.45, 3.05, 3.55, '#f472b6', 1.8);
                    break;
                }
                case 'mochigo': {
        ring(3, 4.4, cell * 1.5, '#a16207', 1.8);
        ring(3, 2.9, cell * 1.1, '#a16207', 1.6);
        dot(3, 1.6, '#f97316', '#c2410c', cell * 0.45);
        seg(3, 2.6, 3, 3.4, '#a16207', 1.2);
                    break;
                }
                case 'mochigomago': {
        blk(1.4, 1.4, 'rgba(251,191,36,0.3)', '#fbbf24');
        dot(2.1, 2.1, P2, P2S, cell * 0.32);
        dot(4, 4, P1, P1S, cell * 0.45);
        seg(2.6, 2.6, 3.6, 3.6, '#fbbf24', 1.6);
                    break;
                }
                case 'mochitsukigo': {
        // 餅搗: 杵で搗かれた伸びる餅 + 杵
        dot(2.6, 3.6, '#fef3c7', '#d6a94f', cell * 0.75);
        dot(3.5, 3.4, '#fef3c7', '#d6a94f', cell * 0.5);
        seg(3.9, 1.4, 3.2, 2.9, '#92400e', 2.6);
        dot(4.0, 1.3, '#b45309', '#78350f', cell * 0.35);
                    break;
                }
                case 'mokugyogo': {
        // 木魚: 丸い木魚と撥、魚の目
        dot(3, 3.6, '#a16207', '#713f12', cell * 1.3);
        seg(2, 3.6, 4, 3.6, '#713f12', 1.2);       // 鱗の線1
        seg(2.2, 4.1, 3.8, 4.1, '#713f12', 1.2);   // 鱗の線2
        dot(3.7, 3.1, '#292524', '#000', cell * 0.16); // 目
        seg(4.2, 1.6, 4.9, 2.6, '#57534e', 2);     // 撥の柄
        dot(4.9, 2.7, '#dc2626', '#991b1b', cell * 0.32); // 撥の頭
                    break;
                }
                case 'moltgo': {
        dot(1.9, 2.8, P1, P1S);
        ring(3.5, 2.6, cell * 0.52, "#a8a29e", 1.5);
        seg(3.1, 2.2, 3.9, 3.0, "#a8a29e", 1.2);
        seg(2.4, 2.8, 3.0, 2.7, "#a8a29e", 1.1);
        dot(4.0, 4.1, P2, P2S, R * 0.7);
                    break;
                }
                case 'momijigo': {
        // 紅葉: 紅く色づいた楓
        dot(2.2, 2.4, '#fde047', '#eab308', R * 0.7);
        dot(3.6, 2.8, '#f97316', '#ea580c', R * 0.75);
        dot(3, 4, '#dc2626', '#991b1b', R * 0.85);
        seg(2.2, 2.4, 3, 4, '#a16207', 1.2);
        seg(3.6, 2.8, 3, 4, '#a16207', 1.2);
                    break;
                }
                case 'monogatarigo': {
        // 物語: 巻物と起承転結の四場面
        blk(3, 3, '#fef3c7', '#b45309');
        seg(3.6, 1.8, 3.6, 4.2, '#b45309', 1.4);
        dot(1.4, 1.4, '#f472b6', '#be185d', cell * 0.2);
        dot(4.8, 1.4, '#f472b6', '#be185d', cell * 0.2);
        dot(4.8, 4.8, '#f472b6', '#be185d', cell * 0.2);
        dot(1.4, 4.8, '#f472b6', '#be185d', cell * 0.2);
                    break;
                }
                case 'monolithgo': {
        blk(2.7, 1.6, "#57534e", "#292524");
        blk(2.7, 2.6, "#57534e", "#292524");
        blk(2.7, 3.6, "#57534e", "#292524");
        ring(3, 3, cell * 1.5, "#a78bfa", 1.5);
        dot(1.5, 3, P2, P2S, cell * 0.28); dot(4.5, 3, P2, P2S, cell * 0.28);
                    break;
                }
                case 'monsoongo': {
        dot(3, 1.6, P2, P2S);
        seg(1.6, 2.8, 1.3, 3.8, '#3b82f6', 2.2);
        seg(2.8, 2.8, 2.5, 3.8, '#3b82f6', 2.2);
        seg(4.0, 2.8, 3.7, 3.8, '#3b82f6', 2.2);
        blk(3, 4.6, 'rgba(59,130,246,0.5)', 'rgba(29,78,216,0.8)');
                    break;
                }
                case 'moonphasego': {
        dot(3.4, 3, '#fef08a', '#eab308');
        dot(2.9, 3, '#0f172a', '#0f172a', R * 0.85);
        ring(3.4, 3, R * 1.7, 'rgba(148,163,184,0.6)', 1.2);
                    break;
                }
                case 'morningglorygo': {
        // 朝顔: 咲く紫の喇叭と萎れる影
        tri(2.6, 2.8, cell * 0.9, '#8b5cf6', '#6d28d9', -Math.PI / 2);
        dot(2.6, 2.8, '#ede9fe', '#7c3aed', R * 0.4);
        seg(2.6, 3.4, 2.6, 4.6, '#22c55e', 1.8);
        dot(4.4, 3.6, '#94a3b8', '#64748b', R * 0.5);
        seg(4.4, 4.0, 4.6, 4.7, '#94a3b8', 1.4);
                    break;
                }
                case 'mosaicgo': {
        dot(3, 2.4, P1, P1S, cell * 0.3);
        dot(2.3, 3.1, P1, P1S, cell * 0.3); dot(3.7, 3.1, P1, P1S, cell * 0.3);
        dot(1.6, 3.8, P1, P1S, cell * 0.3); dot(4.4, 3.8, P1, P1S, cell * 0.3);
        txt("鶴", 3, 5.4, "#facc15", 8);
                    break;
                }
                case 'mosquitogo': {
        // 蚊と血のしずく
        dot(3, 3, '#57534e', '#292524', cell * 0.32);
        ring(2.4, 2.4, cell * 0.42, '#94a3b8', 1.6);
        ring(3.6, 2.4, cell * 0.42, '#94a3b8', 1.6);
        seg(3, 3.2, 4.6, 4.4, '#44403c', 1.8);
        dot(4.9, 4.9, '#dc2626', '#991b1b', cell * 0.22);
                    break;
                }
                case 'mossgo': {
        // 苔庭: 苔むした地面と庭石、一部枯れた斑点
        dot(2, 4.4, '#3f6212', '#1a2e05', cell * 0.85, 0.9);
        dot(3.6, 4.6, '#4d7c0f', '#1a2e05', cell * 0.95, 0.9);
        dot(4.6, 3.6, '#3f6212', '#1a2e05', cell * 0.7, 0.85);
        dot(2.8, 3.2, '#78716c', '#44403c', cell * 0.5);
        dot(4.8, 4.8, '#a8a29e', '#57534e', cell * 0.3);
                    break;
                }
                case 'mukaebigo': {
        // 迎火: 迎え火の炎と迎えられる精霊
        tri(3.0, 2.6, cell * 1.15, '#f97316', '#c2410c'); // 炎
        tri(3.0, 2.9, cell * 0.62, '#fde047', '#eab308');
        seg(1.6, 4.4, 4.4, 4.4, '#78350f', cell * 0.3); // 薪
        seg(2.0, 4.9, 4.0, 4.0, '#92400e', cell * 0.24);
        ring(4.7, 1.4, cell * 0.4, 'rgba(165,180,252,0.9)', 1.6); // 精霊
        dot(4.7, 1.4, '#c7d2fe', '#818cf8', R * 0.4, 0.8);
                    break;
                }
                case 'mummgo': {
        dot(3, 3, "#d6d3d1", "#78716c");
        seg(1.9, 2.5, 4.1, 2.5, "#a8a29e", 1.5);
        seg(1.9, 3.5, 4.1, 3.5, "#a8a29e", 1.5);
                    break;
                }
                case 'murmurgo': {
        seg(1.4, 2.6, 2.2, 2, "#7dd3fc", 2); seg(2.2, 2, 3, 2.6, "#7dd3fc", 2);
        seg(2.4, 3.8, 3.2, 3.2, "#7dd3fc", 2); seg(3.2, 3.2, 4, 3.8, "#7dd3fc", 2);
        seg(3.4, 2.2, 4.2, 1.6, "#7dd3fc", 2); seg(4.2, 1.6, 5, 2.2, "#7dd3fc", 2);
                    break;
                }
                case 'mutatego': {
                    // 変異体ブロブとDNAらしき渦
                    c.fillStyle = '#a855f7'; c.strokeStyle = '#6b21a8'; c.lineWidth = 1.3;
                    c.beginPath();
                    for (let k = 0; k < 9; k++) {
                        const a = (k / 9) * Math.PI * 2;
                        const rr = cell * 1.5 * (1 + 0.16 * Math.sin(k * 3.1));
                        const px = at(3, 3).x + Math.cos(a) * rr, py = at(3, 3).y + Math.sin(a) * rr;
                        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
                    }
                    c.closePath(); c.fill(); c.stroke();
                    dot(2.6, 2.7, '#e9d5ff', '#6b21a8', cell * 0.22); dot(3.4, 3.3, '#e9d5ff', '#6b21a8', cell * 0.18);
                    break;
                }
                case 'myceliumgo': {
        dot(1.8, 3, P1, P1S);
        seg(2.3, 2.8, 4.4, 2, "#84cc16", 1.8);
        seg(2.3, 3, 4.6, 3.2, "#84cc16", 1.8);
        seg(2.3, 3.2, 4.2, 4.2, "#84cc16", 1.8);
        ring(4.5, 3.1, cell * 0.4, "#84cc16", 2);
                    break;
                }
                case 'naildollgo': {
        seg(2.3, 1.5, 2.3, 3.7, "#dc2626", 2.4);
        dot(2.3, 1.4, "#dc2626", "#991b1b", R * 0.55);
        dot(3.7, 3.4, P2, P2S, R * 0.8);
        seg(2.6, 2.0, 3.5, 3.2, "#7f1d1d", 1.4);
                    break;
                }
                case 'namakogo': {
        // 鼠壁: なまこ壁の格子と耐火の連
        seg(1.0, 1.0, 5.0, 1.0, '#57534e', 3);
        seg(1.0, 3.0, 5.0, 3.0, '#57534e', 3);
        seg(1.0, 5.0, 5.0, 5.0, '#57534e', 3);
        dot(2.0, 2.0, P1, P1S, cell * 0.3);
        dot(3.0, 2.0, P1, P1S, cell * 0.3);
        dot(4.0, 2.0, P1, P1S, cell * 0.3);
                    break;
                }
                case 'narikomago': {
        dot(3, 3.3, P1, P1S, cell * 0.55);
        ring(3, 3.3, cell * 0.85, '#fbbf24', 1.6);
        tri(3, 1.5, cell * 0.42, '#fbbf24', '#b45309');
                    break;
                }
                case 'narrativego': {
        // 物語: 開いた本と文字行
        c.strokeStyle = '#92400e'; c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(at(1.2, 2).x, at(1.2, 2).y); c.quadraticCurveTo(at(3, 1.4).x, at(3, 1.4).y, at(3, 2).x, at(3, 2).y);
        c.quadraticCurveTo(at(3, 1.4).x, at(3, 1.4).y, at(4.8, 2).x, at(4.8, 2).y);
        c.lineTo(at(4.8, 4.6).x, at(4.8, 4.6).y); c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(3, 4.6).x, at(3, 4.6).y);
        c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(1.2, 4.6).x, at(1.2, 4.6).y);
        c.closePath(); c.stroke();
        [[1.8, 2.6, 2.6], [1.8, 3.2, 2.6], [3.4, 2.6, 4.2], [3.4, 3.2, 4.2]].forEach(([x, y, x2]) => {
            seg(x, y, x2, y, 'rgba(146,64,14,0.6)', 1.4);
        });
        dot(3, 0.9, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'nashgo': {
        ring(3, 3, cell * 0.85, '#60a5fa', 1.8);
        ring(3, 3, cell * 0.45, '#60a5fa', 1.4);
        dot(3, 3, P1, P1S, cell * 0.3);
        dot(1.6, 1.6, P2, P2S, cell * 0.3);
        dot(4.4, 4.4, P2, P2S, cell * 0.3);
                    break;
                }
                case 'netgraphgo': {
        dot(3, 3, '#60a5fa', '#1d4ed8', cell * 0.4);
        dot(1.7, 2, P1, P1S, cell * 0.3);
        dot(4.3, 2, P1, P1S, cell * 0.3);
        dot(3, 4.6, P1, P1S, cell * 0.3);
        bond(1.9, 2.2, 2.75, 2.8, 1.4); bond(4.1, 2.2, 3.25, 2.8, 1.4); bond(3, 3.4, 3, 4.35, 1.4);
                    break;
                }
                case 'novago': {
        // 客星: 光る新星と尾
        dot(3.4, 2.6, '#fbbf24', '#b45309', cell * 0.5);
        seg(1.0, 1.0, 3.0, 2.4, '#f59e0b', 3);
        seg(1.4, 4.8, 2.8, 3.4, '#f59e0b', 2);
        dot(4.6, 4.6, P2, P2S, cell * 0.24);
                    break;
                }
                case 'nucleationgo': {
        // 結晶: 核から育つ結晶群
        dot(3, 3.4, P1, P1S);
        ring(3, 3.4, cell * 0.6, '#38bdf8', 1.5);
        tri(2.2, 2.2, cell * 0.4, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);
        tri(3.9, 2.4, cell * 0.35, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);
        tri(3.6, 4.6, cell * 0.3, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);
                    break;
                }
                case 'nurikabego': {
        // 塗壁: 道を塞ぐ白い壁と目
        blk(3.0, 3.2, '#e7e5e4', '#78716c');
        blk(1.8, 3.2, '#e7e5e4', '#78716c');
        blk(4.2, 3.2, '#e7e5e4', '#78716c');
        dot(2.4, 2.9, '#1c1917', '#1c1917', cell * 0.09);
        dot(3.6, 2.9, '#1c1917', '#1c1917', cell * 0.09);
        seg(0.8, 4.9, 5.2, 4.9, '#92603a', 2.0);
                    break;
                }
                case 'oathgo': {
        // 宣誓: 石碑の刻文 + 刻まれた石
        blk(3, 3, '#a8a29e', '#57534e');
        seg(3, 1.6, 3, 4.4, '#44403c', 2.0);
        seg(2.5, 2.2, 3.5, 2.2, '#44403c', 1.6);
        seg(2.6, 3.0, 3.4, 3.0, '#44403c', 1.6);
        dot(3, 4.4, P1, P1S, cell * 0.36);
                    break;
                }
                case 'obligego': {
        dot(2, 2.2, P1, P1S);
        dot(4, 4, P2, P2S);
        seg(2.8, 2.6, 3.6, 3.2, '#34d399', 1.8);
        tri(3.8, 3.35, cell * 0.14, '#34d399', '#34d399', Math.PI / 4);
        seg(3.2, 3.6, 2.4, 3.0, '#f59e0b', 1.8);
        tri(2.2, 2.9, cell * 0.14, '#f59e0b', '#f59e0b', Math.PI * 1.25);
                    break;
                }
                case 'obsidiango': {
        // 玻璃: 黒いガラス片と切り裂く刃線
        tri(2.8, 3.2, cell * 1.1, '#18181b', '#52525b', -Math.PI / 3);
        seg(2.4, 2.4, 3.6, 4.0, '#a78bfa', 1.6);
        seg(2.2, 3.4, 3.2, 2.6, '#a78bfa', 1.2);
        dot(4.6, 2.0, '#c4b5fd', '#8b5cf6', R * 0.45);
                    break;
                }
                case 'offergo': {
        // 捧剣: 祭壇 (鳥居) + 捧げられる剣
        seg(1.4, 1.2, 4.6, 1.2, '#dc2626', 2.6);
        seg(1.7, 1.7, 4.3, 1.7, '#dc2626', 2.0);
        seg(2.0, 1.7, 2.0, 3.2, '#dc2626', 2.0);
        seg(4.0, 1.7, 4.0, 3.2, '#dc2626', 2.0);
        seg(3.0, 2.2, 3.0, 4.8, '#94a3b8', 2.8);
        tri(3.0, 5.1, cell * 0.3, '#fbbf24', '#b45309', Math.PI / 2);
                    break;
                }
                case 'ohajikigo': {
        // 御碁: 弾かれるおはじき (丸いガラス玉) と軌跡
        dot(1.7, 4.0, '#fda4af', '#e11d48');
        dot(4.3, 2.4, '#a5f3fc', '#0891b2');
        seg(2.2, 3.7, 3.9, 2.6, '#94a3b8', 1.6);
        ring(4.3, 2.4, cell * 0.32, '#f8fafc', 1.2);
                    break;
                }
                case 'oharaigo': {
        // 大祓: 穢れを掃く祓い串と消える石
        seg(1.4, 4.6, 4.2, 1.8, '#059669', 2.4);
        seg(4.2, 1.8, 4.8, 2.2, '#34d399', 2);
        seg(4.2, 1.8, 4.4, 2.8, '#34d399', 2);
        seg(4.2, 1.8, 3.8, 3.0, '#34d399', 2);
        dot(2, 2, P2, P2S, cell * 0.3, 0.4);
                    break;
                }
                case 'okagego': {
        // お陰: 神域(鳥居)と集まる福の玉
        seg(1.8, 1.6, 4.2, 1.6, '#dc2626', cell * 0.3); // 鳥居上
        seg(2.0, 2.4, 4.0, 2.4, '#dc2626', cell * 0.2);
        seg(2.15, 1.75, 2.15, 4.4, '#b91c1c', cell * 0.22); // 柱
        seg(3.85, 1.75, 3.85, 4.4, '#b91c1c', cell * 0.22);
        [[2.6,4.7],[3.0,4.5],[3.4,4.7]].forEach(([x,y]) =>
            dot(x, y, '#f0abfc', '#a21caf', R * 0.4)); // 福の玉
                    break;
                }
                case 'omenego': {
        // 面隠し: お面+背後の石
        dot(2.9, 3.1, P1, P1S);
        ring(2.9, 3.1, cell * 0.72, '#a78bfa', 2.4);
        dot(2.6, 3.0, '#2e1065', '#2e1065', cell * 0.1);
        dot(3.2, 3.0, '#2e1065', '#2e1065', cell * 0.1);
        seg(2.6, 3.5, 3.2, 3.5, '#2e1065', 1.6);
                    break;
                }
                case 'onmyogo': {
        // 陰陽: 五行の五芒星と陰陽の石
        {
            const pts = [];
            for (let k = 0; k < 5; k++) {
                const a = k * Math.PI * 2 / 5 - Math.PI / 2;
                pts.push([3 + Math.cos(a) * 1.9, 3 + Math.sin(a) * 1.9]);
            }
            [[0,2],[2,4],[4,1],[1,3],[3,0]].forEach(([a,b]) =>
                seg(pts[a][0], pts[a][1], pts[b][0], pts[b][1], 'rgba(180,83,9,0.55)', 1.2));
            const cols = ['#22c55e', '#ef4444', '#eab308', '#e2e8f0', '#3b82f6'];
            pts.forEach(([x, y], k) => dot(x, y, cols[k], '#78350f', cell * 0.22));
        }
        dot(2.75, 3, P1, P1S, R * 0.55); dot(3.25, 3, P2, P2S, R * 0.55); // 陰陽
                    break;
                }
                case 'oomagago': {
        dot(3, 3, P1, '#e11d48', cell * 0.65);
        seg(1.6, 3, 4.4, 3, '#e11d48', 1.4);
        seg(3, 1.6, 3, 4.4, '#e11d48', 1.4);
        seg(2, 2, 4, 4, '#e11d48', 1.4);
        seg(4, 2, 2, 4, '#e11d48', 1.4);
                    break;
                }
                case 'opticalgo': {
        ring(3, 3, R * 0.8, '#64748b', 1.4);
        ring(3, 3, R * 1.6, '#64748b', 1.2);
        ring(3, 3, R * 2.3, '#94a3b8', 1);
        dot(3, 3, P1, P1S, R * 0.5);
                    break;
                }
                case 'oracle2go': {
        // 神託: 輝く環 + 輝点
        ring(3, 3, cell * 1.5, '#22d3ee', 2.2);
        ring(3, 3, cell * 0.9, '#a5f3fc', 1.4);
        dot(3, 3, '#0e7490', '#155e75', cell * 0.3);
        dot(1.4, 1.4, P1, P1S, cell * 0.3);
        dot(4.6, 4.6, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'orbit2go': {
                    // 軌道リングと周回する2石
                    c.strokeStyle = '#60a5fa'; c.lineWidth = 1.3; c.setLineDash([3, 2]);
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.9, 0, Math.PI * 2); c.stroke();
                    c.setLineDash([]);
                    dot(3, 3, '#fde68a', '#d97706', cell * 0.34);
                    dot(4.9, 3, P1, P1S); dot(1.1, 3, P2, P2S);
                    // 周回矢印
                    c.strokeStyle = '#3b82f6'; c.lineWidth = 1.6;
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.9, -Math.PI * 0.28, Math.PI * 0.08); c.stroke();
                    tri(4.78, 2.28, cell * 0.2, '#3b82f6', '#1d4ed8', Math.PI * 0.35);
                    break;
                }
                case 'ordercardgo': {
        blk(1.5, 3, P2, P2S);
        blk(3, 3, P2, P2S);
        blk(4.5, 3, P2, P2S);
        txt('1', 1.5, 3, '#78350f', cell * 0.7);
        txt('2', 3, 3, '#78350f', cell * 0.7);
        txt('3', 4.5, 3, '#78350f', cell * 0.7);
                    break;
                }
                case 'oreveingo': {
        // 鉱脈: 斜めに連なる鉱石
        dot(1.4, 4.6, P1, P1S, R * 0.75);
        dot(2.4, 3.6, P1, P1S, R * 0.75);
        dot(3.4, 2.6, '#fbbf24', '#d97706', R * 0.8);
        dot(4.4, 1.6, '#fbbf24', '#d97706', R * 0.8);
        seg(1.4, 4.6, 4.4, 1.6, '#a16207', 1.2);
                    break;
                }
                case 'origamigo': {
        tri(2.4, 2.8, cell * 0.8, "#f8fafc", "#94a3b8");
        tri(4, 3.4, cell * 0.55, "#f1f5f9", "#94a3b8");
        seg(1.4, 4.4, 4.8, 1.4, "#fbbf24", 1.5);
                    break;
                }
                case 'oshogo': {
        dot(3, 3.5, P1, P1S, cell * 0.6);
        tri(2.3, 2, cell * 0.35, '#fbbf24', '#b45309');
        tri(3, 1.7, cell * 0.4, '#fbbf24', '#b45309');
        tri(3.7, 2, cell * 0.35, '#fbbf24', '#b45309');
                    break;
                }
                case 'otedamago': {
        // 手玉: 弧を描いて投げ上げられる3つの玉
        seg(1.6, 4.6, 3, 1.6, '#cbd5e1', 1.2);
        seg(3, 1.6, 4.4, 4.6, '#cbd5e1', 1.2);
        dot(1.7, 4.5, '#f472b6', '#be185d');
        dot(3, 1.6, '#f9a8d4', '#ec4899');
        dot(4.3, 4.5, '#fbcfe8', '#f472b6');
                    break;
                }
                case 'outlastgo': {
        dot(3, 2.8, P1, P1S);
        ring(3, 2.8, cell * 0.68, 'rgba(52,211,153,0.9)', 2.4);
        seg(3, 2.1, 3, 3.5, 'rgba(52,211,153,0.9)', 2.2);
        txt('Z', 4.6, 1.4, '#34d399', cell * 0.9);
        txt('z', 5.1, 0.8, 'rgba(52,211,153,0.6)', cell * 0.6);
                    break;
                }
                case 'owlgo': {
        // 梟: 大きな目二つと耳羽、夜空の月
        dot(3, 3.2, '#57534e', '#292524', cell * 1.15);   // 梟の体
        dot(2.5, 2.9, '#fde68a', '#b45309', cell * 0.4);  // 左目
        dot(3.5, 2.9, '#fde68a', '#b45309', cell * 0.4);  // 右目
        dot(2.5, 2.9, '#292524', '#000', cell * 0.15);    // 左瞳
        dot(3.5, 2.9, '#292524', '#000', cell * 0.15);    // 右瞳
        tri(2.2, 2.0, cell * 0.3, '#78716c', '#44403c');  // 左耳羽
        tri(3.8, 2.0, cell * 0.3, '#78716c', '#44403c');  // 右耳羽
        dot(5.2, 1.4, '#fef3c7', '#fde68a', cell * 0.35); // 月
                    break;
                }
                case 'paintergo': {
        // 絵画: 筆の軌跡と2つの石
        c.strokeStyle = '#7c3aed'; c.lineWidth = cell * 0.28; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1, 4.6).x, at(1, 4.6).y); c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(3.4, 2).x, at(3.4, 2).y); c.stroke();
        c.strokeStyle = '#a78bfa'; c.lineWidth = cell * 0.16;
        c.beginPath(); c.moveTo(at(1.6, 4.8).x, at(1.6, 4.8).y); c.quadraticCurveTo(at(4.4, 4.2).x, at(4.4, 4.2).y, at(4.8, 2.6).x, at(4.8, 2.6).y); c.stroke();
        dot(1.8, 1.6, P1, P1S); dot(4.6, 1.2, P2, P2S);
        tri(3.6, 1.6, cell * 0.4, '#c084fc', '#7e22ce');
    
                    break;
                }
                case 'parallelgo': {
// 並走する2本の回路
seg(0.8,2,5.2,2,'#34d399',1.8);
seg(0.8,4,5.2,4,'#34d399',1.8);
dot(1.4,2,P1,P1S,cell*0.42,1);
dot(3,2,P1,P1S,cell*0.42,1);
dot(4.6,2,P1,P1S,cell*0.42,1);
dot(1.4,4,P1,P1S,cell*0.42,1);
dot(3,4,P1,P1S,cell*0.42,1);
dot(4.6,4,P1,P1S,cell*0.42,1);
                    break;
                }
                case 'parleygo': {
        dot(2, 3, P1, P1S);
        dot(4, 3, P2, P2S);
        seg(2.4, 3.4, 3.6, 2.6, '#10b981', 1.6);
        seg(2.4, 2.6, 3.6, 3.4, '#10b981', 1.6);
        seg(3, 2.6, 3, 1.4, '#10b981', 1.6);
                    break;
                }
                case 'pasturego': {
        dot(2.2, 2.6, P2, P2S);
        ring(2.2, 2.6, cell * 0.5, "#93c5fd", 1.4);
        seg(0.9, 4.2, 4.4, 4.2, "#92400e", 2);
        seg(1.6, 3.7, 1.6, 4.7, "#92400e", 1.8);
        seg(3.6, 3.7, 3.6, 4.7, "#92400e", 1.8);
                    break;
                }
                case 'pawnarmygo': {
        dot(1.6, 4.4, P1, P1S, cell * 0.28); dot(2.4, 4.4, P1, P1S, cell * 0.28);
        dot(1.6, 3.6, P1, P1S, cell * 0.28); dot(2.4, 3.6, P1, P1S, cell * 0.28);
        dot(4, 2.4, P1, "#facc15", cell * 0.5);
        ring(4, 2.4, cell * 0.62, "#facc15", 2);
                    break;
                }
                case 'peelgo': {
        // 表面が剥がれる石
        dot(3, 3, P1, P1S, cell * 0.52);
        ring(3.4, 2.6, cell * 0.4, '#d6d3d1', 2.4);
        seg(3.6, 2.2, 4.4, 1.4, '#a8a29e', 1.8);
        dot(4.6, 1.2, '#d6d3d1', '#a8a29e', cell * 0.16);
        dot(1.4, 4.6, '#d6d3d1', '#a8a29e', cell * 0.14);
                    break;
                }
                case 'pendulum2go': {
                    // 振子: 支点から吊るした石と往復矢印
                    seg(3, 0.9, 2, 3.4, '#78716c', 1.6);
                    dot(3, 0.9, '#a8a29e', '#57534e', cell * 0.24);
                    dot(2, 3.4, P1, P1S);
                    c.strokeStyle = '#78716c'; c.lineWidth = 1.4; c.setLineDash([2, 2]);
                    c.beginPath(); c.arc(at(3, 0.9).x, at(3, 0.9).y, cell * 2.55, Math.PI * 0.42, Math.PI * 0.58); c.stroke();
                    c.setLineDash([]);
                    txt('⇄', 3, 5.1, '#57534e', cell * 1.2);
                    dot(4.4, 4.4, P2, P2S, cell * 0.34);
                    break;
                }
                case 'pendulumgo': {
        seg(3, 0.5, 3.9, 2.4, 'rgba(120,113,108,0.8)', 1.8);
        dot(4.1, 2.7, P1, P1S);
        dot(1.8, 4.0, P2, P2S, cell * 0.34);
        seg(1.2, 4.0, 2.4, 4.0, 'rgba(167,139,250,0.8)', 2);
        tri(2.4, 4.0, cell * 0.2, '#a78bfa', '#7c3aed', 0);
        dot(3, 0.5, '#57534e', '#44403c', cell * 0.14);
                    break;
                }
                case 'percussiongo': {
        // 打楽: 大太鼓と撥、震える波紋
        dot(3, 3.6, '#b45309', '#78350f', cell * 1.15);   // 太鼓の胴
        ring(3, 3.6, cell * 0.8, '#fef3c7', 2);           // 鼓面
        dot(3, 3.6, '#f59e0b', '#b45309', cell * 0.25);   // 鼓の芯
        seg(4.2, 1.6, 4.8, 2.6, '#57534e', 2);            // 撥1
        seg(1.8, 1.6, 1.2, 2.6, '#57534e', 2);            // 撥2
        dot(4.8, 2.7, '#ef4444', '#991b1b', cell * 0.2);  // 撥頭1
        dot(1.2, 2.7, '#ef4444', '#991b1b', cell * 0.2);  // 撥頭2
        ring(3, 3.6, cell * 1.35, 'rgba(251,191,36,0.5)', 1.2); // 震える波紋
                    break;
                }
                case 'pestilencego': {
        dot(2.0, 2.2, '#65a30d', '#3f6212');
        dot(3.4, 2.8, '#84cc16', '#3f6212');
        dot(2.6, 4.0, '#4d7c0f', '#1a2e05');
        dot(4.2, 4.0, '#65a30d', '#3f6212');
                    break;
                }
                case 'petalgo': {
        mol([[3, 1.2], [4.6, 2.2], [4.6, 3.8], [3, 4.8], [1.4, 3.8], [1.4, 2.2]], "#f9a8d4", "#db2777");
        dot(3, 3, "#facc15", "#a16207", cell * 0.4);
                    break;
                }
                case 'pharmacygo': {
        // 生薬3つが薬に
        dot(1.4, 2, '#34d399', '#059669', cell * 0.28);
        dot(2.6, 2, '#34d399', '#059669', cell * 0.28);
        dot(3.8, 2, '#34d399', '#059669', cell * 0.28);
        seg(1.4, 2.9, 5, 2.9, '#57534e', 1.4);
        tri(5, 2.9, cell * 0.2, '#57534e', '#44403c', 0);
        dot(4.6, 4.4, '#fde68a', '#d97706', cell * 0.42);
        txt('薬', 4.6, 4.4, '#92400e', cell * 0.5);
                    break;
                }
                case 'photosynthesisgo': {
        // 太陽と葉
        ring(3, 1.6, cell * 0.45, '#eab308', 2.4);
        seg(3, 0.5, 3, 0.9, '#eab308', 2);
        seg(1.8, 1.6, 2.2, 1.6, '#eab308', 2);
        seg(3.8, 1.6, 4.2, 1.6, '#eab308', 2);
        dot(2.2, 4.4, '#65a30d', '#3f6212', cell * 0.34);
        dot(3.8, 4.4, '#65a30d', '#3f6212', cell * 0.34);
                    break;
                }
                case 'piergo': {
        // 橋脚: 橋桁と2本の橋脚、その上の石
        seg(0.6, 1.8, 5.4, 1.8, '#78716c', 4);
        seg(0.6, 2.2, 5.4, 2.2, '#57534e', 2);
        seg(2, 2.2, 2, 5.2, '#57534e', 3);
        seg(4, 2.2, 4, 5.2, '#57534e', 3);
        dot(2, 1.8, P1, P1S, R * 0.9);
        dot(4, 1.8, P2, P2S, R * 0.9);
                    break;
                }
                case 'pilgrimgo': {
        seg(1.8, 1.4, 4.2, 1.4, "#dc2626", 3);
        seg(2.1, 2.1, 3.9, 2.1, "#dc2626", 2.5);
        seg(2.3, 1.4, 2.3, 4.6, "#dc2626", 3);
        seg(3.7, 1.4, 3.7, 4.6, "#dc2626", 3);
        dot(3, 5.1, P1, P1S, cell * 0.3);
                    break;
                }
                case 'pinkygo': {
        dot(2, 3, P1, P1S);
        dot(4, 3, P2, P2S);
        seg(2, 3, 4, 3, '#f472b6', 2);
        ring(3, 2, R * 0.5, '#f472b6', 1.4);
        seg(3, 2.4, 3, 3, '#f472b6', 1.4);
                    break;
                }
                case 'planetarygo': {
        // 七曜: 曜の点が一列に巡る
        dot(0.8, 3.0, '#f59e0b', '#b45309', cell * 0.28);
        dot(1.9, 3.0, '#e7e5e4', '#a8a29e', cell * 0.26);
        dot(3.0, 3.0, '#dc2626', '#991b1b', cell * 0.3);
        dot(4.1, 3.0, '#60a5fa', '#1d4ed8', cell * 0.3);
        dot(5.2, 3.0, '#a16207', '#713f12', cell * 0.32);
                    break;
                }
                case 'plantgo': {
        dot(1.1, 1.1, "#fde047", "#eab308", cell * 0.42);
        seg(1.1, 0.4, 1.1, 0.1, "#eab308", 1.4);
        seg(1.7, 0.5, 2, 0.2, "#eab308", 1.4);
        dot(3, 4, P1, P1S, R * 0.9);
        tri(3.35, 3.4, cell * 0.3, "#22c55e", "#15803d", -0.4);
        tri(2.7, 3.5, cell * 0.26, "#4ade80", "#16a34a", -2.4);
        dot(4.4, 4.4, P2, P2S, R * 0.8);
                    break;
                }
                case 'plastergo': {
        // 左官: 漆喰の壁と鏝 (こて)
        blk(0.8, 3.2, '#e7e5e4', '#a8a29e');
        tri(4.0, 2.2, cell * 0.7, '#a8a29e', '#57534e', Math.PI / 4);
        seg(4.3, 2.5, 5.2, 3.4, '#78350f', 1.8);
        seg(1.4, 3.6, 3.4, 3.6, '#ffffff', 1.4);
                    break;
                }
                case 'platego': {
        // 皿回し: 竿の上の皿+回転弧
        seg(2.9, 4.6, 2.9, 2.6, '#78716c', 2);
        seg(1.7, 2.2, 4.1, 2.2, '#38bdf8', 3);
        ring(2.9, 2.0, cell * 0.6, 'rgba(56,189,248,0.5)', 1.4);
        seg(4.3, 1.4, 4.7, 1.9, 'rgba(56,189,248,0.7)', 1.4);
        seg(1.5, 1.4, 1.1, 1.9, 'rgba(56,189,248,0.7)', 1.4);
                    break;
                }
                case 'polaritygo': {
        dot(1.8, 3, '#60a5fa', '#1e40af', cell * 0.62);
        dot(4.2, 3, '#f87171', '#b91c1c', cell * 0.62);
        txt('N', 1.8, 3, '#eff6ff', cell * 0.55);
        txt('S', 4.2, 3, '#fef2f2', cell * 0.55);
        seg(2.6, 2.4, 3.4, 2.4, '#94a3b8', 1.2);
        seg(2.6, 3.6, 3.4, 3.6, '#94a3b8', 1.2);
                    break;
                }
                case 'polarnightgo': {
// 極夜の星空と沈む盤
ctx.fillStyle='rgba(15,23,42,0.92)';
ctx.fillRect(0,0,cell*6,cell*6);
dot(1.2,1.0,'#e0e7ff','#818cf8',cell*0.09,1);
dot(3.4,0.7,'#e0e7ff','#818cf8',cell*0.07,1);
dot(4.8,1.5,'#e0e7ff','#818cf8',cell*0.08,1);
dot(2.2,2.0,'#c7d2fe','#6366f1',cell*0.06,1);
dot(2,4.0,P1,P1S,cell*0.5,0.8);
dot(4.2,4.2,P2,P2S,cell*0.5,0.8);
seg(0.8,3.0,5.2,3.0,'rgba(129,140,248,0.5)',1.2);
                    break;
                }
                case 'pollengo': {
        dot(1.8, 3, P1, P1S);
        seg(2.6, 3, 4, 3, "#fbcfe8", 2);
        tri(4.2, 3, cell * 0.3, "#fbcfe8", "#f472b6");
        dot(4.6, 3, P1, "#fbcfe8", cell * 0.25);
                    break;
                }
                case 'possessgo': {
        dot(3, 3, P1, P1S);
        ring(3, 2.6, cell * 0.6, '#c4b5fd', 2.2);
        dot(2.7, 2.5, '#ede9fe', '#7c3aed');
        dot(3.3, 2.5, '#ede9fe', '#7c3aed');
                    break;
                }
                case 'potholego': {
        // 甌穴: 底の見えない穴と落ちる石
        c.fillStyle = '#0c0a09';
        c.beginPath(); c.ellipse(at(3,4).x, at(3,4).y, cell * 1.5, cell * 0.9, 0, 0, Math.PI * 2); c.fill();
        ring(3, 4, cell * 1.1, '#44403c', 2.4);
        dot(3, 1.8, P1, P1S, R * 0.85);
        seg(3, 2.6, 3, 3.2, '#78716c', 1.8);
        dot(1.2, 4.6, P2, P2S, R * 0.8);
        dot(4.8, 4.6, P2, P2S, R * 0.8);
                    break;
                }
                case 'potiongo': {
        tri(3, 3.4, cell * 0.9, '#4ade80', '#166534');
        seg(2.6, 1.8, 3.4, 1.8, '#166534', 2.2);
        dot(2.7, 3.2, '#f87171', '#991b1b');
        dot(3.3, 3.6, '#fbbf24', '#92400e');
                    break;
                }
                case 'potterygo': {
        // 窯で焼かれる壺
        blk(3, 2.6, '#d6d3d1', '#78716c');
        ring(3, 2.6, cell * 0.55, '#fbbf24', 2);
        tri(3, 4.6, cell * 0.6, '#f97316', '#c2410c');
        tri(3, 4.9, cell * 0.34, '#fbbf24', '#d97706');
        dot(1.4, 1.4, P2, P2S, cell * 0.28);
                    break;
                }
                case 'predatorgo': {
                    // 捕食: 牙の生えた大きな石が小さな石を追う
                    dot(2.4, 2.4, P1, P1S, cell * 0.62);
                    c.fillStyle = '#fef2f2';
                    [0, 1].forEach(k => {
                        const fx = 2.4 + (k - 0.5) * 0.5;
                        c.beginPath();
                        c.moveTo(at(fx - 0.12, 2.72).x, at(fx - 0.12, 2.72).y);
                        c.lineTo(at(fx + 0.12, 2.72).x, at(fx + 0.12, 2.72).y);
                        c.lineTo(at(fx, 3.05).x, at(fx, 3.05).y);
                        c.closePath(); c.fill();
                    });
                    dot(4.6, 4.4, P2, P2S, cell * 0.34);
                    c.strokeStyle = '#fca5a5'; c.lineWidth = 1.3; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(3.1, 3.1).x, at(3.1, 3.1).y); c.quadraticCurveTo(at(4.1, 3.4).x, at(4.1, 3.4).y, at(4.3, 4).x, at(4.3, 4).y); c.stroke();
                    c.setLineDash([]);
                    break;
                }
                case 'pressgo': {
        // 圧延: ローラー2本+延びた薄板
        seg(1.0, 2.2, 4.8, 2.2, '#57534e', 2.4);
        seg(1.0, 3.8, 4.8, 3.8, '#57534e', 2.4);
        seg(1.4, 3.0, 4.4, 3.0, '#fbbf24', 4);
        tri(4.6, 3.0, cell * 0.2, '#fbbf24', '#b45309', 0);
                    break;
                }
                case 'prisonergo': {
        dot(3, 3, P2, P2S);
        seg(1.8, 1.4, 1.8, 4.6, '#57534e', 2.2);
        seg(3.0, 1.4, 3.0, 4.6, '#57534e', 2.2);
        seg(4.2, 1.4, 4.2, 4.6, '#57534e', 2.2);
        seg(1.4, 1.4, 4.6, 1.4, '#57534e', 2.2);
                    break;
                }
                case 'prizeboardgo': {
        blk(2.4, 2.6, '#ffffff', '#78350f');
        dot(2.2, 2.4, '#dc2626', '#dc2626', cell * 0.1);
        dot(2.6, 2.8, '#dc2626', '#dc2626', cell * 0.1);
        txt('3', 4.4, 4, '#b45309', cell * 0.9);
        txt('6', 4.9, 2.2, '#78350f', cell * 0.7);
        dot(4.3, 4.9, P1, P1S, cell * 0.3);
                    break;
                }
                case 'probgo': {
        dot(2.6, 3, P1, P1S, cell * 0.5);
        ring(3.8, 3, cell * 0.5, '#fb7185', 1.4);
        seg(3.1, 3, 3.35, 3, '#fb7185', 1.6);
        txt('%', 3.65, 4.6, '#fb7185', cell * 0.85);
                    break;
                }
                case 'projectiongo': {
        dot(3, 1.5, '#fde68a', '#f59e0b', R * 0.8);
        seg(3, 2.1, 3, 2.7, '#fde68a', 1.4);
        dot(2.6, 3.2, P2, P2S);
        dot(3.4, 3.6, P1, P1S, R, 0.6);
                    break;
                }
                case 'proofgo': {
        // 校閲: 石+朱丸+朱斜線
        dot(2.9, 3.1, P2, P2S);
        ring(2.9, 3.1, cell * 0.62, '#dc2626', 2.4);
        seg(2.3, 3.7, 3.5, 2.5, '#dc2626', 2);
        seg(1.4, 4.4, 2.0, 4.0, '#dc2626', 2);
                    break;
                }
                case 'prunego': {
        // 剪定: 枝の連+鋏の十字
        dot(1.8, 4.0, P1, P1S, cell * 0.3);
        dot(2.8, 3.4, P1, P1S, cell * 0.3);
        dot(3.8, 4.0, P1, P1S, cell * 0.3);
        seg(1.4, 1.6, 3.0, 2.8, '#dc2626', 2);
        seg(3.0, 1.6, 1.4, 2.8, '#dc2626', 2);
                    break;
                }
                case 'pulleygo': {
                    // 滑車: 中央の輪と両端に吊るされた石
                    ring(3, 1.3, '#d97706', cell * 0.5);
                    seg(3, 1.3, 1.6, 3.6, '#a16207', 1.5); seg(3, 1.3, 4.4, 3.6, '#a16207', 1.5);
                    dot(1.6, 3.9, P1, P1S); dot(4.4, 3.9, P2, P2S);
                    txt('▼', 4.4, 5.1, '#57534e', cell * 0.8); txt('▲', 1.6, 2.4, '#57534e', cell * 0.8);
                    break;
                }
                case 'puppetgo': {
        seg(2.2, 0.6, 2.8, 2.2, 'rgba(203,213,225,0.9)', 1.6);
        seg(3.8, 0.6, 3.2, 2.2, 'rgba(203,213,225,0.9)', 1.6);
        dot(3, 2.8, P2, P2S);
        seg(1.6, 0.5, 4.4, 0.5, 'rgba(148,163,184,0.9)', 2.4);
        dot(1.4, 4.2, P1, P1S, cell * 0.3);
                    break;
                }
                case 'pushrowgo': {
        // 列推: 列に並ぶ石と押し出す矢
        dot(3, 1.4, P2, P2S, cell * 0.34); dot(3, 2.6, P2, P2S, cell * 0.34);
        dot(3, 4, P1, P1S);
        c.strokeStyle = '#ef4444'; c.lineWidth = 2.2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3, 4.9).x, at(3, 4.9).y); c.lineTo(at(3, 1.1).x, at(3, 1.1).y); c.stroke();
        tri(3, 0.9, cell * 0.34, '#ef4444', '#b91c1c');
        dot(5, 4.6, P2, P2S, cell * 0.28);
    
                    break;
                }
                case 'pyramid2go': {
                    // ピラミッドと頂点の石
                    tri(3, 3.1, cell * 2.1, 'rgba(214,178,70,0.85)', '#92610e', Math.PI * 1.5);
                    seg(1.05, 5.2, 3, 1.1, 'rgba(146,97,14,0.7)', 1.2);
                    seg(3, 1.1, 4.95, 5.2, 'rgba(146,97,14,0.7)', 1.2);
                    dot(3, 1.15, P1, P1S); dot(1.15, 5.05, P1, P1S); dot(4.85, 5.05, P1, P1S);
                    break;
                }
                case 'pyroclasticgo': {
        // 火砕流: 噴火する山と斜面を下る炎の帯
        tri(3, 2.2, cell * 1.1, '#57534e', '#292524', 0);
        dot(3, 1.5, '#f97316', '#ea580c', cell * 0.16);
        seg(3, 2.0, 2.2, 4.6, '#f97316', 2.2);
        seg(3, 2.0, 3.8, 4.6, '#fb923c', 2.0);
                    break;
                }
                case 'quarrygo': {
        dot(3.6, 3.8, '#78716c', '#44403c', cell * 0.5);
        dot(4.5, 4.4, '#57534e', '#44403c', cell * 0.3);
        seg(2.4, 1.8, 3.7, 3.1, '#a16207', 3);
        seg(1.9, 1.5, 2.9, 2.1, '#57534e', 3);
                    break;
                }
                case 'quartzgo': {
        // 水晶: 六角の結晶と屈折光
        tri(3, 3.4, cell * 0.7, 'rgba(165,243,252,0.75)', '#22d3ee', -Math.PI / 2);
        tri(3, 3.4, cell * 0.7, 'rgba(165,243,252,0.4)', '#67e8f9', Math.PI / 2);
        seg(3, 3.4, 4.6, 2.0, '#a5f3fc', 1.4);
        seg(3, 3.4, 1.4, 2.0, '#a5f3fc', 1.4);
        dot(3, 3.4, '#e0f2fe', '#38bdf8', R * 0.5);
                    break;
                }
                case 'radengo': {
        // 螺鈿: 漆黒の地に虹彩の貝片が輝く
        blk(3.0, 3.0, '#1c1917', '#000000');
        tri(2.5, 2.6, cell * 0.5, '#67e8f9', '#0e7490');
        tri(3.8, 3.4, cell * 0.5, '#f0abfc', '#a21caf', -Math.PI * 0.3);
        dot(3.4, 2.2, '#a5f3fc', '#0891b2', cell * 0.18);
        seg(1.6, 4.4, 2.4, 4.0, '#fde68a', 1.4);
                    break;
                }
                case 'raftgo': {
        blk(0.8, 1, "#b45309", "#78350f");
        blk(4, 4, "#b45309", "#78350f");
        seg(1.8, 2, 4, 4, "#fbbf24", 1.4);
                    break;
                }
                case 'rainbowgo': {
        ring(3, 4.6, cell * 2.6, '#ef4444', 2);
        ring(3, 4.6, cell * 2.25, '#facc15', 2);
        ring(3, 4.6, cell * 1.9, '#3b82f6', 2);
        dot(2, 3.4, P1, P1S, R * 0.8);
        dot(4, 3.4, P2, P2S, R * 0.8);
                    break;
                }
                case 'rammergo': {
        // 重錘: 上の錘 + 下向き矢印 + 潰れる列
        blk(3, 1.2, '#44403c', '#1c1917');
        seg(3, 2.0, 3, 3.0, '#f59e0b', 2.4);
        tri(3, 3.4, cell * 0.34, '#f59e0b', '#b45309', Math.PI / 2);
        dot(3, 4.3, P2, P2S, cell * 0.36);
        dot(3, 5.0, P2, P2S, cell * 0.36, 0.5);
                    break;
                }
                case 'rampartgo': {
        // 石垣: 積み石の壁と梯子
        blk(1.6, 3, '#78716c', '#44403c'); blk(2.6, 3, '#57534e', '#44403c');
        blk(3.6, 3, '#78716c', '#44403c'); blk(4.6, 3, '#57534e', '#44403c');
        seg(3, 3.6, 3, 5.6, '#f59e0b', 2);
        seg(2.7, 4, 3.3, 4, '#f59e0b', 1.4);
        seg(2.7, 4.8, 3.3, 4.8, '#f59e0b', 1.4);
        dot(1.4, 1.6, P1, P1S, R * 0.8);
        dot(4.6, 1.6, P2, P2S, R * 0.8);
                    break;
                }
                case 'raptorgo': {
        // 猛禽: 鷹の目と鉤爪、獲物の小動物
        dot(2.8, 2.4, '#78350f', '#451a03', cell * 0.7);  // 鷹の頭
        dot(3.0, 2.3, '#fbbf24', '#92400e', cell * 0.22); // 鋭い目
        tri(3.5, 2.8, cell * 0.4, '#f59e0b', '#92400e');  // 嘴
        seg(1.8, 4.2, 2.6, 4.7, '#57534e', 2.2);          // 鉤爪1
        seg(2.4, 4.6, 3.0, 5.0, '#57534e', 2.2);          // 鉤爪2
        dot(4.4, 4.4, '#a8a29e', '#57534e', cell * 0.4);  // 小動物 (獲物)
                    break;
                }
                case 'recallgo': {
        txt('⟲', 3, 3, '#a78bfa', cell * 2.6);
        dot(4.4, 3.2, P1, P1S, cell * 0.36);
        dot(1.7, 3.6, P2, P2S, cell * 0.36, 0.6);
                    break;
                }
                case 'regressgo': {
        blk(1.6, 3.0, '#78716c', '#44403c');
        blk(2.6, 2.4, '#a8a29e', '#44403c');
        blk(3.6, 1.8, '#d6d3d1', '#78716c');
        seg(1.2, 4.6, 4.8, 4.6, '#57534e', 2.0);
        seg(3.8, 1.4, 4.6, 0.9, '#ef4444', 1.6);
                    break;
                }
                case 'requiemgo': {
        // 鎮魂: 幽光の霊 + 囲む石
        dot(3, 3, '#bae6fd', '#67e8f9', cell * 0.6);
        ring(3, 3, cell * 0.95, '#67e8f9', 1.4);
        dot(1.6, 3, P1, P1S, cell * 0.34);
        dot(4.4, 3, P1, P1S, cell * 0.34);
        dot(3, 1.6, P1, P1S, cell * 0.34);
                    break;
                }
                case 'reservoirgo': {
        blk(3, 3.4, '#38bdf8', '#0284c7');
        dot(2.4, 1.8, '#bae6fd', '#38bdf8', R * 0.45);
        dot(3.6, 1.4, '#bae6fd', '#38bdf8', R * 0.45);
        seg(2.2, 3.2, 3.8, 3.2, '#e0f2fe', 1.6);
                    break;
                }
                case 'resistorgo': {
// 抵抗器と電流
seg(0.4,3,1.6,3,'#facc15',1.6);
seg(4.4,3,5.6,3,'#facc15',1.6);
mol([[1.6,2.3],[2.4,2.3],[2.4,3.7],[3.6,3.7],[3.6,2.3],[4.4,2.3],[4.4,3.7],[3.6,3.7],[3.6,2.3],[2.4,2.3],[2.4,3.7],[1.6,3.7]],'rgba(250,204,21,0.25)','#facc15');
dot(0.9,3,P1,P1S,cell*0.35,1);
dot(5.1,3,P2,P2S,cell*0.35,1);
                    break;
                }
                case 'resonancego': {
        dot(1.6, 3, P1, P1S, cell * 0.4);
        dot(3, 3, P1, P1S, cell * 0.4);
        dot(4.4, 3, P1, P1S, cell * 0.4);
        ring(3, 3, cell * 1.1, '#facc15', 1.4);
        ring(3, 3, cell * 1.9, '#facc15', 1);
        seg(1.6, 3, 4.4, 3, '#a3a3a3', 1.2);
                    break;
                }
                case 'retreatgo': {
        dot(4, 3, P1, P1S);
        seg(4, 3.8, 4, 2.2, "#7dd3fc", 2);
        seg(2.2, 2.2, 1.2, 2.2, "#7dd3fc", 2.5);
        tri(1.6, 2.2, cell * 0.3, "#7dd3fc", "#0369a1");
                    break;
                }
                case 'rhythmgo': {
        dot(1.2, 3.4, P1, P1S, cell * 0.3);
        dot(2.4, 3.4, P1, P1S, cell * 0.3);
        dot(3.6, 3.4, P1, P1S, cell * 0.3);
        dot(4.8, 3.4, P1, P1S, cell * 0.42);
        ring(4.8, 3.4, cell * 0.6, '#fb923c', 2);
        txt('4', 4.8, 1.4, '#fb923c', cell * 0.9);
                    break;
                }
                case 'ricego': {
        blk(2.2, 3.6, '#e7e5e4', '#a8a29e');
        blk(3.8, 3.6, '#e7e5e4', '#a8a29e');
        blk(3, 2.2, '#e7e5e4', '#a8a29e');
        seg(2.2, 3.6, 2.2, 4.4, '#a8a29e', 1.4);
        seg(3.8, 3.6, 3.8, 4.4, '#a8a29e', 1.4);
                    break;
                }
                case 'ridgego': {
        tri(1.5, 2.8, cell * 0.7, "#78716c", "#44403c");
        tri(3, 2.4, cell * 0.9, "#a8a29e", "#57534e");
        tri(4.5, 2.8, cell * 0.7, "#78716c", "#44403c");
        seg(0.6, 3.4, 5.4, 3.4, "#78350f", 2);
        dot(3, 2.4, P2, P2S, R * 0.7);
        dot(1.5, 4.6, P1, P1S, R * 0.7);
        dot(4.5, 4.6, P2, P2S, R * 0.7);
        txt("-2", 4.6, 0.9, "#dc2626", cell * 0.85);
                    break;
                }
                case 'rimmedgo': {
        dot(2.4, 3, P1, P1S);
        ring(2.4, 3, cell * 0.55, '#fbbf24', 2.2);
        dot(3.7, 3, P1, P1S);
        ring(3.7, 3, cell * 0.55, '#fbbf24', 2.2);
        seg(2.9, 3, 3.2, 3, '#fbbf24', 2);
                    break;
                }
                case 'ringtossgo': {
        // 輪投げ: 的の杭と投げられた輪2つ
        seg(2.9, 1.6, 2.9, 4.4, '#92400e', 2.6);
        tri(2.9, 1.4, cell * 0.22, '#dc2626', '#991b1b');
        ring(2.9, 2.2, cell * 0.62, P1, 2);
        ring(1.6, 3.9, cell * 0.55, P2, 2);
        ring(4.2, 4.1, cell * 0.55, '#facc15', 2);
                    break;
                }
                case 'rinshogo': {
        // 手本(円)と筆で写す一字
        ring(3.0, 3.0, cell * 2.0, '#a8a29e', 2);
        dot(3.0, 3.0, P1, P1S);
        dot(1.2, 4.6, P2, P2S, cell * 0.3);
        seg(4.6, 1.4, 5.4, 3.0, '#78350f', 4);
        txt('書', 5.0, 5.0, '#44403c', cell * 1.0);
                    break;
                }
                case 'ripplego': {
        ring(2.5, 2.5, cell * 0.8, "#38bdf8", 1.5);
        ring(2.5, 2.5, cell * 1.4, "#38bdf8", 1.2);
        ring(2.5, 2.5, cell * 2.0, "#7dd3fc", 1.0);
        dot(2.5, 2.5, P1, P1S);
        dot(4.0, 4.0, P2, P2S, R * 0.75);
                    break;
                }
                case 'riverbridgego': {
        seg(1, 2.6, 5, 2.6, '#38bdf8', 1.8);
        seg(1, 3.4, 5, 3.4, '#38bdf8', 1.8);
        blk(2.6, 2.2, '#92683a', '#503a1a');
        blk(2.6, 3, '#92683a', '#503a1a');
        dot(1.7, 1.6, P1, P1S, cell * 0.4);
        dot(4.3, 4.6, P2, P2S, cell * 0.4);
                    break;
                }
                case 'rokkigo': {
        // 六曜: 日めくり暦と大安の吉印
        blk(3, 3, '#f8fafc', '#94a3b8'); // 暦
        seg(2.4, 2.15, 3.6, 2.15, '#ef4444', cell * 0.22); // 暦の頭
        txt('大安', 3, 3.35, '#b91c1c', cell * 0.62);
        ring(4.7, 1.6, cell * 0.4, '#fbbf24', 1.8); // 吉の輪
        dot(4.7, 1.6, '#fde047', '#d97706', R * 0.28);
        dot(1.3, 4.6, P1, P1S, R * 0.4); // 凶石
        seg(1.15, 4.45, 1.45, 4.75, '#64748b', 1.4); // 凶印×
        seg(1.45, 4.45, 1.15, 4.75, '#64748b', 1.4);
                    break;
                }
                case 'rokurohigo': {
        // 轆轤: 回転盤の環+回転矢と器の石
        ring(3, 3, cell * 1.2, '#a16207', 2.2);
        seg(4.2, 1.9, 4.6, 2.6, '#a16207', 2);
        tri(4.6, 2.8, cell * 0.22, '#a16207', '#713f12', Math.PI / 2);
        dot(3, 3, P2, P2S);
                    break;
                }
                case 'roofgo': {
        tri(3, 2.4, cell * 2.2, '#9a5140', '#5d2f26', 0);
        seg(3, 0.7, 3, 5.2, '#57534e', 1.8);
        seg(1.6, 3, 4.4, 3, '#5d2f26', 1.4);
        seg(2, 4, 4, 4, '#5d2f26', 1.4);
        dot(3, 4.2, P1, P1S, cell * 0.4);
                    break;
                }
                case 'rosarygo': {
        ring(3, 2.8, cell * 1.6, '#facc15', 1.4);
        dot(3, 1.2, P2, '#a16207', cell * 0.32);
        dot(4.6, 2, P2, '#a16207', cell * 0.32);
        dot(4.6, 3.6, P2, '#a16207', cell * 0.32);
        dot(3, 4.4, P2, '#a16207', cell * 0.32);
        dot(1.4, 3.6, P2, '#a16207', cell * 0.32);
        dot(1.4, 2, P2, '#a16207', cell * 0.32);
        seg(3, 4.6, 3, 5.6, '#a16207', 1.4);
                    break;
                }
                case 'roulette2go': {
        // 回転盤: 4分割のルーレットと停止マーカー
        const p = at(3, 3);
        const colors = ['#ef4444', '#1c1917', '#ef4444', '#1c1917'];
        for (let i = 0; i < 4; i++) {
            c.fillStyle = colors[i];
            c.beginPath(); c.moveTo(p.x, p.y);
            c.arc(p.x, p.y, cell * 1.7, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            c.closePath(); c.fill();
        }
        c.strokeStyle = '#fef3c7'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(p.x, p.y, cell * 1.7, 0, Math.PI * 2); c.stroke();
        tri(3, 0.7, cell * 0.4, '#fbbf24', '#b45309', Math.PI);
        dot(3, 3, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'rubberjumpgo': {
        // ゴム跳び: 両端の支点+ゴム+跳ぶ矢印
        dot(1.2, 4.2, P1, P1S, cell * 0.3);
        dot(4.6, 4.2, P1, P1S, cell * 0.3);
        seg(1.2, 4.2, 4.6, 4.2, '#f59e0b', 2.2);
        seg(2.2, 3.0, 2.9, 1.8, '#22c55e', 2);
        tri(2.9, 1.7, cell * 0.2, '#22c55e', '#15803d');
                    break;
                }
                case 'rustzonego': {
        dot(3, 3, '#b45309', '#7c2d12', cell * 0.85);
        dot(2.6, 2.7, '#7c2d12', '#7c2d12', cell * 0.16);
        dot(3.4, 3.3, '#7c2d12', '#7c2d12', cell * 0.13);
        dot(2.9, 3.6, '#451a03', '#451a03', cell * 0.12);
        dot(4.6, 4.6, P1, P1S, cell * 0.35);
                    break;
                }
                case 'ryoushigo': {
        // 料紙: 厚い帯と薄い帯の縞に筆跡
        blk(1.0, 1.6, '#d97706', '#92400e');
        blk(5.0, 1.6, '#d97706', '#92400e');
        blk(1.0, 4.4, '#93c5fd', '#3b82f6');
        blk(5.0, 4.4, '#93c5fd', '#3b82f6');
        seg(2.4, 2.2, 4.0, 3.8, '#1c1917', 4);
                    break;
                }
                case 'saiseigo': {
        // 再生: 切られた連と蘇る新芽
        dot(1.8, 4.0, '#d4d4d4', '#a3a3a3', cell * 0.3);
        dot(4.2, 4.0, '#d4d4d4', '#a3a3a3', cell * 0.3);
        seg(2.6, 4.0, 3.4, 4.0, '#ef4444', 1.6);
        dot(3.0, 2.6, '#4ade80', '#166534', cell * 0.36);
        tri(3.4, 2.1, cell * 0.2, '#86efac', '#166534');
                    break;
                }
                case 'sakurago': {
        // 桜: 枝から散る花びら
        seg(1.2, 1.8, 4.8, 1.2, '#78350f', 2.4);
        dot(2.6, 2.2, '#f9a8d4', '#ec4899', R * 0.8);
        dot(3.4, 3.0, '#fbcfe8', '#f472b6', R * 0.5);
        dot(4.2, 3.8, '#fbcfe8', '#f472b6', R * 0.45);
        dot(2.0, 4.4, '#fce7f3', '#f9a8d4', R * 0.4);
                    break;
                }
                case 'salmonrungo': {
        // 鮭遡: 川を遡る鮭と産卵の泡
        seg(1, 5.2, 5, 5.2, '#38bdf8', 2);
        seg(1.4, 4.4, 4.6, 4.4, '#7dd3fc', 1.4);
        tri(2.6, 3, cell * 0.7, '#fb7185', '#be123c', -Math.PI / 2);
        dot(2.6, 2.2, '#f8fafc', '#be123c', cell * 0.1);
        ring(4.2, 1.4, cell * 0.2, '#fda4af', 1.2);
        ring(4.8, 2.2, cell * 0.14, '#fda4af', 1);
                    break;
                }
                case 'saltfieldgo': {
        // 塩田: 結晶田の畦と白い塩の結晶
        c.strokeStyle = '#94a3b8'; c.lineWidth = 1.6;
        c.strokeRect(cell * 0.4, cell * 2.6, cell * 5.2, cell * 2.8);
        seg(0.6, 3.6, 5.4, 3.6, '#94a3b8', 1.4);
        seg(3, 2.6, 3, 5.4, '#94a3b8', 1.4);
        c.fillStyle = '#fff'; c.strokeStyle = '#38bdf8'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(at(2,3).x, at(2,3).y); c.lineTo(at(2.5,3.4).x, at(2.5,3.4).y); c.lineTo(at(2,4.6).x, at(2,4.6).y); c.lineTo(at(1.5,3.4).x, at(1.5,3.4).y); c.closePath(); c.fill(); c.stroke();
        dot(4.4, 4.4, P1, P1S, R * 0.8);
        dot(4.4, 1.4, P2, P2S, R * 0.8);
                    break;
                }
                case 'saltgo': {
        tri(2.6, 2.6, cell * 0.9, '#e2e8f0', '#94a3b8', 0);
        tri(4, 3.4, cell * 0.6, '#e2e8f0', '#94a3b8', 0);
        seg(1, 4.4, 5, 4.4, '#38bdf8', 1.8);
        ring(4.6, 4.8, cell * 0.2, '#93c5fd', 1);
        ring(2, 5, cell * 0.25, '#93c5fd', 1);
        dot(2.6, 2.7, '#f8fafc', '#cbd5e1', cell * 0.3);
                    break;
                }
                case 'samsarago': {
        // 輪廻: 環状の矢
        ring(3, 3, cell * 1.05, '#a855f7', 2.2);
        tri(4.6, 2.2, cell * 0.24, '#a855f7', '#7e22ce', Math.PI * 0.35);
        tri(1.4, 3.8, cell * 0.24, '#a855f7', '#7e22ce', Math.PI * 1.35);
        dot(3, 3, P2, P2S, cell * 0.3);
                    break;
                }
                case 'sashikogo': {
        // 刺子: 1点空けの2石と破線の縫い目
        dot(1.6, 3, P1, P1S); dot(4.4, 3, P1, P1S);
        seg(2.4, 2.8, 2.8, 3.2, '#f8fafc', 1.6);
        seg(3.0, 2.8, 3.4, 3.2, '#f8fafc', 1.6);
        seg(3.6, 2.8, 4.0, 3.2, '#f8fafc', 1.6);
                    break;
                }
                case 'scalego': {
        // 音階: 五線譜と上昇する音符
        seg(1.2, 2.0, 4.8, 2.0, 'rgba(87,83,78,0.5)', 1); // 五線1
        seg(1.2, 2.7, 4.8, 2.7, 'rgba(87,83,78,0.5)', 1); // 五線2
        seg(1.2, 3.4, 4.8, 3.4, 'rgba(87,83,78,0.5)', 1); // 五線3
        dot(1.8, 4.2, '#38bdf8', '#0369a1', cell * 0.3);  // ド
        dot(2.6, 3.5, '#38bdf8', '#0369a1', cell * 0.3);  // レ
        dot(3.4, 2.8, '#38bdf8', '#0369a1', cell * 0.3);  // ミ
        dot(4.2, 2.1, '#38bdf8', '#0369a1', cell * 0.3);  // ファ
        txt('♪', 4.6, 1.4, '#f59e0b', cell * 0.6);        // 完成の音
                    break;
                }
                case 'scapegoatgo': {
        dot(2.5, 2.8, P2, P2S);
        seg(2.5, 2.0, 2.5, 3.6, "#d6d3d1", 2);
        seg(1.9, 2.4, 3.1, 2.4, "#d6d3d1", 2);
        tri(4.0, 4.1, cell * 0.4, "#a8a29e", "#78716c");
                    break;
                }
                case 'scentgo': {
        dot(3, 3.6, P1, P1S);
        seg(2.4, 2.8, 2.8, 1.8, '#d946ef', 1.4);
        seg(3, 3, 3.4, 2, '#d946ef', 1.4);
        seg(3.6, 2.8, 4, 1.8, '#d946ef', 1.4);
        seg(1.8, 3.4, 4.2, 3.4, 'rgba(217,70,239,0.4)', 1);
                    break;
                }
                case 'scissorgo': {
        // 鋏: 交差する刃 + 挟まれた敵石
        seg(1.4, 1.2, 4.4, 4.2, '#94a3b8', 3.0);
        seg(4.4, 1.2, 1.4, 4.2, '#64748b', 3.0);
        ring(1.4, 1.2, cell * 0.34, '#475569', 2.0);
        ring(4.4, 1.2, cell * 0.34, '#475569', 2.0);
        dot(2.9, 3.9, P2, P2S, cell * 0.36);
                    break;
                }
                case 'scrabblogo': {
        // 文字碁: 文字タイル3枚で単語
        [[1.4, 'ア'], [3, 'イ'], [4.6, 'ウ']].forEach(([x, ch]) => {
            const p = at(x, 3);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#78350f'; c.lineWidth = 1.4;
            c.beginPath();
            if (c.roundRect) c.roundRect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4, cell * 0.15); else c.rect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4);
            c.fill(); c.stroke();
            txt(ch, x, 3, '#78350f', cell * 0.8);
        });
        dot(1.4, 4.8, P1, P1S, cell * 0.26); dot(4.6, 4.8, P2, P2S, cell * 0.26);
    
                    break;
                }
                case 'scrapgo': {
        txt('♻', 2.7, 3, '#84cc16', cell * 2.2);
        dot(4.5, 3.2, P2, P2S, cell * 0.4);
        blk(1.4, 4.6, '#a3a3a3', '#525252');
                    break;
                }
                case 'scrollmountgo': {
        // 表具: 吊り下がる掛軸と軸先、絵の丸
        seg(2.2, 0.9, 3.8, 0.9, '#57534e', 1.6);
        blk(2.3, 1.1, '#fef3c7', '#8a5a2b');
        dot(3, 2.4, '#dc2626', '#991b1b', cell * 0.2);
        seg(2.1, 4.9, 3.9, 4.9, '#8a5a2b', 2.4);
                    break;
                }
                case 'seachartgo': {
        // 海図: 港・礁・航路
        blk(0.9, 3.0, '#0e7490', '#155e75');
        blk(5.1, 3.0, '#0e7490', '#155e75');
        seg(1.4, 3.0, 2.8, 2.0, '#0ea5e9', 2);
        seg(2.8, 2.0, 4.6, 3.0, '#0ea5e9', 2);
        tri(3.4, 4.6, cell * 0.3, '#0891b2', '#155e75', Math.PI);
                    break;
                }
                case 'sealgo': {
        dot(2.5, 3.0, P1, P1S);
        blk(2.5, 1.9, "#fef3c7", "#b45309");
        txt("封", 2.5, 1.9, "#92400e", cell * 0.65);
        ring(2.5, 3.0, cell * 0.6, "#facc15", 1.3);
                    break;
                }
                case 'seamarkgo': {
        // 灯台: 灯台の塔と光の筋
        tri(2, 3.4, cell * 0.7, '#dc2626', '#991b1b', -Math.PI / 2);
        seg(1.4, 4.6, 2.6, 4.6, '#78716c', 3);
        seg(2.6, 2.8, 5.2, 1.6, '#facc15', 2.2);
        seg(2.6, 3.2, 5.2, 3.6, '#facc15', 2.2);
        dot(2, 2.6, '#fef08a', '#eab308', cell * 0.2);
                    break;
                }
                case 'sedimentgo': {
        // 堆積: 川が海に注ぎ三角州が成長
        blk(0.8, 0.8, '#1a5d8f', '#0b3450');
        mol([[2.2, 4.9], [3, 2.8], [3.8, 4.9]], '#d9b25c', '#a16207');
        seg(2.2, 1.2, 2.6, 3.0, '#38bdf8', 1.8);
        seg(3.8, 1.2, 3.4, 3.0, '#38bdf8', 1.8);
                    break;
                }
                case 'seedgo': {
        dot(3, 3.6, P1, P1S);
        seg(3, 3.2, 3, 1.8, "#16a34a", 2);
        tri(3.5, 1.9, cell * 0.3, "#4ade80", "#15803d");
                    break;
                }
                case 'seizago': {
        dot(1.6, 1.6, '#fde047', '#a16207');
        dot(3.0, 2.4, '#fde047', '#a16207');
        dot(4.4, 2.0, '#fde047', '#a16207');
        seg(1.6, 1.6, 3.0, 2.4, '#fde047', 1.2);
        seg(3.0, 2.4, 4.4, 2.0, '#fde047', 1.2);
        seg(1.8, 4.4, 4.2, 4.4, '#64748b', 1.4);
                    break;
                }
                case 'sekkigo': {
// 四半分に色分けされた節気盤と太陽
const q = [[P1,'rgba(74,222,128,0.85)'],[P2S,'rgba(250,204,21,0.85)'],[P1S,'rgba(248,113,113,0.85)'],[P2,'rgba(96,165,250,0.85)']];
ctx.fillStyle=q[0][1]; ctx.fillRect(0,0,cell*3,cell*3);
ctx.fillStyle=q[1][1]; ctx.fillRect(cell*3,0,cell*3,cell*3);
ctx.fillStyle=q[2][1]; ctx.fillRect(0,cell*3,cell*3,cell*3);
ctx.fillStyle=q[3][1]; ctx.fillRect(cell*3,cell*3,cell*3,cell*3);
dot(3,3,'#fde68a','#b45309',cell*0.55,1);
seg(1,3,5,3,'rgba(120,60,10,0.8)',1.2);
seg(3,1,3,5,'rgba(120,60,10,0.8)',1.2);
                    break;
                }
                case 'sennichitego': {
        ring(3, 3, cell * 1.15, '#94a3b8', 1.6);
        ring(3, 3, cell * 0.65, '#94a3b8', 1.3);
        dot(3, 3, P1, P1S, cell * 0.32);
        txt('3', 4.1, 4.6, '#94a3b8', cell * 0.8);
                    break;
                }
                case 'senryugo': {
        // 川柳: 山なりの三連
        dot(1.6, 3.6, P1, P1S, cell * 0.3);
        dot(3, 2.4, P1, P1S, cell * 0.3);
        dot(4.4, 3.6, P1, P1S, cell * 0.3);
        seg(1.6, 3.6, 3, 2.4, '#4ade80', 1.6);
        seg(3, 2.4, 4.4, 3.6, '#4ade80', 1.6);
        dot(3, 4.8, P2, P2S, cell * 0.22);
                    break;
                }
                case 'sentego': {
        dot(1.8, 3.4, P1, P1S, cell * 0.45);
        seg(2.3, 3.4, 4.2, 3.4, '#fb923c', 2);
        tri(4.4, 3.4, cell * 0.5, '#fb923c', '#c2410c');
                    break;
                }
                case 'senyakugo': {
        // 煎薬: 土瓶と生薬の葉、煎じる湯気
        dot(3, 4.2, '#78350f', '#451a03', cell * 1.15); // 土瓶
        seg(2, 3.9, 1.4, 3.4, '#451a03', 1.8);          // 注ぎ口
        seg(3.6, 3.1, 3.6, 2.6, '#451a03', 1.8);        // 取っ手
        seg(4.2, 3.1, 4.2, 2.6, '#451a03', 1.8);
        seg(3.6, 2.6, 4.2, 2.6, '#451a03', 1.8);
        dot(2.4, 2.6, '#16a34a', '#14532d', cell * 0.26); // 生薬の葉1
        dot(2.9, 2.3, '#22c55e', '#15803d', cell * 0.22); // 生薬の葉2
        seg(4.7, 1.9, 4.9, 2.7, '#a8a29e', 1.4);         // 湯気
                    break;
                }
                case 'sequencego': {
        // フィボナッチ: 増えていく珠
        dot(1.2, 4, P2, P2S, cell * 0.18);
        dot(2.2, 4, P2, P2S, cell * 0.26);
        dot(3.5, 4, P2, P2S, cell * 0.36);
        ring(4.9, 4, cell * 0.5, P2S, 1.4);
        txt('1,1,2,3', 3, 1.6, '#92400e', cell * 0.62);
                    break;
                }
                case 'seriesgo': {
// 一直線の直列連
seg(0.6,3,5.4,3,'#60a5fa',1.8);
dot(1.2,3,P1,P1S,cell*0.45,1);
dot(2.4,3,P1,P1S,cell*0.45,1);
dot(3.6,3,P1,P1S,cell*0.45,1);
dot(4.8,3,P1,P1S,cell*0.45,1);
seg(1.2,1.4,4.8,1.4,'rgba(96,165,250,0.5)',1.2);
seg(1.2,4.6,4.8,4.6,'rgba(96,165,250,0.5)',1.2);
                    break;
                }
                case 'setgo': {
        ring(2.4, 3, cell * 1.05, '#60a5fa', 1.6);
        ring(3.6, 3, cell * 1.05, '#f472b6', 1.6);
        dot(2.4, 3, P1, P1S, cell * 0.3);
        dot(3.6, 3, P2, P2S, cell * 0.3);
                    break;
                }
                case 'shadowgo': {
        tri(1.1, 1.1, cell * 0.4, "#fde047", "#eab308");
        dot(2.6, 2.6, P1, P1S);
        blk(3.4, 3.4, "rgba(0,0,0,0.28)", "rgba(0,0,0,0.45)");
                    break;
                }
                case 'shatekigo': {
        // 射的: 的と弾と景品
        ring(3.9, 2.7, cell * 0.85, '#dc2626', 2.4);
        ring(3.9, 2.7, cell * 0.45, '#f8fafc', 2.0);
        dot(3.9, 2.7, '#dc2626', '#991b1b', cell * 0.16);
        seg(1.2, 4.6, 2.6, 3.6, '#94a3b8', 2.0);
        dot(1.1, 4.7, '#facc15', '#a16207', cell * 0.20);
        dot(2.0, 5.1, P1, P1S, cell * 0.24);
                    break;
                }
                case 'sheergo': {
        dot(2.2, 3, P1, P1S);
        dot(3.9, 3, P2, P2S, R, 0.35);
        ring(3.9, 3, cell * 0.55, '#94a3b8', 1.2);
        seg(1.4, 1.6, 4.6, 1.6, '#cbd5e1', 1.2);
                    break;
                }
                case 'shellgo': {
        ring(2.4, 3, cell * 0.75, "#7dd3fc", 2);
        ring(2.4, 3, cell * 1.25, "#38bdf8", 1.4);
        ring(3.8, 3, cell * 0.75, "#7dd3fc", 2);
        dot(2.4, 3, P1, P1S, R * 0.8);
        dot(3.8, 3, P2, P2S, R * 0.8);
        seg(2.9, 3, 3.3, 3, "#7dd3fc", 2);
                    break;
                }
                case 'shiborigo': {
        // 絞染: 中心の絞り目 (菱形結び目) を囲む4石
        ring(3, 3, cell * 0.4, '#ca8a04', 2);
        dot(1.4, 3, P1, P1S); dot(4.6, 3, P1, P1S);
        dot(3, 1.4, P1, P1S); dot(3, 4.6, P1, P1S);
                    break;
                }
                case 'shichiyago': {
        dot(1.8, 3.4, P1, P1S);
        ring(4.1, 2.2, cell * 0.42, '#f59e0b', 2.4);
        txt('質', 4.1, 2.25, '#f59e0b', cell * 0.85);
        seg(2.6, 3.6, 3.6, 2.6, '#a16207', 1.6);
                    break;
                }
                case 'shikigamigo': {
        blk(2.3, 2.4, "#c084fc", "#7e22ce");
        txt("式", 2.3, 2.4, "#faf5ff", cell * 0.75);
        dot(3.8, 3.8, P2, P2S, R * 0.8);
        ring(3.8, 3.8, cell * 0.55, "#c084fc", 1.2);
                    break;
                }
                case 'shimenawago': {
        // 注連: 3連の縄と白い紙垂
        dot(1.4, 2.4, P1, P1S); dot(3, 2.4, P1, P1S); dot(4.6, 2.4, P1, P1S);
        seg(1.4, 2.4, 4.6, 2.4, '#92400e', 3);
        seg(2.2, 3.0, 2.6, 3.8, '#f8fafc', 2);
        seg(2.6, 3.8, 2.2, 4.4, '#f8fafc', 2);
        seg(3.8, 3.0, 4.2, 3.8, '#f8fafc', 2);
        seg(4.2, 3.8, 3.8, 4.4, '#f8fafc', 2);
                    break;
                }
                case 'shimofurigo': {
// 凍った外周の結晶と霜
seg(0.6,0.6,5.4,0.6,'#93c5fd',2.2);
seg(0.6,5.4,5.4,5.4,'#93c5fd',2.2);
seg(0.6,0.6,0.6,5.4,'#93c5fd',2.2);
seg(5.4,0.6,5.4,5.4,'#93c5fd',2.2);
dot(1,1,'#e0f2fe','#38bdf8',cell*0.5,1);
dot(4.5,1,'#e0f2fe','#38bdf8',cell*0.4,1);
dot(1,4.5,'#e0f2fe','#38bdf8',cell*0.4,1);
seg(3,2,3,4,'#bae6fd',1.4);
seg(2,3,4,3,'#bae6fd',1.4);
seg(2.3,2.3,3.7,3.7,'#bae6fd',1.2);
seg(3.7,2.3,2.3,3.7,'#bae6fd',1.2);
                    break;
                }
                case 'shinkirogo': {
        ring(3, 2.6, R * 1.6, '#67e8f9', 1.4);
        dot(3, 2.6, '#67e8f9', '#0891b2', R * 0.7, 0.45);
        dot(3.8, 3.8, P1, P1S, R * 0.55);
        seg(1.4, 4.4, 4.6, 4.4, 'rgba(103,232,249,0.5)', 1.2);
                    break;
                }
                case 'shinogigo': {
        ring(3, 3, cell * 1.35, '#2dd4bf', 1.6);
        dot(3, 3, P1, P1S, cell * 0.5);
        dot(1.4, 1.4, P2, P2S, cell * 0.3);
        dot(4.6, 1.4, P2, P2S, cell * 0.3);
        dot(4.6, 4.6, P2, P2S, cell * 0.3);
                    break;
                }
                case 'shintogo': {
        ring(3, 3, cell * 1.35, "#f87171", 3);
        seg(2, 4.9, 2.6, 4.4, "#f8fafc", 2); seg(3.2, 5.1, 3.8, 4.6, "#f8fafc", 2);
        dot(3, 3, P1, P1S, cell * 0.3);
                    break;
                }
                case 'shiohigo': {
        // 潮干狩り: 干潟の貝と潮の引き線
        seg(0.8, 1.8, 5.2, 1.8, '#7dd3fc', 1.6);
        seg(1.2, 2.6, 4.8, 2.6, '#bae6fd', 1.2);
        mol([[2, 3.4], [2.8, 3], [3, 3.8]], 'rgba(253,230,138,0.8)', '#d97706');
        mol([[4, 4], [4.6, 3.6], [4.8, 4.4]], 'rgba(253,230,138,0.6)', '#d97706');
        dot(2, 5, P2, P2S, cell * 0.22);
                    break;
                }
                case 'shiomachigo': {
        // 潮待: 満ち引きの波2段と月
        seg(0.8, 2.4, 1.8, 2.2, '#0284c7', 2);
        seg(1.8, 2.2, 2.8, 2.4, '#0284c7', 2);
        seg(3.2, 2.4, 4.2, 2.2, '#0284c7', 2);
        seg(4.2, 2.2, 5.2, 2.4, '#0284c7', 2);
        seg(0.8, 4.4, 2.0, 4.2, '#67e8f9', 2);
        seg(3.4, 4.4, 5.0, 4.2, '#67e8f9', 2);
        dot(4.6, 1.2, '#fde68a', '#d97706', cell * 0.24);
                    break;
                }
                case 'shippogo': {
        // 七宝: 銀線の枠に流し込まれた色釉の玉
        ring(2.2, 2.4, cell * 0.62, '#94a3b8', 1.8);
        ring(4.0, 2.4, cell * 0.62, '#94a3b8', 1.8);
        ring(3.1, 4.0, cell * 0.62, '#94a3b8', 1.8);
        dot(2.2, 2.4, '#34d399', '#065f46', cell * 0.42);
        dot(4.0, 2.4, '#38bdf8', '#075985', cell * 0.42);
        dot(3.1, 4.0, '#f472b6', '#be185d', cell * 0.42);
                    break;
                }
                case 'shojigo': {
        // 建具: 木枠の障子 (格子窓) と桟
        blk(1.6, 1.2, '#fef3c7', '#8a5a2b');
        seg(3, 1.3, 3, 4.7, '#8a5a2b', 1.8);
        seg(1.7, 2.5, 4.3, 2.5, '#8a5a2b', 1.6);
        seg(1.7, 3.6, 4.3, 3.6, '#8a5a2b', 1.6);
        dot(4.6, 4.7, '#f59e0b', '#b45309', cell * 0.12);
                    break;
                }
                case 'shoyugo': {
        // 醤油蔵: 杉玉の木桶と熟成の垂れ
        ring(3, 3, cell * 1.6, '#92400e', 2.4);
        ring(3, 3, cell * 1.0, '#b45309', 1.4);
        dot(3, 3, '#451a03', '#78350f', cell * 0.7);
        seg(3, 4.8, 3, 5.6, '#451a03', 2);
        dot(2.2, 1.6, P2, P2S, cell * 0.22);
                    break;
                }
                case 'shrinkgo': {
        ring(3, 3, 2.6, "#78716c", 2);
        dot(3, 3, P1, P1S);
        tri(5.4, 3, cell * 0.3, "#ef4444", "#991b1b", Math.PI);
        tri(0.6, 3, cell * 0.3, "#ef4444", "#991b1b", 0);
                    break;
                }
                case 'shugendo': {
        // 修験: 険しい行場の山と行者の杖・法螺貝
        tri(2.4, 3.4, cell * 1.5, '#475569', '#1e293b', -Math.PI / 2); // 山
        tri(2.4, 2.2, cell * 0.45, '#f8fafc', '#cbd5e1', -Math.PI / 2); // 雪
        tri(4.4, 4.0, cell * 0.9, '#64748b', '#334155', -Math.PI / 2); // 小さな山
        seg(4.6, 5.0, 4.6, 2.2, '#78350f', cell * 0.14); // 錫杖
        ring(4.6, 2.0, cell * 0.28, '#b45309', 1.4);
        dot(1.4, 4.7, '#fbbf24', '#b45309', R * 0.5); // 法螺貝
                    break;
                }
                case 'siegego': {
        blk(1, 3.4, "#78716c", "#44403c"); blk(2, 3.4, "#78716c", "#44403c");
        blk(4, 3.4, "#78716c", "#44403c"); blk(5, 3.4, "#78716c", "#44403c");
        tri(3, 1.8, cell * 0.8, "#dc2626", "#7f1d1d");
                    break;
                }
                case 'sigilgo': {
                    // 3x3の印章と朱枠
                    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) dot(1.6 + x, 1.6 + y, P1, P1S, cell * 0.36);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2;
                    c.strokeRect(at(0.95, 0.95).x, at(0.95, 0.95).y, cell * 4.1, cell * 4.1);
                    txt('印', 4.7, 4.9, '#dc2626', cell * 1.1);
                    break;
                }
                case 'silkwormgo': {
        // 養蚕: 桑の葉と白い繭
        c.fillStyle = '#4ade80'; c.strokeStyle = '#166534'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(at(1.8,1.6).x, at(1.8,1.6).y, cell * 1, cell * 0.6, -0.6, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = '#fef3c7'; c.strokeStyle = '#b45309';
        c.beginPath(); c.ellipse(at(3.4,3.4).x, at(3.4,3.4).y, cell * 0.55, cell * 0.4, 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(at(4.6,4.4).x, at(4.6,4.4).y, cell * 0.55, cell * 0.4, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
        dot(2.2, 4.6, P1, P1S, R * 0.7);
                    break;
                }
                case 'simulgo': {
        dot(2, 3, P1, P1S);
        dot(4, 3, P2, P2S);
        seg(3, 1, 3, 5, '#60a5fa', 1.2);
        seg(2, 2, 4, 2, '#93c5fd', 1.2);
        seg(2, 4, 4, 4, '#93c5fd', 1.2);
                    break;
                }
                case 'sinkinggo': {
        tri(2.4, 2.6, cell * 0.9, '#b45309', '#78350f', 0);
        blk(2, 3, '#a16207', '#713f12');
        seg(1, 3.8, 5, 3.8, '#38bdf8', 2.2);
        seg(1.4, 4.6, 4.6, 4.6, '#60a5fa', 1.8);
        ring(3.6, 3, cell * 0.25, '#93c5fd', 1);
        ring(4.4, 4.4, cell * 0.2, '#93c5fd', 1);
                    break;
                }
                case 'skeletongo': {
        bond(2, 2.4, 3.4, 2.4, 5);
        dot(2, 2.4, P2, P2S, R * 0.9);
        dot(3.4, 2.4, P2, P2S, R * 0.9);
        bond(3.4, 2.4, 3.4, 3.8, 5);
        dot(3.4, 3.8, P2, P2S, R * 0.9);
        dot(1.5, 4.3, P1, P1S, R * 0.7);
        bond(1.5, 4.3, 2.6, 4.7, 4);
        dot(2.6, 4.7, P1, P1S, R * 0.7);
                    break;
                }
                case 'skimminggo': {
        // 水切: 水面を跳ねる石 + 波紋
        dot(1.6, 1.8, P1, P1S, cell * 0.44);
        ring(2.6, 3.2, cell * 0.5, '#38bdf8', 1.5);
        ring(3.8, 3.6, cell * 0.7, '#38bdf8', 1.5);
        ring(4.9, 4.0, cell * 0.9, '#38bdf8', 1.5);
        seg(0.8, 2.4, 2.2, 2.0, '#94a3b8', 1.4);
                    break;
                }
                case 'sledgo': {
        // 橇: 雪原を滑る橇と雪片
        seg(1.6, 4.2, 4.4, 4.2, '#57534e', 2.4);          // 橇の底
        seg(4.4, 4.2, 4.8, 3.7, '#57534e', 2.2);          // 橇の反り
        seg(1.6, 4.2, 1.2, 3.7, '#57534e', 2.2);          // 橇の後部
        blk(2.2, 3.0, '#a16207', '#713f12');             // 橇の座席左
        blk(3.0, 3.0, '#a16207', '#713f12');             // 橇の座席右
        seg(2.4, 3.0, 2.0, 2.2, '#78350f', 1.8);          // 曳き綱
        dot(1.9, 2.1, '#57534e', '#292524', cell * 0.3);  // 橇を引く手
        dot(1.4, 4.9, '#f0f9ff', '#bae6fd', cell * 0.14); // 雪片1
        dot(3.0, 5.0, '#f0f9ff', '#bae6fd', cell * 0.12); // 雪片2
        dot(4.6, 4.9, '#f0f9ff', '#bae6fd', cell * 0.15); // 雪片3
                    break;
                }
                case 'slimego': {
        dot(3, 2.2, P1, P1S);
        dot(2.2, 4.2, "#22c55e", "#15803d", cell * 0.42);
        dot(3.8, 4.4, "#22c55e", "#15803d", cell * 0.5);
                    break;
                }
                case 'sluicego': {
        // 水門: 水路の中の開閉ゲートと流れる石
        seg(0.6, 2, 5.4, 2, '#38bdf8', 2.4);
        seg(0.6, 4, 5.4, 4, '#38bdf8', 2.4);
        blk(3, 3, '#78716c', '#44403c');
        tri(1.6, 3, cell * 0.34, '#7dd3fc', '#0284c7', 0);
        tri(4.6, 3, cell * 0.34, '#7dd3fc', '#0284c7', 0);
        dot(2.2, 3, P1, P1S, R * 0.8);
                    break;
                }
                case 'snipego': {
        dot(3.4, 3.2, P2, P2S);
        ring(3.4, 3.2, cell * 0.62, '#ef4444', 1.6);
        seg(3.4, 1.9, 3.4, 2.5, '#ef4444', 1.6);
        seg(3.4, 3.9, 3.4, 4.5, '#ef4444', 1.6);
        seg(2.1, 3.2, 2.7, 3.2, '#ef4444', 1.6);
        seg(4.1, 3.2, 4.7, 3.2, '#ef4444', 1.6);
                    break;
                }
                case 'snowgo': {
        dot(2, 3, P1, P1S);
        dot(4, 3.4, P2, P2S);
        seg(0.8, 1.6, 5.2, 1.6, '#e0f2fe', 5);
        seg(1.2, 1.2, 4.8, 1.2, 'rgba(186,230,253,0.8)', 3);
        dot(1.6, 3.9, '#ffffff', '#bae6fd', cell * 0.16);
        dot(4.4, 4.3, '#ffffff', '#bae6fd', cell * 0.14);
                    break;
                }
                case 'snowpilego': {
        dot(3, 3.6, P1, P1S, R * 0.7);
        ring(3, 3.4, cell * 0.8, '#e0f2fe', 3.5);
        dot(2, 1.8, '#f0f9ff', '#bae6fd', R * 0.35);
        dot(4, 1.6, '#f0f9ff', '#bae6fd', R * 0.35);
        dot(3, 2.2, '#f0f9ff', '#bae6fd', R * 0.35);
                    break;
                }
                case 'sojutsugo': {
        // 槍術: 間合いを制する穂先
        dot(1.6, 3.6, P1, P1S, R * 0.8);
        dot(2.6, 3.0, P1, P1S, R * 0.8);
        seg(1.6, 3.6, 4.4, 1.8, '#a16207', 2.4);
        tri(4.7, 1.5, cell * 0.4, '#dc2626', '#991b1b', 0.4);
        seg(3.4, 4.4, 3.8, 4.8, '#ef4444', 1.4);
                    break;
                }
                case 'sokuryogo': {
        // 測量: 縄と杭
        seg(1.0, 5.0, 5.0, 1.0, '#0ea5e9', 2);
        dot(1.0, 5.0, P1, P1S, cell * 0.3);
        dot(5.0, 1.0, P2, P2S, cell * 0.3);
        seg(3.0, 3.0, 3.0, 5.4, '#57534e', 3);
        dot(3.0, 3.0, '#dc2626', '#991b1b', cell * 0.2);
                    break;
                }
                case 'sometsukego': {
        // 青花: 白地の器と呉須の花菱文様
        dot(3, 3, P2, P2S, cell * 0.9);
        seg(3, 2.1, 3.9, 3, '#1d4ed8', 1.8);
        seg(3.9, 3, 3, 3.9, '#1d4ed8', 1.8);
        seg(3, 3.9, 2.1, 3, '#1d4ed8', 1.8);
        seg(2.1, 3, 3, 2.1, '#1d4ed8', 1.8);
        dot(3, 3, '#1d4ed8', '#1e3a8a', cell * 0.16);
                    break;
                }
                case 'sonatago': {
        // 楽章: 三つの楽章記号 (呈示・展開・再現)
        dot(1.6, 3.6, '#7dd3fc', '#0369a1', cell * 0.4);  // 呈示 (単音)
        blk(2.8, 3.4, '#38bdf8', '#0369a1');             // 展開 (連1)
        blk(3.4, 3.4, '#38bdf8', '#0369a1');             // 展開 (連2)
        dot(4.6, 3.6, '#facc15', '#a16207', cell * 0.4);  // 再現 (完結)
        seg(1.6, 2.4, 4.6, 2.4, 'rgba(87,83,78,0.45)', 1.2); // 小節線上
        seg(1.6, 4.8, 4.6, 4.8, 'rgba(87,83,78,0.45)', 1.2); // 小節線下
        seg(2.3, 2.4, 2.3, 4.8, 'rgba(87,83,78,0.35)', 1);  // 区切り1
        seg(3.8, 2.4, 3.8, 4.8, 'rgba(87,83,78,0.35)', 1);  // 区切り2
        txt('∴', 4.6, 2.2, '#a16207', cell * 0.5);        // 反復記号
                    break;
                }
                case 'songbirdgo': {
        // 鳴禽: 小鳥と囀りの音符
        dot(2.4, 3.4, '#f59e0b', '#b45309', cell * 0.75); // 鳥の体
        dot(2.7, 3.2, '#292524', '#000', cell * 0.12);    // 目
        tri(1.7, 3.5, cell * 0.35, '#fbbf24', '#b45309'); // 尾
        seg(3.0, 3.2, 3.5, 3.0, '#fbbf24', 2);            // 嘴
        txt('♪', 4.4, 2.2, '#38bdf8', cell * 0.7);        // 囀り
        ring(4.0, 3.4, cell * 0.5, 'rgba(56,189,248,0.5)', 1.2); // 縄張りの輪
                    break;
                }
                case 'sorobango': {
        // 算盤: 梁と桁の珠、繰上りの列
        seg(0.9, 3.0, 5.1, 3.0, '#78350f', cell * 0.22); // 梁
        [[1.4],[2.6],[3.8],[5.0]].forEach(([x]) => seg(x, 1.0, x, 5.2, '#78350f', 1.4)); // 桁
        dot(1.4, 2.2, P1, P1S, R * 0.7); // 上珠
        [3.9, 4.5].forEach(y => dot(1.4, y, P1, P1S, R * 0.55)); // 下珠
        [1.8, 2.4].forEach(y => dot(2.6, y, P2, P2S, R * 0.55));
        [3.7, 4.3, 4.9].forEach(y => dot(3.8, y, P1, P1S, R * 0.55));
        dot(5.0, 1.6, P2, P2S, R * 0.7);
        txt('5', 5.0, 4.6, '#b45309', cell * 0.7); // 繰上り
                    break;
                }
                case 'sotchigo': {
        // 綴じ目: 環とそれを囲む石
        ring(3.0, 3.0, cell * 0.3, '#78716c', 2);
        dot(3.0, 1.4, P1, P1S);
        dot(3.0, 4.6, P1, P1S);
        dot(1.4, 3.0, P1, P1S);
        dot(4.6, 3.0, P1, P1S);
        bond(1.4, 3.0, 4.6, 3.0, 2);
                    break;
                }
                case 'sparrgo': {
                    // ぶつかり合う二石と火花
                    dot(2.2, 3, P1, P1S); dot(3.8, 3, P2, P2S);
                    c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.lineCap = 'round';
                    [[-0.5, -0.9], [0, -1.1], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]].forEach(([dx, dy]) => {
                        c.beginPath();
                        c.moveTo(at(3 + dx * 0.6, 3 + dy * 0.6).x, at(3 + dx * 0.6, 3 + dy * 0.6).y);
                        c.lineTo(at(3 + dx * 1.4, 3 + dy * 1.4).x, at(3 + dx * 1.4, 3 + dy * 1.4).y);
                        c.stroke();
                    });
                    break;
                }
                case 'spearheadgo': {
        // 矛先: 3連の石と突き出た矛
        dot(1.4, 3.6, P1, P1S); dot(2.6, 3.6, P1, P1S); dot(3.8, 3.6, P1, P1S);
        seg(4.3, 3.6, 5.4, 3.6, '#92400e', cell * 0.16);
        tri(5.5, 3.6, cell * 0.42, '#d1d5db', '#4b5563', Math.PI / 2);
        dot(5.4, 1.4, P2, P2S, cell * 0.28); dot(2, 1.2, P2, P2S, cell * 0.28);
    
                    break;
                }
                case 'spellcirclego': {
        ring(3, 3, cell * 0.75, '#a78bfa', 2);
        ring(3, 3, cell * 0.42, '#c4b5fd', 1.4);
        seg(3, 1.4, 4.4, 3.9, '#a78bfa', 1.4);
        seg(4.4, 3.9, 1.6, 3.9, '#a78bfa', 1.4);
        seg(1.6, 3.9, 3, 1.4, '#a78bfa', 1.4);
        dot(3, 3, '#ede9fe', '#7c3aed');
                    break;
                }
                case 'spirego': {
        // 塔頂: 上に窄まる塔の断面
        seg(1.2, 5, 2.4, 1.2, '#78716c', 3);
        seg(4.8, 5, 3.6, 1.2, '#78716c', 3);
        seg(1.2, 5, 4.8, 5, '#78716c', 3);
        dot(3, 1.4, P1, P1S, R * 0.7);
        dot(2.4, 3.4, P2, P2S, R * 0.8);
        dot(3.6, 3.4, P1, P1S, R * 0.8);
        dot(2, 4.8, P1, P1S, R * 0.8);
        dot(4, 4.8, P2, P2S, R * 0.8);
                    break;
                }
                case 'spitgo': {
        // 砂州: 上下の海を分断する砂の連結部
        blk(0.8, 0.8, '#1a5d8f', '#0b3450');
        blk(0.8, 4.4, '#1a5d8f', '#0b3450');
        seg(3, 1.4, 3, 4.4, '#d9b25c', 3.2);
        dot(3, 2.9, P1, P1S);
                    break;
                }
                case 'splitturngo': {
        dot(1.8, 2.8, P1, P1S);
        dot(4.2, 2.8, P2, P2S);
        seg(3.6, 2.2, 4.8, 3.4, '#ef4444', 2.4);
        seg(4.8, 2.2, 3.6, 3.4, '#ef4444', 2.4);
        seg(3, 1.2, 3, 4.6, 'rgba(120,113,108,0.7)', 1.6);
                    break;
                }
                case 'spokego': {
        seg(3, 3, 5.4, 3, "#57534e", 1.6);
        seg(3, 3, 3, 0.6, "#57534e", 1.6);
        seg(3, 3, 1.4, 1.4, "#57534e", 1.6);
        dot(3, 3, "#f59e0b", "#b45309", cell * 0.5);
                    break;
                }
                case 'spotgo': {
        txt('★', 3, 3, '#fbbf24', cell * 1.7);
        dot(4.5, 4.5, P1, P1S, cell * 0.38);
        dot(1.5, 1.5, P2, P2S, cell * 0.3, 0.8);
                    break;
                }
                case 'springboardgo': {
                    // トランポリンと跳ねる石
                    c.strokeStyle = '#059669'; c.lineWidth = 1.6;
                    for (let k = 0; k < 3; k++) {
                        c.beginPath();
                        c.arc(at(3, 4.6).x, at(3, 4.6).y - k * cell * 0.28, cell * 1.3 - k * cell * 0.28, Math.PI * 0.15, Math.PI * 0.85);
                        c.stroke();
                    }
                    dot(3, 1.6, P1, P1S);
                    c.strokeStyle = '#6ee7b7'; c.lineWidth = 1.3; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(3, 4.4).x, at(3, 4.4).y); c.quadraticCurveTo(at(4.6, 3.4).x, at(4.6, 3.4).y, at(4.2, 2).x, at(4.2, 2).y); c.stroke();
                    c.setLineDash([]);
                    break;
                }
                case 'springgo': {
        dot(2.6, 2.6, P1, P1S);
        dot(3.4, 3.4, P1, P1S, cell * 0.28);
        dot(3.6, 1.8, P1, P1S, cell * 0.2);
        ring(1.2, 1.2, cell * 0.34, '#4ade80', 2);
        ring(4.8, 1.2, cell * 0.34, '#fb923c', 2);
        ring(1.2, 4.8, cell * 0.34, '#d97706', 2);
        ring(4.8, 4.8, cell * 0.34, '#93c5fd', 2);
                    break;
                }
                case 'stairsgo': {
        blk(1, 5, '#8d7a5f', '#3f332a');
        blk(2, 4, '#8d7a5f', '#3f332a');
        blk(3, 3, '#8d7a5f', '#3f332a');
        blk(4, 2, '#8d7a5f', '#3f332a');
        seg(4.6, 4.6, 3.4, 2.6, '#ef4444', 2);
        dot(4.8, 4.9, P1, P1S, cell * 0.42);
                    break;
                }
                case 'stallgo': {
        seg(1.4, 1.0, 4.6, 1.0, '#b91c1c', 2.4);
        blk(1.7, 1.5, '#ef4444', '#7f1d1d');
        blk(3.0, 1.5, '#fbbf24', '#92400e');
        blk(4.0, 1.6, '#ef4444', '#7f1d1d');
        dot(2.6, 4.0, P1, P1S);
        dot(3.8, 4.2, P2, P2S);
                    break;
                }
                case 'stampgo': {
        seg(2.5, 1.0, 2.5, 2.0, "#78350f", 2.6);
        blk(2.5, 3.1, "#dc2626", "#991b1b");
        txt("印", 2.5, 3.1, "#fef2f2", cell * 0.75);
        blk(3.9, 4.2, "#f87171", "#b91c1c");
                    break;
                }
                case 'stancego': {
        tri(2.4, 2.2, R * 0.9, '#f43f5e', '#be123c', -Math.PI / 2);
        tri(3.6, 3.8, R * 0.9, '#14b8a6', '#0f766e', Math.PI / 2);
        dot(2.4, 4, P1, P1S, R * 0.7);
        dot(3.6, 2, P2, P2S, R * 0.7);
                    break;
                }
                case 'starcyclego': {
        ring(3, 3, R * 2.1, '#fbbf24', 1.4);
        txt('✦', 3, 3, '#f59e0b', cell * 0.8);
        dot(3, 1.4, P2, P2S, R * 0.55);
        dot(4.8, 3.9, P1, P1S, R * 0.55);
                    break;
                }
                case 'stickygo': {
        dot(1.9, 3, P1, P1S);
        dot(4.1, 3, P2, P2S);
        dot(3, 3, "#fbbf24", "#b45309", cell * 0.4);
                    break;
                }
                case 'stiltgo': {
        // 竹馬: 高い石 + 二本の竹馬脚
        dot(3, 1.4, P1, P1S, cell * 0.5);
        seg(2.2, 2.0, 1.7, 5.0, '#b45309', 3.0);
        seg(3.8, 2.0, 4.3, 5.0, '#b45309', 3.0);
        seg(1.9, 3.0, 4.1, 3.0, '#92400e', 2.4);
                    break;
                }
                case 'stonekickgo': {
        // 石蹴: 蹴った石が端へ転がる
        dot(1.4, 3.8, P1, P1S, cell * 0.42);
        seg(2.2, 3.4, 4.6, 2.4, '#f59e0b', 2.2);
        tri(4.8, 2.3, cell * 0.3, '#f59e0b', '#b45309', Math.PI / 3);
        seg(1.0, 4.6, 5.2, 4.6, '#94a3b8', 1.4);
        dot(4.8, 4.2, P2, P2S, cell * 0.3);
                    break;
                }
                case 'stormgo': {
        blk(1.6, 2.6, '#64748b', '#334155');
        blk(2.6, 2.6, '#64748b', '#334155');
        tri(4, 1.4, cell * 0.55, '#facc15', '#ca8a04', Math.PI * 0.25);
        seg(4, 1.8, 4, 3.6, '#facc15', 2.6);
        dot(1.6, 4.2, P2, P2S, cell * 0.3);
                    break;
                }
                case 'stowagego': {
        // 積荷: コンテナ積み+喫水線
        blk(1.6, 3.2, '#38bdf8', '#0369a1');
        blk(2.6, 3.2, '#f97316', '#c2410c');
        blk(2.1, 2.4, '#22c55e', '#15803d');
        blk(4.0, 3.2, '#a855f7', '#7e22ce');
        seg(0.6, 4.3, 5.4, 4.3, '#0ea5e9', 2.2);
                    break;
                }
                case 'strathgo': {
        // 河岸段丘: 3段の段丘面と崖線、最上段に石
        blk(0.8, 4.4, '#a16207', '#713f12');
        blk(0.8, 3.1, '#ca8a04', '#854d0e');
        blk(0.8, 1.8, '#eab308', '#a16207');
        seg(0.8, 4.35, 5.2, 4.35, '#713f12', 1.4);
        dot(4.4, 1.7, P1, P1S);
                    break;
                }
                case 'stratigraphygo': {
        seg(0.5, 1.4, 4.6, 1.4, "#a16207", 1.5);
        seg(0.5, 2.5, 4.6, 2.5, "#854d0e", 1.5);
        seg(0.5, 3.6, 4.6, 3.6, "#713f12", 1.5);
        dot(2.6, 3.0, P1, P1S);
        ring(2.6, 3.0, cell * 0.55, "#facc15", 1.3);
                    break;
                }
                case 'stringfieldgo': {
        // 絃楽: 張られた弦と振動、琴柱
        seg(1.2, 3.0, 4.8, 3.0, '#f0abfc', 1.8);          // 弦1
        seg(1.2, 3.6, 4.8, 3.6, '#f0abfc', 1.8);          // 弦2
        seg(1.2, 4.2, 4.8, 4.2, '#f0abfc', 1.8);          // 弦3
        tri(2.2, 3.6, cell * 0.45, '#a16207', '#713f12'); // 琴柱1
        tri(3.8, 3.6, cell * 0.45, '#a16207', '#713f12'); // 琴柱2
        seg(1.6, 2.2, 2.2, 1.6, 'rgba(240,171,252,0.6)', 1.4); // 振動1
        seg(3.4, 2.0, 4.0, 1.5, 'rgba(240,171,252,0.6)', 1.4); // 振動2
        dot(5.0, 3.0, '#e879f9', '#a21caf', cell * 0.15); // 弾かれる音
                    break;
                }
                case 'stripgo': {
        blk(0.5, 2, "#44403c", "#292524");
        blk(0.5, 3.2, "#44403c", "#292524");
        tri(5.2, 2.6, cell * 0.4, "#38bdf8", "#0369a1", Math.PI / 2);
                    break;
                }
                case 'subsidencego': {
        // 沈む外周
        blk(1, 1, '#0ea5e9', '#075985');
        blk(5, 1, '#0ea5e9', '#075985');
        blk(1, 5, '#0ea5e9', '#075985');
        blk(5, 5, '#0ea5e9', '#075985');
        dot(3, 3, P1, P1S, cell * 0.38);
        seg(1.8, 1.8, 2.6, 2.6, '#0284c7', 1.6);
                    break;
                }
                case 'subzerogo': {
        seg(3, 1.2, 3, 4.8, '#7dd3fc', 1.6);
        seg(1.5, 2.1, 4.5, 3.9, '#7dd3fc', 1.6);
        seg(1.5, 3.9, 4.5, 2.1, '#7dd3fc', 1.6);
        dot(3, 3, '#e0f2fe', '#38bdf8', R * 0.7);
                    break;
                }
                case 'suggestiongo': {
        ring(3, 3, R * 0.7, '#c084fc', 1.6);
        ring(3.4, 3.4, R * 1.3, 'rgba(168,85,247,0.7)', 1.2);
        dot(3, 3, P2, P2S, R * 0.5);
        dot(2, 1.6, P1, P1S, R * 0.5);
                    break;
                }
                case 'sukigo': {
        // 数寄屋: 茶室の庭と孤石・竹
        mol([[1.4, 1.4], [4.6, 1.4], [4.6, 4.6], [1.4, 4.6]], 'rgba(167,243,208,0.2)', '#059669');
        dot(3, 3, P2, P2S, cell * 0.4);
        seg(4.8, 1.4, 4.8, 4.8, '#10b981', 1.8);
        seg(4.4, 2.2, 5, 1.8, '#10b981', 1.2);
        seg(4.4, 3.4, 5, 3, '#10b981', 1.2);
                    break;
                }
                case 'sumigo': {
        // 墨摺: 硯の水盤と摺る墨棒、滲み
        ring(3, 3.6, cell * 1.4, '#292524', 3.0);
        dot(3, 3.6, '#0c0a09', '#1c1917', cell * 0.7);
        blk(3.7, 1.4, '#1c1917', '#44403c');
        seg(4.0, 3.2, 4.3, 1.9, '#0c0a09', 2.4);
                    break;
                }
                case 'summitflaggo': {
        // 登頂: 山+頂上の旗
        tri(2.6, 3.6, cell * 1.15, '#78716c', '#57534e');
        seg(3.4, 1.8, 3.4, 2.6, '#44403c', 1.8);
        seg(3.4, 1.8, 4.2, 2.1, '#dc2626', 2.2);
        seg(4.2, 2.1, 3.4, 2.4, '#dc2626', 2.2);
                    break;
                }
                case 'summongo': {
        dot(3, 3.3, '#7c3aed', '#4c1d95');
        tri(2.0, 2.0, cell * 0.42, '#a78bfa', '#4c1d95');
        tri(4.0, 2.0, cell * 0.42, '#a78bfa', '#4c1d95');
        dot(2.5, 3.1, '#fbbf24', '#92400e');
        dot(3.5, 3.1, '#fbbf24', '#92400e');
                    break;
                }
                case 'sunflowergo': {
        // 向日葵: 太陽を向く大輪
        dot(4.6, 1.4, '#fde047', '#eab308', R * 0.7);
        seg(4.6, 0.6, 4.6, 0.2, '#fde047', 1.4);
        dot(2.8, 3.2, '#854d0e', '#713f12', R * 0.85);
        ring(2.8, 3.2, cell * 0.62, '#facc15', 2.4);
        ring(2.8, 3.2, cell * 0.82, '#fbbf24', 1.4);
        seg(2.8, 4.0, 2.8, 4.9, '#16a34a', 2);
                    break;
                }
                case 'sunpillargo': {
// 縦に立つ光柱と石
ctx.fillStyle='rgba(253,224,71,0.45)';
ctx.fillRect(cell*2.2,0,cell*1.6,cell*6);
ctx.strokeStyle='rgba(251,191,36,0.9)'; ctx.lineWidth=1.4;
ctx.strokeRect(cell*2.2,0,cell*1.6,cell*6);
dot(3,1.2,P1,P1S,cell*0.42,1);
dot(3,2.8,P1,P1S,cell*0.42,1);
dot(3,4.4,P1,P1S,cell*0.42,1);
dot(0.8,3.2,P2,P2S,cell*0.4,1);
dot(5.2,3.0,P2,P2S,cell*0.4,1);
                    break;
                }
                case 'supplylinego': {
        // 兵糧: 米俵と兵站線
        dot(2.4, 3.6, '#d6a85c', '#a16207', cell * 0.75); // 米俵
        seg(2.4, 2.9, 2.4, 4.3, '#a16207', 1.6);          // 俵の縄1
        seg(1.9, 3.6, 2.9, 3.6, '#a16207', 1.6);          // 俵の縄2
        seg(1.2, 4.8, 3.0, 4.4, '#f59e0b', 1.8);          // 兵站線1
        seg(3.0, 4.4, 4.8, 4.0, '#f59e0b', 1.8);          // 兵站線2
        dot(4.6, 2.4, '#57534e', '#292524', cell * 0.4);  // 前線の旗
        tri(4.6, 2.0, cell * 0.3, '#ef4444', '#991b1b');  // 旗
                    break;
                }
                case 'sutegomago': {
        dot(3, 3, P1, P1S, cell * 0.55);
        seg(2.6, 2.6, 3.4, 3.4, '#f87171', 2);
        seg(3.4, 2.6, 2.6, 3.4, '#f87171', 2);
                    break;
                }
                case 'suzurigo': {
        // 硯(石盤)・墨条・墨溜まり
        blk(2.2, 4.2, '#475569', '#1e293b');
        blk(4.4, 4.2, '#475569', '#1e293b');
        dot(3.3, 4.2, '#0f172a', '#000000', cell * 0.5);
        seg(3.0, 1.0, 3.8, 3.1, '#78350f', 5);
        dot(1.4, 5.4, '#111827', '#000000', cell * 0.2);
                    break;
                }
                case 'swapstonego': {
        dot(2.2, 2.5, P1, P1S);
        dot(3.8, 2.5, P2, P2S);
        seg(2.6, 1.2, 3.4, 1.2, '#f0abfc', 2.4);
        tri(3.4, 1.2, cell * 0.22, '#f0abfc', '#d946ef', 0);
        seg(3.4, 3.8, 2.6, 3.8, '#f0abfc', 2.4);
        tri(2.6, 3.8, cell * 0.22, '#f0abfc', '#d946ef', Math.PI);
                    break;
                }
                case 'symbiosisgo': {
        dot(1.8, 2.6, P1, P1S);
        dot(3.4, 2.6, P2, P2S);
        seg(1.8, 2.6, 3.4, 2.6, "#34d399", 2);
        ring(2.6, 2.6, cell * 0.26, "#34d399", 1.5);
        dot(1.8, 4.2, P2, P2S, R * 0.6);
                    break;
                }
                case 'symmetrygo': {
        // 対称軸を挟んで同じ形
        seg(3, 0.4, 3, 5.6, '#a78bfa', 1.6);
        dot(1.6, 2, P1, P1S, cell * 0.34);
        dot(4.4, 2, P1, P1S, cell * 0.34);
        dot(1.6, 4.2, P2, P2S, cell * 0.34);
        dot(4.4, 4.2, P2, P2S, cell * 0.34);
                    break;
                }
                case 'syzygygo': {
        // 交食: 太陽と月の重なり
        dot(2.2, 2.6, '#f59e0b', '#b45309', cell * 0.75);
        dot(3.4, 3.0, '#1e293b', '#0f172a', cell * 0.7);
        dot(1.4, 4.8, P1, P1S, cell * 0.3);
        dot(5.0, 5.0, P2, P2S, cell * 0.3);
                    break;
                }
                case 'taggo': {
        dot(2.3, 3, P1, P1S);
        dot(3.8, 3, P2, P2S);
        seg(2.7, 3, 3.4, 3, '#06b6d4', 2.6);
        seg(3, 1.3, 3, 4.7, '#78350f', 1.2);
                    break;
                }
                case 'taketombogo': {
        // 竹蜻: 回転する羽根と軸、飛行の弧
        seg(3, 1.2, 3, 4.6, '#a16207', 2.0);
        seg(1.6, 1.6, 4.4, 1.6, '#4d7c0f', 2.6);
        seg(1.9, 1.2, 4.1, 2.0, '#65a30d', 1.8);
        seg(4.4, 2.8, 4.9, 4.2, '#38bdf8', 1.6);
                    break;
                }
                case 'takeyabugo': {
        // 竹藪: 節のある竹と地下茎
        seg(2.4, 4.6, 2.4, 1.8, '#16a34a', 3.6);
        seg(2.0, 3.6, 2.8, 3.6, '#14532d', 1.4);
        seg(2.0, 2.7, 2.8, 2.7, '#14532d', 1.4);
        seg(4.0, 4.8, 4.0, 2.6, '#22c55e', 3);
        seg(3.7, 4.0, 4.3, 4.0, '#14532d', 1.2);
        seg(2.4, 4.6, 4.0, 4.8, '#65a30d', 1.6);
                    break;
                }
                case 'takotsubogo': {
        // 蛸壺: 素焼きの壺と覗く蛸足
        ring(3, 3.4, cell * 1.3, '#b45309', 2.4);
        dot(3, 3.6, '#92400e', '#78350f', cell * 0.85);
        seg(2.4, 2.6, 2, 1.6, '#fb923c', 1.6);
        seg(3.4, 2.6, 3.8, 1.4, '#fb923c', 1.6);
        seg(3, 2.8, 3, 1.6, '#fdba74', 1.4);
        dot(4.6, 4.8, P1, P1S, cell * 0.2);
                    break;
                }
                case 'takuhatsugo': {
        // 托鉢: 施しを受ける鉢と巡る僧の石
        c.beginPath(); c.fillStyle = '#57534e'; c.strokeStyle = '#292524'; c.lineWidth = 1.4;
        c.arc(3.0 * cell + cell, 3.6 * cell + cell, cell * 0.75, 0, Math.PI); c.fill(); c.stroke();
        dot(3.0, 3.5, '#fbbf24', '#b45309', cell * 0.18);
        dot(2.0, 2.0, P1, P1S, cell * 0.28);
        dot(4.2, 1.7, P2, P1S, cell * 0.28);
                    break;
                }
                case 'takuhongo': {
        // 碑と拓本(白抜き文字)
        blk(2.0, 1.4, '#57534e', '#292524');
        blk(2.0, 2.4, '#57534e', '#292524');
        txt('拓', 4.4, 3.4, '#1c1917', cell * 1.6);
        seg(3.4, 1.6, 5.2, 1.6, '#57534e', 3);
        seg(3.4, 5.0, 5.2, 5.0, '#57534e', 3);
                    break;
                }
                case 'tamagushigo': {
        // 玉串: 榊の枝と奉納された石
        seg(2.4, 4.6, 2.4, 2.4, '#16a34a', 2.2);
        seg(2.4, 3.0, 1.4, 2.2, '#16a34a', 2);
        seg(2.4, 3.0, 3.4, 2.2, '#16a34a', 2);
        seg(2.4, 3.8, 1.4, 3.0, '#15803d', 2);
        seg(2.4, 3.8, 3.4, 3.0, '#15803d', 2);
        dot(4.6, 4.0, P1, P1S, cell * 0.3);
                    break;
                }
                case 'tanabatago': {
        // 七夕: 笹の枝と吊るした短冊
        seg(1.4, 5.2, 3.4, 1.2, '#15803d', cell * 0.3); // 笹の幹
        seg(2.2, 3.4, 4.6, 2.4, '#16a34a', cell * 0.22); // 枝
        seg(2.9, 2.2, 4.4, 1.4, '#16a34a', cell * 0.18);
        blk(4.3, 2.0, '#f43f5e', '#9f1239'); // 短冊(赤)
        blk(3.6, 2.9, '#38bdf8', '#075985'); // 短冊(青)
        seg(4.3, 2.0, 4.3, 1.4, '#94a3b8', 1); // 吊り糸
        seg(3.6, 2.9, 3.9, 2.6, '#94a3b8', 1);
        dot(2.0, 4.4, P2, P2S, R * 0.5); // 星
                    break;
                }
                case 'tansugo': {
        // 箪笥: 引出し重ねの箪笥と取っ手
        seg(1.6, 1.8, 4.4, 1.8, '#92400e', 2.2);   // 上枠
        seg(1.6, 4.8, 4.4, 4.8, '#92400e', 2.2);   // 下枠
        seg(1.6, 1.8, 1.6, 4.8, '#92400e', 2.2);   // 左枠
        seg(4.4, 1.8, 4.4, 4.8, '#92400e', 2.2);   // 右枠
        seg(1.6, 2.8, 4.4, 2.8, '#b45309', 1.6);   // 仕切り1
        seg(1.6, 3.8, 4.4, 3.8, '#b45309', 1.6);   // 仕切り2
        seg(2.7, 2.3, 3.3, 2.3, '#fde68a', 1.6);   // 取っ手上
        seg(2.7, 3.3, 3.3, 3.3, '#fde68a', 1.6);   // 取っ手中
        seg(2.7, 4.3, 3.3, 4.3, '#fde68a', 1.6);   // 取っ手下
                    break;
                }
                case 'tanukigo': {
        // 狸: 丸い腹鼓と葉っぱ笠
        dot(3, 3.6, '#a16207', '#713f12', cell * 1.15);   // 狸の体
        dot(3, 3.9, '#fef3c7', '#d6a85c', cell * 0.6);    // 白い腹鼓
        seg(2.6, 3.9, 3.4, 3.9, '#a16207', 1.4);          // 鼓の撥跡
        dot(2.5, 2.8, '#292524', '#000', cell * 0.13);    // 左目
        dot(3.5, 2.8, '#292524', '#000', cell * 0.13);    // 右目
        tri(3, 1.9, cell * 0.65, '#4d7c0f', '#365314');   // 頭の葉っぱ
        seg(4.5, 3.0, 5.0, 3.4, '#57534e', 2);            // 酒徳利の柄
                    break;
                }
                case 'tanzakugo': {
        seg(2.4, 0.6, 2.4, 5.4, "#b45309", 3);
        seg(3.6, 0.6, 3.6, 5.4, "#b45309", 3);
        dot(2.4, 1.5, P1, P1S, R * 0.85);
        dot(3.6, 3.0, P2, P2S, R * 0.85);
        dot(2.4, 4.5, P1, P1S, R * 0.85);
        tri(2.4, 0.5, cell * 0.22, "#3b82f6", "#1d4ed8", Math.PI);
        tri(3.6, 5.5, cell * 0.22, "#3b82f6", "#1d4ed8");
                    break;
                }
                case 'targetgo': {
        // 的当: 同心円の的 + 命中の石
        ring(3, 3, cell * 1.7, '#dc2626', 2.4);
        ring(3, 3, cell * 1.1, '#fef3c7', 2.0);
        ring(3, 3, cell * 0.5, '#dc2626', 2.0);
        dot(3, 3, P1, P1S, cell * 0.38);
                    break;
                }
                case 'tarotgo': {
        // 占札: 1枚のタロットカードに月と星
        const p = at(3, 3);
        c.fillStyle = '#312e81'; c.strokeStyle = '#c4b5fd'; c.lineWidth = 1.6;
        c.beginPath();
        if (c.roundRect) c.roundRect(p.x - cell * 0.8, p.y - cell * 1.3, cell * 1.6, cell * 2.6, cell * 0.18); else c.rect(p.x - cell * 0.8, p.y - cell * 1.3, cell * 1.6, cell * 2.6);
        c.fill(); c.stroke();
        // 三日月
        c.fillStyle = '#fde68a';
        c.beginPath(); c.arc(at(3.2, 2.6).x, at(3.2, 2.6).y, cell * 0.45, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#312e81';
        c.beginPath(); c.arc(at(3.5, 2.5).x, at(3.5, 2.5).y, cell * 0.4, 0, Math.PI * 2); c.fill();
        txt('★', 2.7, 3.7, '#fde68a', cell * 0.55);
        dot(5, 4.8, P1, P1S, cell * 0.28); dot(1, 1.2, P2, P2S, cell * 0.28);
    
                    break;
                }
                case 'tatego': {
        // 楯: 両脇の石に挟まれた盾
        dot(1.2, 3, P1, P1S); dot(4.8, 3, P1, P1S);
        seg(2.4, 2.2, 3.6, 2.2, '#ca8a04', 2.4);
        seg(3.6, 2.2, 3.6, 3.2, '#ca8a04', 2.4);
        seg(3.6, 3.2, 3, 4.2, '#ca8a04', 2.4);
        seg(3, 4.2, 2.4, 3.2, '#ca8a04', 2.4);
        seg(2.4, 3.2, 2.4, 2.2, '#ca8a04', 2.4);
                    break;
                }
                case 'temizugo': {
        // 手水: 水盤・柄杓・清めの滴
        ring(3, 3.4, cell * 1.15, '#0e7490', 2.4); // 水盤の縁
        c.fillStyle = 'rgba(125,211,252,0.55)';
        c.beginPath(); c.arc(at(3,3.4).x, at(3,3.4).y, cell * 0.95, 0, Math.PI * 2); c.fill(); // 水
        seg(4.6, 1.6, 3.6, 2.9, '#a16207', cell * 0.16); // 柄杓の柄
        ring(4.75, 1.4, cell * 0.34, '#a16207', cell * 0.16); // 柄杓の枡
        dot(2.3, 2.6, '#7dd3fc', '#0284c7', R * 0.34); // 滴
        dot(3.4, 1.9, '#7dd3fc', '#0284c7', R * 0.28);
                    break;
                }
                case 'templego': {
                    // 寺院: 屋根と柱と囲む石
                    tri(3, 1.6, cell * 1.15, '#b45309', '#78350f');
                    c.fillStyle = '#d4af37'; c.fillRect(at(3, 3.4).x - cell * 0.55, at(3, 3.4).y - cell * 0.45, cell * 1.1, cell * 0.9);
                    c.fillStyle = '#78350f';
                    c.fillRect(at(3, 3.4).x - cell * 0.38, at(3, 3.4).y - cell * 0.38, cell * 0.14, cell * 0.76);
                    c.fillRect(at(3, 3.4).x + cell * 0.24, at(3, 3.4).y - cell * 0.38, cell * 0.14, cell * 0.76);
                    dot(1.4, 4.8, P1, P1S); dot(2.6, 5.1, P1, P1S); dot(3.8, 5.1, P1, P1S); dot(5, 4.8, P1, P1S);
                    break;
                }
                case 'tenmokugo': {
        // 天目: 曜変の虹輪と油滴
        dot(3, 3, P1, P1S, cell * 0.9);
        ring(3, 3, cell * 0.62, '#7c3aed', 1.8);
        ring(3, 3, cell * 0.38, '#38bdf8', 1.6);
        dot(2.6, 2.6, '#a5f3fc', '#0891b2', cell * 0.12);
                    break;
                }
                case 'termitego': {
        blk(1, 4.6, '#a16207', '#713f12');
        blk(2, 4.6, '#a16207', '#713f12');
        blk(3, 3.6, '#a16207', '#713f12');
        blk(4, 3.6, '#a16207', '#713f12');
        dot(4.8, 2.4, P1, P1S, cell * 0.34);
        seg(4.4, 3.9, 4.9, 3.3, '#eab308', 2);
                    break;
                }
                case 'terracego': {
        seg(1.4, 1.8, 4.6, 1.8, '#65a30d', 1.8);
        seg(1.8, 3.2, 4.6, 3.2, '#84cc16', 1.8);
        seg(2.2, 4.6, 4.6, 4.6, '#a3b550', 1.8);
        seg(1.6, 2.5, 1.6, 3.9, '#6b4a1e', 1.6);
        seg(2, 3.9, 2, 5.1, '#6b4a1e', 1.6);
        dot(3.6, 2.5, P1, P1S, cell * 0.38);
                    break;
                }
                case 'tesujigo': {
        dot(2, 2, P1, P1S, cell * 0.45);
        dot(3.4, 2, P2, P2S, cell * 0.45);
        dot(3.4, 3.4, P1, P1S, cell * 0.45);
        seg(2.3, 4.3, 4.4, 4.3, '#38bdf8', 1.8);
        tri(2, 4.4, cell * 0.38, '#38bdf8', '#0369a1');
                    break;
                }
                case 'thatchgo': {
        // 茅葺: 寄棟の屋根
        tri(3.0, 2.2, cell * 1.5, '#a16207', '#713f12', Math.PI / 2);
        seg(1.6, 4.0, 4.4, 4.0, '#713f12', 4);
        dot(2.2, 4.8, P1, P1S, cell * 0.28);
        dot(3.8, 4.8, P2, P2S, cell * 0.28);
                    break;
                }
                case 'threeleggo': {
        dot(2.2, 2.6, P1, P1S);
        dot(3.8, 2.6, P2, P2S);
        seg(2.2, 2.6, 3.8, 2.6, '#f43f5e', 2);
        seg(2.4, 3, 1.8, 4.6, P1S, 1.6);
        seg(3.6, 3, 4.2, 4.6, P2S, 1.6);
                    break;
                }
                case 'threewaygo': {
        seg(3, 1.9, 2, 4.1, '#78350f', 1.4);
        seg(2, 4.1, 4, 4.1, '#78350f', 1.4);
        seg(4, 4.1, 3, 1.9, '#78350f', 1.4);
        dot(3, 1.9, P1, P1S, cell * 0.4);
        dot(2, 4.1, P2, P2S, cell * 0.4);
        dot(4, 4.1, '#dc2626', '#7f1d1d', cell * 0.4);
                    break;
                }
                case 'thronego': {
        // 昇殿: 高座の上の石 + 高座段
        dot(3, 1.8, '#fbbf24', '#b45309', cell * 0.5);
        blk(3, 3.2, '#a16207', '#713f12');
        blk(3, 4.4, '#854d0e', '#713f12');
        dot(1.4, 4.4, P1, P1S, cell * 0.32);
        dot(4.6, 4.4, P1, P1S, cell * 0.32);
                    break;
                }
                case 'thundercloudgo': {
        ring(2.7, 1.9, cell * 0.5, '#475569', 4.5);
        ring(3.5, 1.9, cell * 0.42, '#475569', 4);
        tri(3.1, 3.4, cell * 0.5, '#facc15', '#eab308', Math.PI);
        seg(3.1, 3.0, 2.8, 3.6, '#facc15', 2);
        seg(2.8, 3.6, 3.4, 3.6, '#facc15', 2);
        seg(3.4, 3.6, 3.0, 4.4, '#facc15', 2);
                    break;
                }
                case 'tidepoolgo': {
        dot(3, 2.2, P1, P1S);
        blk(3, 4.6, 'rgba(56,189,248,0.55)', 'rgba(14,116,144,0.8)');
        seg(0.8, 3.4, 5.2, 3.4, '#38bdf8', 2.4);
        seg(1.2, 3.0, 2.0, 3.0, '#7dd3fc', 1.6);
        seg(4.0, 3.0, 4.8, 3.0, '#7dd3fc', 1.6);
                    break;
                }
                case 'tightropego': {
        // 綱渡り: 綱+渡る石+綱竿
        seg(0.4, 3.8, 5.6, 3.8, '#78716c', 2);
        dot(2.8, 3.8, P1, P1S);
        seg(2.0, 2.4, 3.6, 2.8, '#b45309', 2);
        seg(2.8, 3.0, 2.8, 3.8, '#57534e', 1.6);
                    break;
                }
                case 'tilengo': {
        tri(1.6, 1.8, cell * 0.75, "rgba(45,212,191,0.5)", "#0d9488");
        tri(4.2, 1.8, cell * 0.75, "rgba(56,189,248,0.5)", "#0284c7", Math.PI / 2);
        tri(1.7, 4.2, cell * 0.75, "rgba(167,139,250,0.5)", "#7c3aed", Math.PI);
        tri(4.3, 4.2, cell * 0.75, "rgba(251,191,36,0.5)", "#d97706", -Math.PI / 2);
        dot(1.7, 1.9, P1, P1S, R * 0.6);
        dot(4.2, 1.9, P2, P2S, R * 0.6);
                    break;
                }
                case 'tithego': {
        dot(1.8, 2.4, '#facc15', '#a16207', cell * 0.3);
        dot(2.7, 2.4, '#facc15', '#a16207', cell * 0.3);
        dot(3.6, 2.4, '#facc15', '#a16207', cell * 0.3);
        dot(4.7, 4.2, '#facc15', '#a16207', cell * 0.3);
        txt('1/10', 2.6, 4.3, '#78350f', cell * 0.85);
                    break;
                }
                case 'tobiishigo': {
        // 飛石: 間隔を空けて並ぶ踏み石の弧
        dot(1.3, 4.8, '#57534e', '#292524', cell * 0.65);
        dot(2.7, 3.7, '#78716c', '#44403c', cell * 0.6);
        dot(3.9, 4.3, '#57534e', '#292524', cell * 0.55);
        dot(4.9, 2.9, '#78716c', '#44403c', cell * 0.5);
        seg(1.9, 4.4, 2.3, 4.1, '#a8a29e', 1);
        seg(3.3, 3.9, 3.6, 4, '#a8a29e', 1);
                    break;
                }
                case 'tofugo': {
        // 豆腐: 白い豆腐丁とにがりの雫
        blk(2.4, 3, '#fafaf9', '#d6d3d1');
        blk(3.8, 3.6, '#f5f5f4', '#d6d3d1');
        seg(4.6, 1.2, 4.6, 2, '#a8a29e', 1.6);
        tri(4.6, 2.6, cell * 0.32, '#e7e5e4', '#a8a29e', Math.PI);
        dot(1.6, 1.4, P2, P2S, cell * 0.22);
                    break;
                }
                case 'tokogo': {
        // 床飾: 床の間に掛け軸と生け花
        seg(1.4, 1.4, 4.6, 1.4, '#78350f', 2);      // 床框
        seg(2.2, 1.8, 2.2, 4.6, '#e7e5e4', 4);     // 軸 (太い縦線)
        seg(2.0, 4.6, 2.4, 4.6, '#57534e', 2);     // 軸の風帯
        txt('飾', 2.2, 3, '#44403c', cell * 0.7);   // 軸の字
        seg(3.6, 4.8, 3.6, 3.9, '#166534', 1.6);   // 花茎
        dot(3.6, 3.7, '#dc2626', '#991b1b', cell * 0.35); // 花
        seg(3.2, 4.8, 4, 4.8, '#57534e', 1.8);     // 花生け
                    break;
                }
                case 'tokyogo': {
        // 斗栱: 柱と受け材の組物
        seg(3.0, 1.0, 3.0, 5.4, '#57534e', 5);
        bond(1.6, 2.2, 4.4, 2.2, 5);
        bond(2.2, 3.4, 3.8, 3.4, 4);
        dot(1.6, 2.2, P1, P1S, cell * 0.28);
        dot(4.4, 2.2, P1, P1S, cell * 0.28);
                    break;
                }
                case 'tollgo': {
        // 弔鐘と響き
        tri(3, 3.4, cell * 0.95, '#fbbf24', '#b45309', Math.PI);
        blk(3, 4.4, '#fbbf24', '#b45309');
        dot(3, 5, '#b45309', '#92400e', cell * 0.16);
        ring(3, 3.6, cell * 1.3, 'rgba(217,119,6,0.8)', 1.4);
        ring(3, 3.6, cell * 1.7, 'rgba(217,119,6,0.5)', 1.2);
                    break;
                }
                case 'tonego': {
        seg(1, 2.2, 5, 2.2, '#94a3b8', 1);
        seg(1, 3, 5, 3, '#94a3b8', 1);
        seg(1, 3.8, 5, 3.8, '#94a3b8', 1);
        dot(2, 3.2, P1, P1S, cell * 0.42);
        seg(2.4, 3.2, 2.4, 1.2, '#1c1917', 1.6);
        seg(2.4, 1.2, 3.4, 1.7, '#1c1917', 1.6);
        dot(4.2, 4.4, P2, P2S, cell * 0.36);
                    break;
                }
                case 'topspingo': {
        // 独楽: 回転するコマと残像の弧
        tri(3.0, 3.0, cell * 0.85, '#dc2626', '#7f1d1d', Math.PI / 2);
        seg(3.0, 1.6, 3.0, 2.3, '#7f1d1d', 2.0);
        c.beginPath(); c.strokeStyle = '#94a3b8'; c.lineWidth = 1.6;
        c.arc(3.0 * cell + cell, 3.0 * cell + cell, cell * 1.5, Math.PI * 0.9, Math.PI * 1.5); c.stroke();
        c.beginPath(); c.arc(3.0 * cell + cell, 3.0 * cell + cell, cell * 1.5, Math.PI * 1.9, Math.PI * 2.5); c.stroke();
                    break;
                }
                case 'tossengo': {
        // 投扇興: 的と投げた扇
        ring(4, 2, cell * 0.7, '#dc2626', 2);
        ring(4, 2, cell * 0.3, '#dc2626', 1.6);
        dot(4, 2, '#f8fafc', '#dc2626', cell * 0.12);
        mol([[1.2, 4.8], [2, 3.4], [2.6, 4.4], [3.2, 3.6]], 'rgba(251,191,36,0.7)', '#b45309');
        dot(1.2, 4.8, '#78350f', '#451a03', cell * 0.16);
                    break;
                }
                case 'totalitygo': {
        dot(3, 3, P1, P1S);
        ring(3, 3, R * 1.6, '#f97316', 2.2);
        ring(3, 3, R * 2.2, 'rgba(249,115,22,0.4)', 1);
        dot(4.6, 1.6, P2, P2S, R * 0.5);
                    break;
                }
                case 'toujigo': {
        // 湯治: 温泉の湯面と湯けむり、浸かる石
        dot(3, 4.2, '#0ea5e9', '#0369a1', cell * 1.5, 0.8);
        dot(3.4, 4.3, '#78716c', '#44403c', cell * 0.5); // 浸かる石
        c.beginPath(); c.moveTo(at(2, 3.2).x, at(2, 3.2).y); c.quadraticCurveTo(at(2.2, 2.7).x, at(2.2, 2.7).y, at(2, 2.3).x, at(2, 2.3).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり1
        c.beginPath(); c.moveTo(at(3, 3).x, at(3, 3).y); c.quadraticCurveTo(at(3.2, 2.5).x, at(3.2, 2.5).y, at(3, 2.1).x, at(3, 2.1).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり2
        c.beginPath(); c.moveTo(at(4, 3.2).x, at(4, 3.2).y); c.quadraticCurveTo(at(4.2, 2.7).x, at(4.2, 2.7).y, at(4, 2.3).x, at(4, 2.3).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり3
                    break;
                }
                case 'tracego': {
        dot(1.5, 1.8, P1, P1S, cell * 0.28); dot(2.3, 2.6, P1, P1S, cell * 0.28);
        dot(3.1, 3.4, P1, P1S, cell * 0.28);
        ring(4.3, 4.3, cell * 0.55, "#facc15", 2.5);
        dot(4.3, 4.3, "#facc15", "#a16207", cell * 0.15);
                    break;
                }
                case 'tradego': {
        ring(2.4, 2, cell * 0.28, '#0369a1', 2);
        seg(2.4, 2.3, 2.4, 4.3, '#0369a1', 2.4);
        seg(1.8, 3.4, 3, 3.4, '#0369a1', 2);
        seg(1.7, 4.5, 2.4, 4, '#0369a1', 2.2);
        seg(3.1, 4.5, 2.4, 4, '#0369a1', 2.2);
        blk(4.4, 4, '#facc15', '#a16207');
                    break;
                }
                case 'traitorgo': {
        dot(3, 3, P2, P2S);
        seg(2.4, 2.6, 3.6, 2.6, P1, cell * 0.42);
        txt('仮', 3, 3.5, '#f43f5e', cell * 0.6);
        seg(3, 1.4, 3, 4.7, '#f43f5e', 1.2);
                    break;
                }
                case 'trenchgo': {
        blk(1.6, 3, "#57534e", "#292524");
        blk(4.4, 3, "#57534e", "#292524");
        seg(3, 0.6, 3, 5.4, "#0c4a6e", 4);
        seg(2.7, 0.6, 2.7, 5.4, "#075985", 1.2);
        seg(3.3, 0.6, 3.3, 5.4, "#075985", 1.2);
        dot(1.6, 3, P1, P1S, R * 0.8);
        dot(4.4, 3, P2, P2S, R * 0.8);
                    break;
                }
                case 'trialgo': {
        // 試練: 関門の鳥居+くぐる石
        seg(1.6, 1.8, 4.4, 1.8, '#dc2626', 2.6);
        seg(2.0, 2.2, 4.0, 2.2, '#dc2626', 2);
        seg(2.0, 1.8, 2.0, 4.4, '#dc2626', 2.2);
        seg(4.0, 1.8, 4.0, 4.4, '#dc2626', 2.2);
        dot(3.0, 3.4, P1, P1S, cell * 0.3);
                    break;
                }
                case 'trickgo': {
        // 悪戯: インクの飛沫と笑い顔
        const p = at(3, 2.6);
        c.fillStyle = '#ec4899';
        c.beginPath(); c.arc(p.x, p.y, cell * 0.7, 0, Math.PI * 2); c.fill();
        [[-0.9, -0.6], [0.8, -0.9], [1, 0.7], [-0.7, 0.9]].forEach(([ox, oy]) => {
            c.beginPath(); c.arc(p.x + ox * cell * 0.9, p.y + oy * cell * 0.9, cell * 0.22, 0, Math.PI * 2); c.fill();
        });
        // 目と口
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(p.x - cell * 0.2, p.y - cell * 0.15, cell * 0.12, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(p.x + cell * 0.2, p.y - cell * 0.15, cell * 0.12, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(p.x, p.y + cell * 0.15, cell * 0.3, 0.2, Math.PI - 0.2); c.stroke();
        dot(1.2, 4.8, P1, P1S, cell * 0.3); dot(4.8, 4.8, P2, P2S, cell * 0.3);
    
                    break;
                }
                case 'triggergo': {
        // 引金: 爆発 + 縁の列
        txt('✸', 3.0, 2.6, '#f97316', cell * 2.0);
        dot(1.2, 4.8, P1, P1S, cell * 0.36);
        dot(2.4, 4.8, P1, P1S, cell * 0.36);
        dot(4.2, 4.8, P2, P2S, cell * 0.36);
        seg(0.8, 5.2, 5.4, 5.2, '#dc2626', 2.0);
                    break;
                }
                case 'troopgo': {
        // 猿山: 山とボス猿、その群れ
        tri(3, 2.6, cell * 1.1, '#57534e', '#292524');    // 山
        dot(3, 3.0, '#f59e0b', '#b45309', cell * 0.4);    // ボス猿
        ring(3, 3.0, cell * 0.55, '#fbbf24', 1.4);        // ボスの冠輪
        dot(1.6, 4.2, '#fbbf24', '#b45309', cell * 0.3);  // 群れ1
        dot(3.0, 4.5, '#fbbf24', '#b45309', cell * 0.3);  // 群れ2
        dot(4.4, 4.2, '#fbbf24', '#b45309', cell * 0.3);  // 群れ3
        seg(1.6, 3.8, 3.0, 4.1, 'rgba(180,83,9,0.5)', 1.2); // 群れの線
        seg(4.4, 3.8, 3.0, 4.1, 'rgba(180,83,9,0.5)', 1.2);
                    break;
                }
                case 'trumpgo': {
        blk(2.5, 3, '#ffffff', '#7f1d1d');
        seg(3.6, 1.7, 3.1, 3, '#dc2626', 2.4);
        seg(3.1, 3, 3.7, 4.3, '#dc2626', 2.4);
        dot(4.6, 4.4, P2, P2S, cell * 0.4);
                    break;
                }
                case 'tsubogo': {
        // 経穴: 経脈の線とツボの環+赤点
        seg(0.8, 3, 2.4, 3, '#94a3b8', 1.6);
        seg(3.6, 3, 5.2, 3, '#94a3b8', 1.6);
        seg(3, 0.8, 3, 2.4, '#94a3b8', 1.6);
        seg(3, 3.6, 3, 5.2, '#94a3b8', 1.6);
        ring(3, 3, cell * 0.55, '#94a3b8', 2.2);
        dot(3, 3, '#dc2626', '#991b1b', cell * 0.16);
                    break;
                }
                case 'tsugitego': {
        // 継手: 2材を継ぐ楔
        bond(1.0, 2.0, 3.0, 2.0, 5);
        bond(3.0, 2.0, 5.0, 2.0, 5);
        tri(3.0, 2.0, cell * 0.4, '#b45309', '#78350f', Math.PI / 2);
        dot(1.0, 2.0, P1, P1S);
        dot(5.0, 2.0, P1, P1S);
        dot(3.0, 4.6, P2, P2S);
                    break;
                }
                case 'tsuitatego': {
        // 衝立: 一枚板の衝立と脚
        seg(2, 1.7, 4, 1.7, '#8a5a24', 2.4);       // 上框
        seg(2, 4.2, 4, 4.2, '#8a5a24', 2.4);       // 下框
        seg(2, 1.7, 2, 4.2, '#a16207', 2.4);       // 左框
        seg(4, 1.7, 4, 4.2, '#a16207', 2.4);       // 右框
        seg(3, 1.7, 3, 4.2, '#d6a85c', 1.2);       // 板の目
        seg(2.2, 4.2, 1.7, 4.9, '#57534e', 2);     // 左脚
        seg(3.8, 4.2, 4.3, 4.9, '#57534e', 2);     // 右脚
                    break;
                }
                case 'tsukego': {
        dot(2.3, 3, P1, P1S, cell * 0.48);
        dot(3.7, 3, P2, P2S, cell * 0.48);
        ring(3.7, 3, cell * 0.8, '#c084fc', 1.6);
        seg(3, 1.8, 3, 2.3, '#c084fc', 1.6);
                    break;
                }
                case 'tsukemonogo': {
        // 糠床: 漬物樽と大根 (漬けられた石)
        blk(2, 2.4, '#d6d3d1', '#78716c');
        blk(2.4, 1.8, '#e7e5e4', '#a8a29e');
        seg(1.6, 2.6, 4.4, 2.6, '#a8a29e', 1.4);
        tri(3, 1.4, cell * 0.5, '#fafaf9', '#d6d3d1', 0);
        dot(2.2, 3.4, '#ca8a04', '#a16207', cell * 0.3);
        dot(3.6, 3.8, P2, P2S, cell * 0.24);
                    break;
                }
                case 'tsukimigo': {
        // 月見: 満月・月見団子・すすき
        dot(4.2, 1.6, '#fef3c7', '#f59e0b', cell * 0.9); // 満月
        dot(2.4, 4.4, P2, P2S, R * 0.62); // 団子3
        dot(3.1, 4.4, P2, P2S, R * 0.62);
        dot(2.75, 3.85, P2, P2S, R * 0.62);
        seg(1.2, 5.2, 1.6, 2.6, '#a16207', cell * 0.14); // すすき穂
        seg(1.6, 2.6, 2.1, 2.2, '#ca8a04', cell * 0.3);
        seg(1.6, 2.6, 1.2, 2.1, '#ca8a04', cell * 0.3);
                    break;
                }
                case 'tsukiyamago': {
        // 築山: 盛り上げた小山と麓の石・頂の松
        tri(3, 4.2, cell * 1.6, '#65a30d', '#3f6212');
        tri(3.6, 3.2, cell * 0.8, '#4d7c0f', '#3f6212');
        seg(3.2, 1.9, 3.2, 2.7, '#44403c', 1.6);
        tri(3.2, 1.9, cell * 0.5, '#166534', '#14532d');
        dot(1.4, 4.9, '#78716c', '#57534e', cell * 0.45);
                    break;
                }
                case 'tsukubaigo': {
        // 蹲踞: 低い石の水盤と水面、しずく
        ring(3, 3.8, cell * 1.2, '#57534e', 2.6);
        dot(3, 3.8, '#7dd3fc', '#38bdf8', cell * 0.75, 0.9);
        dot(4.4, 2.2, '#38bdf8', '#0284c7', cell * 0.22);
        seg(2.2, 1.6, 2.2, 2.6, '#a8a29e', 1.6);
        seg(2.2, 2.6, 2.8, 2.6, '#a8a29e', 1.6);
                    break;
                }
                case 'tsukumogo': {
        // 付喪神: 古傘が化けて一目と舌を出す
        seg(3.0, 1.2, 3.0, 4.8, '#92603a', 2.0);
        tri(3.0, 2.0, cell * 1.1, '#a16207', '#713f12', -Math.PI / 2);
        dot(3.0, 1.9, '#f8fafc', '#1c1917', cell * 0.22);
        dot(3.0, 1.9, '#1c1917', '#1c1917', cell * 0.09);
        seg(3.0, 4.8, 3.6, 5.4, '#92603a', 1.8);
        seg(3.4, 2.6, 4.0, 3.4, '#f87171', 1.6);
                    break;
                }
                case 'tsumego': {
        dot(1.6, 4.4, P1, P1S, cell * 0.4);
        dot(3, 3, P1, P1S, cell * 0.4);
        dot(4.4, 1.6, P2, P2S, cell * 0.4);
        seg(1.9, 4.1, 2.7, 3.3, '#f87171', 1.8);
        seg(3.3, 2.7, 4.1, 1.9, '#f87171', 1.8);
                    break;
                }
                case 'tsumikigo': {
        // 積木: 高く積まれた色積み木
        blk(1.8, 4.2, '#ef4444', '#b91c1c');
        blk(2.3, 2.9, '#3b82f6', '#1d4ed8');
        blk(2.8, 1.6, '#f59e0b', '#b45309');
        tri(4.6, 4.2, cell * 0.4, '#22c55e', '#15803d', 0);
                    break;
                }
                case 'tsunatorigo': {
        // 綱取: 横綱の綱と優勝旗
        seg(1.2, 3.8, 4.8, 3.8, '#f8fafc', 3.6);
        seg(1.2, 3.8, 1.2, 4.4, '#f8fafc', 2.2);
        seg(4.8, 3.8, 4.8, 4.4, '#f8fafc', 2.2);
        seg(3.0, 0.8, 3.0, 3.0, '#92603a', 1.8);
        tri(3.7, 1.5, cell * 0.5, '#dc2626', '#7f1d1d', 0);
        dot(3.0, 3.8, P1, P1S, cell * 0.3);
                    break;
                }
                case 'tuggo': {
        // 綱引: 中央の結び目 + 両方向の綱 + 引き矢印
        seg(0.8, 3.0, 5.2, 3.0, '#b45309', 3.2);
        ring(3.0, 3.0, cell * 0.5, '#dc2626', 3.0);
        dot(1.2, 2.0, P1, P1S, cell * 0.34);
        dot(4.8, 4.0, P2, P2S, cell * 0.34);
        seg(2.2, 3.6, 1.6, 4.2, '#94a3b8', 1.6);
        seg(3.8, 2.4, 4.4, 1.8, '#94a3b8', 1.6);
                    break;
                }
                case 'tunnelgo': {
        tri(1.6, 3, cell * 0.6, "#92400e", "#451a03");
        seg(2.6, 3, 4.4, 3, "#f59e0b", 1.8);
        tri(4.8, 3, cell * 0.35, "#f59e0b", "#b45309", Math.PI / 2);
                    break;
                }
                case 'twinboardgo': {
        seg(1.4, 1.4, 3, 1.4, '#94a3b8', 1.5);
        seg(1.4, 1.4, 1.4, 3, '#94a3b8', 1.5);
        seg(3, 3, 4.6, 3, '#a5b4fc', 1.5);
        seg(4.6, 3, 4.6, 4.6, '#a5b4fc', 1.5);
        ring(3, 3, cell * 1.7, '#818cf8', 1.2);
        dot(1.9, 1.9, P1, P1S, cell * 0.36);
        dot(4.1, 4.1, P2, P2S, cell * 0.36);
                    break;
                }
                case 'twinringgo': {
        // 双環: 1点で繋がる2つの環
        ring(2.1, 3, 1.7, '#0ea5e9', 2.4);
        ring(3.9, 3, 1.7, '#f59e0b', 2.4);
        dot(3, 3, P1, P1S, R * 0.8);
        dot(2.1, 1.6, P2, P2S, R * 0.8);
        dot(3.9, 4.4, P2, P2S, R * 0.8);
                    break;
                }
                case 'uchiagego': {
        // 打ち上げ花火: 上昇の尾と開いた大輪
        seg(3.0, 5.4, 3.0, 3.2, '#fdba74', 1.8);
        dot(3.0, 2.4, '#facc15', '#b45309', cell * 0.22);
        seg(3.0, 1.0, 3.0, 0.3, '#fde047', 1.6); seg(4.4, 1.4, 5.1, 0.9, '#fde047', 1.6);
        seg(1.6, 1.4, 0.9, 0.9, '#fde047', 1.6); seg(4.7, 2.4, 5.6, 2.4, '#fde047', 1.6);
        seg(1.3, 2.4, 0.4, 2.4, '#fde047', 1.6); seg(4.1, 3.4, 4.7, 4.0, '#f472b6', 1.6);
        seg(1.9, 3.4, 1.3, 4.0, '#f472b6', 1.6);
                    break;
                }
                case 'ukaigo': {
        // 鵜飼: 鮎を銜えた鵜と篝火
        dot(2.6, 2.8, '#1c1917', '#44403c', cell * 0.75);
        tri(3.4, 1.8, cell * 0.4, '#292524', '#57534e', -Math.PI / 6);
        seg(3.8, 2, 4.8, 2.4, '#d97706', 1.6);
        tri(4.6, 3.4, cell * 0.4, '#38bdf8', '#0369a1', Math.PI / 3);
        dot(1.6, 4.4, '#fbbf24', '#b45309', cell * 0.3);
                    break;
                }
                case 'umeboshigo': {
        // 梅干: 五弁の梅の花と塩の粒
        dot(3, 1.8, '#fda4af', '#e11d48', cell * 0.42);
        dot(4.1, 2.6, '#fda4af', '#e11d48', cell * 0.42);
        dot(3.7, 4.1, '#fda4af', '#e11d48', cell * 0.42);
        dot(2.3, 4.1, '#fda4af', '#e11d48', cell * 0.42);
        dot(1.9, 2.6, '#fda4af', '#e11d48', cell * 0.42);
        dot(3, 3, '#fbbf24', '#d97706', cell * 0.3);
        dot(1.2, 5, '#f8fafc', '#cbd5e1', cell * 0.12);
        dot(4.8, 5.2, '#f8fafc', '#cbd5e1', cell * 0.12);
                    break;
                }
                case 'unbango': {
        // 雲版: 雲形の版と撞座・下の垂れ
        dot(2.4, 2.9, '#cbd5e1', '#64748b', cell * 0.7);
        dot(3, 2.5, '#e2e8f0', '#64748b', cell * 0.85);
        dot(3.7, 2.9, '#cbd5e1', '#64748b', cell * 0.7);
        seg(2.1, 3.4, 3.9, 3.4, '#94a3b8', 2);     // 版の底
        dot(3, 4.2, '#b45309', '#78350f', cell * 0.26); // 撞座
        seg(3, 4.4, 3, 5, '#94a3b8', 1.6);         // 垂れ紐
                    break;
                }
                case 'underminego': {
        // 掘削: 地表線+坑道+坑夫の石
        seg(0.6, 2.2, 5.4, 2.2, '#78716c', 2);
        seg(1.4, 2.2, 1.4, 4.0, '#b45309', 2.4);
        seg(1.4, 4.0, 4.4, 4.0, '#b45309', 2.4);
        dot(3.6, 4.0, P1, P1S, cell * 0.3);
        dot(4.6, 3.0, P2, P2S, cell * 0.26);
                    break;
                }
                case 'unengo': {
// 月と暈の輪、雨の前兆
dot(3,2.2,'#fde68a','#d97706',cell*0.6,1);
ctx.strokeStyle='rgba(165,180,252,0.8)'; ctx.lineWidth=1.4;
ctx.beginPath(); ctx.arc(cell*3,cell*2.2,cell*1.5,0,Math.PI*2); ctx.stroke();
ctx.strokeStyle='rgba(165,180,252,0.4)';
ctx.beginPath(); ctx.arc(cell*3,cell*2.2,cell*2.0,0,Math.PI*2); ctx.stroke();
seg(1,4.2,0.5,5.4,'#60a5fa',1.4);
seg(3,4.0,2.5,5.2,'#60a5fa',1.4);
seg(5,4.2,4.5,5.4,'#60a5fa',1.4);
                    break;
                }
                case 'unevengo': {
        dot(1.7, 2.4, P1, P1S, cell * 0.34);
        dot(2.5, 3, P1, P1S, cell * 0.34);
        dot(1.7, 3.7, P1, P1S, cell * 0.34);
        dot(4.4, 3, P2, P2S, cell * 0.55);
        ring(4.4, 3, cell * 0.75, '#fbbf24', 1.6);
                    break;
                }
                case 'upliftgo': {
        // 隆起: せり上がる大地と上向きの矢、頂上の石
        blk(0.8, 4.4, '#8a5a2b', '#5c3a1a');
        blk(1.8, 3.3, '#b47a3e', '#8a5a2b');
        tri(4.3, 2.0, cell * 0.5, '#f59e0b', '#b45309', 0);
        dot(4.3, 3.4, P1, P1S);
                    break;
                }
                case 'upsidedowngo': {
        tri(3, 1.8, R * 0.9, P1, P1S, -Math.PI / 2);
        tri(3, 4.2, R * 0.9, P2, P2S, Math.PI / 2);
        dot(2, 3, P1, P1S, R * 0.6);
        dot(4, 3, P2, P2S, R * 0.6);
                    break;
                }
                case 'uruugo': {
        // 閏年: 暦に差し込まれる閏の一日
        blk(2.6, 3, '#f8fafc', '#94a3b8'); // 暦
        seg(2.0, 2.15, 3.2, 2.15, '#0ea5e9', cell * 0.22); // 暦の頭
        [[2.3,3.0],[2.9,3.0],[2.3,3.7],[2.9,3.7]].forEach(([x,y]) =>
            dot(x, y, '#cbd5e1', '#64748b', cell * 0.14)); // 日々
        blk(4.5, 3.1, '#a3e635', '#4d7c0f'); // 閏の日
        txt('+1', 4.5, 3.1, '#1a2e05', cell * 0.55);
        seg(3.4, 3.1, 4.05, 3.1, '#4d7c0f', cell * 0.14); // 差し込み矢印
        tri(4.05, 3.1, cell * 0.2, '#4d7c0f', '#365314', 0);
                    break;
                }
                case 'usuigo': {
// 泥に沈む石と雨の帯
ctx.fillStyle='rgba(146,64,14,0.55)';
ctx.fillRect(0,cell*3.4,cell*6,cell*2.6);
dot(2,3.1,P1,P1S,cell*0.5,1);
dot(4,3.3,P2,P2S,cell*0.42,1);
seg(1,0.8,0.5,2.4,'#60a5fa',1.5);
seg(3,0.6,2.5,2.2,'#60a5fa',1.5);
seg(5,0.8,4.5,2.4,'#60a5fa',1.5);
                    break;
                }
                case 'valleygo': {
        seg(1, 1, 3, 5, '#78716c', 2);
        seg(5, 1, 3, 5, '#78716c', 2);
        seg(2.4, 4.9, 3.6, 4.9, '#38bdf8', 1.4);
        dot(3, 4.2, P1, P1S, cell * 0.4);
        dot(2.3, 3.2, P2, P2S, cell * 0.36);
                    break;
                }
                case 'vampirogo': {
        dot(2, 2.6, P1, P1S);
        dot(4, 3.4, P2, P2S);
        tri(3.6, 2.4, cell * 0.22, "#e879f9", "#701a75");
        tri(3.6, 4.4, cell * 0.22, "#e879f9", "#701a75");
                    break;
                }
                case 'viscerago': {
        // 五臓: 4象限の臓器石 + 中臓の菱形
        dot(1.4, 1.4, '#b45309', '#78350f', cell * 0.3);
        dot(4.6, 1.4, '#dc2626', '#991b1b', cell * 0.3);
        dot(1.4, 4.6, '#ca8a04', '#a16207', cell * 0.3);
        dot(4.6, 4.6, '#0284c7', '#075985', cell * 0.3);
        ring(3, 3, cell * 0.5, '#7c3aed', 2);
        dot(3, 3, '#a78bfa', '#5b21b6', cell * 0.22);
                    break;
                }
                case 'volcango2': {
        tri(3, 3.4, cell * 1.3, '#57534e', '#44403c', -Math.PI / 2);
        dot(3, 2.2, '#ef4444', '#b91c1c', cell * 0.22);
        dot(2.2, 1.4, '#f97316', '#c2410c', cell * 0.16);
        dot(3.8, 1.2, '#f97316', '#c2410c', cell * 0.14);
        dot(3, 0.8, '#fbbf24', '#d97706', cell * 0.12);
                    break;
                }
                case 'voltagego': {
        dot(2.2, 3, P1, P1S, R * 0.95);
        dot(3.8, 3, P2, P2S, R * 0.95);
        txt("+", 2.2, 3, "#fbbf24", cell * 0.55);
        txt("−", 3.8, 3, "#60a5fa", cell * 0.6);
        seg(2.8, 2.4, 3.2, 3, "#fde047", 1.8);
        seg(3.2, 3, 2.8, 3.6, "#fde047", 1.8);
        seg(3.2, 3, 3.5, 3.8, "#fde047", 1.4);
                    break;
                }
                case 'vortex2go': {
                    // 渦を巻く環流矢印と中心石
                    c.strokeStyle = '#0891b2'; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.7, -0.4, Math.PI * 1.55); c.stroke();
                    tri(4.62, 1.62, cell * 0.22, '#0891b2', '#0e7490', Math.PI * 0.85);
                    dot(3, 3, P1, P1S);
                    dot(1.4, 4.5, P2, P2S); dot(4.6, 4.5, P1, P1S);
                    break;
                }
                case 'wafergo': {
        blk(1.3, 1.4, "#e7e5e4", "#a8a29e");
        blk(1.9, 2.7, "#78716c", "#57534e");
        dot(2.6, 3.4, P1, P1S);
                    break;
                }
                case 'wakago': {
        // 和歌: 短冊と結ばれた句 (2点空けの石)
        blk(2, 2.2, '#fdf2f8', '#be185d');
        seg(1.8, 1.8, 2.2, 1.8, '#be185d', 1);
        seg(1.8, 2.4, 2.2, 2.4, '#be185d', 1);
        dot(4, 3.4, P1, P1S, cell * 0.3);
        seg(4, 3.4, 4, 4.8, '#f472b6', 1.4);
        dot(4, 4.8, P1, P1S, cell * 0.3);
                    break;
                }
                case 'washigo': {
        // 和紙: 濡れて破れる紙の石と水滴
        blk(2.4, 2.6, '#f5f0e6', '#a8a29e');
        seg(2, 2.2, 2.8, 3, '#78716c', 1.6);
        seg(2.8, 3, 2.4, 3.4, '#78716c', 1.6);
        c.fillStyle = '#60a5fa';
        c.beginPath(); c.moveTo(at(4.2,1.4).x, at(4.2,1.4).y); c.quadraticCurveTo(at(4.7,2.4).x, at(4.7,2.4).y, at(4.2,2.6).x, at(4.2,2.6).y); c.quadraticCurveTo(at(3.7,2.4).x, at(3.7,2.4).y, at(4.2,1.4).x, at(4.2,1.4).y); c.fill();
        dot(4.4, 4.4, P1, P1S, R * 0.8);
                    break;
                }
                case 'watago': {
        ring(3, 3, cell * 1.5, '#fbcfe8', 1.6);
        ring(2, 3.6, cell * 0.9, '#fbcfe8', 1.4);
        ring(4, 3.6, cell * 0.9, '#fbcfe8', 1.4);
        ring(3, 2.2, cell * 0.9, '#fbcfe8', 1.4);
        dot(3, 3.2, P2, P2S, cell * 0.5);
                    break;
                }
                case 'waterwheelgo': {
        ring(3, 2.8, cell * 1.4, '#92683a', 1.6);
        ring(3, 2.8, cell * 0.45, '#92683a', 1.6);
        seg(3, 1.4, 3, 4.2, '#92683a', 1.4);
        seg(1.6, 2.8, 4.4, 2.8, '#92683a', 1.4);
        seg(1, 5, 5, 5, '#38bdf8', 1.8);
        seg(1.6, 5.6, 4.4, 5.6, '#60a5fa', 1.4);
                    break;
                }
                case 'wave2go': {
                    // 波動: 中心石と同心波
                    dot(3, 3, P1, P1S);
                    c.strokeStyle = '#38bdf8'; c.lineWidth = 1.4;
                    [0.9, 1.6, 2.3].forEach(r => {
                        c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * r, -Math.PI * 0.3, Math.PI * 0.3); c.stroke();
                        c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * r, Math.PI * 0.7, Math.PI * 1.3); c.stroke();
                    });
                    dot(4.9, 1.1, P2, P2S, cell * 0.34);
                    break;
                }
                case 'weatheringgo': {
        // ひびの入った石と砂
        dot(3, 2.4, P1, P1S, cell * 0.5);
        seg(2.8, 2, 3, 2.5, '#a8a29e', 1.6);
        seg(3, 2.5, 2.8, 2.9, '#a8a29e', 1.6);
        dot(2, 4.8, '#e7e5e4', '#a8a29e', cell * 0.2);
        dot(3.4, 5, '#e7e5e4', '#a8a29e', cell * 0.24);
        dot(4.6, 4.7, '#e7e5e4', '#a8a29e', cell * 0.16);
                    break;
                }
                case 'whetstonego': {
        // 研師: 砥石と研がれる刃物の切っ先
        blk(0.9, 3.9, '#78716c', '#44403c');
        tri(3.4, 2.3, cell * 0.6, '#cbd5e1', '#64748b', Math.PI / 4);
        seg(3.6, 2.5, 5.0, 3.9, '#334155', 2.2);
        seg(1.4, 4.3, 3.9, 4.3, '#a5f3fc', 1.4);
                    break;
                }
                case 'windinstgo': {
        // 管楽: 横笛と音の波
        seg(1.4, 2.6, 4.6, 3.8, '#d6a85c', 3);            // 笛の管
        dot(2.0, 2.9, '#292524', '#000', cell * 0.1);     // 指穴1
        dot(2.7, 3.15, '#292524', '#000', cell * 0.1);    // 指穴2
        dot(3.4, 3.4, '#292524', '#000', cell * 0.1);     // 指穴3
        dot(4.1, 3.65, '#292524', '#000', cell * 0.1);    // 指穴4
        seg(4.9, 2.4, 5.2, 2.0, '#38bdf8', 1.6);          // 高音の波1
        seg(4.5, 1.9, 4.9, 1.5, '#38bdf8', 1.6);          // 高音の波2
        ring(1.6, 4.6, cell * 0.5, 'rgba(129,140,248,0.6)', 1.4); // 低音の響き
                    break;
                }
                case 'wishgo': {
        seg(1.2, 1.2, 4.2, 4.2, '#facc15', 2);
        seg(1.8, 1.1, 4.4, 3.9, 'rgba(250,204,21,0.5)', 1.2);
        tri(4.5, 4.4, R * 0.8, '#fde047', '#eab308', Math.PI / 4);
        dot(2, 4, P1, P1S, R * 0.7);
                    break;
                }
                case 'wisteriago': {
        // 藤: 棚から垂れる花房
        seg(1.2, 1.6, 4.8, 1.6, '#57534e', 3);
        dot(2.2, 2.4, '#c084fc', '#a855f7', R * 0.55);
        dot(2.2, 3.2, '#c084fc', '#a855f7', R * 0.45);
        dot(3.8, 2.4, '#d8b4fe', '#a855f7', R * 0.55);
        dot(3.8, 3.2, '#d8b4fe', '#a855f7', R * 0.45);
        dot(3.8, 4.0, '#e9d5ff', '#c084fc', R * 0.35);
                    break;
                }
                case 'workshopgo': {
        dot(2.2, 3.6, P1, P1S, R * 0.9);
        tri(3.8, 2.2, cell * 0.4, '#a78bfa', '#5b21b6', Math.PI / 2);
        seg(3.4, 3.2, 4.2, 4.0, '#a78bfa', 2.4);
        seg(4.2, 3.2, 3.4, 4.0, '#a78bfa', 2.4);
                    break;
                }
                case 'wriggle': {
        // 蠕動: S字に這う石の列
        [[1.4, 4.2], [2.3, 3.8], [3.2, 3.4], [4, 2.6], [4.6, 1.6]].forEach(([x, y], i) => {
            dot(x, y, i === 4 ? P2 : P1, i === 4 ? P2S : P1S, cell * 0.34);
            if (i) bond([[1.4, 4.2], [2.3, 3.8], [3.2, 3.4], [4, 2.6], [4.6, 1.6]][i - 1][0], [[1.4, 4.2], [2.3, 3.8], [3.2, 3.4], [4, 2.6], [4.6, 1.6]][i - 1][1], x, y, 2.5);
        });
        txt('〜', 1.6, 1.2, '#34d399', cell);
    
                    break;
                }
                case 'yabusamego': {
        // 流鏑馬: 的+命中した矢
        ring(4.2, 3.0, cell * 0.62, '#dc2626', 2.2);
        ring(4.2, 3.0, cell * 0.3, '#dc2626', 2);
        seg(1.0, 3.0, 4.0, 3.0, '#57534e', 2);
        tri(4.1, 3.0, cell * 0.22, '#57534e', '#292524', 0);
        seg(1.0, 3.0, 1.5, 2.6, '#f472b6', 1.6);
                    break;
                }
                case 'yataigo': {
        // 屋台: 縞々の屋根と提灯と石の客
        seg(1.2, 1.8, 4.8, 1.8, '#dc2626', 2.5);
        seg(1.2, 1.8, 2.0, 2.6, '#dc2626', 2.5);
        seg(4.8, 1.8, 4.0, 2.6, '#dc2626', 2.5);
        seg(2.0, 2.6, 4.0, 2.6, '#f8fafc', 2.5);
        dot(1.7, 3.4, P1, P1S, cell * 0.30);
        dot(3.0, 3.7, P2, P1S, cell * 0.30);
        dot(4.3, 3.4, P1, P1S, cell * 0.30);
        dot(3.0, 2.15, '#fbbf24', '#b45309', cell * 0.16);
                    break;
                }
                case 'yeastgo': {
        // 酵母: 出芽する丸い酵母と糖蜜
        dot(2.4, 3.4, '#fde68a', '#b45309', R * 1.1);
        dot(3.4, 2.6, '#fef3c7', '#b45309', R * 0.6);
        dot(4.6, 4.2, '#fde68a', '#b45309', R * 0.9);
        dot(5.2, 3.6, '#fef3c7', '#b45309', R * 0.5);
        c.fillStyle = 'rgba(217, 119, 6, 0.4)';
        c.beginPath(); c.ellipse(at(3,5).x, at(3,5).y, cell * 1.8, cell * 0.5, 0, 0, Math.PI * 2); c.fill();
                    break;
                }
                case 'yohengo': {
        // 窯変: 黒石→白石の変化矢
        dot(1.8, 3, P1, P1S);
        seg(2.6, 2.4, 3.8, 2.4, '#d97706', 1.8);
        seg(3.8, 2.4, 3.4, 2.0, '#d97706', 1.8);
        seg(3.8, 2.4, 3.4, 2.8, '#d97706', 1.8);
        dot(4.4, 3, P2, P2S);
                    break;
                }
                case 'yomigo': {
        // 黄泉の裂け目から手
        blk(3, 4.6, '#4c1d95', '#2e1065');
        seg(1.4, 4, 3, 5, '#2e1065', 2.4);
        seg(3, 5, 4.6, 4.2, '#2e1065', 2.4);
        dot(3, 3.4, '#a78bfa', '#6d28d9', cell * 0.3);
        seg(2.6, 3, 2.6, 2.2, '#a78bfa', 1.8);
        seg(3.4, 3, 3.4, 2.2, '#a78bfa', 1.8);
                    break;
                }
                case 'yorakugo': {
        // 瓔珞: 首飾りの弧と連なる珠
        c.beginPath(); c.arc(at(3, 2.4).x, at(3, 2.4).y, cell * 1.5, Math.PI * 0.15, Math.PI * 0.85); c.strokeStyle = '#d4af37'; c.lineWidth = 1.8; c.stroke();
        dot(1.7, 3.7, '#dc2626', '#991b1b', cell * 0.28);
        dot(2.4, 4.4, '#0ea5e9', '#0369a1', cell * 0.3);
        dot(3, 4.7, '#d4af37', '#92600e', cell * 0.34);
        dot(3.7, 4.4, '#0ea5e9', '#0369a1', cell * 0.3);
        dot(4.3, 3.7, '#dc2626', '#991b1b', cell * 0.28);
                    break;
                }
                case 'yubago': {
        // 湯葉: 引き上げた薄膜と鍋の湯気
        seg(0.8, 4.6, 5.2, 4.6, '#d6d3d1', 1.6);
        seg(1, 3.6, 2.2, 2.2, '#fbbf24', 2);
        seg(2.2, 2.2, 3.4, 3.4, '#fbbf24', 2);
        seg(3.4, 3.4, 5, 2.2, '#fbbf24', 2);
        dot(3, 5.2, '#fde68a', '#d97706', cell * 0.22);
        dot(1.4, 1.2, P1, P1S, cell * 0.2);
                    break;
                }
                case 'yukionnago': {
        // 雪女: 白い姿と凍った石と雪の結晶
        dot(2.6, 2.2, '#f8fafc', '#94a3b8', cell * 0.5);
        tri(2.6, 4.2, cell * 0.9, '#f8fafc', '#94a3b8', -Math.PI / 2);
        dot(4.4, 4.0, '#93c5fd', '#1d4ed8', cell * 0.34);
        seg(4.9, 1.2, 4.9, 2.4, '#bae6fd', 1.4);
        seg(4.3, 1.8, 5.5, 1.8, '#bae6fd', 1.4);
        seg(4.5, 1.4, 5.3, 2.2, '#bae6fd', 1.4);
        seg(5.3, 1.4, 4.5, 2.2, '#bae6fd', 1.4);
                    break;
                }
                case 'yuzengo': {
        // 友禅: 絵羽模様の斜め3連と花色
        dot(1.6, 4.4, P1, P1S); dot(3, 3, P1, P1S); dot(4.4, 1.6, P1, P1S);
        seg(1.6, 4.4, 4.4, 1.6, '#db2777', 1.6);
        dot(4.4, 1.6, '#f9a8d4', '#db2777', cell * 0.2);
        ring(4.4, 1.6, cell * 0.6, '#f472b6', 1.4);
                    break;
                }
                case 'zashikigo': {
        // 座敷: 畳の座席と上座の席次
        seg(1.4, 2.6, 4.6, 2.6, '#65a30d', 1.6);   // 畳の縁上
        seg(1.4, 4.8, 4.6, 4.8, '#65a30d', 1.6);   // 畳の縁下
        seg(3, 2.6, 3, 4.8, '#65a30d', 1.2);       // 畳の区切り
        dot(2.2, 3.6, P1, P1S, cell * 0.5);        // 上座の石
        dot(3.8, 3.8, P2, P2S, cell * 0.5);        // 下座の石
        txt('上', 2.2, 2.2, '#b45309', cell * 0.55);
                    break;
                }
                case 'zazengo': {
        // 座禅: 円相の中で坐る石
        c.beginPath(); c.arc(at(3, 3.2).x, at(3, 3.2).y, cell * 1.6, Math.PI * 0.2, Math.PI * 1.75); c.strokeStyle = '#57534e'; c.lineWidth = 2.2; c.stroke(); // 円相
        dot(3, 3.4, '#292524', '#000', cell * 0.7);    // 坐る石
        dot(3, 2.3, '#44403c', '#292524', cell * 0.32); // 頭
        seg(1.8, 4.6, 4.2, 4.6, '#78716c', 2);         // 座布団
        seg(2.4, 4.2, 3.6, 4.2, '#a16207', 1.6);       // 結跏の線
                    break;
                }
                case 'zigguratgo': {
                    // ジッグラト: 階段ピラミッドと頂点の光
                    c.fillStyle = '#d6b246'; c.strokeStyle = '#92610e'; c.lineWidth = 1.2;
                    [[0.9, 4.6, 4.2, 1.0], [1.4, 3.5, 3.2, 1.0], [1.9, 2.4, 2.2, 1.0], [2.4, 1.3, 1.2, 1.0]].forEach(([x, y, w, h]) => {
                        c.fillRect(at(x, y).x, at(x, y).y, w * cell, h * cell);
                        c.strokeRect(at(x, y).x, at(x, y).y, w * cell, h * cell);
                    });
                    dot(3, 0.85, '#fde68a', '#d97706', cell * 0.3);
                    break;
                }
                case 'zogango': {
        // 象嵌: 黒檀の地に嵌め込まれた異素材の文様
        blk(3.0, 3.0, '#44403c', '#1c1917');
        tri(2.4, 2.4, cell * 0.5, '#f8fafc', '#a8a29e');
        blk(3.8, 3.0, '#eab308', '#a16207');
        tri(2.8, 3.9, cell * 0.45, '#fb923c', '#c2410c', Math.PI / 2);
                    break;
                }
                case 'zuihitsugo': {
        // 随筆: 徒然に散った孤石と筆の一画
        dot(1.6, 1.8, P1, P1S, cell * 0.3);
        dot(4.4, 2.4, P1, P1S, cell * 0.3);
        dot(2.6, 4, P1, P1S, cell * 0.3);
        dot(4.8, 5, P1, P1S, cell * 0.3);
        seg(1, 5.4, 5.2, 5.8, '#57534e', 1.4);
                    break;
                }
                // == WAVE3 ICONS END ==
                default: // 未定義kind: 石+スパークル (wave2汎用)
                    dot(3, 3, P1, P1S);
                    c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.lineCap = 'round';
                    const sx = at(4.4, 1.6).x, sy = at(4.4, 1.6).y, r = cell * 0.42;
                    [[0, -r], [0, r], [-r, 0], [r, 0]].forEach(([dx, dy]) => {
                        c.beginPath(); c.moveTo(sx + dx * 0.35, sy + dy * 0.35);
                        c.lineTo(sx + dx, sy + dy); c.stroke();
                    });
                    break;
            }
        }

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { drawIcon, drawMolecule, gridLines, shade, P1, P1S, P2, P2S };
}
