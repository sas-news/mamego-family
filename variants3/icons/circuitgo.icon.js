module.exports = {
    icon: "circuitgo",
    body: `// 中央コアと回路配線
ctx.strokeStyle='rgba(74,222,128,0.9)'; ctx.lineWidth=1.8;
ctx.strokeRect(cell*1.6,cell*1.6,cell*2.8,cell*2.8);
dot(3,3,'#4ade80','#166534',cell*0.45,1);
seg(0.4,3,1.6,3,'#4ade80',1.6);
seg(4.4,3,5.6,3,'#4ade80',1.6);
seg(3,0.4,3,1.6,'#4ade80',1.6);
seg(3,4.4,3,5.6,'#4ade80',1.6);
dot(0.4,3,P1,P1S,cell*0.3,1);
dot(5.6,3,P2,P2S,cell*0.3,1);`,
};
