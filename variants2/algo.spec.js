// ALGO — アルカン碁: アルカン分子「碁カン」(球棒モデル) を配置し合う変則囲碁
//   ※ かつて docs/algo.html 自体が全バリアントの生成ベースだった歴史のあるゲーム。
//     今は tools/base.html からの逆方向差分で生成される。
const K = require('../gen_kit.js');
module.exports = {
    file: 'algo.html',
    en: 'ALGO',
    jp: 'アルカン碁',
    prefix: 'algo',
    desc: 'アルカン分子「碁カン」(C₄〜C₆)。球棒モデル+碁カン図鑑',
    kind: 'alkane',
    spec: [
        ...K.rb('ALGO', 'アルカン碁', 'algo'),
        // 中性ベースの碁石スロットをアルカン碁のものに戻す
        [K.ONE, K.MOLECULES_BASE, K.MOLECULES_ALGO],
        [K.ONE, K.OCNT_BASE, K.OCNT_ALGO],
        [K.ONE, K.RCM_BASE, K.RCM_ALGO],
        [K.ONE, K.RC_BASE, K.RC_ALGO],
        [K.ONE, K.RV_BASE, K.RV_ALGO],
        [K.ONE, K.INFO_BASE, K.INFO_ALGO],
        // 盤サイズ 9/13/19 → 13/19/25 (アルカン碁のデフォルト構成)
        ...K.ALGO_SIZE_SPEC,
        // 初期ピース: STONE → ISOBUTANE
        [K.ONE, `let currentPieceType = 'STONE';`, `let currentPieceType = 'ISOBUTANE';`],
        [K.ONE, `? s.currentPieceType : 'STONE'`, `? s.currentPieceType : 'BUTANE'`],
        // 供給モード・トレイ・図鑑は休眠状態のままアルカン表記で残る (ALGO で有効化される)
    ],
};
