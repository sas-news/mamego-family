// ============================================================
// 新規ゲーム アイコン雛形
//   使い方: variants3/icons/<icon名>.icon.js にコピーし、
//           icon 値を spec の icon: と一致させる。
//   body は 6x6 グリッド上に描く描画コード (ctx / cell / 座標部品が使える)。
//   参考: variants3/icons/*.icon.js に実例が多数ある。
// ============================================================
module.exports = {
    icon: 'mygo',   // spec の icon: と一致させる
    body: `// 座標部品 (gx,gy は 6x6 グリッド上の位置、cell = 1マスのpx幅):
//   dot(gx,gy,fill,stroke,r,alpha) 碁石     blk(gx,gy,fill,stroke) 正方形
//   seg(x1,y1,x2,y2,stroke,w)       直線     mol([[x,y]...],fill,stroke) 連結図形
//   ring(gx,gy,r,stroke,w)          円       txt(s,gx,gy,fill,h) 文字
//   tri(gx,gy,r,fill,stroke)        三角形
// 色: P1/P1S (黒石+縁), P2/P2S (白石+縁)。ctx / cell / W も直接使える。
// この例: 四隅に石を置く「隅碁」っぽい絵
dot(1, 1, P1, P1S); dot(5, 1, P1, P1S);
dot(1, 5, P1, P1S); dot(5, 5, P1, P1S);
seg(1, 1, 5, 5, '#f59e0b', 1.5);`,
};
