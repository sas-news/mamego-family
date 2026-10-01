module.exports = {
    icon: "dischargego",
    body: `// 稲妻と打たれる石
ctx.fillStyle='#facc15';
ctx.beginPath();
ctx.moveTo(cell*3.4,cell*0.4);
ctx.lineTo(cell*2.2,cell*2.6);
ctx.lineTo(cell*3.1,cell*2.6);
ctx.lineTo(cell*2.0,cell*4.6);
ctx.lineTo(cell*3.9,cell*2.0);
ctx.lineTo(cell*3.0,cell*2.0);
ctx.closePath(); ctx.fill();
dot(1.4,4.8,P1,P1S,cell*0.42,1);
dot(4.6,4.9,P2,P2S,cell*0.42,1);`,
};
