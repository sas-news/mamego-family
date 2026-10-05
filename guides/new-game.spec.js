// ============================================================
// 新規ゲーム spec 雛形 — ルールを変えて「新しい碁」を作る
//
//   使い方:
//     1. このファイルを variants3/<あなたのゲーム>.spec.js にコピー
//        (ファイル名は file: から .html を除いた名前に揃えると分かりやすい)
//     2. MYGO / マイ碁 / mygo を自分の名前にすべて置き換える
//     3. 「ルール差分」セクションに自分のルールを書く
//     4. docs/new-game.icon.js もコピーして variants3/icons/ に置く
//
//   spec = 「ベース (tools/base.html) のどの文字列を何に置き換えるか」の列。
//   アンカーは gen_kit.js の K.* か自分で書いた完全一致文字列。
//   アンカーが見つからないと gen が MISSING で失敗する。
//   詳しいアンカー一覧は docs/wave3-guide.md と gen_kit.js を参照。
// ============================================================
const K = require('../gen_kit.js');

module.exports = {
    file: 'mygo.html',   // 出力 HTML 名。英小文字 + go.html、他ゲームと被らない一意名
    en:   'MYGO',        // 一覧に出る英字名
    jp:   'マイ碁',      // 日本語名 (○○碁)
    prefix: 'mygo',      // file から .html を除いた名前。セーブキー/ルームIDの接頭辞
    desc: '初手は四隅にしか置けない碁。',  // index.html のカードに出る1行説明
    kind: 'stone',       // アイコン種別。新規は 'stone' (通常碁石) がほぼ全て
    icon: 'mygo',        // variants3/icons/mygo.icon.js の icon 値と一致させる

    spec: [
        // --- 必須・先頭: タイトル/H1/セーブキー/ルームID を自分の名前に一括置換 ---
        ...K.rb('MYGO', 'マイ碁', 'mygo'),

        // --- ルール差分: [K.ONE, アンカー, 置き換え後のコード] ---
        //   アンカーは「ベースコード内の検索用文字列」。この例では
        //   「空いている交点への配置チェック」の直後に「初手は四隅のみ」を足す。
        //   追加するコードはベースのローカル変数 (cells / history / BOARD_SIZE 等) を読める。
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 初手は盤の四隅のみ合法
            if (history.length === 0) {
                const e = BOARD_SIZE - 1;
                if (!cells.every(p =>
                    (p.x === 0 || p.x === e) && (p.y === 0 || p.y === e))) return false;
            }`],

        // --- 任意: 設定モーダルの「このゲームの設定」に出る調整パラメータ ---
        //   K.params([{ key: 'n', label: '例の間隔', min: 1, max: 9, def: 3, unit: '手' }]),
        //   ルールコード内では P('n') で読む (未設定時は def が入る)。

        // --- ルール説明 (必須): ゲーム内「?」モーダルと index の情報枠に出る ---
        [K.ONE, K.INFO_BASE,
            '初手は四隅にしか置けない変則碁。<br>' +
            'PC: クリックで配置<br>' +
            'スマホ: 1タップ目プレビュー、2タップ目確定'],
        [K.ONE, K.RV_BASE, K.rv([
            '初手は盤の四隅にしか置けない',
            '二手目以降は通常の囲碁と同じ',
            '取り・コウ・コミも通常通り',
        ])],

        // --- 必須・最後: 碁カンを普通の碁石に戻す共通仕様 (消さない) ---
        ...K.STONE_SPEC,
    ],

    // ルールテスト。test-wave3.js が生成された HTML を VM で起動して実行する。
    // assert('説明', 条件) を最低3つ。
    // 使えるもの: board[y*BOARD_SIZE+x] / pieces / history / turn / captures /
    //             executeMove({cells:[{x,y}...]}, player) / isValidPlacement(cells, player)
    test: `board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};
assert('初手は隅に置ける', isValidPlacement([{x:0,y:0}], 1));
assert('初手は中央に置けない', !isValidPlacement([{x:4,y:4}], 1));
executeMove({cells:[{x:0,y:0}]}, 1);
assert('二手目は中央に置ける', isValidPlacement([{x:4,y:4}], 2));`,
};
