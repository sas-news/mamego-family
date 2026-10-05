module.exports = {
    icon: "arcirisgo",
    body: `// 虹の弧と両端の石
ctx.strokeStyle='rgba(248,113,113,0.85)'; ctx.lineWidth=2.0;
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*3.0,Math.PI,0); ctx.stroke();
ctx.strokeStyle='rgba(251,191,36,0.85)';
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*2.4,Math.PI,0); ctx.stroke();
ctx.strokeStyle='rgba(74,222,128,0.85)';
ctx.beginPath(); ctx.arc(cell*3,cell*4.6,cell*1.8,Math.PI,0); ctx.stroke();
dot(0.6,4.6,P1,P1S,cell*0.45,1);
dot(5.4,4.6,P1,P1S,cell*0.45,1);
dot(3,1.7,P2,P2S,cell*0.4,1);`,
};
