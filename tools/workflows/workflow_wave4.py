import asyncio
import json
import re

REPO = "sas-news/mamego-family"
BRANCH = "devin/wave4"
DOC = "/home/ubuntu/repos/mamego-family/ideas-wave4.md"

# ---- ideas-wave4.md から採用90件を抽出 ----
doc = open(DOC).read()
info = {}  # file -> (jp, rule)
for m in re.finditer(r'【W4B(\d)/([a-z0-9_]+)\.html】([^\s—\-]+)\s*[—\-]\s*(.+)', doc):
    b, f, jp, rule = m.group(1), m.group(2), m.group(3), m.group(4).strip()
    info[f] = (jp, rule)

# バッチ構成は冒頭の選定リストから
batches = {}
for m in re.finditer(r'\*\*W4B(\d) [^*]+\(30\)\*\*: ([a-z0-9_, ]+)', doc):
    batches[m.group(1)] = [s.strip() for s in m.group(2).split(',')]

SCHEMA = {
    "type": "object",
    "properties": {
        "batch": {"type": "string"},
        "pushed": {"type": "boolean"},
        "done": {"type": "array", "items": {"type": "string"}},
        "skipped": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
    },
    "required": ["batch", "pushed", "done", "skipped"],
}

def prompt_for(b, files):
    rows = "\n".join(f"- {f}: {info.get(f, ('', ''))[0]} — {info.get(f, ('', ''))[1]}"
                     for f in files)
    return f"""リポジトリ {REPO} (ブランチ {BRANCH}) で wave4 バッチW4B{b} の変則碁30個を実装してpushせよ。

## 手順
1. `git fetch origin && git checkout {BRANCH} && git pull --rebase origin {BRANCH}`
2. `docs/wave3-guide.md` `docs/wave2-guide.md` `docs/fx-guide.md` を読む。`variants2/hexgo.spec.js` `variants2/hillgo.spec.js` `variants2/bombgo.spec.js` が参照実装。
3. 下記30個について `variants3/<name>.spec.js` を1つずつ作成。各 spec は wave2-guide のフォーマットに厳密に従う (`...K.rb(...)` 先頭、`...K.STONE_SPEC` 最後、test 文字列に assert 3個以上)。
   ルールのアイデアは一行説明をベースに自分で肉付けしてよい。複雑すぎるものは骨格を保ったまま簡略化可。囲碁の基本 (交互着手・呼吸・取り・コウ・パス終局) は必ず残す。
   **絶対条件**: 先手だけが利益を得る機構にしない (対称的か後手救済を)。キーボード必須の操作を作らない — 特殊操作が必要なら onclick のボタンを追加すること。r/h/c キーは既存の ⟳・ホールドボタンに既に対応済みなので流用可。
4. 各バリアントに `variants3/icons/<prefix>.icon.js` を作成 (wave3-guideのアイコン節参照)。テーマを象徴する2-5要素の専用描画。汎用stoneアイコンに逃げないこと。
5. `node gen_wave3.js` が ALL OK になり、`node test-wave3.js` で自分の30ファイルの行が全て PASS になるまで繰り返す (他バッチの spec が混在していたらその失敗は無視してよい)。
6. 各バリアントについて `node tools/sim-game.js --plies 200 <file>` を実行し `ended=gameOver` が出ること (勝負がつかない・クラッシュはNG — その場合は強制終局ルールかバランスを調整して再確認)。
7. `git add variants3/<自分の30個の*.spec.js> variants3/icons/<自分の30個の*.icon.js> <対応する30個の*.html>` のみ add — 絶対に `git add -A` や他バッチのファイルを add しない。index.html, gen_kit.js, algo.html, gen_wave3*.js, test-wave3.js, docs/ 等は編集禁止。
8. `git commit -m "wave4 W4B{b}: 30 variants"` → `git pull --rebase origin {BRANCH}` → `git push origin {BRANCH}`。push が rejected されたら rebase して再 push を最大10回繰り返す。

## 対象バリアント (file名 | 日本語名 — ルール概要)
{rows}

## 完了条件
- 自分の30 spec が gen_wave3.js で欠落なく生成され test-wave3.js で全 PASS
- 各バリアントが sim-game.js で gameOver 到達
- icons/<prefix>.icon.js 全25件存在
- push 成功

結果は structured output で: batch="W4B{b}", pushed=true/false, done=[生成できたfile名], skipped=[諦めたfile名+理由], notes=バランス上の留意点。"""

META = {
    "name": "wave4-variants-fanout",
    "description": "3バッチ×30の新変則碁を子セッションで並行実装し devin/wave4 にpush (アイコン+バランス検証付き)",
    "product": "sas-news/mamego-family",
    "soft_time_limit_minutes": 60,
    "phases": [
        {"title": "implement", "detail": "各バッチ25バリアントを spec+icon 実装→生成→sim検証→push",
         "count": len(batches),
         "labels": [f"W4B{b}" for b in sorted(batches, key=int)]},
    ],
}

async def run_batch(b, files):
    try:
        r = await agent(
            prompt_for(b, files),
            phase="implement",
            schema=SCHEMA,
            label=f"W4B{b}",
            repos=[REPO],
        )
        log(f"W4B{b}: pushed={r['pushed']} done={len(r['done'])} skipped={len(r['skipped'])}")
        return r
    except WorkflowAgentError as e:
        log(f"W4B{b}: agent failed — {e}")
        return {"batch": f"W4B{b}", "pushed": False, "done": [], "skipped": files,
                "notes": f"agent error: {e}"}

async def main():
    await register_workflow(META)
    log(f"batches: {json.dumps({b: len(v) for b, v in batches.items()})}")
    results = await parallel([ (lambda b=b, v=v: run_batch(b, v)) for b, v in sorted(batches.items(), key=lambda kv: int(kv[0])) ])
    total = sum(len(r["done"]) for r in results)
    log(f"DONE. pushed variants: {total}/100")
    for r in results:
        if r["skipped"]:
            log(f"  {r['batch']} skipped: {r['skipped']}")

asyncio.run(main())
