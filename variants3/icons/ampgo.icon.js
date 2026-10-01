module.exports = {
    icon: "ampgo",
    body: `// 増幅器の三角記号と波形
ctx.strokeStyle='#a78bfa'; ctx.lineWidth=1.8;
ctx.beginPath();
ctx.moveTo(cell*1.4,cell*1.8);
ctx.lineTo(cell*1.4,cell*4.2);
ctx.lineTo(cell*4.2,cell*3);
ctx.closePath(); ctx.stroke();
seg(0.4,2.4,1.4,2.4,'#a78bfa',1.4);
seg(0.4,3.6,1.4,3.6,'#a78bfa',1.4);
seg(4.2,3,5.6,3,'#facc15',1.6);
seg(5.6,3,5.9,2.4,'#facc15',1.4);
seg(5.6,3,5.9,3.6,'#facc15',1.4);`,
};
