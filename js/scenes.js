// Scene rendering — home (with furniture) + work/classroom

const SCALE = 4; // keep in sync with game.js

// ─── Furniture snap zones ────────────────────────────────────────────────────

function getHomeSnapZones(paneW, H) {
  const floorY  = Math.floor(H * 0.6);
  const spriteH = SPRITE_H * SCALE;
  const sx      = paneW * 0.36; // sofa left edge (matches _drawSofa)
  const bx      = paneW * 0.58; // bed left edge  (matches _drawBed)
  return [
    { id: 'desk',       x: paneW * 0.18, y: floorY - spriteH - 28, pose: 'sit' },
    { id: 'sofa-left',  x: sx + 16,      y: floorY - spriteH - 8,  pose: 'sit' },
    { id: 'sofa-right', x: sx + 60,      y: floorY - spriteH - 8,  pose: 'sit' },
    { id: 'bed-left',   x: bx + 6,       y: floorY - spriteH + 22, pose: 'lie' },
    { id: 'bed-right',  x: bx + 74,      y: floorY - spriteH + 22, pose: 'lie' },
  ];
}

// Characters that are in a classroom sit at these positions (indexed 0,1)
function getClassroomSeatPositions(paneW, H) {
  const floorY  = Math.floor(H * 0.6);
  const spriteH = SPRITE_H * SCALE;
  return [
    { x: paneW * 0.25, y: floorY - spriteH - 6 },
    { x: paneW * 0.60, y: floorY - spriteH - 6 },
  ];
}

function getOfficeSeatPositions(paneW, H) {
  const floorY  = Math.floor(H * 0.6);
  const spriteH = SPRITE_H * SCALE;
  return [
    { x: paneW * 0.18, y: floorY - spriteH - 28 },
    { x: paneW * 0.60, y: floorY - spriteH - 28 },
  ];
}

// ─── Master draw entry ───────────────────────────────────────────────────────

// Draws the full canvas, splitting into panes when the two players are in
// different locations. Returns pane layout so game.js knows where to place chars.
function drawWorldAndGetPanes(ctx, bjergPlayer, hungryPlayer, W, H) {
  const bs = bjergPlayer.status  || 'home';
  const hs = hungryPlayer.status || 'home';

  if (bs === hs) {
    // Same scene — full width
    _drawScenePane(ctx, bs, 0, W, H, bjergPlayer.furniture, hungryPlayer.furniture);
    _drawSceneLabel(ctx, bs, 0, W);
    return {
      bjerg:  { offX: 0, paneW: W, scene: bs },
      hungry: { offX: 0, paneW: W, scene: hs },
    };
  } else {
    const half = Math.floor(W / 2);
    // Left pane: bjerg's scene
    _drawScenePane(ctx, bs, 0, half, H, bjergPlayer.furniture, hungryPlayer.furniture);
    _drawSceneLabel(ctx, bs, 0, half);
    // Divider
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(half - 2, 0, 4, H);
    // Right pane: hungry's scene
    ctx.save();
    ctx.translate(half, 0);
    _drawScenePane(ctx, hs, 0, half, H, bjergPlayer.furniture, hungryPlayer.furniture);
    _drawSceneLabel(ctx, hs, 0, half);
    ctx.restore();
    return {
      bjerg:  { offX: 0,    paneW: half, scene: bs },
      hungry: { offX: half, paneW: half, scene: hs },
    };
  }
}

function _drawSceneLabel(ctx, sceneId, offX, paneW) {
  const labels = { home: '🏠 Home', classroom: '📚 School', office: '💼 Work', cafe: '☕ Café' };
  const text   = labels[sceneId] || sceneId;
  ctx.save();
  ctx.font      = '10px "Press Start 2P", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(text, offX + paneW / 2, 18);
  ctx.restore();
}

function _drawScenePane(ctx, sceneId, offX, paneW, H, furB, furH) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(offX, 0, paneW, H);
  ctx.clip();
  ctx.translate(offX, 0);
  switch (sceneId) {
    case 'home':      _drawHome(ctx, paneW, H, [...(furB||[]), ...(furH||[])]); break;
    case 'classroom': _drawClassroom(ctx, paneW, H); break;
    case 'office':    _drawOffice(ctx, paneW, H); break;
    case 'cafe':      _drawCafe(ctx, paneW, H); break;
    default:          _drawHome(ctx, paneW, H, []); break;
  }
  ctx.restore();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pxr(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawWindow(ctx, x, y, s = 1) {
  const w = 72 * s, h = 60 * s;
  pxr(ctx, x, y, w, h, '#8B6914');
  pxr(ctx, x+4*s, y+4*s, 64*s, 52*s, '#87CEEB');
  pxr(ctx, x+4*s, y+34*s, 64*s, 22*s, '#90EE90');
  pxr(ctx, x+34*s, y+4*s, 4*s, 52*s, '#8B6914');
  pxr(ctx, x+4*s, y+28*s, 64*s, 4*s, '#8B6914');
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(x+54*s, y+14*s, 8*s, 0, Math.PI*2); ctx.fill();
}

function drawPlant(ctx, x, y) {
  pxr(ctx, x+8, y+28, 16, 12, '#C0682A');
  pxr(ctx, x+6, y+26, 20, 4,  '#A0561E');
  pxr(ctx, x+15, y+10, 2, 20, '#5D8A3C');
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath(); ctx.ellipse(x+10, y+16, 9, 6, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+22, y+12, 9, 6, 0.5,  0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+16, y+8,  7, 5, 0,    0, Math.PI*2); ctx.fill();
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function _drawHome(ctx, W, H, allFurniture) {
  const floorY = Math.floor(H * 0.6);

  // Sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#B8D4F8'); g.addColorStop(1, '#E8D5F5');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Wall
  pxr(ctx, 0, 0, W, floorY, '#F0E6D3');
  // Subtle wallpaper dots
  ctx.fillStyle = 'rgba(180,140,100,0.12)';
  for (let xi = 20; xi < W; xi += 30)
    for (let yi = 20; yi < floorY; yi += 30) {
      ctx.beginPath(); ctx.arc(xi, yi, 2, 0, Math.PI*2); ctx.fill();
    }

  // Floor
  const fg = ctx.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0, '#D4A853'); fg.addColorStop(1, '#B8893A');
  ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H - floorY);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let xi = 0; xi < W; xi += 55) {
    ctx.beginPath(); ctx.moveTo(xi, floorY); ctx.lineTo(xi, H); ctx.stroke();
  }
  pxr(ctx, 0, floorY, W, 5, '#C49A6C'); // baseboard

  // Windows
  drawWindow(ctx, W * 0.05, 30);
  if (W > 300) drawWindow(ctx, W - 110, 30);

  // Wall clock (centre top)
  _drawClock(ctx, W / 2, 50);

  // ── Wardrobe (left wall) ──
  _drawWardrobe(ctx, W * 0.02, floorY - 110);

  // ── Computer desk ──
  _drawComputerDesk(ctx, W * 0.14, floorY - 52);

  // ── Sofa ──
  _drawSofa(ctx, W * 0.36, floorY - 58);

  // ── Bed ──
  _drawBed(ctx, W * 0.58, floorY - 40);

  // Optional furniture from shop
  if (allFurniture.includes('plant'))     drawPlant(ctx, W - 60, floorY - 44);
  if (allFurniture.includes('bookshelf')) _drawBookshelf(ctx, W * 0.02, floorY - 100);
}

function _drawClock(ctx, cx, cy) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2);
  ctx.fillStyle = '#F5F5F0'; ctx.fill();
  ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3; ctx.stroke();
  const now = new Date(), hr = now.getHours() % 12, mn = now.getMinutes();
  ctx.save(); ctx.translate(cx, cy);
  ctx.rotate((hr + mn/60) * Math.PI/6 - Math.PI/2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(11,0); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(cx, cy);
  ctx.rotate(mn * Math.PI/30 - Math.PI/2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(15,0); ctx.stroke(); ctx.restore();
  ctx.restore();
}

function _drawWardrobe(ctx, x, y) {
  const w = 68, h = 110;
  pxr(ctx, x, y, w, h, '#8B6914');
  pxr(ctx, x+4, y+4, w-8, h-8, '#C49A6C');
  // two doors
  pxr(ctx, x+6, y+8, (w-16)/2, h-16, '#A0785A');
  pxr(ctx, x+8+(w-16)/2, y+8, (w-16)/2, h-16, '#A0785A');
  // handles
  pxr(ctx, x+(w/2)-6, y+h/2-3, 4, 6, '#8B6914');
  pxr(ctx, x+(w/2)+2, y+h/2-3, 4, 6, '#8B6914');
  // top trim
  pxr(ctx, x, y, w, 8, '#7B5010');
}

function _drawComputerDesk(ctx, x, y) {
  // Desk body
  pxr(ctx, x, y, 110, 10, '#A0785A');
  pxr(ctx, x, y+2, 110, 4, '#C49A6C');
  pxr(ctx, x+6, y+10, 10, 40, '#8B6914');
  pxr(ctx, x+94, y+10, 10, 40, '#8B6914');
  // Monitor
  pxr(ctx, x+30, y-46, 50, 34, '#1A1A2E');
  pxr(ctx, x+34, y-42, 42, 26, '#00AACC');
  // screen glow lines
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x+36, y-40+i*6, 38, 2);
  pxr(ctx, x+52, y-12, 8, 12, '#1A1A2E');
  pxr(ctx, x+42, y-2, 26, 4, '#1A1A2E');
  // Keyboard
  pxr(ctx, x+20, y-4, 60, 6, '#555');
}

function _drawSofa(ctx, x, y) {
  // seat
  pxr(ctx, x, y+22, 120, 36, '#7B68EE');
  pxr(ctx, x+4, y+26, 112, 28, '#9B8FFF');
  // back
  pxr(ctx, x, y, 120, 26, '#7B68EE');
  pxr(ctx, x+4, y+4, 112, 20, '#9B8FFF');
  // armrests
  pxr(ctx, x, y, 16, 58, '#7B68EE');
  pxr(ctx, x+104, y, 16, 58, '#7B68EE');
  // cushions
  pxr(ctx, x+18, y+26, 36, 26, '#8B7BFF');
  pxr(ctx, x+62, y+26, 36, 26, '#8B7BFF');
  // legs
  pxr(ctx, x+4, y+54, 10, 10, '#5D4037');
  pxr(ctx, x+106, y+54, 10, 10, '#5D4037');
}

function _drawBed(ctx, x, y) {
  const w = 130;
  // frame
  pxr(ctx, x, y, w, 70, '#8B6914');
  // mattress
  pxr(ctx, x+4, y+18, w-8, 50, '#F5E6CC');
  // pillow
  pxr(ctx, x+8, y+20, 36, 22, '#FFFFFF');
  pxr(ctx, x+10, y+22, 32, 18, '#F0F0F0');
  // blanket
  pxr(ctx, x+4, y+38, w-8, 26, '#B0C4DE');
  pxr(ctx, x+4, y+38, w-8, 6,  '#90A8C8');
  // headboard
  pxr(ctx, x, y, w, 16, '#7B5010');
  pxr(ctx, x+6, y+3, 10, 10, '#9A6814');
  pxr(ctx, x+w-16, y+3, 10, 10, '#9A6814');
}

function _drawBookshelf(ctx, x, y) {
  pxr(ctx, x, y, 60, 80, '#8B6914');
  const colors = ['#E74C3C','#3498DB','#2ECC71','#F39C12','#9B59B6','#1ABC9C'];
  for (let row = 0; row < 3; row++) {
    const sy = y + 6 + row * 24;
    pxr(ctx, x+4, sy, 52, 18, '#F5F5DC');
    for (let b = 0; b < 6; b++) {
      ctx.fillStyle = colors[(b + row*2) % colors.length];
      ctx.fillRect(x+6+b*8, sy+2, 7, 14);
    }
    pxr(ctx, x+4, sy+18, 52, 3, '#8B6914');
  }
}

// ─── CLASSROOM ────────────────────────────────────────────────────────────────

function _drawClassroom(ctx, W, H) {
  const floorY = Math.floor(H * 0.6);
  pxr(ctx, 0, 0, W, floorY, '#E8D5A3');
  const fg = ctx.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0,'#C9A84C'); fg.addColorStop(1,'#A88730');
  ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H-floorY);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let xi = 0; xi < W; xi += 50) { ctx.beginPath(); ctx.moveTo(xi,floorY); ctx.lineTo(xi,H); ctx.stroke(); }
  pxr(ctx, 0, floorY, W, 5, '#B8973C');

  // Blackboard
  const bx = W/2 - 80;
  pxr(ctx, bx, 20, 160, 90, '#4A3728');
  pxr(ctx, bx+6, 26, 148, 78, '#2D6A4F');
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '13px monospace';
  ctx.fillText('y = mx + b', bx+20, 60);
  ctx.fillText('∫ f(x) dx', bx+20, 82);
  pxr(ctx, bx+6, 104, 148, 8, '#5D4037');

  // Teacher desk
  _drawStudentDesk(ctx, W/2 - 55, floorY - 50);

  // Student desks
  const deskY = floorY - 50;
  _drawStudentDesk(ctx, W * 0.15, deskY);
  _drawStudentDesk(ctx, W * 0.55, deskY);
  _drawChair(ctx, W * 0.16 + 5, deskY - 2);
  _drawChair(ctx, W * 0.56 + 5, deskY - 2);
  // Books on student desks
  _drawBook(ctx, W*0.17 + 15, deskY - 8);
  _drawBook(ctx, W*0.57 + 15, deskY - 8);

  drawWindow(ctx, W - 100, 25, 0.85);
}

function _drawStudentDesk(ctx, x, y) {
  pxr(ctx, x, y, 90, 10, '#A0785A');
  pxr(ctx, x, y+2, 90, 4, '#C49A6C');
  pxr(ctx, x+6, y+10, 8, 35, '#8B6914');
  pxr(ctx, x+76, y+10, 8, 35, '#8B6914');
}

function _drawChair(ctx, x, y) {
  pxr(ctx, x, y, 36, 7, '#8B6914');
  pxr(ctx, x+3, y-28, 30, 30, '#8B6914');
  pxr(ctx, x+7, y-24, 22, 22, '#C49A6C');
  pxr(ctx, x+3, y+7, 6, 20, '#8B6914');
  pxr(ctx, x+27, y+7, 6, 20, '#8B6914');
}

function _drawBook(ctx, x, y) {
  pxr(ctx, x, y, 28, 6, '#E74C3C');
  pxr(ctx, x+2, y+1, 24, 4, '#C0392B');
  pxr(ctx, x+12, y, 2, 6, '#922B21');
}

// ─── OFFICE ───────────────────────────────────────────────────────────────────

function _drawOffice(ctx, W, H) {
  const floorY = Math.floor(H * 0.6);
  pxr(ctx, 0, 0, W, floorY, '#D4C5A9');
  const fg = ctx.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0,'#8B7355'); fg.addColorStop(1,'#6B5535');
  ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H-floorY);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let xi = 0; xi < W; xi += 50) { ctx.beginPath(); ctx.moveTo(xi,floorY); ctx.lineTo(xi,H); ctx.stroke(); }
  pxr(ctx, 0, floorY, W, 5, '#7A6545');

  drawWindow(ctx, W/2 - 36, 28);
  if (W > 300) { drawWindow(ctx, 20, 28); drawWindow(ctx, W-100, 28); }

  // Two computer desks
  _drawComputerDesk(ctx, W * 0.08, floorY - 52);
  _drawComputerDesk(ctx, W * 0.55, floorY - 52);
  _drawChair(ctx, W*0.09+8, floorY - 54);
  _drawChair(ctx, W*0.56+8, floorY - 54);
  _drawBookshelf(ctx, W/2 - 30, floorY - 100);
  drawPlant(ctx, W - 56, floorY - 44);
}

// ─── CAFÉ ─────────────────────────────────────────────────────────────────────

function _drawCafe(ctx, W, H) {
  const floorY = Math.floor(H * 0.6);
  pxr(ctx, 0, 0, W, floorY, '#F5DEB3');
  const fg = ctx.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0,'#C4956A'); fg.addColorStop(1,'#A0784A');
  ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H-floorY);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let xi = 0; xi < W; xi += 40) { ctx.beginPath(); ctx.moveTo(xi,floorY); ctx.lineTo(xi,H); ctx.stroke(); }
  pxr(ctx, 0, floorY, W, 5, '#B8853A');
  _drawCafeTable(ctx, W/2-45, floorY-40);
  _drawChair(ctx, W/2-38, floorY-44);
  _drawChair(ctx, W/2+16, floorY-44);
  drawPlant(ctx, W-60, floorY-44);
  drawPlant(ctx, 10, floorY-44);
  drawWindow(ctx, W/2-36, 28);
}

function _drawCafeTable(ctx, x, y) {
  pxr(ctx, x, y, 90, 10, '#C49A6C');
  pxr(ctx, x+2, y+2, 86, 4, '#D4AA7D');
  pxr(ctx, x+8, y+10, 8, 30, '#A0785A');
  pxr(ctx, x+74, y+10, 8, 30, '#A0785A');
}

// ─── Public API ──────────────────────────────────────────────────────────────

function getSceneList() {
  return {
    home:      { label: 'Home',       emoji: '🏠' },
    classroom: { label: 'Classroom',  emoji: '📚' },
    office:    { label: 'Work',       emoji: '💼' },
    cafe:      { label: 'Café',       emoji: '☕' },
  };
}
