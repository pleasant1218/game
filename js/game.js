// Main game loop and canvas rendering

const SCALE = 4;
const WALK_SPEED = 1.2;

let canvas, ctx;
let frame = 0;
let bjergState, hungryState;
let animFrameId;

function initGame() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bjergState  = { x: 0, y: 0, targetX: 0, frame: 0, dir: 1, idle: true, idleTimer: 0 };
  hungryState = { x: 0, y: 0, targetX: 0, frame: 0, dir: 1, idle: true, idleTimer: 0 };

  resetPositions();
  gameLoop();
}

function resizeCanvas() {
  const container = document.getElementById('game-container');
  canvas.width  = container.clientWidth;
  canvas.height = container.clientHeight;
  window.gameNeedsRedraw = true;
}

function resetPositions() {
  const W = canvas.width, H = canvas.height;
  const floorY = H * 0.6 - 21 * SCALE;
  bjergState.x  = bjergState.targetX  = W * 0.3;
  hungryState.x = hungryState.targetX = W * 0.6;
  bjergState.y  = hungryState.y = floorY;
}

function gameLoop() {
  frame++;
  update();
  draw();
  animFrameId = requestAnimationFrame(gameLoop);
}

function update() {
  const data = Data.load();
  updateCharacter(bjergState,  data.players.bjerg,  canvas.width, canvas.height);
  updateCharacter(hungryState, data.players.hungry, canvas.width, canvas.height);
}

function updateCharacter(state, player, W, H) {
  const floorY = H * 0.6 - 21 * SCALE;
  state.y = floorY;

  // Random wandering
  state.idleTimer++;
  if (state.idleTimer > 180 + Math.random() * 200) {
    state.idleTimer = 0;
    const margin = 50;
    state.targetX = margin + Math.random() * (W - margin * 2 - 12 * SCALE);
  }

  const dx = state.targetX - state.x;
  if (Math.abs(dx) > 2) {
    state.x += Math.sign(dx) * WALK_SPEED;
    state.dir = Math.sign(dx);
    state.idle = false;
    state.frame++;
  } else {
    state.x = state.targetX;
    state.idle = true;
  }
}

function draw() {
  const data = Data.load();
  const bjerg  = data.players.bjerg;
  const hungry = data.players.hungry;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Draw the scene matching bjerg's current status (or home by default)
  // We use the active player's status for the scene
  const activeId  = typeof getActivePlayer !== 'undefined' ? getActivePlayer() : 'bjerg';
  const sceneId   = data.players[activeId].status || 'home';
  const allFurniture = [...bjerg.furniture, ...hungry.furniture];

  drawScene(ctx, sceneId, W, H, bjerg.furniture, hungry.furniture);

  // Draw both characters
  const isActiveB = activeId === 'bjerg';
  const isActiveH = activeId === 'hungry';

  // Draw the less-active one first (behind)
  if (bjergState.x < hungryState.x) {
    drawCharacterWithName(ctx, bjerg,  bjergState.x,  bjergState.y,  SCALE, bjergState.frame,  isActiveB);
    drawCharacterWithName(ctx, hungry, hungryState.x, hungryState.y, SCALE, hungryState.frame, isActiveH);
  } else {
    drawCharacterWithName(ctx, hungry, hungryState.x, hungryState.y, SCALE, hungryState.frame, isActiveH);
    drawCharacterWithName(ctx, bjerg,  bjergState.x,  bjergState.y,  SCALE, bjergState.frame,  isActiveB);
  }

  // Click to teleport active character
  window.gameNeedsRedraw = false;
}

function setupCanvasClick() {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const cx = (e.clientX - rect.left) * scaleX;
    const margin = 30;
    const clampedX = Math.max(margin, Math.min(canvas.width - margin - 12 * SCALE, cx));
    const activeId = getActivePlayer();
    if (activeId === 'bjerg')  bjergState.targetX  = clampedX;
    else                       hungryState.targetX = clampedX;
  });
}
