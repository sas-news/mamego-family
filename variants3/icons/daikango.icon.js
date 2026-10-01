module.exports = {
    icon: "daikango",
    body: `// 氷に閉じた石と融け出す石
ctx.fillStyle='rgba(186,230,253,0.6)';
ctx.fillRect(cell*1.2,cell*2.4,cell*1.8,cell*1.8);
ctx.strokeStyle='#38bdf8'; ctx.lineWidth=1.6;
ctx.strokeRect(cell*1.2,cell*2.4,cell*1.8,cell*1.8);
dot(2.1,3.3,P1,P1S,cell*0.38,1);
dot(4.3,3.4,P2,P2S,cell*0.5,1);
seg(4.3,2.4,4.3,1.6,'#fbbf24',1.6);
seg(4.0,1.9,4.3,1.6,'#fbbf24',1.6);
seg(4.6,1.9,4.3,1.6,'#fbbf24',1.6);`,
};
