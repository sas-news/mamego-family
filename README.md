# 変則碁シリーズ (TETOGO family)

碁のルール (連・呼吸点・取り・コウ・地集計) に「つながったピース」を持ち込んだ
ブラウザゲーム集。[MAMEGO](https://github.com/cerevisiae-fii/mamego) の派生。

**Play:** https://sas-news.github.io/tetogo/

## ゲーム一覧

| ゲーム | 内容 |
|---|---|
| **TETOGO** `tetogo.html` | テトロミノ碁。7種テトロミノ・回転・ホールド・NEXTキュー |
| **ALGO** `algo.html` | アルカン碁。球棒モデルの炭化水素分子「碁カン」+ 碁カン図鑑 |
| PENGO `pengo.html` | ペントミノ12種、窒息領域 < 5 |
| TORUSGO `torusgo.html` | トーラス盤 (上下左右の端が繋がる) |
| DECAYGO `decaygo.html` | 碁石に寿命 (8手で崩壊) |
| LIFEGO `lifego.html` | 着手ごとに盤面がライフゲーム1世代進化 |
| RUSHGO `rushgo.html` | 1手あたり制限時間、時間切れ=自動パス |
| CYCLOGO `cyclogo.html` | シクロアルカン環状分子「碁クロ」 |
| ALKENEGO `alkenego.html` | アルケン/アルキン。剛直な二重結合で回転不可 |
| POLYGO `polygo.html` | 毎手4連のポリマー鎖を自由に描画 |
| 3DGO `3dgo.html` | 3層立体盤、上下層も連・呼吸点 |
| ASYMGO `asymgo.html` | 非対称ピースセット (黒:I/O/T、白:L/J/S/Z) |
| DRAFTGO `draftgo.html` | 対局前にピースを交互ドラフト |
| GRAPHGO `graphgo.html` | 盤面そのものが分子グラフ (結合=辺のみが道) |

## 共通機能

- ローカル / AI / オンライン (PeerJS) 対戦
- 1手戻る、sessionStorage による対局状態の保存、テーマ・サウンド設定
- 9・13・19路 (ALGO は 13/19/25路) の盤サイズ

## 開発

- `gen_variants.js` — バリアント HTML を TETOGO/ALGO から生成するジェネレータ (`node gen_variants.js`)
- `node test-logic.js` / `node test-algo.js` — TETOGO/ALGO のルールエンジンテスト (vm + DOM スタブ)
- `node test-variants.js` — 全バリアントの起動 + 固有ルールのスモークテスト
