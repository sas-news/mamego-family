import asyncio
import json

REPO = "sas-news/mamego-family"
BASE_BRANCH = "devin/game-viability"

SLICES = {
    "w1a": "normgo.html tetogo.html algo.html pengo.html cyclogo.html alkenego.html polygo.html torusgo.html diago.html wallgo.html gravgo.html spawngo.html mirrgo.html twicego.html kinggo.html maxgo.html sandgo.html reversego.html pushgo.html attractgo.html turngo.html nogo.html limitgo.html growgo.html molego.html blastgo.html handigo.html decaygo.html lifego.html rushgo.html 3dgo.html asymgo.html draftgo.html graphgo.html mamego.html triogo.html kogo.html ringo.html crossgo.html livego.html fusego.html wormgo.html gravego.html reapgo.html quadgo.html circlego.html lavago.html halfgo.html sparsego.html firstgo.html treasurego.html darkgo.html orbitgo.html selfgo.html stargo.html biggo.html connectgo.html",
    "w1b": "centgo.html switchgo.html thundergo.html cylindgo.html moebiusgo.html quartergo.html escapego.html siphongo.html monogo.html reggo.html antigravgo.html fourgo.html pushchaingo.html twilightgo.html hydrago.html ghostgo.html kleingo.html zombego.html relaygo.html sumgo.html fuelgo.html stripego.html driftgo.html lastgo.html eyego.html brawlgo.html chaingo.html finitego.html copygo.html swampgo.html tidego.html pulsego.html recyclego.html libgo.html stonerain.html splitgo.html minigo.html grenadego.html infectgo.html bondgo.html rimgo.html budgetgo.html frontgo.html chargego.html shufflego.html taxgo.html greedgo.html crosswallgo.html polargo.html microgo.html jumpgo.html nokogo.html chaoticgo.html",
    "w2a": "alchego.html alterngo.html archergo.html archgo.html armorgo.html bankgo.html barbgo.html betgo.html billiardgo.html bingogo.html bishopgo.html blackjackgo.html blindgo.html blockgo.html bombgo.html bordergo.html bouncego.html bridgego.html burygo.html camogo.html cardgo.html cavego.html cellgo.html centrifugo.html centripetgo.html chambergo.html checkergo.html chessgo.html classgo.html cloakgo.html clockgo.html contractgo.html conveyorgo.html corego.html cornergo.html crowngo.html crumbgo.html curlgo.html cursego.html dartsgo.html decoygo.html diadgo.html dicego.html dimgo.html distgo.html dotgo.html dualgo.html dynastygo.html echogo.html",
    "w2b": "echolocgo.html edgego.html elastgo.html escalgo.html expandgo.html fadedgo.html fallgo.html fatego.html firego.html fishgo.html fissurego.html flaggo.html flankgo.html flipgo.html floatgo.html flockgo.html floodgo.html fortgo.html fragilego.html gachago.html geargo.html gemgo.html geysergo.html glassgo.html goalgo.html golfgo.html gomokugo.html halogo.html harborgo.html heavygo.html hexgo.html hexygo.html hillgo.html holego.html honeygo.html hourgo.html icego.html illusiongo.html invadergo.html islego.html isolatego.html itemgo.html jackpotgo.html kamigo.html knightgo.html leashgo.html leechgo.html levelgo.html lgo.html linkgo.html longgo.html",
    "w2c": "loopgo.html magego.html magnetgo.html mahjonggo.html marketgo.html martyrgo.html matchgo.html mazego.html medigo.html mergego.html meteorgo.html minego.html miragego.html moatsgo.html modgo.html moldgo.html nexusgo.html numbgo.html omnigo.html orbitalgo.html ossugo.html outgo.html overgo.html pacgo.html pacigo.html pairgo.html parasitego.html paritygo.html peakgo.html pentago.html phoenixgo.html piecechaingo.html pinggo.html pinogo.html pinwheelgo.html plaguego.html poisongo.html pokergo.html polego.html pondgo.html potgo.html primego.html prophgo.html pyrago.html quakego.html racego.html radargo.html railgo.html returgo.html reversigo.html",
    "w2d": "rivergo.html rollgo.html rookgo.html rotatego.html roulettego.html rowgo.html rustgo.html scarcego.html scattergo.html schrogo.html scoutgo.html sectorgo.html shogigo.html slidego.html slinego.html slitgo.html slotgo.html slothgo.html smokego.html snakego.html snatchgo.html spinngo.html spiralgo.html spongego.html stairgo.html sugorokugo.html surveygo.html swapgo.html sweepergo.html tectogo.html tetrisgo.html tgo.html tornago.html towergo.html trapgo.html trigo.html triplego.html twingo.html vampgo.html vortexgo.html votego.html wheelgo.html wildgo.html windgo.html winggo.html xgo.html xraygo.html ziggo.html zipgo.html zonego.html",
}

SCHEMA = {
    "type": "object",
    "properties": {
        "branch": {"type": "string"},
        "checked": {"type": "integer"},
        "flagged": {"type": "array", "items": {"type": "string"}},
        "fixed": {"type": "array", "items": {"type": "string"}},
        "unfixable": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
    },
    "required": ["branch", "checked", "flagged", "fixed", "unfixable", "notes"],
}

PROMPT_TMPL = """\
Repository: {repo} (a static site: ~310 standalone HTML files, each a self-contained Go-variant game).
Clone it, then create and check out a NEW branch off the shared base branch:
  git checkout -b devin/bughunt-{name} origin/{base}
The base branch contains tools/sim-game.js, a headless playout harness.

# Goal
The user reports that some of the 310 Go variants are not viable as games (e.g. ライフ碁 lifego — a Game-of-Life variant — and rotating-board variants where rotation strips liberties so play deadlocks/never ends). Audit YOUR SLICE of variants for game-breaking problems and FIX them so every variant is a playable, terminable game.

# Your slice (verify exactly these files; ignore all others)
{files}

# Detection method
1. Run the harness in batches of ~10 files (each run can take 1-3 min; use a long timeout and run several batches sequentially or in background):
   node tools/sim-game.js --plies 250 --repeat 2 <files...>
   The harness boots each variant's inline script in a Node vm sandbox (DOM stubbed) and plays full games via the game's own AI move enumerator (evaluateBestAiMove / handlePass / executeMove). Flags:
   - boot / sim-timeout / crash errors
   - 'early-deadlock' / 'no-first-move': no legal moves near game start
   - 'wipe@plyN': a move wiped ALL stones off the board
   - 'no-end': never reaches game over within the ply cap (real games must terminate: double-pass or a win condition)
   - 'result-NaN': scoring produced NaN/undefined
2. For every flagged variant, READ the generated HTML's variant-specific code (wave2: generated from variants2/<name>.spec.js; wave1: generated from gen_variants.js) and judge: is it a real defect (deadlock, unwinnable, unbounded, crash, rule that prevents all moves) or a false positive (e.g. normgo legitimately takes >250 plies)?
3. Also skim EVERY variant in your slice's spec/source for design-level breaks the sim may miss: a special move that's never legal, a turn that never flips, a board transform that can strand/instakill all stones, scoring that never triggers, an RNG setup that can make the first move impossible, etc.

# Fixing rules
- NEVER hand-edit generated variant HTML. Fix the source:
  - wave2 file X.html  -> edit variants2/X.spec.js, then run `node gen_wave2.js` (regenerates all wave2 HTML) and `node test-wave2.js`.
  - wave1 file X.html  -> edit its block in gen_variants.js, then run `node gen_variants.js` and `node test-variants.js`.
- Prefer MINIMAL rule tweaks that keep the variant's concept: e.g. rotate only every Nth move, exempt rotation-moved stones from immediate capture-clear, cap Life evolution steps, add a max-move auto-scoring rule, guarantee a baseline legal move. Do NOT delete variants or remove their signature mechanic.
- If a variant's spec declares a `test` string, extend it to cover the fix when practical.
- After fixing, re-run the harness on the fixed files: flags must be gone or explicitly justified in `notes`.
- Only touch files in YOUR slice. Do not edit index.html GAMES entries unless a fix changes a variant's one-line description; if so, keep the desc format identical.
- If a defect is truly unfixable without destroying the variant's identity, don't force it — put it in `unfixable` with a one-line reason.

# Deliverable
Commit all changes (specs/generator + regenerated HTML) on branch devin/bughunt-{name}, push it (do NOT open a PR), and report via structured output:
  branch, checked (# variants audited), flagged (file:issue one-liners), fixed (file:fix one-liners), unfixable (file:reason), notes (caveats).
"""

META = {
    "name": "mamego-viability-bughunt",
    "description": "Parallel audit+fix of all 310 Go variants for game-breaking defects (deadlock, non-termination, crashes)",
    "product": "mamego-family",
    "soft_time_limit_minutes": 50,
    "phases": [
        {
            "title": "audit+fix",
            "detail": "Each agent sim-plays its variant slice, fixes real defects, pushes a branch",
            "count": len(SLICES),
            "labels": list(SLICES.keys()),
        },
    ],
}


async def hunt(name, files):
    return await agent(
        PROMPT_TMPL.format(repo=REPO, name=name, base=BASE_BRANCH, files=files),
        phase="audit+fix",
        schema=SCHEMA,
        label=name,
        repos=[REPO],
    )


async def main():
    await register_workflow(META)
    names = list(SLICES.keys())
    results = await parallel([lambda n=n: hunt(n, SLICES[n]) for n in names])
    summary = {}
    for n, r in zip(names, results):
        summary[n] = {
            "branch": r.get("branch"),
            "checked": r.get("checked"),
            "flagged": r.get("flagged"),
            "fixed": r.get("fixed"),
            "unfixable": r.get("unfixable"),
            "notes": r.get("notes"),
        }
    log("RESULTS: " + json.dumps(summary, ensure_ascii=False))


asyncio.run(main())
