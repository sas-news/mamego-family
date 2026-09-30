# 変則碁アイデア 200 + 選定 100 (wave3)

wave3サイクル1の新規200案。候補母集団は本書200案 + rejected-pool.txt(wave2棄却298案)。
`【W3B#/file.html】` = 採用 (バッチ番号/ファイル名)。採用基準: 実装済み310種と非重複・プレイの面白さ・シミュレーション可能なゲーム構造。

## A. ボード構造・空間 (新トポロジー)
1. 【W3B1/layergo.html】層積碁 — 盤は上下3層。着手はどの層でも可、同座標縦貫は近傍扱い
2. 【W3B1/stripgo.html】帯碁 — 盤は幅5の無限帯、端がループ。上下端なしの長い戦線
3. 【W3B1/crowngo2.html】王冠碁 — 歯形の外周盤、凹部は陥穽で呼吸点-1
4. 【W3B1/forkgo.html】分岐碁 — Y字に分岐した2本の腕盤。分岐点争奪が核心
5. 【W3B1/mirrorgo.html】鏡面碁 — 左右対称盤、一手置くと鏡像位置にも自動的に同じ石が置かれる
6. 【W3B1/shrinkgo.html】縮小碁 — 10手ごとに外周1マスが崩落して盤が縮む
7. 【W3B1/dungo.html】地下碁 — 盤の下に隠し層が存在し、特定点で潜行・浮上
8. 【W3B1/cloudgo.html】雲碁 — 浮遊島状の盤、島間は細い筋で接続
9. 【W3B1/wafergo.html】薄板碁 — 盤が「表」と「裏」の2面。裏面はひっくり返して別盤として進行
10. 【W3B1/spokego.html】車軸碁 — 中心から放射する8本の線のみが着手可能筋
11. 【W3B1/covego.html】入江碁 — 海岸線のような凹凸盤、湾内は呼吸点+1の好地
12. 【W3B1/tunnelgo.html】隧道碁 — 盤内に4本のトンネル、入口→出口へ石が瞬間移動
13. 【W3B1/raftgo.html】筏碁 — 複数の小盤がロープで繋がった浮筏、筏同士の距離が手番で変わる
14. 【W3B1/domgo.html】半球碁 — ドーム状に見立てた盤、中央が「高い」位置で周辺へ転がる力が働く
15. 【W3B1/petalgo.html】花弁碁 — 中心から6弁の花形盤、弁と弁の間は切れ目で分断

## B. 石の属性・素材
16. 【W3B1/stickygo.html】粘着碁 — 石は隣の石に触れると「粘着」し、以後その連は分離不能に
17. 【W3B1/batterygo.html】電池碁 — 石に充電量(1-3)。隣接敵石に放電して弱める、切れたら死滅
18. 【W3B1/magnetgo2.html】極性碁 — 石にN極S極。同極は反発(置けない)・異極は引き寄せ(近傍扱い)
19. 【W3B1/ghostgo2.html】幽体碁 — 打った石は3手間「幽霊状態」で取られない・呼吸もしない
20. 【W3B1/crystalgo.html】結晶碁 — 石は4連で結晶化。結晶は取られないが着手点にもならない
21. 【W3B1/slimego.html】粘体碁 — 取られた石は跡に粘液を残し、次の1手はそのマスに置けない
22. 【W3B1/mummgo.html】干乾碁 — 呼吸点0の連は即死せず「ミイラ化」して盤に残り、相手が解放するまで地に数えない
23. 【W3B1/embergo.html】残火碁 — 取られた石の跡は2手間「余燼」として熱を持ち、敵は置けない
24. 【W3B1/seedgo.html】種子碁 — 石は配置時に「種」。3手後に発芽して近傍1マスへ新石が生える
25. 【W3B1/shadowgo.html】影碁 — 各石は光の方向に影を落とし、影のマスは敵の呼吸点にならない
26. {rustgo2}錆蝕碁 — 古い石(10手経過)は錆びて脆くなり、1呼吸減で取られる
27. {wetgo}濡衣碁 — 水たまりマスの石は重くなり取られにくいが動かせない
28. 【W3B2/mirrorstonego.html】鏡石碁 — 鏡面石は取られると代わりに隣接敵石1つが消える
29. 【W3B2/swapstonego.html】交替石碁 — 石は着手後5手ごとに色が反転する
30. 【W3B2/glowgo.html】輝石碁 — 石は近傍連結数に応じて輝き、輝きが強い石はアゲハマ倍率

## C. 手番・タイム構造
31. 【W3B2/pendulumgo.html】振子碁 — 手番は交互でなく振り子式: 1,2,2,1,1,2,2,1… の繰り返し
32. 【W3B2/handovergo.html】引継碁 — 10手ごとに盤面がそのまま色反転して続行
33. 【W3B2/crisisgo.html】危機碁 — 敗勢側は「捨身の一手」として2連続着手を1回使える
34. 【W3B2/splitturngo.html】分掌碁 — 各プレイヤーは「配置フェーズ」「除去フェーズ」の2段構え手番
35. 【W3B2/stormgo.html】嵐碁 — 15手ごとに「嵐手番」: この手だけは石ではなく壁を1個置ける
36. 【W3B2/echo2go.html】残響碁 — 自分の前回の手の座標が残響となり、そこは次の手で着手不可
37. 【W3B2/doubledown.html】倍返碁 — 自分だけ「倍返し宣言」で同じ手をもう一度打てる(1局1回)
38. 【W3B2/outlastgo.html】耐久碁 — パスは「休養」: パスした側は石の呼吸点が1手だけ+1
39. 【W3B2/rhythmgo.html】拍子碁 — 4拍子: 弱拍は1石、強拍(4手目)は2石置ける
40. 【W3B2/delaygo.html】遅延碁 — 着手は即座に反映されず2手後に盤面に現れる(予約着手)

## D. 経済・リソース・システム
41. {minego2}鉱山碁 — 盤上の鉱山マスの隣に石を置くと鉱石+1。鉱石3個で追加一手
42. {farmgo}農耕碁 — 空点の領地は「畑」として収穫ポイントを生む。畑の隣に石を置くと倍増
43. {loango}融資碁 — 不利時に「融資」として石を2個追加できるが終局時に借金として地-3
44. {stockgo}株式碁 — 盤面の各区域が「株」。区域を制圧すると配当ポイントが入る
45. {forgego}鍛冶碁 — 取った石は資源になり、3個消費で盤上の石を1つ「鋼石化」(取られない)
46. {auctiongo}競売碁 — 5手ごとに中央の特典(追加着手等)が競売にかかり、地を賭けて入札
47. {inflationgo}膨張碁 — 経過手ごとに石の価値が目方で変動、早期の地は価値減衰
48. {taxgo2}関税碁 — 相手領地に侵入する手は「関税」として相手に石1個を献上
49. {wager}賭金碁 — 着手時に1-3の賭け点を宣言。取られたら賭け点分を相手に渡す
50. {rentgo}地代碁 — 敵の領地内に石を維持する手は、手番ごとに家賃1ポイントを払う

## E. 自然・天候・季節
51. 【W3B2/springgo.html】季節碁 — 20手周期で春夏秋冬が巡り、春=石成長/夏=活発/秋=枯渇/冬=休眠
52. 【W3B2/tidepoolgo.html】潮間碁 — 満潮・干潮周期で盤の辺縁が水没・露出する
53. 【W3B2/eclipsego.html】日食碁 — 日食手では全石の色が反転する
54. 【W3B2/monssoongo.html】雨季碁 — 雨季は低地が水没、乾季は回復。水没中の石は流される
55. 【W3B2/droughtgo.html】干ばつ碁 — 水源から遠い石は渇きで徐々に弱る
56. 【W3B2/foggo2.html】濃霧碁 — 霧の帯が盤を移動し、霧内の石は不可視・着手不可
57. 【W3B2/volcango2.html】噴火碁 — 中央の火山が周期で噴火、溶岩流で経路上の石を全て焼失
58. 【W3B2/snowgo.html】雪崩碁 — 山頂方向から雪が滑落、積もったマスは3手間凍結
59. 【W3B2/termitego.html】蟻塚碁 — シロアリの通路が盤を這い回り、通路上の石は食われて消える
60. 【W3B2/magnetstormgo.html】磁暴碁 — 磁暴の手は盤上の石の極性がランダム反転

## F. 情報・心理・錯覚
61. 【W3B2/mirage2go.html】蜃気楼碁 — 相手の視点では自分の石が1マスずれて見える(実座標は正確)
62. 【W3B2/puppetgo.html】傀儡碁 — 自分の手番で相手の石を1つ「指す」(傀儡操作)。自石は配置しない
63. 【W3B3/oracle2go.html】神託碁 — 5手ごとに次の5手を予言表示。予言の手を打つとボーナス
64. 【W3B3/paintergo.html】絵画碁 — 石ではなく「筆」で描く。筆の軌跡は3手間残り線が途切れるまで有効
65. 【W3B3/inkgo.html】墨染碁 — 自分の石の周囲が墨で滲み、滲んだ領域は相手の着手を妨げる
66. 【W3B3/chefgo.html】料理碁 — 石は食材。取ると「調理済み」で得点+、生のままは価値半減
67. 【W3B3/detectivego.html】推理碁 — 相手の意図を推理表示。正しく推測すると予告ボーナス
68. 【W3B3/narrativego.html】物語碁 — 手が進むと盤面に「物語テキスト」が刻まれ、結末で地が変動
69. 【W3B3/dreamgo.html】夢幻碁 — 10手周期で現実盤と夢盤が入れ替わる
70. 【W3B3/bluffgo.html】詐称碁 — 自分の手に「偽の強さ」を宣言。相手が見抜けば宣言無効+罰則

## G. カード・ゲーム要素
71. 【W3B3/deckgo.html】山札碁 — 手札5枚から石配置カードをプレイ。特殊カード(爆発/交換/複製)混在
72. 【W3B3/tarotgo.html】占札碁 — 着手するたびタロットカードを引き、その運命効果が手に適用
73. 【W3B3/dicebuildgo.html】骰子建築碁 — 出目の数だけ石を連続配置できる
74. 【W3B3/trickgo.html】悪戯碁 — 相手に「悪戯カード」を1手に1度押し付けられる(視覚妨害等)
75. 【W3B3/bingolinego.html】釣合碁 — 盤の対角線を自分の石で結ぶとビンゴボーナス得点
76. 【W3B3/roulette2go.html】回転盤碁 — ルーレットが止まった区域だけがその手番で着手可能
77. 【W3B3/lotterygo.html】宝籤碁 — 着手でくじ引き。当たれば追加石・外れれば次の手番スキップ
78. 【W3B3/dominogo.html】骨牌碁 — ドミノ牌を積み立て、倒れた牌の列が石になる
79. 【W3B3/scrabblogo.html】文字碁 — 石ではなく文字タイル。隣接で単語を作るとボーナス地
80. 【W3B3/jengago.html】抜積碁 — 石は積み木。取る代わりに「抜く」: 抜いた石が自分の得点、盤が崩れたら負け

## H. 移動・動作・戦闘
81. 【W3B3/knight2go.html】跳馬碁 — 石は置く代わりに桂馬跳びで移動できる(移動碁)
82. 【W3B3/pushrowgo.html】列推碁 — 石を置くとその列の敵石を1マスずつ押し出す
83. 【W3B3/dragon2go.html】竜巻碁 — 竜巻が盤を横断し、通路上の石を吹き飛ばす
84. 【W3B3/spearheadgo.html】矛先碁 — 石は直線状に伸びる「矛」。先端で敵を貫くと得点
85. 【W3B3/hurdlego.html】跳欄碁 — 自石を1つ飛び越えて置くことが可能(飛越手)
86. 【W3B3/lungego.html】突撃碁 — 自石の連が敵に接する時「突撃」で敵列を1マス後退させられる
87. 【W3B3/wriggle.html】蠕動碁 — 連が「蠕動」で1マスずつ匍匐移動できる(石の並べ替え)
88. 【W3B4/divego.html】潜水碁 — 石は盤下に潜って他の石の下を通過・浮上できる
89. 【W3B4/sparrgo.html】対打碁 — 石を置くと対峙する敵石と「対打」: 強さ比較で敗者が消える
90. 【W3B4/vortex2go.html】旋風碁 — 置いた石の周囲が時計回りに1マスずつ回転する

## I. 特殊勝利・目的
91. 【W3B4/templego.html】寺院碁 — 中央の寺院区域を4連以上で囲むと即勝ち
92. 【W3B4/flag2go.html】旗揚碁 — 自陣の旗点に旗を3本立てると勝ち。旗は石の3連結で立つ
93. 【W3B4/crown2go.html】戴冠碁 — 自分の石で王冠形(菱6連)を作ると即勝ち
94. 【W3B4/escapego2.html】脱走碁 — 自陣から敵陣の端まで石を1本繋げると勝ち
95. 【W3B4/circle2go.html】環状碁 — 自分の石で完全な環(閉曲線)を作ると環内を得点+環自体は無敵
96. 【W3B4/pyramid2go.html】三角碁 — 石で正三角形を作ると内部の敵石を全取り
97. 【W3B4/zigguratgo.html】神殿碁 — 階段状に石を積み上げ、頂点に到達すると勝ち
98. 【W3B4/colonygo.html】植民碁 — 盤を植民地化: 各区域の過半数を握った側が区域の領主になる
99. 【W3B4/dominiongo.html】版図碁 — 終局時に最大連結区域を持つ側が勝ち
100. 【W3B4/sigilgo.html】印章碁 — 特定の幾何学模様(3x3)を刻むとその区域を封印・得点化

## J. 物理・力学系
101. 【W3B4/orbit2go.html】軌道碁 — 石は「衛星」として周回し、軌道交差で衝突・結合する
102. 【W3B4/springboardgo.html】跳床碁 — 特定マスはトランポリンで、石が別マスへ跳ねる
103. 【W3B4/chainreact.html】連鎖碁 — 石が取られると隣接同士も連鎖して反応(制限付き連鎖)
104. 【W3B4/pendulum2go.html】振子碁2 — 各石が独自の振子周期で隣へ移動する
105. 【W3B4/marblego.html】玉石碁 — 石は球体として扱われ、坂を転がり落ちて集まる
106. 【W3B4/collidego.html】衝突碁 — 石を投げると直線的に滑り、他石と衝突して反射・結合
107. 【W3B4/pulleygo.html】滑車碁 — 一方を持ち上げると他方が落ちる滑車構造の盤
108. 【W3B4/capsulego.html】カプセル碁 — 石はカプセル入り。取られると中身(強化石等)が飛び出す
109. 【W3B4/levergo.html】梃子碁 — 中央の支点を軸に、一方に置くと他方の石が浮く(呼吸-1)
110. 【W3B4/wave2go.html】波動碁 — 着手の衝撃が波として伝播し、波の重なりで石が揺れる

## K. 生態・進化・生命
111. 【W3B4/predatorgo.html】捕食碁 — 石は食物連鎖: 草食→肉食→頂点。下位を食って成長
112. 【W3B4/mutatego.html】変異碁 — 取られた石の跡にランダム変異体が生まれる
113. {herdgo}群れ碁 — 同種の石が3個以上固まると「群れ」として一括移動できる
114. {nestgo}巣作碁 — 自陣に「巣」を作ると毎手1石ずつ自動補充される
115. {symbiogo}共生碁 — 敵味方の石が隣接すると「共生」して両者とも強化
116. {fossilgo}化石碁 — 古い石は化石となり、取られないが呼吸もしない障害物になる
117. {hivego}蜂巣碁 — 蜂群モデル: 女王石を守り、働き蜂が敵を追い出す
118. {reefgo}礁岩碁 — 珊瑚のように石が徐々に繁殖・隣接へ拡大する
119. {packgo}群狼碁 — 3匹以上の群れで囲むと即捕獲(通常より少ない呼吸で取れる)
120. {evolvego}進化碁 — 石は取られるたび進化段階が上がり、最終形は無敵

## L. 抽象・数学・論理
121. {prime2go}素数碁 — 素数座標(2,3,5,7…)のみ着手可能
122. {fibogo}継子碁 — 手番の石数がフィボナッチ数列 (1,1,2,3,5,8…) で供給
123. {matrixgo}行列碁 — 盤は行列で、着手は行・列の線形変換を引き起こす
124. {parity2go}偶奇碁 — 偶数手番は偶数座標、奇数手番は奇数座標のみ
125. {torus2go}環面碁 — 球面→トーラス→クラインの壷と位相が変化する盤
126. {graph2go}頂点碁 — 盤はグラフ理論の頂点集合、辺が存在する点同士が近傍
127. {fractalgo} fractal碁 — 盤の各点が更に小盤に分岐する階層構造
128. {quantumgo}量子碁 — 石は「重ね合わせ」で複数座標に存在し、観測(着手)で確定
129. {chaosgo2}混沌碁 — 微小な初期差が指数増大するカオス系盤
130. {infintygo}無限碁 — 盤は概念的に無限、端はどこまでも拡張される

## M. スポーツ・競技
131. {archerygo}弓術碁 — 石の代わりに矢を放ち、的(敵石)を射抜く
132. {fencinggo}剣術碁 — 石を置くと「剣の一線」が走り、交差した敵石を貫く
133. {wrestlingo}相撲碁 — 押し出し競争: 取る代わりに相手の石を盤外に押し出す
134. {marathongo}長走碁 — スタートからゴール(盤端)まで石を連結させる競走
135. {hockeygo}氷球碁 — 石はパック。押すと氷上を滑り、敵ゴールに入ると得点
136. {poloballgo}馬球碁 — 馬上競技風: 石はボールで、囲んで自分のゴールに入れる
137. {javelingo}投槍碁 — 槍を投げて直線上の敵石を貫通させる
138. {swinggo}盪揺碁 — ブランコのように石が前後に揺れ、揺れの範囲で攻撃
139. {skigo}滑降碁 — 斜面を滑る石、カーブで方向転換しながら敵を削る
140. {vaultgo}跳馬碁2 — 石を跳び箱のように跳ねさせて配置する

## N. 日常生活・社会
141. {trafficgo}交通碁 — 盤は道路網。石は車で、渋滞(囲み)で動けなくなる
142. {buildgo}建築碁 — 石は建材。積み上げて「ビル」を作ると高層得点
143. {gardengo}庭園碁 — 石は植木。配置で「庭」を完成させると得点
144. {recipego}調理碁 — 石は具材。隣接組み合わせで「レシピ」完成で得点
145. {festivalgo}祭礼碁 — 石は屋台・提灯。祭りの行列を完成させると勝ち
146. {fashiongo}装飾碁 — 石は衣服パーツ。隣接で「コーデ」が完成すると得点
147. {urbango}都市碁 — 石は建物。区画制圧で「都市」を拡大する
148. {bandgo}楽団碁 — 石は楽器。隣接で「ハーモニー」が生まれ得点になる
149. {postergo}布告碁 — 石はポスター。敵のポスターを自分のもので上書きしていく
150. {pubgo}居酒屋碁 — 石は客。相手の客を勧誘して自分の店に引き入れる

## O. 魔法・ファンタジー
151. {spellgo}呪文碁 — 石は呪文の言霊。3連で「詠唱」完了、呪文効果発動
152. {alchemygo}錬金碁 — 2種類の石を融合させて「賢者の石」を作る(最強石)
153. {necrogo}死霊碁 — 取られた石は墓地へ。3個集めると「骸骨兵」として盤に復活
154. {dragoongo}竜族碁 — 竜の石は時間で成長し、成体は飛行して広範囲を制圧
155. {golemgo}魔像碁 — 土の石を重ねてゴーレムを作る。ゴーレムは破壊不能で地を占める
156. {portalgo}転門碁 — ポータルの対ができ、一方の入り口から他方へ石を転送
157. {enchantgo}付呪碁 — 石に魔法効果(飛行/貫通/再生)を付与できる
158. {mimicgo}擬態碁 — 宝箱型の石は擬態して敵をおびき寄せ、捕食する
159. {familiargo}使魔碁 — 使い魔の石が盤上を巡回し、敵の位置を偵察する
160. {runego}刻印碁 — 盤上にルーン文字を刻み、完成した魔法陣で敵を封じる

## P. ダーク・ホラー・スリラー
161. {abyssgo}深淵碁 — 盤の淵から「何か」がのぞき、呼吸点を奪っていく
162. {plague2go}疫碁 — 疫病が石から石へ伝染。隔離しないと全滅する
163. {curse2go}呪詛碁 — 呪いの石を置くと周囲が徐々に衰弱していく
164. {sacrificego}犠牲碁 — 強力な効果の代償として自分の石を生贄に捧げる
165. {asylumgo}狂気碁 — 長考するほど「狂気度」が上がり、操作が混乱する
166. {void2go}虚無碁 — 着手するたび盤の一部が「虚無」に飲まれて消える
167. {possessgo}憑依碁 — 敵の石に憑依して、以後その石を自分のものにできる
168. {nightmarego}悪夢碁 — 相手の悪夢を具現化した石で攻撃する
169. {scarecrowgo}案山子碁 — 囮の石を置いて敵を釣り出し、囲んで取る
170. {labyrinthgo}迷宮碁 — 盤は迷宮。壁を移動させて敵を迷路に閉じ込める

## Q. その他・独創的機構
171. {compassgo}羅針碁 — 盤面に常に「北」が表示され、北向きの石は強化される
172. {scalego}天秤碁 — 左右の石の重さを比較して、軽い側の石が浮いて取られる
173. {mirrormaze}反射碁 — 石はビームを発し、鏡で反射して敵を撃つ
174. {tunnelwar}塹壕碁 — 盤下の塹壕を掘って敵陣へ潜り込む
175. {airgo}気流碁 — 上空の気流が石の移動方向を決める
176. {minefieldgo}地雷碁 — 地雷原を歩くように石を進める。地雷を踏むと爆発
177. {parkourgo}跳躍碁 — 石は壁を蹴って跳躍し、着地地点を占領する
178. {castinggo}鋳造碁 — 溶けた金属の石を鋳型に流し込んで形を作る
179. {sculpture}彫刻碁 — 大きな石を削って形を整える。削りカスが新たな石になる
180. {muralgo}壁画碁 — 盤面に「壁画」を描くように石を配置し、完成した絵で得点

## R. 複合・ハイブリッド系
181. {pokergo2}競技碁 — 囲碁+ポーカー: 石の配置で手役(フラッシュ等)を作る
182. {triviago}雑学碁 — 着手時にクイズが出題、正解で追加石・不正解でパス
183. {rpgglidego}剣戟碁 — 囲碁+RPG: 石はキャラクターで経験値・レベルアップあり
184. {pianogo}鍵盤碁 — 盤はピアノ鍵盤。音階を奏でるように石を並べると得点
185. {chess2go}王将碁 — 囲碁+将棋: 王将を取ると即勝ち、歩は桂馬跳び
186. {mahjong2go}翻牌碁 — 囲碁+麻雀: 4面子+1雀頭の「役」を石の配置で作る
187. {bingo2go}壷算碁 — 囲碁+そろばん: 石の配置で計算式を作ると得点
188. {tradewindgo}貿易碁 — 航路を開いて他プレイヤーと交易(資源交換)できる
189. {auction2go}入札碁 — 着手権をオークションで競り落とす
190. {puzzle2go}謎解碁 — 盤上にパズルピースが散らばり、正しい配置で大得点

## S. 究極の逸脱 (もはや別ゲーム)
191. {soupgo}汁物碁 — スープの表面に具材(石)を浮かべる。縁に集まると完成
192. {gravitation}引力碁 — 石同士の引力で配置が決まる。質量が大きいほど影響大
193. {orbit3go}恒星碁 — 惑星(石)が恒星の周りを公転し、軌道が交差すると衝突
194. {sandwichgo}挟撃碁 — パンに具を挟むように、敵石を自石で挟んで「食べる」
195. {origamigo}折紙碁 — 盤面が紙で、折り目をつけて形を変えて遊ぶ
196. {kaleidogo}万華鏡碁 — 石の配置が万華鏡のように回転対称に複製される
197. {forestfire}山火碁 — 火の手が広がるように石が隣へ燃え移る
198. {lavavatgo}溶鉱碁 — 溶鉱炉に石を投げ込み、溶けて大きな塊になる
199. {airtraffic}管制碁 — 空港の管制官のように石(飛行機)を誘導して衝突を避ける
200. {ecologygo}生態碁 — 盤全体が生態系シミュレーション。石は生物で増減・捕食を繰り返す

---

## 選定100 + バッチ割り当て

実装済み310種との非重複・実装可能性・面白さで絞った100件。バッチ順が優先順位の目安。

- **W3B1 構造・属性・手番・経済・自然 (25)**: layergo, stripgo, crowngo2, forkgo, mirrorgo, shrinkgo, dungo, cloudgo, wafergo, spokego, covego, tunnelgo, raftgo, domgo, petalgo, stickygo, batterygo, magnetgo2, ghostgo2, crystalgo, slimego, mummgo, embergo, seedgo, shadowgo
- **W3B2 属性続き・天候・心理・カード (25)**: mirrorstonego, swapstonego, glowgo, pendulumgo, handovergo, crisisgo, splitturngo, stormgo, echo2go, doubledown, outlastgo, rhythmgo, delaygo, springgo, tidepoolgo, eclipsego, monssoongo, droughtgo, foggo2, volcango2, snowgo, termitego, magnetstormgo, mirage2go, puppetgo
- **W3B3 心理続き・勝利・物理・生態 (25)**: oracle2go, paintergo, inkgo, chefgo, detectivego, narrativego, dreamgo, bluffgo, deckgo, tarotgo, dicebuildgo, trickgo, bingolinego, roulette2go, lotterygo, dominogo, scrabblogo, jengago, knight2go, pushrowgo, dragon2go, spearheadgo, hurdlego, lungego, wriggle
- **W3B4 動作・勝利・抽象 (25)**: divego, sparrgo, vortex2go, templego, flag2go, crown2go, escapego2, circle2go, pyramid2go, zigguratgo, colonygo, dominiongo, sigilgo, orbit2go, springboardgo, chainreact, pendulum2go, marblego, collidego, pulleygo, capsulego, levergo, wave2go, predatorgo, mutatego
- **W3B6 スポーツ続き・日常・魔法・ダーク・複合・究極 (残りから選定)**: swinggo, skigo, vaultgo, trafficgo, buildgo, garden go, recipego, festival go, fashiongo, urban go, bandgo, postergo, pubgo, spellgo, alchemygo, necrogo, dragoongo, golemgo, portalgo, enchantgo, mimicgo, familiar go, rune go, abyssgo, plague2go, curse2go

※ W3B5・W3B6は候補過剰のため採用見送り — サイクル2以降で再利用可能 (herdgo, nestgo, symbiogo, fossilgo, hivego, reefgo, packgo, evolvego, prime2go, fibogo, matrixgo, parity2go, torus2go, graph2go, fractalgo, quantumgo, chaosgo2, infintygo, archerygo, fencinggo, wrestlingo, marathongo, hockeygo, poloballgo, javelingo, sacrificego, asylumgo, void2go, possessgo, nightmarego, scarecrowgo, labyrinthgo, compassgo, scalego, mirrormaze, tunnelwar, airgo, minefieldgo, parkourgo, castinggo, sculpture, muralgo, pokergo2, triviago, rpgglidego, pianogo, chess2go, mahjong2go, bingo2go, tradewind go, auction2go, puzzle2go, soupgo, gravitation, orbit3go, sandwichgo, origamigo, kaleidogo, forestfire, lavavatgo, airtraffic, ecologygo)
