# 変則碁シリーズ (MAMEGO family)

標準的な囲碁のルール (連・呼吸点・取り・コウ・地集計) をベースに、
特殊ルールや特殊碁石を加えたブラウザゲーム集。[MAMEGO](https://github.com/cerevisiae-fii/mamego) の派生。

**Play:** https://sas-news.github.io/mamego-family/

**新しい変則碁を作るには:** [CONTRIBUTING.md](CONTRIBUTING.md) — spec+アイコンの2ファイルを置くだけでゲームが自動生成されます

## ゲーム一覧

全リストは自動生成の [VARIANTS.md](VARIANTS.md) を参照。以下は代表例。

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
| STARGO `stargo.html` | 碁ホシ=十字形5連結のみ |
| BIGGO `biggo.html` | 碁オオ=3×3ブロック9連結 |

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
| CYLINDGO `cylindgo.html` | 円筒盤 (左右端のみループ) |
| MOEBIUSGO `moebiusgo.html` | メビウス帯盤 (左右端が上下反転で接続) |
| QUARTERGO `quartergo.html` | 象限碁 (手番ごとに許可象限が回転) |
| CENTGO `centgo.html` | 中心碁 (中心からの円内のみ配置可、半径は手数で拡大) |
| KLEINGO `kleingo.html` | クライン瓶 (横反転+縦ループ) |
| ANTIGRAVGO `antigravgo.html` | 反重力 (最上段か石の直下のみ) |
| FOURGO `fourgo.html` | 四方重力 (手番ごとに重力方向が回転) |
| TWILIGHTGO `twilightgo.html` | 黄昏碁 (昼=自由、夜=自石隣接のみ) |
| REGGO `reggo.html` | 上限碁 (自連は最大3石) |
| STRIPEGO `stripego.html` | 縞碁 (奇数行は壁、偶数レーンのみ) |
| RELAYGO `relaygo.html` | 追撃碁 (相手の直前着手から距離4以内) |
| FUELGO `fuelgo.html` | 燃料碁 (着手は自石までの距離分の燃料を消費) |

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
| CONNECTGO `connectgo.html` | 連絡碁 (黒=上下辺/白=左右辺の連結で即勝利) |
| ESCAPEGO `escapego.html` | 脱出碁 (辺に接する連は不死) |
| SIPHONGO `siphongo.html` | 吸収碁 (取った敵連が自色に変わる) |
| MONOGO `monogo.html` | 単石碁 (2連以上は不死、単石のみ取れる) |
| PUSHCHAINGO `pushchaingo.html` | 連鎖押し碁 (押した敵石がさらに押す) |
| CHAINGO `chaingo.html` | 連鎖爆発碁 (取った空点の8方向の敵石も連鎖) |
| BRAWLGO `brawlgo.html` | 乱闘碁 (3方向以上敵に囲まれた石は個別に取れる) |
| EYEGO `eyego.html` | 眼碁 (最初に眼を作った側が即勝利) |
| LASTGO `lastgo.html` | 終着碁 (最後に石を置いた側が勝つ) |
| SUMGO `sumgo.html` | 実子碁 (得点=地+生き石+アゲハマ) |
| LIBGO `libgo.html` | 呼吸碁 (得点=自連の呼吸点合計+アゲハマ) |
| MINIGO `minigo.html` | 少子碁 (得点の少ない側が勝つミゼール) |
| FINITEGO `finitego.html` | 有限碁 (各プレイヤーの石は最大12個) |
| COPYGO `copygo.html` | 模倣碁 (相手の着手の点対称位置のみ可) |
| SPLITGO `splitgo.html` | 分裂碁 (7石以上の連は半分が敵化) |
| GRENADEGO `grenadego.html` | 榴弾碁 (取られた連が爆発し8方向を道連れ) |
| BONDGO `bondgo.html` | 結合碁 (敵連を取ると接触自連も道連れ) |
| INFECTGO `infectgo.html` | 感染碁 (孤立石が敵石を感染させる) |
| GREEDGO `greedgo.html` | 強欲碁 (アタリ状態なら取る手のみ合法) |
| CHARGEGO `chargego.html` | 溜め碁 (パスで次の石が5手間不死) |
| TAXGO `taxgo.html` | 関税碁 (敵陣への着手は相手に+1目) |
| CROSSWALLGO `crosswallgo.html` | 十字壁碁 (中央十字壁で盤が4区域に分断) |
| POLARGO `polargo.html` | 極地碁 (外周1周の回廊のみ有効) |
| MICROGO `microgo.html` | 微細碁 (5/7/9路の小盤) |
| JUMPGO `jumpgo.html` | 跳躍碁 (自石から距離2の点のみ着手可) |
| NOKOGO `nokogo.html` | 劫無碁 (コウ禁止なし) |
| CHAOTICGO `chaoticgo.html` | 混沌碁 (漂流・潮汐・壁落下が周期的に発動) |
| RIMGO `rimgo.html` | 淵碁 (外周の地は2倍計算) |
| BUDGETGO `budgetgo.html` | 手数碁 (60手で自動終局) |
| FRONTGO `frontgo.html` | 前線碁 (前線より上の石は取られない) |
| SHUFFLEGO `shufflego.html` | 混成碁 (15手ごとに全石が50%で色反転) |

### 自動変化系

| ゲーム | 内容 |
|---|---|
| DECAYGO `decaygo.html` | 碁石に寿命 (8手で崩壊) |
| LIFEGO `lifego.html` | 着手ごとに盤面がライフゲーム1世代進化 |
| GROWGO `growgo.html` | 着手ごとに石が隣の空点へ増殖 |
| MOLEGO `molego.html` | 着手ごとに石がランダムに隣へ移動 |
| LAVAGO `lavago.html` | 溶岩碁 (8手ごとに外周が沈む) |
| ORBITGO `orbitgo.html` | 周回碁 (着手ごとに外周が1マス回転) |
| SWITCHGO `switchgo.html` | 転換碁 (12手ごとに全石の色が反転) |
| THUNDERGO `thundergo.html` | 雷碁 (10手ごとに雷がランダムな連を破壊) |
| HYDRAGO `hydrago.html` | ヒドラ碁 (取られた石が隣の空点に復活) |
| GHOSTGO `ghostgo.html` | 幽霊碁 (取られたマスは幽霊として6手間塞がる) |
| ZOMBEGO `zombego.html` | ゾンビ碁 (取られた石は徘徊する中立壁) |
| DRIFTGO `driftgo.html` | 漂流碁 (8手ごとに全石がランダムに流れる) |
| TIDEGO `tidego.html` | 潮汐碁 (10手ごとに外周が水没↔復活) |
| PULSEGO `pulsego.html` | 脈動碁 (6手ごとに全連が呼吸点へ増殖) |
| STONERAIN `stonerain.html` | 石雨碁 (9手ごとにランダムな空点へ壁) |
| SWAMPGO `swampgo.html` | 沼碁 (沼地の石は6手で沈む) |
| RECYCLEGO `recyclego.html` | 再生碁 (取られた石は10手後に復活) |

## 共通機能

- ローカル / AI / オンライン (PeerJS) 対戦
- 1手戻る、sessionStorage による対局状態の保存、テーマ・サウンド設定
- 9・13・19路 (ALGO は 13/19/25路) の盤サイズ
- 各画面右上の「?」ボタンでルールモーダル (基本ルール + 派生ルール + 操作説明)

## サイト機能

- **共通ナビ** — 全ゲーム上部に「← 一覧 / ★お気に入り / 🎲ランダム / 🔗シェア / 🐞バグ報告」 (`tools/inject-site.js` で注入)
- **お気に入り** — `localStorage('mamego-favs')`。index で絞り込み可。★押下で GoatCounter に `fav/<slug>` イベント送信
- **ランキング** — index の「🏆人気順」。GoatCounter イベントを夜間 Action (`nightly-ranking.yml`) が集計 → `ranking.js` コミット
- **NEW/調整中バッジ** — 追加30日以内は NEW、`tools/health-flags.json` に書いたゲームは「調整中」
- **OGP** — 全ページに og:title/description/`og/<slug>.png` カード (`tools/og-image.js` で生成)
- **sitemap.xml / robots.txt** — `tools/build-manifest.js` で自動生成
- **バグ報告** — 🐞ボタンで診断情報 (slug/ビルド/盤サイズ/UA) をコピーし prefilled issue へ。`game:<slug>` ラベル自動付与 (`issue-game-label.yml`)
- **アナリティクス** — `site-config.js` の `goat` にサイトコードを入れると GoatCounter が有効化

## 開発

- `npm run gen` — 生成チェーン一式: `gen_variants.js` (wave1) → `gen_wave2.js` → `gen_wave3.js` → `gen_wave3_index.js` (index/icon-draw 更新) → `tools/build-manifest.js` (games.json/games.js/VARIANTS.md/sitemap/robots) → `tools/inject-site.js` (全HTMLへ共通部品注入)
- `npm run og` — OGPカード `og/*.png` を生成 (要 `npm install`・CJKフォント・ImageMagick)
- `npm run ranking` — GoatCounter 集計 → ranking.js (要 `GOATCOUNTER_CODE`/`GOATCOUNTER_TOKEN`)
- `node test-logic.js` / `node test-algo.js` — TETOGO/ALGO のルールエンジンテスト (vm + DOM スタブ)
- `node test-variants.js` — 全バリアントの起動 + 固有ルールのスモークテスト
- `tools/sim-game.js` — ランダム対局シミュレーション (健全性チェック)
- `tools/check-unique.js` — ゲーム名/ファイル名の重複・上書き衝突を検査 (PRチェック用)
- 新規ゲームの作り方は [CONTRIBUTING.md](CONTRIBUTING.md)
- `tools/health-flags.json` — 「調整中」バッジの手動フラグ (`{"file.html": "理由"}`)

生成物の再ビルドは `regen-assets.yml` が push 時に自動化。必要な Actions 変数:

| 種別 | 名前 | 用途 |
|---|---|---|
| Secret | `GOATCOUNTER_TOKEN` | ranking 集計 API |
| Variable | `GOATCOUNTER_CODE` | GoatCounter サイトコード |
