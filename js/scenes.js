// Scene/room backgrounds renderer

const SCENES = {
  home: {
    label: 'Home',
    emoji: '🏠',
    bgGradient: ['#8EC5FC', '#E0C3FC'],
    floor: '#C8A882',
    wall: '#F5E6C8',
    draw: drawHome
  },
  classroom: {
    label: 'Classroom',
    emoji: '📚',
    bgGradient: ['#a1c4fd', '#c2e9fb'],
    floor: '#D4A853',
    wall: '#E8D5A3',
    draw: drawClassroom
  },
  office: {
    label: 'Office',
    emoji: '💼',
    bgGradient: ['#667eea', '#764ba2'],
    floor: '#8B7355',
    wall: '#D4C5A9',
    draw: drawOffice
  },
  cafe: {
    label: 'Café',
    emoji: '☕',
    bgGradient: ['#f6d365', '#fda085'],
    floor: '#C4956A',
    wall: '#F5DEB3',
    draw: drawCafe
  }
};

function drawScene(ctx, sceneId, canvasW, canvasH, furnitureBjerg = [], furnitureHungry = []) {
  const scene = SCENES[sceneId] || SCENES.home;
  scene.draw(ctx, canvasW, canvasH, furnitureBjerg, furnitureHungry);
}

function drawPixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawWindow(ctx, x, y) {
  // Window frame
  drawPixelRect(ctx, x, y, 72, 60, '#8B6914');
  drawPixelRect(ctx, x + 4, y + 4, 64, 52, '#87CEEB');
  // sky
  drawPixelRect(ctx, x + 4, y + 4, 64, 30, '#87CEEB');
  drawPixelRect(ctx, x + 4, y + 34, 64, 22, '#90EE90');
  // cross
  drawPixelRect(ctx, x + 34, y + 4, 4, 52, '#8B6914');
  drawPixelRect(ctx, x + 4, y + 28, 64, 4, '#8B6914');
  // sun
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + 54, y + 14, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlant(ctx, x, y) {
  // pot
  drawPixelRect(ctx, x + 8, y + 24, 16, 12, '#C0682A');
  drawPixelRect(ctx, x + 6, y + 22, 20, 4, '#A0561E');
  // stem
  drawPixelRect(ctx, x + 15, y + 8, 2, 18, '#5D8A3C');
  // leaves
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath(); ctx.ellipse(x + 10, y + 14, 9, 6, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 22, y + 10, 9, 6, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 16, y + 6, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function drawBookshelf(ctx, x, y) {
  drawPixelRect(ctx, x, y, 60, 80, '#8B6914');
  // shelves
  for (let i = 0; i < 3; i++) {
    const sy = y + 6 + i * 24;
    drawPixelRect(ctx, x + 4, sy, 52, 18, '#F5F5DC');
    const bookColors = ['#E74C3C','#3498DB','#2ECC71','#F39C12','#9B59B6','#1ABC9C'];
    let bx = x + 6;
    for (let b = 0; b < 6; b++) {
      ctx.fillStyle = bookColors[(b + i * 2) % bookColors.length];
      ctx.fillRect(bx, sy + 2, 7, 14);
      bx += 8;
    }
    drawPixelRect(ctx, x + 4, sy + 18, 52, 3, '#8B6914');
  }
}

function drawDesk(ctx, x, y) {
  // desk surface
  drawPixelRect(ctx, x, y, 120, 12, '#A0785A');
  drawPixelRect(ctx, x, y + 2, 120, 4, '#C49A6C');
  // legs
  drawPixelRect(ctx, x + 6, y + 12, 10, 40, '#8B6914');
  drawPixelRect(ctx, x + 104, y + 12, 10, 40, '#8B6914');
  // monitor
  drawPixelRect(ctx, x + 40, y - 44, 40, 30, '#2C3E50');
  drawPixelRect(ctx, x + 44, y - 40, 32, 22, '#00BCD4');
  drawPixelRect(ctx, x + 56, y - 14, 8, 14, '#2C3E50');
  drawPixelRect(ctx, x + 48, y - 2, 24, 4, '#2C3E50');
}

function drawChair(ctx, x, y) {
  // seat
  drawPixelRect(ctx, x, y, 40, 8, '#8B6914');
  drawPixelRect(ctx, x + 2, y + 2, 36, 4, '#A0785A');
  // back
  drawPixelRect(ctx, x + 4, y - 32, 32, 34, '#8B6914');
  drawPixelRect(ctx, x + 8, y - 28, 24, 26, '#C49A6C');
  // legs
  drawPixelRect(ctx, x + 4, y + 8, 6, 24, '#8B6914');
  drawPixelRect(ctx, x + 30, y + 8, 6, 24, '#8B6914');
}

function drawTable(ctx, x, y) {
  drawPixelRect(ctx, x, y, 100, 10, '#C49A6C');
  drawPixelRect(ctx, x + 2, y + 2, 96, 4, '#D4AA7D');
  drawPixelRect(ctx, x + 8, y + 10, 8, 36, '#A0785A');
  drawPixelRect(ctx, x + 84, y + 10, 8, 36, '#A0785A');
}

function drawBlackboard(ctx, x, y) {
  drawPixelRect(ctx, x, y, 140, 80, '#4A3728');
  drawPixelRect(ctx, x + 6, y + 6, 128, 68, '#2D6A4F');
  // chalk writing
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px monospace';
  ctx.fillText('y = mx + b', x + 20, y + 30);
  ctx.fillText('∫ f(x)dx', x + 20, y + 50);
  // chalk tray
  drawPixelRect(ctx, x + 6, y + 74, 128, 8, '#5D4037');
}

function drawSofa(ctx, x, y) {
  // base
  drawPixelRect(ctx, x, y + 20, 130, 40, '#7B68EE');
  drawPixelRect(ctx, x + 4, y + 24, 122, 32, '#9B8FFF');
  // back
  drawPixelRect(ctx, x, y, 130, 24, '#7B68EE');
  drawPixelRect(ctx, x + 4, y + 4, 122, 18, '#9B8FFF');
  // armrests
  drawPixelRect(ctx, x, y, 18, 60, '#7B68EE');
  drawPixelRect(ctx, x + 112, y, 18, 60, '#7B68EE');
  // cushions
  drawPixelRect(ctx, x + 20, y + 24, 40, 28, '#8B7BFF');
  drawPixelRect(ctx, x + 68, y + 24, 40, 28, '#8B7BFF');
  // legs
  drawPixelRect(ctx, x + 4, y + 56, 12, 10, '#5D4037');
  drawPixelRect(ctx, x + 114, y + 56, 12, 10, '#5D4037');
}

function drawRug(ctx, x, y, w, h) {
  ctx.fillStyle = '#E8A0BF';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#C77DAF';
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
  // pattern
  ctx.fillStyle = '#F5C6E0';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillRect(x + 24 + i * 36, y + 18 + j * 24, 14, 10);
    }
  }
}

function drawCoffeeTable(ctx, x, y) {
  drawPixelRect(ctx, x, y, 80, 8, '#C49A6C');
  drawPixelRect(ctx, x + 2, y + 2, 76, 4, '#D4AA7D');
  drawPixelRect(ctx, x + 6, y + 8, 8, 20, '#A0785A');
  drawPixelRect(ctx, x + 66, y + 8, 8, 20, '#A0785A');
}

function pixelStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ix = r * Math.cos(angle), iy = r * Math.sin(angle);
    i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHome(ctx, W, H, furnitureBjerg, furnitureHungry) {
  const allFurniture = [...furnitureBjerg, ...furnitureHungry];

  // Sky gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#B8D4F8');
  grad.addColorStop(1, '#E8D5F5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Wall
  drawPixelRect(ctx, 0, 0, W, H * 0.6, '#F0E6D3');
  // Wallpaper pattern
  ctx.fillStyle = 'rgba(200, 170, 130, 0.15)';
  for (let i = 0; i < W; i += 40) {
    for (let j = 0; j < H * 0.6; j += 40) {
      pixelStar(ctx, i + 20, j + 20, 5, 'rgba(200,170,130,0.2)');
    }
  }

  // Floor
  const floorGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
  floorGrad.addColorStop(0, '#D4A853');
  floorGrad.addColorStop(1, '#B8893A');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);
  // Floor planks
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 60) {
    ctx.beginPath(); ctx.moveTo(i, H * 0.6); ctx.lineTo(i, H); ctx.stroke();
  }

  // Baseboard
  drawPixelRect(ctx, 0, H * 0.6, W, 6, '#C49A6C');

  // Windows
  drawWindow(ctx, 60, 40);
  drawWindow(ctx, W - 140, 40);

  // Sofa
  drawSofa(ctx, W/2 - 65, H * 0.35);

  // Rug
  drawRug(ctx, W/2 - 80, H * 0.6, 160, 50);

  // Coffee table
  drawCoffeeTable(ctx, W/2 - 40, H * 0.6 + 28);

  // Furniture items
  if (allFurniture.includes('plant')) drawPlant(ctx, W - 90, H * 0.6 - 36);
  if (allFurniture.includes('bookshelf')) drawBookshelf(ctx, 20, H * 0.6 - 80);

  // Wall clock
  ctx.save();
  ctx.beginPath();
  ctx.arc(W/2, 50, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#F5F5F0';
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 3;
  ctx.stroke();
  const now = new Date();
  const hr = now.getHours() % 12, mn = now.getMinutes();
  // hour hand
  ctx.save();
  ctx.translate(W/2, 50);
  ctx.rotate((hr + mn/60) * (Math.PI*2/12) - Math.PI/2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(12,0); ctx.stroke();
  ctx.restore();
  // minute hand
  ctx.save();
  ctx.translate(W/2, 50);
  ctx.rotate(mn * (Math.PI*2/60) - Math.PI/2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(17,0); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawClassroom(ctx, W, H) {
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#E0F0FF');
  grad.addColorStop(1, '#F0F8FF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Wall
  drawPixelRect(ctx, 0, 0, W, H * 0.6, '#E8D5A3');
  // Floor
  const fg = ctx.createLinearGradient(0, H * 0.6, 0, H);
  fg.addColorStop(0, '#C9A84C'); fg.addColorStop(1, '#A88730');
  ctx.fillStyle = fg; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i, H*0.6); ctx.lineTo(i, H); ctx.stroke(); }

  drawPixelRect(ctx, 0, H * 0.6, W, 6, '#B8973C');

  // Blackboard
  drawBlackboard(ctx, W/2 - 70, 30);

  // Teacher's desk
  drawDesk(ctx, W/2 - 60, H * 0.42);

  // Student desks
  const deskY = H * 0.6 - 10;
  drawDesk(ctx, 40, deskY);
  drawChair(ctx, 55, deskY - 6);
  drawDesk(ctx, W/2 - 60, deskY);
  drawChair(ctx, W/2 - 45, deskY - 6);
  drawDesk(ctx, W - 160, deskY);
  drawChair(ctx, W - 145, deskY - 6);

  // Windows
  drawWindow(ctx, W - 110, 40);
}

function drawOffice(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#DDE8F5'); grad.addColorStop(1, '#EEF3FA');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  drawPixelRect(ctx, 0, 0, W, H * 0.6, '#D4C5A9');
  const fg = ctx.createLinearGradient(0, H*0.6, 0, H);
  fg.addColorStop(0, '#8B7355'); fg.addColorStop(1, '#6B5535');
  ctx.fillStyle = fg; ctx.fillRect(0, H*0.6, W, H*0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i,H*0.6); ctx.lineTo(i,H); ctx.stroke(); }
  drawPixelRect(ctx, 0, H*0.6, W, 6, '#7A6545');

  // Two desks with monitors
  drawDesk(ctx, 60, H * 0.55);
  drawDesk(ctx, W - 180, H * 0.55);
  drawChair(ctx, 90, H * 0.55 - 4);
  drawChair(ctx, W - 150, H * 0.55 - 4);

  drawBookshelf(ctx, W/2 - 30, H * 0.6 - 80);
  drawWindow(ctx, W/2 - 36, 30);
  drawWindow(ctx, 30, 30);
  drawWindow(ctx, W - 110, 30);
}

function drawCafe(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#F9E4C8'); grad.addColorStop(1, '#FDEBD0');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  drawPixelRect(ctx, 0, 0, W, H * 0.6, '#F5DEB3');
  const fg = ctx.createLinearGradient(0, H*0.6, 0, H);
  fg.addColorStop(0, '#C4956A'); fg.addColorStop(1, '#A0784A');
  ctx.fillStyle = fg; ctx.fillRect(0, H*0.6, W, H*0.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i,H*0.6); ctx.lineTo(i,H); ctx.stroke(); }
  drawPixelRect(ctx, 0, H*0.6, W, 6, '#B8853A');

  // Tables with chairs
  drawTable(ctx, W/2 - 50, H * 0.55);
  drawChair(ctx, W/2 - 40, H * 0.55 - 8);
  drawChair(ctx, W/2 + 20, H * 0.55 - 8);
  drawTable(ctx, 40, H * 0.55);
  drawChair(ctx, 50, H * 0.55 - 8);

  drawPlant(ctx, W - 70, H * 0.6 - 36);
  drawPlant(ctx, 20, H * 0.6 - 36);
  drawWindow(ctx, W/2 - 36, 30);
  drawWindow(ctx, 20, 30);
}

function getSceneList() { return SCENES; }
