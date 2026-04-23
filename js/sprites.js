// Pixel art sprite renderer for characters

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

// Pixel art: 12 wide x 22 tall, each unit = S pixels on screen
// Colors: 0=transparent, S=skin, H=hair, E=eye, M=mouth, C=shirt, P=pants, X=shoe, W=white/collar, D=hairDetail

function buildSprite(player, scale = 4) {
  const skin = player.skin;
  const hair = player.hairColor;
  const eye  = player.eyeColor;
  const outfit = OUTFIT_COLORS[player.outfit || 'default'];
  const shirt  = outfit.shirt;
  const pants  = outfit.pants;
  const shoe   = '#3D2B1F';
  const isLong = player.hairStyle === 'long';

  // 12x24 pixel grid
  const T = 'transparent';
  const grid = [];

  if (isLong) {
    // Long hair character (hungry)
    grid.push(
      [T, T, hair, hair, hair, hair, hair, hair, hair, hair, T, T],      // 0
      [T, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, T], // 1
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 2
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 3
      [hair, skin, skin, eye, skin, skin, skin, eye, skin, skin, skin, hair],  // 4 eyes
      [hair, skin, skin, eye, skin, skin, skin, eye, skin, skin, skin, hair],  // 5
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 6
      [hair, skin, skin, skin, '#D4896A', skin, skin, '#D4896A', skin, skin, skin, hair], // 7 cheeks
      [hair, skin, skin, skin, skin, '#8B5E3C', '#8B5E3C', skin, skin, skin, skin, hair], // 8 mouth
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 9
      // body
      [T, hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair, T], // 10
      [hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair], // 11
      [hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair], // 12
      [hair, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, hair], // 13
      [hair, shirt, shirt, pants, pants, pants, pants, pants, pants, shirt, shirt, hair], // 14
      // lower
      [T, hair, pants, pants, pants, pants, pants, pants, pants, pants, hair, T], // 15
      [T, hair, pants, pants, T, T, T, T, pants, pants, hair, T],  // 16 legs split
      [T, hair, pants, pants, T, T, T, T, pants, pants, hair, T],  // 17
      [T, hair, pants, pants, T, T, T, T, pants, pants, hair, T],  // 18
      [T, T, shoe, shoe, shoe, T, T, shoe, shoe, shoe, T, T],      // 19
      [T, T, shoe, shoe, shoe, T, T, shoe, shoe, shoe, T, T],      // 20
    );
  } else {
    // Short hair character (bjerg)
    grid.push(
      [T, T, hair, hair, hair, hair, hair, hair, hair, hair, T, T],      // 0
      [T, hair, hair, hair, hair, hair, hair, hair, hair, hair, hair, T], // 1
      [T, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, T], // 2
      [hair, hair, skin, skin, skin, skin, skin, skin, skin, skin, hair, hair], // 3
      [hair, skin, skin, eye, skin, skin, skin, eye, skin, skin, skin, hair],  // 4 eyes
      [hair, skin, skin, eye, skin, skin, skin, eye, skin, skin, skin, hair],  // 5
      [hair, skin, skin, skin, skin, skin, skin, skin, skin, skin, skin, hair], // 6
      [hair, skin, skin, skin, '#FFAA88', skin, skin, '#FFAA88', skin, skin, skin, hair], // 7 cheeks
      [T, hair, skin, skin, skin, '#8B5E3C', '#8B5E3C', skin, skin, skin, hair, T], // 8 mouth
      [T, T, hair, hair, skin, skin, skin, skin, hair, hair, T, T], // 9 chin/hairline
      // body
      [T, T, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T, T], // 10
      [T, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T], // 11
      [T, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T], // 12
      [T, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, shirt, T], // 13
      [T, shirt, shirt, pants, pants, pants, pants, pants, pants, shirt, shirt, T], // 14
      // lower
      [T, T, pants, pants, pants, pants, pants, pants, pants, pants, T, T], // 15
      [T, T, pants, pants, T, T, T, T, pants, pants, T, T],  // 16 legs split
      [T, T, pants, pants, T, T, T, T, pants, pants, T, T],  // 17
      [T, T, pants, pants, T, T, T, T, pants, pants, T, T],  // 18
      [T, T, shoe, shoe, shoe, T, T, shoe, shoe, shoe, T, T], // 19
      [T, T, shoe, shoe, shoe, T, T, shoe, shoe, shoe, T, T], // 20
    );
  }

  return { grid, scale, width: 12 * scale, height: 21 * scale };
}

function drawSprite(ctx, player, x, y, scale = 4, frame = 0, direction = 1) {
  const { grid } = buildSprite(player, scale);

  // Walking animation: slight bounce
  const bounce = Math.sin(frame * 0.3) * scale * 0.5;
  const yOff = y + bounce;

  ctx.save();
  if (direction === -1) {
    ctx.translate(x + 12 * scale, 0);
    ctx.scale(-1, 1);
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const color = grid[row][col];
        if (color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * scale - 12 * scale, yOff + row * scale, scale, scale);
      }
    }
  } else {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const color = grid[row][col];
        if (color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + col * scale, yOff + row * scale, scale, scale);
      }
    }
  }
  ctx.restore();
}

function getSpriteSize(scale = 4) {
  return { width: 12 * scale, height: 21 * scale };
}

function drawCharacterWithName(ctx, player, x, y, scale = 4, frame = 0, isActive = false) {
  const size = getSpriteSize(scale);

  // Glow/highlight for active player
  if (isActive) {
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fillRect(x - 4, y - 4, size.width + 8, size.height + 8);
    ctx.restore();
  }

  drawSprite(ctx, player, x, y, scale, frame);

  // Name tag
  const nameX = x + size.width / 2;
  const nameY = y - 12;
  ctx.save();
  ctx.font = `bold ${scale * 2.5}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  const metrics = ctx.measureText(player.displayName);
  const tagW = metrics.width + 12;
  const tagH = scale * 3;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, nameX - tagW/2, nameY - tagH + 2, tagW, tagH, 4);
  ctx.fill();

  ctx.fillStyle = isActive ? '#FFD700' : '#FFFFFF';
  ctx.fillText(player.displayName, nameX, nameY);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
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
