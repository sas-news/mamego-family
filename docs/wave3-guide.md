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

## VPARAMS — バリアント固有設定 (パラメータUI)

spec 配列に `K.params([...])` を1つ挿入すると、設定モーダルに「このゲームの設定」UIが自動生成される。ゲームコードは `P('key')` で現在値を読む。値は `localStorage['vpar:<file>']` に保存されリロード後も残る。`def` は必ず元のリテラルと同じ値にすること (デフォルト挙動を変えない)。

```js
K.params([
    { key: 'interval', label: 'イベント間隔', min: 1, max: 10, def: 4, unit: '手' },
    { key: 'radius',   label: '効果範囲',     min: 1, max: 5,  def: 2 },
    { key: 'bonus',    label: 'ボーナス',     min: 0, max: 10, def: 2, step: 0.5 },
    { key: 'mode',     label: '挙動', options: [{v:'a',l:'穏やか'},{v:'b',l:'激しい'}], def: 'a' },
]),
```

- 調整対象: イベント間隔・区域半径/範囲・個数・確率・得点係数・閾値・打ち切り手数 などバランスに効く定数すべて。
- `P('key')` は使用箇所で直接呼ぶ (トップレベルのconstに代入しても動くが、設定変更が即時反映されない)。`P('x') || <元の値>` でフォールバックする癖を付ける。
- ロード時に構築される構造 (区域Set等) を使う場合: `let` + rebuild関数化し、`function onVariantParam(p){ ... }` を同スコープに宣言すると変更時に即時再構築される (参照: variants3/yeastgo.spec.js)。
- label は日本語。min/max/def は静的な数値のみ (BOARD_SIZE依存の初期値は hint で説明するか適当な固定値に丸める)。
- 対象外: 盤面サイズ・対戦モード・コミ (共通設定が担当)。
