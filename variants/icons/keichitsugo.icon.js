module.exports = {
    icon: "keichitsugo",
    body: `// 土から目覚める蟲と伏せ石
ctx.fillStyle='rgba(110,80,50,0.75)';
ctx.beginPath(); ctx.arc(cell*2,cell*4.6,cell*1.7,Math.PI,0); ctx.fill();
ctx.beginPath(); ctx.arc(cell*4.2,cell*4.8,cell*1.3,Math.PI,0); ctx.fill();
dot(2,3.4,P1,P1S,cell*0.5,1);
dot(4.2,3.9,P2,P2S,cell*0.45,1);
seg(2.6,1.6,3.6,1.2,'#4ade80',1.6);
seg(3.6,1.2,4.4,2.0,'#4ade80',1.6);
seg(3.6,1.2,3.4,2.3,'#4ade80',1.6);
dot(3.7,1.1,'#4ade80','#166534',cell*0.18,1);`,
};
