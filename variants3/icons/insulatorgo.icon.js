module.exports = {
    icon: "insulatorgo",
    body: `// 白い陶器の絶縁石と電流の分断
dot(3,3,P1,P1S,cell*0.55,1);
ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=2.2;
ctx.beginPath(); ctx.arc(cell*3,cell*3,cell*0.85,0,Math.PI*2); ctx.stroke();
seg(0.5,1.2,2.0,1.2,'#facc15',1.5);
seg(4.0,1.2,5.5,1.2,'#facc15',1.5);
seg(2.0,1.2,2.0,2.2,'#facc15',1.5);
seg(4.0,1.2,4.0,2.2,'#facc15',1.5);`,
};
