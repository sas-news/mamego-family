// site-config.js — サイト運用設定 (リリース時に自分の値を入れる)
// 全ページで site-common.js より先に読み込まれる。
window.MAMEGO_SITE = {
    // GitHubリポジトリ (owner/repo) — バグ報告先・ラベルに使用
    repo: 'sas-news/mamego-family',
    // サイトのベースURL (末尾スラッシュ必須) — OGP/シェアURLの生成に使用
    baseUrl: 'https://sas-news.github.io/mamego-family/',
    // GoatCounter サイトコード (例 'mamego' → https://mamego.goatcounter.com)。
    // 空のままだと計測スクリプトは読み込まれず、ランキング集計も行われない。
    goat: '',
    // Googleフォーム等の報告フォームURL。{slug} {name} はゲーム識別子に置換される。
    // 空のままだと「フォームで報告」メニューは出ない。
    reportForm: '',
};
