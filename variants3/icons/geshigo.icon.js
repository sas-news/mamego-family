module.exports = {
    icon: "geshigo",
    body: `// 太陽と盤に伸びる影
dot(3,1.6,'#fde68a','#d97706',cell*0.7,1);
seg(1.2,1.6,4.8,1.6,'rgba(217,119,6,0.6)',1.2);
seg(3,0.2,3,3,'rgba(217,119,6,0.6)',1.2);
dot(3,4.2,P1,P1S,cell*0.5,1);
ctx.fillStyle='rgba(0,0,0,0.35)';
ctx.beginPath();
ctx.moveTo(cell*3,cell*4.4);
ctx.lineTo(cell*4.6,cell*5.4);
ctx.lineTo(cell*2.6,cell*5.6);
ctx.closePath(); ctx.fill();`,
};
