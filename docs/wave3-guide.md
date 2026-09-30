# wave3+ バリアント作成ガイド (wave2ガイド + wave3追加分)

基本的な仕組みは docs/wave2-guide.md 通り。違いは以下:

- spec置き場は `variants3/*.spec.js`、生成は `node gen_wave3.js`、テストは `node test-wave3.js`
- **各バリアントに専用アイコン必須**: `variants3/icons/<prefix>.icon.js` を作成
- index.html は編集禁止 — `node gen_wave3_index.js` が spec の {file,en,jp,desc,kind,icon} と icon.js からカタログ行+drawIcon case を自動挿入する
- **キーボード必須操作は禁止**: 特殊操作 (切替・選択・ホールド以外の新UI操作) を作るならボタン等のタッチUIを必ず追加すること。r/h/c キー相当は既存 ⟳・ホールドボタンに既にマッピング済み
- **バランス必須**: 先手必勝・勝負がつかない構造はNG。シミュレーション `node tools/sim-game.js --plies 200 <file>` で `ended=gameOver` 必須。対称的な仕組み (両者に同じ効果) か後手救済を持たせること

## アイコン spec (variants3/icons/<prefix>.icon.js)

```js
module.exports = {
    icon: 'namego',        // spec の icon 値 (= index.html drawIcon の case 名)
    body: `               // case 本体 (c=ctx, W=描画幅, cell=6目格子1マス幅 px が使える)
        // 使える部品: dot(gx,gy,fill,stroke,r,alpha) 石
        //             blk(gx,gy,fill,stroke)         矩形ブロック
        //             bond(x1,y1,x2,y2,w)           結合線
        //             mol([[x,y]...],fill,stroke)    分子
        //             ring(gx,gy,r,stroke,w) seg(x1,y1,x2,y2,stroke,w)
        //             txt(s,gx,gy,fill,h) tri(gx,gy,r,fill,stroke)
        // 色: P1(黒石) P1S(黒縁) P2(白石) P2S(白縁)。6x6格子座標で指定
        dot(2, 2, P1, P1S); dot(3, 3, P2, P2S);
        tri(4, 1.5, cell * 0.5, '#f59e0b', '#b45309');
    `,
};
```

テーマを象徴する2-5要素の描画で十分。index.html 既存の `case` 群 (~2400行目手前) が実例300+。

## 対局バランスの考え方

- 「先手だけが利益を得る」機構 (先手のみイベント発動等) は NG — 両者に同じ周期で効くようにするか、後手にも同等の機会を
- 「取った側が一方的に強い」も偏りやすい — コストや副次効果で対称性を
- 終局不能を防ぐため、強制終局 (手数・区域・カウント) を持つルールはシミュレーションで gameOver 到達を確認する
