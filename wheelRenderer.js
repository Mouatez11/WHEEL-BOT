const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const path = require('path');

// تسجيل الخط
registerFont(path.join(__dirname, 'bein-ar-normal.ttf'), {
  family: 'BeinAR'
});

function drawWheel(ctx, prizes, rotation, canvasSize) {
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = canvasSize / 2 - 20;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // خلفية نظيفة
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const numPrizes = prizes.length;
  const anglePerSlice = (2 * Math.PI) / numPrizes;

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52BE80'
  ];

  for (let i = 0; i < numPrizes; i++) {
    const startAngle = rotation + i * anglePerSlice;
    const endAngle = startAngle + anglePerSlice;

    // القطاع
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // النص
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + anglePerSlice / 2);

    const textDistance = radius * 0.68;

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px BeinAR';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // اسم الجائزة
    ctx.fillText(prizes[i].name, textDistance, -12);

    // الكمية
    ctx.font = '22px BeinAR';
    ctx.fillText(`الكمية: ${prizes[i].quantity}`, textDistance, 18);

    ctx.restore();
  }

  // الدائرة الوسطى
  ctx.beginPath();
  ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
  ctx.fillStyle = '#2C3E50';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px BeinAR';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', centerX, centerY);

  // المؤشر
  const pointerSize = 30;
  ctx.beginPath();
  ctx.moveTo(centerX, 25);
  ctx.lineTo(centerX - pointerSize / 2, 25 + pointerSize);
  ctx.lineTo(centerX + pointerSize / 2, 25 + pointerSize);
  ctx.closePath();
  ctx.fillStyle = '#E74C3C';
  ctx.fill();
}

function getWinningPrize(finalAngle, prizes) {
  const numPrizes = prizes.length;
  const anglePerSlice = (2 * Math.PI) / numPrizes;
  const pointerAngle = (3 * Math.PI) / 2;

  let relativeAngle = (pointerAngle - finalAngle) % (2 * Math.PI);
  if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

  const winningIndex = Math.floor(relativeAngle / anglePerSlice);
  return prizes[winningIndex % numPrizes];
}

async function generateWheelGIF(prizes, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const canvasSize = 600;
      const canvas = createCanvas(canvasSize, canvasSize);
      const ctx = canvas.getContext('2d');

      const encoder = new GIFEncoder(canvasSize, canvasSize);
      const stream = fs.createWriteStream(outputPath);

      encoder.createReadStream().pipe(stream);
      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(50);
      encoder.setQuality(10);

      let angle = 0;
      let speed = 0.4;
      const friction = 0.97;
      const minSpeed = 0.002;

      const targetPrize = selectRandomPrize(prizes);
      const numPrizes = prizes.length;
      const anglePerSlice = (2 * Math.PI) / numPrizes;
      const targetIndex = prizes.indexOf(targetPrize);

      const pointerAngle = (3 * Math.PI) / 2;
      const targetSliceCenter = targetIndex * anglePerSlice + anglePerSlice / 2;

      const extraSpins = 4;
      const targetAngle = (2 * Math.PI * extraSpins) + (pointerAngle - targetSliceCenter);

      let totalDistance = 0;
      let testSpeed = speed;
      while (testSpeed > minSpeed) {
        totalDistance += testSpeed;
        testSpeed *= friction;
      }
      speed = (targetAngle / totalDistance) * speed;

      while (speed > minSpeed) {
        angle += speed;
        speed *= friction;
        drawWheel(ctx, prizes, angle, canvasSize);
        encoder.addFrame(ctx);
      }

      for (let i = 0; i < 10; i++) {
        drawWheel(ctx, prizes, angle, canvasSize);
        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on('finish', () => {
        const normalizedAngle = angle % (2 * Math.PI);
        const winningPrize = getWinningPrize(normalizedAngle, prizes);
        resolve({ path: outputPath, winningPrize });
      });

    } catch (e) {
      reject(e);
    }
  });
}

function selectRandomPrize(prizes) {
  const total = prizes.reduce((s, p) => s + p.percentage, 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= p.percentage;
    if (r <= 0) return p;
  }
  return prizes[0];
}

async function generateStaticWheel(prizes, outputPath) {
  const canvasSize = 600;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  drawWheel(ctx, prizes, 0, canvasSize);
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
  return outputPath;
}

module.exports = {
  generateWheelGIF,
  generateStaticWheel
};
