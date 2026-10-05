module.exports = {
    icon: "dividergo",
    body: `// 分圧回路の分岐点
seg(1,1,3,3,'#38bdf8',1.8);
seg(3,3,5,1,'#38bdf8',1.8);
seg(3,3,5,5,'#38bdf8',1.8);
seg(3,3,1,5,'#38bdf8',1.8);
dot(3,3,'#7dd3fc','#0284c7',cell*0.4,1);
dot(1,1,P1,P1S,cell*0.35,1);
dot(5,1,P2,P2S,cell*0.35,1);
dot(1,5,P2,P2S,cell*0.35,1);
dot(5,5,P1,P1S,cell*0.35,1);`,
};
