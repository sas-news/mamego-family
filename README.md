# 変則碁シリーズ (MAMEGO family)

標準的な囲碁のルール (連・呼吸点・取り・コウ・地集計) をベースに、
特殊ルールや特殊碁石を加えたブラウザゲーム集。[MAMEGO](https://github.com/cerevisiae-fii/mamego) の派生。

**Play:** https://sas-news.github.io/mamego-family/

## ゲーム一覧

### ピース系 (連結碁石)

| ゲーム | 内容 |
|---|---|
| GO `normgo.html` | 標準的な囲碁 (派生のベース) |
| TETOGO `tetogo.html` | テトロミノ碁。7種テトロミノ・回転・ホールド・NEXTキュー |
| ALGO `algo.html` | アルカン碁。球棒モデルの炭化水素分子「碁カン」+ 碁カン図鑑 |
| PENGO `pengo.html` | ペントミノ12種、窒息領域 < 5 |
| CYCLOGO `cyclogo.html` | シクロアルカン環状分子「碁クロ」 |
| ALKENEGO `alkenego.html` | アルケン/アルキン。剛直な二重結合で回転不可 |
| POLYGO `polygo.html` | 毎手4連のポリマー鎖を自由に描画 |
| ASYMGO `asymgo.html` | 非対称ピースセット (黒:直鎖アルカン、白:分枝) |
| DRAFTGO `draftgo.html` | 対局前に碁カンを交互ドラフト |
| MAMEGO `mamego.html` | 原作の碁豆 (ドミノ2連) を通常囲碁エンジンで再実装 |
| TRIOGO `triogo.html` | 碁リオ=トリオミノ2種 (直鎖I・曲がりL、3連結) |
| QUADGO `quadgo.html` | 碁カク=2×2ブロックのみ |

### 盤面・配置ルール系 (通常碁石 + 特殊ルール)

| ゲーム | 内容 |
|---|---|
| TORUSGO `torusgo.html` | トーラス盤 (上下左右の端が繋がる) |
| DIAGO `diago.html` | 8近傍。斜めの連も繋がる |
| WALLGO `wallgo.html` | ランダム壁マス (置けない・呼吸点にならない) |
| GRAVGO `gravgo.html` | 重力ルール (最下段か石の直上のみ) |
| SPAWNGO `spawngo.html` | 繁殖ルール (自石隣接のみ配置可) |
| MIRRGO `mirrgo.html` | 対称ルール (縦中央線で鏡映して両側に置く) |
| GRAPHGO `graphgo.html` | 盤面が分子グラフ (結合=辺のみが道) |
| 3DGO `3dgo.html` | 3層立体盤、上下層も連・呼吸点 |
| KOGO `kogo.html` | 孤立ルール (自石隣接には置けない、全石単石) |
| RINGO `ringo.html` | 環状盤 (中央3×3が壁) |
| CROSSGO `crossgo.html` | 十字盤 (四隅が壁で削れる) |
| WORMGO `wormgo.html` | ワームホールペア (◎) が遠隔近傍を作る |
| CIRCLEGO `circlego.html` | 円盤碁 (隅のない円形盤面) |
| HALFGO `halfgo.html` | 陣地碁 (黒=左半分/白=右半分、中央列共通) |
| SPARSEGO `sparsego.html` | 離散碁 (いかなる石の隣にも置けない) |
| DARKGO `darkgo.html` | 暗闇碁 (自石近傍しか見えないフォグ) |

### 手順・勝敗系

| ゲーム | 内容 |
|---|---|
| TWICEGO `twicego.html` | 各手番で2石ずつ置く |
| KINGGO `kinggo.html` | 初手が王(♛)。王を取られると即負け |
| MAXGO `maxgo.html` | 先取ルール (10石先取で即勝利) |
| SANDGO `sandgo.html` | ハサミ取り (上下/左右に挟んだ敵石を捕獲) |
| REVERSEGO `reversego.html` | ハサミで敵石が自分の色に寝返る |
| PUSHGO `pushgo.html` | 置いた石が隣接する敵石を1マス押す |
| ATTRACTGO `attractgo.html` | 置いた石が直線2マス先の敵石を引き寄せる |
| TURNGO `turngo.html` | 着手ごとに盤面が90°回転 |
| NOGO `nogo.html` | 取る手は禁止。合法手なしで敗北 |
| LIMITGO `limitgo.html` | 置ける場所がなくなった側が即負け |
| BLASTGO `blastgo.html` | 隣接する敵石の連を無条件破壊 |
| HANDIGO `handigo.html` | 置碁ハンデ (2〜9子、コミ0.5目) |
| RUSHGO `rushgo.html` | 1手あたり制限時間、時間切れ=自動パス |
| LIVEGO `livego.html` | 活石得点 (盤上の生き石+アゲハマで勝負、地は数えない) |
| FUSEGO `fusego.html` | 融合ルール (隣接敵石が中立ブロックに中和) |
| GRAVEGO `gravego.html` | 墓標ルール (取られたマスは壁になり盤面が狭まる) |
| REAPGO `reapgo.html` | 連取ルール (取ったらもう1手、連鎖可) |
| FIRSTGO `firstgo.html` | 一撃ルール (最初の取りで即勝利) |
| TREASUREGO `treasurego.html` | 宝碁 (星マス◆を囲むと+5点) |
| SELFGO `selfgo.html` | 自爆碁 (自殺手が合法、自連は相手のアゲハマ) |

### 自動変化系

| ゲーム | 内容 |
|---|---|
| DECAYGO `decaygo.html` | 碁石に寿命 (8手で崩壊) |
| LIFEGO `lifego.html` | 着手ごとに盤面がライフゲーム1世代進化 |
| GROWGO `growgo.html` | 着手ごとに石が隣の空点へ増殖 |
| MOLEGO `molego.html` | 着手ごとに石がランダムに隣へ移動 |
| LAVAGO `lavago.html` | 溶岩碁 (8手ごとに外周が沈む) |
| ORBITGO `orbitgo.html` | 周回碁 (着手ごとに外周が1マス回転) |

## 共通機能

- ローカル / AI / オンライン (PeerJS) 対戦
- 1手戻る、sessionStorage による対局状態の保存、テーマ・サウンド設定
- 9・13・19路 (ALGO は 13/19/25路) の盤サイズ
- 各画面右上の「?」ボタンでルールモーダル (基本ルール + 派生ルール + 操作説明)

## 開発

- `gen_variants.js` — バリアント HTML を ALGO ベース (通常囲碁エンジン) から生成 (`node gen_variants.js`)
- `node test-logic.js` / `node test-algo.js` — TETOGO/ALGO のルールエンジンテスト (vm + DOM スタブ)
- `node test-variants.js` — 全バリアントの起動 + 固有ルールのスモークテスト
