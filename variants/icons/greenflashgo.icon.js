module.exports = {
    icon: "greenflashgo",
    body: `// 落日のグリーンフラッシュ
ctx.fillStyle='rgba(30,58,95,0.9)';
ctx.fillRect(0,cell*3.4,cell*6,cell*2.6);
ctx.fillStyle='#fb923c';
ctx.beginPath(); ctx.arc(cell*3,cell*3.4,cell*1.3,Math.PI,0); ctx.fill();
ctx.fillStyle='#4ade80';
ctx.fillRect(cell*2.2,cell*2.0,cell*1.6,cell*0.28);
dot(1.2,4.6,P1,P1S,cell*0.4,1);
dot(4.8,4.8,P2,P2S,cell*0.4,1);`,
};
