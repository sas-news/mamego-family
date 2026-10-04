// site-common.js — 全ゲームページ共通: ナビ配線 / お気に入り / シェア / バグ報告 / 計測
// site-config.js (設定) → games.js (カタログ) → このファイル の順に読み込む。
(function () {
    'use strict';
    var SITE = window.MAMEGO_SITE || {};
    var REPO = SITE.repo || 'sas-news/mamego-family';
    var GAMES = window.MAMEGO_GAMES || [];

    var file = (location.pathname.split('/').pop() || 'index.html');
    var slug = file.replace(/\.html$/, '');
    var titleText = (document.title || slug).replace(/\s*\|.*$/, '');

    // ---- GoatCounter ----
    if (SITE.goat) {
        var gs = document.createElement('script');
        gs.dataset.goatcounter = 'https://' + SITE.goat + '.goatcounter.com/count';
        gs.async = true;
        gs.src = 'https://gc.zgo.at/count.js';
        document.head.appendChild(gs);
    }
    // カスタムイベント送信 (集計側が 'event/fav/<slug>' 'event/play/<slug>' を拾う)
    function mcEvent(path) {
        try {
            if (window.goatcounter && typeof window.goatcounter.count === 'function') {
                window.goatcounter.count({ path: 'event/' + path, event: true });
            }
        } catch (e) { /* 計測失敗は無視 */ }
    }

    // ---- お気に入り (index.html と共有キー) ----
    var FAV_KEY = 'mamego-favs';
    function getFavs() {
        try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
        catch (e) { return new Set(); }
    }
    function saveFavs(s) {
        try { localStorage.setItem(FAV_KEY, JSON.stringify([].concat(Array.from(s)))); } catch (e) {}
    }
    function isFav() { return getFavs().has(file); }
    function toggleFav() {
        var s = getFavs();
        if (s.has(file)) { s.delete(file); saveFavs(s); return false; }
        s.add(file); saveFavs(s);
        mcEvent('fav/' + slug); // 追加時だけカウント
        return true;
    }

    // ---- トースト ----
    var toastEl = null, toastTimer = 0;
    function toast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
                'background:#3e2211;color:#f4e4bc;padding:8px 16px;border-radius:9999px;font-size:12px;' +
                'font-weight:700;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:opacity .2s;';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        toastEl.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; }, 1600);
    }

    function copyText(t) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return false; });
        }
        try {
            var ta = document.createElement('textarea');
            ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            var ok = document.execCommand('copy'); ta.remove();
            return Promise.resolve(ok);
        } catch (e) { return Promise.resolve(false); }
    }

    // ---- バグ報告 ----
    function diagInfo() {
        var lines = [
            'game: ' + titleText,
            'file: ' + file,
            'url: ' + location.href
        ];
        var build = document.querySelector('meta[name="mamego-build"]');
        if (build) lines.push('build: ' + build.content);
        try {
            var raw = localStorage.getItem(slug + '-save-v1');
            if (raw) {
                var s = JSON.parse(raw);
                if (s && s.boardSize) lines.push('boardSize: ' + s.boardSize);
                if (s && s.gameMode) lines.push('mode: ' + s.gameMode);
            }
        } catch (e) {}
        lines.push('ua: ' + navigator.userAgent);
        return lines.join('\n');
    }
    function githubIssueUrl() {
        return 'https://github.com/' + REPO + '/issues/new' +
            '?template=bug_report.yml' +
            '&title=' + encodeURIComponent('[' + slug + '] ') +
            '&labels=bug';
    }
    function report(via) {
        copyText(diagInfo()).then(function (ok) {
            if (via === 'copy') { toast(ok ? '診断情報をコピーしました' : 'コピーに失敗しました'); return; }
            if (ok) toast('診断情報をコピーしました (issueに貼ってください)');
            var url = via === 'form' && SITE.reportForm
                ? SITE.reportForm.replace('{slug}', encodeURIComponent(slug)).replace('{name}', encodeURIComponent(titleText))
                : githubIssueUrl();
            window.open(url, '_blank', 'noopener');
        });
    }

    // ---- ナビ配線 (文字ラベルのメニュー) ----
    var menuBtn = document.getElementById('mgMenuBtn');
    var menu = document.getElementById('mgMenu');
    var closeMenu = function () {
        if (menu) menu.classList.add('hidden');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    };
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = menu.classList.toggle('hidden') === false;
            menuBtn.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && e.target !== menuBtn) closeMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
    }
    var favBtn = document.getElementById('mgFav');
    if (favBtn) {
        var syncFav = function () {
            var on = isFav();
            favBtn.textContent = on ? 'お気に入り済み' : 'お気に入り';
            favBtn.classList.toggle('mg-faved', on);
            favBtn.setAttribute('aria-pressed', String(on));
        };
        syncFav();
        favBtn.addEventListener('click', function () {
            var on = toggleFav(); syncFav();
            toast(on ? 'お気に入りに追加しました' : 'お気に入りから外しました');
        });
    }
    var randBtn = document.getElementById('mgRand');
    if (randBtn) {
        randBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var pool = GAMES.filter(function (g) { return g.file !== file; });
            if (!pool.length) { toast('ゲーム一覧を取得できませんでした'); return; }
            location.href = pool[Math.floor(Math.random() * pool.length)].file;
        });
    }
    var shareBtn = document.getElementById('mgShare');
    if (shareBtn) {
        if (navigator.share) shareBtn.textContent = 'このページをシェア';
        shareBtn.addEventListener('click', function () {
            var text = titleText + ' | 変則碁シリーズ';
            if (navigator.share) {
                navigator.share({ title: text, url: location.href }).catch(function () {});
            } else {
                copyText(text + '\n' + location.href).then(function (ok) {
                    toast(ok ? 'シェア用にURLをコピーしました' : 'コピーに失敗しました');
                });
            }
            closeMenu();
        });
    }
    // バグ報告項目 (GitHub / フォーム / コピー) — メニュー内の data-report ボタン
    if (menu) {
        var gh = menu.querySelector('[data-report="github"]');
        var fm = menu.querySelector('[data-report="form"]');
        var cp = menu.querySelector('[data-report="copy"]');
        if (gh) gh.addEventListener('click', function () { closeMenu(); report('github'); });
        if (fm) {
            if (SITE.reportForm) {
                fm.classList.remove('hidden');
                fm.addEventListener('click', function () { closeMenu(); report('form'); });
            } else fm.classList.add('hidden');
        }
        if (cp) cp.addEventListener('click', function () { closeMenu(); report('copy'); });
    }
    var footBug = document.getElementById('mgFootBug');
    if (footBug) footBug.addEventListener('click', function (e) { e.preventDefault(); report('github'); });

    // ---- 対局開始イベント (盤面への最初のタップ/クリック) ----
    if (slug !== 'index') {
        var played = false;
        document.addEventListener('pointerdown', function (e) {
            if (played) return;
            if (e.target && e.target.id === 'boardCanvas') {
                played = true;
                mcEvent('play/' + slug);
            }
        }, true);
    }

    // 外部 (index.html 等) から使うAPI
    window.MAMEGO = window.MAMEGO || {};
    window.MAMEGO.event = mcEvent;
    window.MAMEGO.getFavs = getFavs;
    window.MAMEGO.slug = slug;
})();
