module.exports = {
    icon: 'detectivego',
    body: `        // 推理: 虫眼鏡と?マーク
        dot(2, 2, P1, P1S);
        ring(3.8, 2.6, cell * 0.85, '#0ea5e9', 2.2);
        seg(4.5, 3.4, 5.4, 4.3, '#0369a1', cell * 0.2);
        txt('?', 3.8, 2.6, '#0284c7', cell * 0.9);
        dot(2, 4.6, P2, P2S, cell * 0.3);
    `,
};
