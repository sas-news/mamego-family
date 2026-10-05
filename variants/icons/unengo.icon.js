module.exports = {
    icon: "unengo",
    body: `// 月と暈の輪、雨の前兆
dot(3,2.2,'#fde68a','#d97706',cell*0.6,1);
ctx.strokeStyle='rgba(165,180,252,0.8)'; ctx.lineWidth=1.4;
ctx.beginPath(); ctx.arc(cell*3,cell*2.2,cell*1.5,0,Math.PI*2); ctx.stroke();
ctx.strokeStyle='rgba(165,180,252,0.4)';
ctx.beginPath(); ctx.arc(cell*3,cell*2.2,cell*2.0,0,Math.PI*2); ctx.stroke();
seg(1,4.2,0.5,5.4,'#60a5fa',1.4);
seg(3,4.0,2.5,5.2,'#60a5fa',1.4);
seg(5,4.2,4.5,5.4,'#60a5fa',1.4);`,
};
