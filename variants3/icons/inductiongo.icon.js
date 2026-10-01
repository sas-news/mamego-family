module.exports = {
    icon: "inductiongo",
    body: `// コイルと引き寄せられる石
ctx.strokeStyle='#c084fc'; ctx.lineWidth=1.6;
ctx.beginPath(); ctx.arc(cell*1.6,cell*3,cell*0.9,0,Math.PI*2); ctx.stroke();
ctx.beginPath(); ctx.arc(cell*2.6,cell*3,cell*0.9,0,Math.PI*2); ctx.stroke();
dot(1.6,3,P1,P1S,cell*0.4,1);
dot(2.6,3,P1,P1S,cell*0.4,1);
dot(5.0,3,P2,P2S,cell*0.45,1);
seg(4.4,3,3.9,3,'#c084fc',1.8);
seg(4.1,2.8,3.9,3,'#c084fc',1.6);
seg(4.1,3.2,3.9,3,'#c084fc',1.6);`,
};
