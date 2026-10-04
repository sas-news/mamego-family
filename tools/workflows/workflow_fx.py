# 変則碁 演出改修ワークフロー: カテゴリ別スライスに子セッションを並行展開
# 使い方: run_workflow(script_path='workflow_fx.py')
import asyncio
import json

REPO = 'github.com/sas-news/mamego-family'
BASE = 'devin/fx-base'

# カテゴリ別バリアント割り当て (file名リスト)
SLICES = {
    'motion': [  # 回転・環流・渦: 石が動くのでfxSlideが主役
        'orbitgo', 'geargo', 'spinngo', 'pinwheelgo', 'wheelgo', 'orbitalgo',
        'vortexgo', 'centrifugo', 'centripetgo', 'curlgo', 'spiralgo', 'tornago',
        'cyclogo', 'turngo', 'sectorgo', 'railgo', 'loopgo', 'scattergo',
        'swapgo', 'driftgo', 'chaoticgo', 'flockgo', 'rowgo', 'polego',
    ],
    'move': [  # 移動・重力・押し・落下: 位置移動をアニメ化
        'fallgo', 'slidego', 'slinego', 'conveyorgo', 'escalgo', 'windgo',
        'rollgo', 'bouncego', 'gravgo', 'antigravgo', 'fourgo', 'pushchaingo',
        'pushgo', 'attractgo', 'magnetgo', 'rivergo', 'floodgo', 'zipgo',
        'elastgo', 'floatgo', 'snakego', 'molego', 'tectogo', 'stairgo',
        'heavygo', 'frontgo', 'crumbgo', 'expandgo', 'growgo', 'jumpgo',
        'longgo',
    ],
    'walls': [  # 壁・地形: 壁(3)の専用テクスチャが主役 (LAVAGO型)
        'wallgo', 'zombego', 'ghostgo', 'tidego', 'stonerain', 'moatsgo',
        'cavego', 'bordergo', 'fissurego', 'icego', 'glassgo', 'swampgo',
        'rustgo', 'moldgo', 'spongego', 'mazego', 'fusego', 'stripego',
        'crosswallgo', 'polargo', 'circlego', 'crossgo', 'ringo', 'gravego',
        'islego', 'harborgo', 'pondgo', 'holego', 'slitgo', 'cornergo',
        'edgego', 'chambergo', 'asymgo', 'quartergo', 'trigo', 'hexgo',
        'hexygo', 'halfgo',
    ],
    'boom': [  # 爆発・雷・炎・災厄: fxBurst/fxShake/閃光が主役
        'blastgo', 'grenadego', 'chaingo', 'thundergo', 'minego', 'meteorgo',
        'prophgo', 'geysergo', 'quakego', 'firego', 'plaguego', 'infectgo',
        'poisongo', 'parasitego', 'cursego', 'decaygo', 'martyrgo', 'bondgo',
        'vampgo', 'leechgo', 'burygo', 'fragilego', 'ossugo', 'kamigo',
        'pyrago', 'selfgo', 'reapgo', 'livego', 'armorgo', 'chargego',
    ],
    'dark': [  # 闇・霧・視認・幻影: 常時オーバーレイと見え隠れが主役
        'darkgo', 'blindgo', 'dimgo', 'fadedgo', 'camogo', 'cloakgo',
        'smokego', 'illusiongo', 'miragego', 'schrogo', 'xraygo', 'radargo',
        'echolocgo', 'scoutgo', 'twilightgo', 'decoygo', 'wormgo', '3dgo',
        'graphgo',
    ],
    'theme': [  # 石・盤デザイン改造: 牌/カード/テトリミノ等へ大胆改変
        'mahjonggo', 'pokergo', 'cardgo', 'dicego', 'sugorokugo', 'tetrisgo',
        'tetogo', 'chessgo', 'shogigo', 'checkergo', 'invadergo', 'pacgo',
        'pacigo', 'gomokugo', 'billiardgo', 'golfgo', 'dartsgo', 'archgo',
        'slotgo', 'jackpotgo', 'gachago', 'bingogo', 'blackjackgo',
        'roulettego', 'votego', 'bankgo', 'marketgo', 'racego', 'goalgo',
        'flaggo', 'corego', 'honeygo', 'gemgo', 'betgo', 'pinogo', 'mamego',
        'pengo', 'pentago', 'biggo', 'microgo', 'stargo',
    ],
    'event1': [  # イベント演出A: 蘇生・分裂・反転・呪文等に発動FX
        'lifego', 'pulsego', 'recyclego', 'phoenixgo', 'hydrago', 'alchego',
        'magego', 'itemgo', 'classgo', 'levelgo', 'medigo', 'contractgo',
        'draftgo', 'shufflego', 'echogo', 'numbgo', 'copygo', 'mirrgo',
        'siphongo', 'splitgo', 'mergego', 'switchgo', 'reversego',
        'reversigo', 'snatchgo', 'returgo', 'pinggo', 'relaygo', 'twingo',
        'pairgo', 'triplego', 'twicego', 'alterngo', 'rushgo', 'budgetgo',
        'surveygo', 'distgo', 'fatego', 'taxgo', 'greedgo',
    ],
    'event2': [  # イベント演出B: 得点・王・トポロジー・残りA半
        'normgo', 'alkenego', 'polygo', 'torusgo', 'diago', 'spawngo',
        'kinggo', 'maxgo', 'sandgo', 'nogo', 'limitgo', 'handigo', 'triogo',
        'kogo', 'quadgo', 'sparsego', 'firstgo', 'treasurego', 'connectgo',
        'centgo', 'cylindgo', 'moebiusgo', 'escapego', 'monogo', 'reggo',
        'kleingo', 'sumgo', 'fuelgo', 'lastgo', 'eyego', 'brawlgo',
        'finitego', 'libgo', 'minigo', 'rimgo', 'nokogo', 'archergo',
        'barbgo', 'bishopgo', 'blockgo',
    ],
    'event3': [  # イベント演出C: 残り全部 (B半)
        'bridgego', 'cellgo', 'clockgo', 'crowngo', 'diadgo', 'dotgo',
        'dualgo', 'dynastygo', 'fishgo', 'flankgo', 'flipgo', 'fortgo',
        'halogo', 'hillgo', 'hourgo', 'isolatego', 'knightgo', 'leashgo',
        'lgo', 'linkgo', 'matchgo', 'modgo', 'nexusgo', 'omnigo', 'outgo',
        'overgo', 'paritygo', 'peakgo', 'piecechaingo', 'potgo', 'primego',
        'rookgo', 'scarcego', 'slothgo', 'sweepergo', 'tgo', 'towergo',
        'trapgo', 'wildgo', 'winggo', 'xgo', 'ziggo', 'zonego',
    ],
}

# 実在するバリアント名 (= .html拡張子なし) に正規化 — 存在しない名前は警告して除外
SCHEMA = {
    'type': 'object',
    'properties': {
        'branch': {'type': 'string'},
        'changed': {'type': 'array', 'items': {'type': 'string'}},
        'skipped': {'type': 'array', 'items': {'type': 'string'}},
        'notes': {'type': 'string'},
    },
    'required': ['branch', 'changed', 'notes'],
}

PROMPT_TMPL = '''あなたは mamego-family (300種超の変則碁HTMLゲーム集) の演出改修を担当する。

## セットアップ
1. リポジトリをクローン: https://{repo}  (まだなければ `git clone https://github.com/sas-news/mamego-family.git`)
2. 作業ブランチ: `git fetch origin && git checkout -b devin/fx-{name} origin/{base}`

## 背景 (必読)
- 各バリアントは自己完結のスタンドアロンHTML。algo.html が共通テンプレート。
- **必ず `docs/fx-guide.md` を読んでから作業すること。** FXエンジンのAPI・壁テクスチャの差し替え方・実演例が書いてある。
- 実演例: LAVAGO (gen_variants.js 内の lavago ブロック: 溶岩テクスチャ+沈降演出)、ROTATEGO (variants2/rotatego.spec.js: 環流の fxSlide)、BOMBGO (variants2/bombgo.spec.js: 爆発 fxBurst+fxShake)。
- ソースの編集場所:
  - `variants2/<name>.spec.js` がある → そこを編集し `node gen_wave2.js` で再生成。
  - ない → `gen_variants.js` 内の `out('<name>.html', ...)` ブロックを編集し `node gen_variants.js` で再生成。
  - **生成済みHTMLを直接編集しない。** tetogo.html は手動管理で直接編集してよい。
  - **algo.html は全バリアントの共通テンプレート — 絶対に編集しない** (変更すると全310種に影響する)。
  - `index.html` は基本触らない (ルール説明文を変えた場合のみ desc 更新可)。

## 担当ファイル ({count}件)
{files}

## やること
各バリアントについて「そのルールが一目で分かる演出」を実装する:
- **石や壁が移動するルール** → fxSlide で実際の移動経路をアニメ化 (最重要。実際にどう動いたか分からないのが今の最大の問題)。
- **壁(3)や特殊マス(4)を使うルール** → そのルール専用のテクスチャ/描画にする (全部同じ灰色の壁は禁止。水・氷・溶岩・霧・沼・城壁・墓標などルールに合う質感を)。
- **爆発・雷・炎・感染・崩壊などのイベント** → fxBurst/fxGlow/fxShake/fxText で発動演出。
- **雰囲気のあるルール** → fxAmbient で常時オーバーレイ (闇・霧・雨・雪・泡・揺らめき)。
- **テーマ性の強いルール** → drawPieceShape/drawObstacleCell/盤描画を差し替え、碁石や盤そのもののデザインを変えてよい (牌・カード・駒・星・ダイヤ等)。
- ルールを微調整して演出と整合させてもよいが、ゲームとして成立しなくなる変更は禁止。
- 全バリアントに既に入っている自動演出 (着手リング・取り時の小爆発・壁変化の煙) と重複するものは足さない。**バリアント固有の「そのルールらしさ」を足すこと。**

## 品質ゲート (必須)
1. `node test-wave2.js` と `node test-variants.js` が全パス。
2. `node tools/sim-game.js --plies 120 <触った全ファイル.html>` で boot/進行エラーがないこと (no-end は既知仕様なら許容)。
3. **実際にブラウザで開いて目視確認**: `file://<絶対パス>/<name>.html` を Chrome で開き、2-3手打って演出が発火するか・描画が壊れてないか確認 (コンピュータツール使用。コンソールから `executeMove({{cells:[{{x:3,y:3}}]}}, 1)` 等で石を置ける。localStorage の `<prefix>-save-v1` を消してリロードすれば初期化)。少なくとも変更した中の代表3-5ファイルは必ず目視し、おかしければ直す。
4. `git add -A && git commit` して `git push -u origin devin/fx-{name}`。

## 報告
structured output: branch=ブランチ名, changed=実際に改修したfile名(html拡張子抜き)の配列, skipped=手を付けなかったfile名の配列, notes=特記事項 (ルール変更したもの・確認で気づいたこと)。
'''

META = {
    'name': 'fx-overhaul',
    'description': '変則碁300種の演出・アニメーション・専用テクスチャ改修をカテゴリ別に並行実装',
    'phases': [
        {'title': 'fx', 'detail': 'カテゴリ別スライスで演出改修', 'count': len(SLICES),
         'labels': list(SLICES.keys()), 'soft_time_limit_minutes': 60},
    ],
    'soft_time_limit_minutes': 60,
}


async def work(name, files):
    files_list = '\n'.join(f'  - {f}.html' for f in files)
    prompt = PROMPT_TMPL.format(
        repo=REPO.replace('github.com/', 'github.com/'), base=BASE,
        name=name, count=len(files), files=files_list)
    return await agent(prompt, phase='fx', schema=SCHEMA, label=f'fx-{name}',
                       soft_time_limit_minutes=60)


async def main():
    await register_workflow(META)
    names = list(SLICES.keys())
    log(f'FX改修 fan-out: {len(names)} スライス')
    results = await parallel([lambda n=n: work(n, SLICES[n]) for n in names])
    out = {}
    for n, r in zip(names, results):
        out[n] = r
        log(f"{n}: {len(r.get('changed', []))}件改修 branch={r.get('branch')}")
    log('RESULTS ' + json.dumps(out, ensure_ascii=False))

asyncio.run(main())
