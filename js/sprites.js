// Pixel art sprite renderer — Stardew Valley inspired style

const OUTFIT_COLORS = {
  default: { shirt: '#5B9BD5', pants: '#2C3E50' },
  red:     { shirt: '#E74C3C', pants: '#922B21' },
  blue:    { shirt: '#2980B9', pants: '#1A5276' },
  green:   { shirt: '#27AE60', pants: '#1D6A3A' },
  purple:  { shirt: '#8E44AD', pants: '#5B2C6F' },
  yellow:  { shirt: '#F1C40F', pants: '#9A7D0A' },
  pink:    { shirt: '#E91E8C', pants: '#8C1255' },
  black:   { shirt: '#2C3E50', pants: '#1A252F' },
};

function _dk(hex, amt) {
  if (!hex || hex === 'transparent') return hex;
  const r = Math.max(0, parseInt(hex.slice(1,3),16) - amt);
  const g = Math.max(0, parseInt(hex.slice(3,5),16) - amt);
  const b = Math.max(0, parseInt(hex.slice(5,7),16) - amt);
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function _lt(hex, amt) {
  if (!hex || hex === 'transparent') return hex;
  const r = Math.min(255, parseInt(hex.slice(1,3),16) + amt);
  const g = Math.min(255, parseInt(hex.slice(3,5),16) + amt);
  const b = Math.min(255, parseInt(hex.slice(5,7),16) + amt);
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function buildSpriteGrid(player) {
  const T   = 'transparent';
  const sk  = player.skin;
  const skH = _lt(sk, 30);          // forehead highlight
  const hr  = player.hairColor;
  const hrH = _lt(hr, 50);          // hair highlight
  const hrD = _dk(hr, 35);          // hair shadow / sideburns
  const outfit = OUTFIT_COLORS[player.outfit || 'default'];
  const st  = outfit.shirt;
  const stH = _lt(st, 32);          // shirt highlight (center)
  const stD = _dk(st, 42);          // shirt shadow (sides)
  const pn  = outfit.pants;
  const pnD = _dk(pn, 42);          // pants shadow (sides)
  const blt = _dk(pn, 70);          // belt
  const ey  = player.eyeColor;
  const eyW = '#F2EAEA';            // warm eye white
  const eyP = _dk(ey, 55);          // pupil
  const brow = _dk(hr, 10);         // eyebrow (slightly darker hair)
  const ck  = '#F09878';            // cheek blush
  const mt  = '#9A5038';            // mouth
  const bt  = '#3D2B1F';            // boot
  const btH = '#6B4830';            // boot toe highlight

  if (player.hairStyle === 'long') {
    // hungry — voluminous crown, center-parted, wavy flowing sides
    return [
      // ── HEAD ──────────────────────────────────────────────────────────────
      [T,   hrH, hr,  hrH, hr,  hr,  hr,  hrH, hr,  hr,  hrH, T  ], // 0  wide poofy crown, multi-highlight
      [hrH, hr,  hrH, hr,  hr,  hr,  hr,  hr,  hrH, hr,  hr,  hrH], // 1  maximum width — big hair energy
      [hr,  hr,  hrH, skH, sk,  sk,  sk,  sk,  skH, hrH, hr,  hr ], // 2  inner hair highlight + forehead
      [hr,  hr,  sk,  brow,brow,sk,  sk,  brow,brow,sk,  hr,  hr ], // 3  oval face (hair frames tightly)
      [hr,  sk,  sk,  eyW, ey,  sk,  sk,  eyW, ey,  sk,  sk,  hr ], // 4  eye whites + iris
      [hr,  sk,  sk,  ey,  eyP, sk,  sk,  ey,  eyP, sk,  sk,  hr ], // 5  iris + pupil
      [hr,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  hr ], // 6  mid face
      [hr,  sk,  ck,  sk,  sk,  sk,  sk,  sk,  sk,  ck,  sk,  hr ], // 7  cheeks
      [hr,  sk,  sk,  sk,  sk,  mt,  mt,  sk,  sk,  sk,  sk,  hr ], // 8  mouth
      [hr,  hr,  hrD, sk,  sk,  sk,  sk,  sk,  sk,  hrD, hr,  hr ], // 9  chin + hair shadow frame
      // ── BODY — wavy strands, highlight on outer bulge, shadow on inner ───
      [hrH, T,   stH, st,  st,  st,  st,  st,  st,  stH, T,   hrH], // 10 narrow, crest highlight
      [hr,  hrD, st,  stH, st,  st,  st,  st,  stH, st,  hrD, hr ], // 11 wide, trough shadow
      [hrH, T,   stD, st,  st,  st,  st,  st,  st,  stD, T,   hrH], // 12 narrow, crest
      [hr,  hrD, stD, st,  st,  st,  st,  st,  st,  stD, hrD, hr ], // 13 wide, trough
      [hrH, T,   blt, pnD, pn,  pn,  pn,  pn,  pnD, blt, T,   hrH], // 14 belt
      [hr,  hrD, pnD, pn,  pn,  pn,  pn,  pn,  pn,  pnD, hrD, hr ], // 15 pants
      [hrH, T,   pnD, pn,  pn,  T,   T,   pn,  pn,  pnD, T,   hrH], // 16 legs
      [hr,  hrD, pnD, pn,  pn,  T,   T,   pn,  pn,  pnD, hrD, hr ], // 17 legs
      [hrD, T,   bt,  btH, bt,  T,   T,   bt,  btH, bt,  T,   hrD], // 18 boot top
      [T,   hrD, bt,  btH, bt,  bt,  bt,  bt,  btH, bt,  hrD, T  ], // 19 boot toe
      [T,   T,   bt,  bt,  bt,  bt,  bt,  bt,  bt,  bt,  T,   T  ], // 20 boot sole
    ];
  } else {
    // bjerg — textured short hair, side-swept with small bang
    return [
      // ── HEAD ──────────────────────────────────────────────────────────────
      [T,   T,   hrH, hrD, hr,  hrH, hrD, hr,  hrH, hr,  T,   T  ], // 0  textured top (strand detail)
      [T,   hrH, hr,  hrH, hr,  hr,  hrD, hr,  hrH, hr,  hr,  T  ], // 1  extends left, textured
      [T,   hr,  hrD, skH, sk,  sk,  sk,  sk,  sk,  sk,  hr,  T  ], // 2  small bang drape + forehead
      [hr,  hr,  sk,  brow,brow,sk,  sk,  brow,brow,sk,  hr,  hr ], // 3  eyebrows + sideburn frame
      [hr,  sk,  sk,  eyW, ey,  sk,  sk,  eyW, ey,  sk,  sk,  hr ], // 4  eye whites + iris
      [hr,  sk,  sk,  ey,  eyP, sk,  sk,  ey,  eyP, sk,  sk,  hr ], // 5  iris + pupil
      [hr,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  hr ], // 6  mid face
      [hr,  sk,  ck,  sk,  sk,  sk,  sk,  sk,  sk,  ck,  sk,  hr ], // 7  cheeks
      [T,   hrD, sk,  sk,  sk,  mt,  mt,  sk,  sk,  sk,  hrD, T  ], // 8  mouth + sideburn
      [T,   T,   hrD, hrD, sk,  sk,  sk,  sk,  hrD, hrD, T,   T  ], // 9  tight sideburns / jaw
      // ── BODY ──────────────────────────────────────────────────────────────
      [T,   T,   stH, st,  st,  st,  st,  st,  st,  stH, T,   T  ], // 10 collar
      [T,   stD, st,  stH, st,  st,  st,  st,  stH, st,  stD, T  ], // 11
      [T,   stD, st,  st,  st,  st,  st,  st,  st,  st,  stD, T  ], // 12
      [T,   stD, st,  st,  st,  st,  st,  st,  st,  st,  stD, T  ], // 13
      [T,   blt, pnD, pn,  pn,  pn,  pn,  pn,  pn,  pnD, blt, T  ], // 14 belt
      [T,   T,   pnD, pn,  pn,  pn,  pn,  pn,  pn,  pnD, T,   T  ], // 15
      [T,   T,   pnD, pn,  pn,  T,   T,   pn,  pn,  pnD, T,   T  ], // 16
      [T,   T,   pnD, pn,  pn,  T,   T,   pn,  pn,  pnD, T,   T  ], // 17
      [T,   T,   bt,  btH, bt,  T,   T,   bt,  btH, bt,  T,   T  ], // 18 boot top
      [T,   T,   bt,  btH, bt,  bt,  bt,  bt,  btH, bt,  T,   T  ], // 19 boot toe
      [T,   T,   bt,  bt,  bt,  bt,  bt,  bt,  bt,  bt,  T,   T  ], // 20 boot sole
    ];
  }
}

// pose: 'stand' | 'sit' | 'lie'
function drawCharacterPosed(ctx, player, x, y, scale, frame, pose, isIdle) {
  const grid = buildSpriteGrid(player);
  if (pose === 'lie') {
    _drawLying(ctx, grid, x, y, scale);
  } else if (pose === 'sit') {
    _drawSitting(ctx, grid, x, y, scale);
  } else {
    const bounce = isIdle ? 0 : Math.sin(frame * 0.35) * scale * 0.4;
    _drawGrid(ctx, grid, x, y + bounce, scale);
  }
}

function _drawGrid(ctx, grid, x, y, scale) {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const c = grid[row][col];
      if (c === 'transparent') continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.floor(x + col * scale), Math.floor(y + row * scale), scale, scale);
    }
  }
}

function _drawSitting(ctx, grid, x, y, scale) {
  _drawGrid(ctx, grid, x, y, scale);
}

function _drawLying(ctx, grid, x, y, scale) {
  _drawGrid(ctx, grid, x, y, scale);
}

function drawCharacterWithName(ctx, player, x, y, scale, frame, isActive, pose, isIdle) {
  pose   = pose   || 'stand';
  isIdle = isIdle !== false;

  if (isActive) {
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = 'rgba(255,215,0,0.10)';
    ctx.fillRect(x - 4, y - 4, 12 * scale + 8, 21 * scale + 8);
    ctx.restore();
  }

  drawCharacterPosed(ctx, player, x, y, scale, frame, pose, isIdle);

  // Name tag
  const tagX = x + (12 * scale) / 2;
  const tagY = y - 10;
  ctx.save();
  ctx.font      = `bold ${scale * 2.2}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  const tw  = ctx.measureText(player.displayName).width + 12;
  const th  = scale * 2.8;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  _roundRect(ctx, tagX - tw / 2, tagY - th + 2, tw, th, 4);
  ctx.fill();
  ctx.fillStyle = isActive ? '#FFD700' : '#FFFFFF';
  ctx.fillText(player.displayName, tagX, tagY);
  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getSpriteSize(scale) { return { w: 12 * scale, h: 21 * scale }; }
