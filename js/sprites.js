// Pixel art sprite renderer — Stardew Valley inspired style

// Sprite grid dimensions (in pixel cells, pre-scale)
const SPRITE_W = 14;
const SPRITE_H = 24;

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
  const hrD = _dk(hr, 35);          // hair shadow
  const hrX = _lt(hr, 85);          // extra bright wave crest
  const outfit = OUTFIT_COLORS[player.outfit || 'default'];
  const st  = outfit.shirt;
  const stH = _lt(st, 32);          // shirt highlight
  const stD = _dk(st, 42);          // shirt shadow
  const pn  = outfit.pants;
  const pnD = _dk(pn, 42);          // pants shadow
  const blt = _dk(pn, 70);          // belt
  const ey  = player.eyeColor;
  const eyW = '#F2EAEA';            // warm eye white
  const eyP = _dk(ey, 55);          // pupil
  const brow = _dk(hr, 10);         // eyebrow
  const ck  = '#F09878';            // cheek blush
  const mt  = '#9A5038';            // mouth
  const bt  = '#3D2B1F';            // boot
  const btH = '#6B4830';            // boot toe highlight

  if (player.hairStyle === 'long') {
    // hungry — HUGE voluminous wavy long hair, big S-curve waves past shoulders
    // 14 cols × 24 rows.  Face occupies cols 4–9, rows 6–12; hair
    // fills rows 0–5 entirely, frames rows 6–13, and flows past the body
    // on rows 14–19 in alternating wave crests and troughs.
    return [
      // ── HAIR CROWN (rows 0-5) — 6 dense rows of big hair ─────────────────
      [T,   T,   hrH, hr,  hrX, hr,  hr,  hr,  hr,  hrX, hr,  hrH, T,   T  ], // 0  top peak
      [T,   hrH, hr,  hrX, hr,  hrH, hr,  hr,  hrH, hr,  hrX, hr,  hrH, T  ], // 1  spreading
      [hrH, hr,  hrX, hr,  hrH, hr,  hrH, hr,  hr,  hrH, hr,  hrX, hr,  hrH], // 2  wider, wave texture
      [hr,  hrX, hr,  hrH, hr,  hrX, hr,  hr,  hrX, hr,  hrH, hr,  hrX, hr ], // 3  MAX volume (14 wide)
      [hr,  hr,  hrH, hr,  hrH, hr,  hrH, hrH, hr,  hrH, hr,  hrH, hr,  hr ], // 4  textured density
      [hr,  hrH, hr,  hrH, skH, sk,  sk,  sk,  sk,  skH, hrH, hr,  hrH, hr ], // 5  forehead peek
      // ── FACE (rows 6-12) — hair tightly frames face ──────────────────────
      [hr,  hr,  hrH, skH, sk,  sk,  sk,  sk,  sk,  sk,  skH, hrH, hr,  hr ], // 6  forehead
      [hr,  hrH, hr,  sk,  brow,brow,sk,  sk,  brow,brow,sk,  hr,  hrH, hr ], // 7  eyebrows
      [hr,  hr,  sk,  sk,  eyW, ey,  sk,  sk,  eyW, ey,  sk,  sk,  hr,  hr ], // 8  eye whites + iris
      [hr,  hrD, sk,  sk,  ey,  eyP, sk,  sk,  ey,  eyP, sk,  sk,  hrD, hr ], // 9  iris + pupil
      [hr,  hrD, sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  hrD, hr ], // 10 mid face
      [hr,  hr,  hrD, sk,  ck,  sk,  sk,  sk,  sk,  ck,  sk,  hrD, hr,  hr ], // 11 cheeks
      [hrH, hr,  hrD, sk,  sk,  sk,  mt,  mt,  sk,  sk,  sk,  hrD, hr,  hrH], // 12 mouth
      // ── BIG WAVE — hair flows past the shoulders in large S curves ───────
      [hr,  hrH, hrD, hrD, sk,  sk,  sk,  sk,  sk,  sk,  hrD, hrD, hrH, hr ], // 13 chin / neck, hair wraps
      [hrX, hr,  hrH, T,   stH, st,  st,  st,  st,  stH, T,   hrH, hr,  hrX], // 14 WAVE CREST outward
      [hr,  hrH, hr,  hrD, stD, st,  stH, st,  st,  stD, hrD, hr,  hrH, hr ], // 15 hair curls inward
      [hrH, hr,  hrX, T,   stD, st,  st,  st,  st,  stD, T,   hrX, hr,  hrH], // 16 WAVE CREST outward (wider)
      [hr,  hrH, hr,  hrD, stD, st,  st,  st,  st,  stD, hrD, hr,  hrH, hr ], // 17 curls inward again
      [hrH, hr,  hrD, blt, blt, pnD, pn,  pn,  pnD, blt, blt, hrD, hr,  hrH], // 18 belt + wave ends
      [hr,  hrD, T,   T,   pnD, pn,  pn,  pn,  pn,  pnD, T,   T,   hrD, hr ], // 19 last hair tips
      // ── LOWER BODY ───────────────────────────────────────────────────────
      [T,   T,   T,   T,   pnD, pn,  pn,  pn,  pn,  pnD, T,   T,   T,   T  ], // 20 pants
      [T,   T,   T,   T,   pnD, pn,  T,   T,   pn,  pnD, T,   T,   T,   T  ], // 21 legs split
      [T,   T,   T,   T,   bt,  btH, bt,  T,   bt,  btH, bt,  T,   T,   T  ], // 22 boot top
      [T,   T,   T,   T,   bt,  btH, bt,  bt,  bt,  btH, bt,  T,   T,   T  ], // 23 boot sole
    ];
  } else {
    // bjerg — textured thick short hair, swoopy side-swept bang, 4x the volume
    // 14 cols × 24 rows.  Crown is 5 rows of layered strands;
    // bang sweeps diagonally across the forehead, sideburns taper down the jaw.
    return [
      // ── HAIR CROWN (rows 0-4) — thick textured spikes ────────────────────
      [T,   T,   hrH, hr,  hrD, hr,  hrH, hr,  hrD, hr,  hrH, hr,  T,   T  ], // 0  spiky top
      [T,   hrH, hr,  hrH, hr,  hrD, hr,  hrH, hr,  hrD, hr,  hrH, hr,  T  ], // 1  textured layer
      [T,   hr,  hrD, hr,  hrH, hr,  hr,  hrD, hr,  hrH, hr,  hr,  hrD, T  ], // 2  layered strands
      [hr,  hrH, hr,  hrD, hr,  hrH, hr,  hr,  hrH, hr,  hrD, hr,  hrH, hr ], // 3  MAX width + layered
      [hr,  hr,  hrH, hr,  hrD, hr,  hrH, hr,  hr,  hrD, hr,  hrH, hr,  hrD], // 4  side-swept sweep begins
      // ── BANG + FOREHEAD (rows 5-6) — bang drapes diagonally ──────────────
      [T,   hr,  hrH, hrD, hr,  hrH, skH, sk,  sk,  skH, hrH, hrD, hr,  T  ], // 5  bang crosses forehead
      [T,   T,   hr,  hrD, skH, sk,  sk,  sk,  sk,  sk,  skH, hrD, hr,  T  ], // 6  forehead + sideburn frame
      // ── FACE (rows 7-12) ─────────────────────────────────────────────────
      [T,   hr,  hr,  sk,  brow,brow,sk,  sk,  brow,brow,sk,  sk,  hr,  T  ], // 7  eyebrows
      [T,   hr,  sk,  sk,  eyW, ey,  sk,  sk,  eyW, ey,  sk,  sk,  hr,  T  ], // 8  eye whites + iris
      [T,   hr,  sk,  sk,  ey,  eyP, sk,  sk,  ey,  eyP, sk,  sk,  hr,  T  ], // 9  iris + pupil
      [T,   hr,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  sk,  hr,  T  ], // 10 mid face
      [T,   hrD, sk,  sk,  ck,  sk,  sk,  sk,  sk,  ck,  sk,  sk,  hrD, T  ], // 11 cheeks + sideburns
      [T,   T,   hrD, sk,  sk,  sk,  mt,  mt,  sk,  sk,  sk,  hrD, T,   T  ], // 12 mouth + sideburn taper
      [T,   T,   T,   hrD, hrD, sk,  sk,  sk,  sk,  hrD, hrD, T,   T,   T  ], // 13 jaw / neck line
      // ── BODY (rows 14-19) ────────────────────────────────────────────────
      [T,   T,   T,   T,   stH, st,  st,  st,  st,  stH, T,   T,   T,   T  ], // 14 collar
      [T,   T,   T,   stD, st,  stH, st,  st,  stH, st,  stD, T,   T,   T  ], // 15 shoulders
      [T,   T,   T,   stD, st,  st,  st,  st,  st,  st,  stD, T,   T,   T  ], // 16 torso
      [T,   T,   T,   stD, st,  st,  st,  st,  st,  st,  stD, T,   T,   T  ], // 17 torso
      [T,   T,   T,   blt, blt, pnD, pn,  pn,  pnD, blt, blt, T,   T,   T  ], // 18 belt
      [T,   T,   T,   T,   pnD, pn,  pn,  pn,  pn,  pnD, T,   T,   T,   T  ], // 19 pants
      // ── LOWER BODY ───────────────────────────────────────────────────────
      [T,   T,   T,   T,   pnD, pn,  pn,  pn,  pn,  pnD, T,   T,   T,   T  ], // 20 pants
      [T,   T,   T,   T,   pnD, pn,  T,   T,   pn,  pnD, T,   T,   T,   T  ], // 21 legs split
      [T,   T,   T,   T,   bt,  btH, bt,  T,   bt,  btH, bt,  T,   T,   T  ], // 22 boot top
      [T,   T,   T,   T,   bt,  btH, bt,  bt,  bt,  btH, bt,  T,   T,   T  ], // 23 boot sole
    ];
  }
}

// pose: 'stand' | 'sit' | 'lie'
function drawCharacterPosed(ctx, player, x, y, scale, frame, pose, isIdle, dir) {
  const grid  = buildSpriteGrid(player);
  const flip  = dir === -1;
  if (flip) {
    ctx.save();
    const cx = x + (SPRITE_W * scale) / 2;
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }
  if (pose === 'lie') {
    _drawLying(ctx, grid, x, y, scale);
  } else if (pose === 'sit') {
    _drawSitting(ctx, grid, x, y, scale);
  } else if (isIdle) {
    _drawGrid(ctx, grid, x, y, scale);
  } else {
    _drawWalking(ctx, grid, x, y, scale, frame);
  }
  if (flip) ctx.restore();
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

// Walking gait: alternating lower-leg lift (rows 21-23) with a tiny body bob.
// Left leg spans cols 4-6, right leg cols 7-10 in the sprite grid.
function _drawWalking(ctx, grid, x, y, scale, frame) {
  const phase     = frame * 0.15;
  const leftLift  = Math.max(0, Math.sin(phase))           * scale;
  const rightLift = Math.max(0, Math.sin(phase + Math.PI)) * scale;
  const bodyBob   = -Math.abs(Math.sin(phase)) * scale * 0.25;
  const LEG_TOP_ROW = 21;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const c = grid[row][col];
      if (c === 'transparent') continue;
      ctx.fillStyle = c;
      let yOff = bodyBob;
      if (row >= LEG_TOP_ROW) {
        yOff -= (col <= 6) ? leftLift : rightLift;
      }
      ctx.fillRect(
        Math.floor(x + col * scale),
        Math.floor(y + row * scale + yOff),
        scale, scale
      );
    }
  }
}

function _drawSitting(ctx, grid, x, y, scale) {
  _drawGrid(ctx, grid, x, y, scale);
}

function _drawLying(ctx, grid, x, y, scale) {
  _drawGrid(ctx, grid, x, y, scale);
}

function drawCharacterWithName(ctx, player, x, y, scale, frame, isActive, pose, isIdle, dir) {
  pose   = pose   || 'stand';
  isIdle = isIdle !== false;
  dir    = dir    || 1;

  if (isActive) {
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = 'rgba(255,215,0,0.10)';
    ctx.fillRect(x - 4, y - 4, SPRITE_W * scale + 8, SPRITE_H * scale + 8);
    ctx.restore();
  }

  drawCharacterPosed(ctx, player, x, y, scale, frame, pose, isIdle, dir);

  // Name tag
  const tagX = x + (SPRITE_W * scale) / 2;
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

function getSpriteSize(scale) { return { w: SPRITE_W * scale, h: SPRITE_H * scale }; }
