module.exports = {
    icon: "genjitsugo",
    body: `// 対蹠の2つの幻日
dot(1.4,1.4,'#fde68a','#d97706',cell*0.55,1);
dot(4.6,4.6,'#fde68a','#d97706',cell*0.55,1);
dot(3,3,'#fef3c7','#fbbf24',cell*0.4,1);
ctx.strokeStyle='rgba(251,191,36,0.7)'; ctx.lineWidth=1.3;
ctx.beginPath(); ctx.arc(cell*3,cell*3,cell*1.9,0,Math.PI*2); ctx.stroke();
dot(3.6,4.6,P1,P1S,cell*0.4,1);
dot(1.4,2.6,P2,P2S,cell*0.4,1);`,
};
