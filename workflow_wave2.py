import asyncio
import json
import re

REPO = "sas-news/mamego-family"
BRANCH = "devin/wave2"
DOC = "/home/ubuntu/repos/mamego-family/ideas-wave2.md"

# ---- ideas-wave2.md から 200 選定を抽出 ----
doc = open(DOC).read()
info = {}  # file -> (jp, rule)
for m in re.finditer(r'【B(\d)/([a-z0-9]+)\.html】([^\s—\-]+)\s*[—\-]\s*(.+)', doc):
    b, f, jp, rule = m.group(1), m.group(2), m.group(3), m.group(4).strip()
    info[f] = (jp, rule)
batches = {}  # batch -> [file,...] in canonical order
for m in re.finditer(r'\*\*B(\d) [^*]+\(25\)\*\*: ([a-z0-9, ]+)', doc):
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
    return f"""リポジトリ {REPO} (ブランチ {BRANCH}) で wave2 バッチB{b} の変則碁25個を実装してpushせよ。

## 手順
1. `git fetch origin && git checkout {BRANCH} && git pull --rebase origin {BRANCH}`
2. `docs/wave2-guide.md` を読む。`variants2/hexgo.spec.js` `rookgo.spec.js` `hillgo.spec.js` が参照実装。
3. 下記25個について `variants2/<name>.spec.js` を1つずつ作成。各 spec は guide のフォーマットに厳密に従う (`...K.rb(...)` 先頭、`...K.STONE_SPEC` 最後、test 文字列に assert 3個以上)。
   ルールのアイデアは一行説明をベースに自分で肉付けしてよい。複雑すぎるものは骨格を保ったまま簡略化可。囲碁の基本 (交互着手・呼吸・取り・コウ・パス終局) は必ず残す。見た目の演出 (CUE_STARS/CUE_GRID 等) を入れると尚良い。
4. `node gen_wave2.js` が ALL OK になり、`node test-wave2.js` で自分の25ファイルの行が全て PASS になるまで繰り返す (他バッチの spec が混在していたらその失敗は無視してよい)。
5. `git add variants2/<自分の25個の*.spec.js> <対応する25個の*.html>` のみ add — 絶対に `git add -A` や他バッチのファイルを add しない。index.html, gen_kit.js, algo.html, gen_wave2.js, test-wave2.js, docs/ 等は編集禁止。
6. `git commit -m "wave2 B{b}: 25 variants"` → `git pull --rebase origin {BRANCH}` → `git push origin {BRANCH}`。push が rejected されたら rebase して再 push を最大10回繰り返す。

## 対象バリアント (file名 | 日本語名 — ルール概要)
{rows}

## 完了条件
- 自分の25 spec が gen_wave2.js で欠落なく生成され test-wave2.js で全 PASS
- push 成功

結果は structured output で: batch="B{b}", pushed=true/false, done=[生成できたfile名], skipped=[諦めたfile名+理由], notes=所感。"""

META = {
    "name": "wave2-variants-fanout",
    "description": "8バッチ×25の新変則碁を子セッションで並行実装し devin/wave2 にpush",
    "product": "sas-news/mamego-family",
    "soft_time_limit_minutes": 55,
    "phases": [
        {"title": "implement", "detail": "各バッチ25バリアントを spec 実装→生成→テスト→push",
         "count": 8,
         "labels": [f"B{b}" for b in sorted(batches, key=int)]},
    ],
}

async def run_batch(b, files):
    try:
        r = await agent(
            prompt_for(b, files),
            phase="implement",
            schema=SCHEMA,
            label=f"B{b}",
            repos=[REPO],
        )
        log(f"B{b}: pushed={r['pushed']} done={len(r['done'])} skipped={len(r['skipped'])}")
        return r
    except WorkflowAgentError as e:
        log(f"B{b}: agent failed — {e}")
        return {"batch": f"B{b}", "pushed": False, "done": [], "skipped": files,
                "notes": f"agent error: {e}"}

async def main():
    await register_workflow(META)
    log(f"batches: {json.dumps({b: len(v) for b, v in batches.items()})}")
    results = await parallel([ (lambda b=b, v=v: run_batch(b, v)) for b, v in sorted(batches.items(), key=lambda kv: int(kv[0])) ])
    total = sum(len(r["done"]) for r in results)
    log(f"DONE. pushed variants: {total}/200")
    for r in results:
        if r["skipped"]:
            log(f"  {r['batch']} skipped: {r['skipped']}")

asyncio.run(main())
