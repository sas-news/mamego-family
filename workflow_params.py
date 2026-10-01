import json, re, os, asyncio

REPO = "sas-news/mamego-family"
BRANCH = "devin/params-all"
_repo = "/home/ubuntu/repos/mamego-family"

spec_files = sorted(os.path.basename(f)[:-8]
    for f in os.listdir(f"{_repo}/variants2") + os.listdir(f"{_repo}/variants3")
    if f.endswith('.spec.js'))
w1 = re.findall(r"out\('([a-z0-9_]+)\.html'", open(f"{_repo}/gen_variants.js").read())

batches = {}
for i in range(0, len(spec_files), 45):
    batches[f"S{i//45+1}"] = {"kind": "spec", "files": spec_files[i:i+45]}
for i in range(0, len(w1), 54):
    batches[f"W{i//54+1}"] = {"kind": "w1", "files": w1[i:i+54]}

SCHEMA = {
    "type": "object",
    "properties": {
        "batch": {"type": "string"},
        "pushed": {"type": "boolean"},
        "done": {"type": "array", "items": {"type": "string"}},
        "skipped": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
    },
    "required": ["batch", "pushed", "done", "skipped", "notes"],
}

COMMON = """## 目的
各変則碁の「ゲームバランスに効く定数」を設定項目化し、設定モーダルの「このゲームの設定」から調整可能にする。

## 手順
1. `docs/wave3-guide.md` の「VPARAMS」節と `gen_kit.js` 末尾の VPARAMS コメントを読む。参照実装: `variants3/yeastgo.spec.js` (出芽間隔・窪み半径・位置をパラメータ化)。
2. 担当バリアントごとに:
   a. spec を読み、バランスに効く定数を洗い出す: イベント間隔 (N手ごと)、区域半径/範囲/サイズ、個数・枚数、確率、得点係数・ボーナス、閾値、打ち切り手数、効果の強さ/持続 など。
   b. `K.params([{key,label,min,max,def,step?,unit?,hint?}])` を spec 配列に1つ挿入 (K.rb の直後が目安)。def は必ず元のリテラルと同じ値 (デフォルト挙動を変えない)。min/max は元値の約1/4〜4倍の範囲で常識的に。label は日本語。選択肢型は options を使ってよい。
   c. 使用箇所のリテラルを `P('key') || <元の値>` に置き換える (フォールバック付き)。構造を事前構築する型 (区域Set等) は rebuild関数+`function onVariantParam(p)` パターン (yeastgo参照)、難しければそのパラメータは諦めてもよい。
   d. 1ファイルに0個〜数個のパラメータ。バランスに効かないもの (色・見た目だけの定数・描画オフセット) は対象外。盤面サイズ・対戦モード・コミは共通設定なので絶対に追加しない。
3. 自分のファイルだけ `node gen_wave2.js` / `node gen_wave3.js` / `node gen_variants.js` で再生成し、`node test-wave2.js` / `node test-wave3.js` / `node test-variants.js` で自分のバリアントの行が全て PASS になるまで繰り返す (他の失敗は無視)。
4. `node tools/sim-game.js --plies 200 <自分のファイル.html>` で全ファイル clean (ended=gameOver) になることを確認。FAILしたら原因を直すか、そのバリアントの変更をrevertして skipped に入れる。
5. `git add <自分のspecファイル> <生成された自分の*.html>` (wave1は `gen_variants.js` と自分の分のhtml)。`git add -A` 禁止。index.html, gen_kit.js, algo.html, gen_wave*.js, test-*.js, docs/ は編集禁止。
6. `git commit -m "params <バッチ名>: <個数> variants"` → `git pull --rebase origin devin/params-all` → `git push origin devin/params-all`。rejected なら rebase→push を最大10回。rebaseコンフリクトは自分のファイルだけ手で解決し、他者の変更を消さない。

## 注意
- spec フォーマット: spec は [モード, アンカー, 置換テキスト] のタプル列。K.params() はタプルを1個返すので spec 配列にそのまま挿入する。
- `K.params` はモジュール関数 (destructure不要、`K.params(...)` と書く)。wave1 (gen_variants.js) でも `K.params(...)` と書くこと。
- P() は使用点で呼ぶ。`const X = P('x')` をトップレベルでやると設定変更が反映されないので避ける (起動時値で固定される)。実行時評価される場所 (関数内・着手処理内) で呼ぶこと。
- 設定UIは min/max/step のスライダーまたは options セレクトのみ。自由テキスト入力は不可。
"""

def prompt_for(bid, info):
    kind, files = info["kind"], info["files"]
    if kind == "w1":
        target = "gen_variants.js 内の以下バリアント (out('NAME.html' のブロックを探して各自の配列のみ編集): " + ", ".join(files)
    else:
        target = "以下の spec ファイル (variants2/ または variants3/): " + ", ".join(files)
    return f"""リポジトリ {REPO} (ブランチ {BRANCH}) でバッチ{bid} のバリアント{len(files)}個に設定パラメータを追加してpushせよ。

対象: {target}

{COMMON}

結果は structured output で: batch="{bid}", pushed=true/false, done=[パラメータ化できたfile名], skipped=[諦めたfile名+理由], notes=留意点。"""

META = {
    "name": "params-fanout",
    "description": "全バリアントに VPARAMS 設定パラメータを子セッション並列で追加 (20 spec×45 + 2 wave1×54)",
    "product": REPO,
    "soft_time_limit_minutes": 60,
    "phases": [
        {"title": "implement", "detail": "各バッチのバリアントへ K.params + P() パラメータ化→生成→sim検証→push",
         "count": len(batches),
         "labels": list(batches.keys())},
    ],
}

async def run_batch(bid, info):
    try:
        r = await agent(
            prompt_for(bid, info),
            phase="implement",
            schema=SCHEMA,
            label=bid,
            repos=[REPO],
        )
        log(f"{bid}: pushed={r['pushed']} done={len(r['done'])} skipped={len(r['skipped'])}")
        return r
    except WorkflowAgentError as e:
        log(f"{bid}: agent failed — {e}")
        return {"batch": bid, "pushed": False, "done": [], "skipped": info["files"],
                "notes": f"agent error: {e}"}

async def main():
    await register_workflow(META)
    log(f"batches: {json.dumps({b: len(v['files']) for b, v in batches.items()})}")
    results = await parallel([(lambda b=b, v=v: run_batch(b, v)) for b, v in batches.items()])
    total = sum(len(r["done"]) for r in results)
    log(f"DONE. parametrized: {total}")
    for r in results:
        if r["skipped"]:
            log(f"  {r['batch']} skipped: {r['skipped']}")

asyncio.run(main())
