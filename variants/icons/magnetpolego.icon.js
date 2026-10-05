module.exports = {
    icon: "magnetpolego",
    body: `// N極とS極の磁石
ctx.fillStyle='#ef4444';
ctx.fillRect(cell*1.4,cell*2.0,cell*1.6,cell*0.9);
ctx.fillStyle='#3b82f6';
ctx.fillRect(cell*3.0,cell*2.0,cell*1.6,cell*0.9);
txt('N',2.2,2.15,'#fff',cell*0.7);
txt('S',3.8,2.15,'#fff',cell*0.7);
seg(1.4,4.4,4.6,4.4,'rgba(120,120,120,0.7)',1.2);
seg(2.0,4.4,2.0,3.6,'rgba(120,120,120,0.7)',1.2);
seg(4.0,4.4,4.0,3.6,'rgba(120,120,120,0.7)',1.2);
dot(1.0,4.4,P1,P1S,cell*0.35,1);
dot(5.0,4.4,P2,P2S,cell*0.35,1);`,
};
