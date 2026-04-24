// Pixel art sprite renderer

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

function buildSpriteGrid(player) {
  const skin   = player.skin;
  const hair   = player.hairColor;
  const eye    = player.eyeColor;
  const outfit = OUTFIT_COLORS[player.outfit || 'default'];
  const shirt  = outfit.shirt;
  const pants  = outfit.pants;
  const shoe   = '#3D2B1F';
  const T      = 'transparent';

  if (player.hairStyle === 'long') {
    // hungry — long wavy hair (curly texture via alternating side width)
    return [
      [T,    T,    hair, hair, hair, hair, hair, hair, hair, hair, T,    T   ], // 0
      [T,    hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, T   ], // 1
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 2
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 3
      [hair, skin, skin, eye,  skin, skin, skin, eye,  skin, skin, skin, hair], // 4
      [hair, skin, skin, eye,  skin, skin, skin, eye,  skin, skin, skin, hair], // 5
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 6
      [hair, skin, skin, skin, '#D4896A', skin, skin, '#D4896A', skin, skin, skin, hair], // 7 cheeks
      [hair, skin, skin, skin, skin, '#7B3F00', '#7B3F00', skin, skin, skin, skin, hair], // 8 mouth
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 9
      // body — wavy hair: narrow row then wide row alternates to create curl texture
      [hair, T,    shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T,    hair], // 10 narrow
      [hair, hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair, hair], // 11 wide
      [hair, T,    shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T,    hair], // 12 narrow
      [hair, hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair, hair], // 13 wide
      [hair, T,    shirt, pants, pants, pants, pants, pants, pants, shirt, T,    hair], // 14 narrow
      [hair, hair, pants, pants, pants, pants, pants, pants, pants, pants, hair, hair], // 15 wide
      [hair, T,    pants, pants, T,    T,    T,    T,    pants, pants, T,    hair], // 16 narrow
      [hair, hair, pants, pants, T,    T,    T,    T,    pants, pants, hair, hair], // 17 wide
      [hair, T,    pants, pants, T,    T,    T,    T,    pants, pants, T,    hair], // 18 narrow
      [T,    hair, shoe,  shoe,  shoe,  T,    T,    shoe,  shoe,  shoe,  hair, T   ], // 19 curl ends
      [T,    T,    shoe,  shoe,  shoe,  T,    T,    shoe,  shoe,  shoe,  T,    T   ], // 20
    ];
  } else {
    // bjerg — short hair
    return [
      [T,    T,    hair, hair, hair, hair, hair, hair, hair, hair, T,    T   ], // 0
      [T,    hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, T   ], // 1
      [T,    hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, T   ], // 2
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 3
      [hair, skin, skin, eye,  skin, skin, skin, eye,  skin, skin, skin, hair], // 4
      [hair, skin, skin, eye,  skin, skin, skin, eye,  skin, skin, skin, hair], // 5
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 6
      [hair, skin, skin, skin, '#FFAA88', skin, skin, '#FFAA88', skin, skin, skin, hair], // 7 cheeks
      [T,    hair, skin, skin, skin, '#7B3F00', '#7B3F00', skin, skin, skin, hair, T  ], // 8 mouth
      [T,    T,    hair, hair, skin, skin, skin, skin, hair, hair, T,    T   ], // 9
      [T,    T,    shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,T,    T   ], // 10
      [T,    shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,T   ], // 11
      [T,    shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,T   ], // 12
      [T,    shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt,T   ], // 13
      [T,    shirt,shirt,pants,pants,pants,pants,pants,pants,shirt,shirt,T   ], // 14
      [T,    T,    pants,pants,pants,pants,pants,pants,pants,pants,T,    T   ], // 15
      [T,    T,    pants,pants,T,    T,    T,    T,    pants,pants,T,    T   ], // 16
      [T,    T,    pants,pants,T,    T,    T,    T,    pants,pants,T,    T   ], // 17
      [T,    T,    pants,pants,T,    T,    T,    T,    pants,pants,T,    T   ], // 18
      [T,    T,    shoe, shoe, shoe, T,    T,    shoe, shoe, shoe, T,    T   ], // 19
      [T,    T,    shoe, shoe, shoe, T,    T,    shoe, shoe, shoe, T,    T   ], // 20
    ];
  }
}

// Draw a character with a specific pose
// pose: 'stand' | 'sit' | 'lie'
function drawCharacterPosed(ctx, player, x, y, scale, frame, pose, isIdle) {
  const grid = buildSpriteGrid(player);

  if (pose === 'lie') {
    _drawLying(ctx, grid, x, y, scale);
  } else if (pose === 'sit') {
    _drawSitting(ctx, grid, x, y, scale);
  } else {
    // Standing — bounce only while walking
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
  // Draw full sprite — legs hang below seat naturally
  _drawGrid(ctx, grid, x, y, scale);
}

function _drawLying(ctx, grid, x, y, scale) {
  // Draw upright on the bed (竖着躺)
  _drawGrid(ctx, grid, x, y, scale);
}

function drawCharacterWithName(ctx, player, x, y, scale, frame, isActive, pose, isIdle) {
  pose   = pose   || 'stand';
  isIdle = isIdle !== false;

  // Glow for active player
  if (isActive) {
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = 'rgba(255,215,0,0.12)';
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
