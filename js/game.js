// Main game loop
// SCALE is defined in scenes.js (loaded before this file)

const WALK_SPEED  = 1.4;
const SNAP_RADIUS = 55;

let canvas, ctx;
let frame = 0;
let bjergState, hungryState;
let paneLayout = null; // set each frame by drawWorldAndGetPanes

function initGame() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', () => { resizeCanvas(); resetPositions(); });

  bjergState  = makeCharState();
  hungryState = makeCharState();
  resetPositions();
  _bindEvents();
  requestAnimationFrame(_loop);
}

function makeCharState() {
  return {
    x: 0, y: 0, targetX: 0,
    frame: 0, dir: 1, idle: true, idleTimer: 0,
    pose: 'stand', snapTarget: null,
    dragging: false, dragOffX: 0,
  };
}

function resizeCanvas() {
  const c = document.getElementById('game-container');
  canvas.width  = c.clientWidth;
  canvas.height = c.clientHeight;
}

function resetPositions() {
  const W = canvas.width, H = canvas.height;
  const floorY = H * 0.6 - 21 * SCALE;
  bjergState.x  = bjergState.targetX  = W * 0.28;
  hungryState.x = hungryState.targetX = W * 0.62;
  bjergState.y  = hungryState.y = floorY;
  bjergState.snapTarget  = null; bjergState.pose  = 'stand';
  hungryState.snapTarget = null; hungryState.pose = 'stand';
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function _loop() {
  frame++;
  Data._cache = null; // re-read localStorage each frame so both tabs see live state
  _update();
  _draw();
  requestAnimationFrame(_loop);
}

function _update() {
  const data = Data.load();
  _updateChar(bjergState,  data.players.bjerg,  canvas.width, canvas.height);
  _updateChar(hungryState, data.players.hungry, canvas.width, canvas.height);
}

function _updateChar(state, player, W, H) {
  // Characters in non-home scenes are auto-placed (no wandering)
  const scene = player.status || 'home';
  if (scene !== 'home') { state.idle = true; return; }
  if (state.dragging || state.snapTarget) { state.idle = true; return; }

  const pW = paneLayout ? paneLayout[player.id]?.paneW : W;

  // Random wander
  state.idleTimer++;
  if (state.idleTimer > 220 + Math.random() * 180) {
    state.idleTimer = 0;
    const margin = 40;
    state.targetX = margin + Math.random() * ((pW || W) - margin * 2 - 12 * SCALE);
  }

  const dx = state.targetX - state.x;
  if (Math.abs(dx) > 2) {
    state.x   += Math.sign(dx) * WALK_SPEED;
    state.dir  = Math.sign(dx);
    state.idle = false;
    state.frame++;
  } else {
    state.x    = state.targetX;
    state.idle = true;
  }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

function _draw() {
  const data    = Data.load();
  const bjerg   = data.players.bjerg;
  const hungry  = data.players.hungry;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Draw rooms and get pane layout
  paneLayout = drawWorldAndGetPanes(ctx, bjerg, hungry, W, H);
  // Attach player ids for _updateChar
  paneLayout.bjerg.id  = 'bjerg';
  paneLayout.hungry.id = 'hungry';

  // Position characters in their panes
  _placeCharInScene(bjergState,  bjerg,  paneLayout.bjerg,  H, 0);
  _placeCharInScene(hungryState, hungry, paneLayout.hungry, H, 1);

  const loggedIn = typeof Auth !== 'undefined' ? Auth.getLoggedIn() : null;

  // Draw back character first (whichever has smaller canvas X)
  const bjergCanvasX  = bjergState.x  + paneLayout.bjerg.offX;
  const hungryCanvasX = hungryState.x + paneLayout.hungry.offX;

  const drawBjerg  = () => drawCharacterWithName(
    ctx, bjerg,
    bjergCanvasX, bjergState.y, SCALE, bjergState.frame,
    !loggedIn || loggedIn === 'bjerg',
    bjergState.pose, bjergState.idle
  );
  const drawHungry = () => drawCharacterWithName(
    ctx, hungry,
    hungryCanvasX, hungryState.y, SCALE, hungryState.frame,
    !loggedIn || loggedIn === 'hungry',
    hungryState.pose, hungryState.idle
  );

  if (bjergCanvasX <= hungryCanvasX) { drawBjerg(); drawHungry(); }
  else                               { drawHungry(); drawBjerg(); }
}

// Place a character appropriately for their scene
function _placeCharInScene(state, player, pane, H, seatIndex) {
  const scene   = player.status || 'home';
  const floorY  = Math.floor(H * 0.6) - 21 * SCALE;
  const pW      = pane.paneW;

  if (scene === 'classroom') {
    const seats = getClassroomSeatPositions(pW, H);
    const seat  = seats[seatIndex % seats.length];
    state.x    = seat.x;
    state.y    = seat.y;
    state.pose = 'sit';
    state.idle = true;
    return;
  }

  if (scene === 'office') {
    const seats = getOfficeSeatPositions(pW, H);
    const seat  = seats[seatIndex % seats.length];
    state.x    = seat.x;
    state.y    = seat.y;
    state.pose = 'sit';
    state.idle = true;
    return;
  }

  if (scene === 'cafe') {
    state.x    = pW * (seatIndex === 0 ? 0.3 : 0.5);
    state.y    = floorY;
    state.pose = 'stand';
    state.idle = true;
    return;
  }

  // Home — sync pose/snap from Data so both accounts see the same state
  if (!state.dragging) {
    state.pose       = player.pose       || 'stand';
    state.snapTarget = player.snapTarget || null;
  }
  if (state.snapTarget) {
    const snaps = getHomeSnapZones(pW, H);
    const snap  = snaps.find(s => s.id === state.snapTarget);
    if (snap) {
      state.x = snap.x; state.y = snap.y; state.targetX = snap.x;
    } else {
      // Stale snap ID (e.g. after an update) — clear from Data once
      state.snapTarget = null; state.pose = 'stand'; state.y = floorY;
      if (player.snapTarget) Data.updatePlayer(player.id, { pose: 'stand', snapTarget: null });
    }
  } else {
    state.y = floorY;
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────

function _bindEvents() {
  canvas.addEventListener('mousedown', _onDown);
  canvas.addEventListener('mousemove', _onMove);
  canvas.addEventListener('mouseup',   _onUp);
  canvas.addEventListener('touchstart', e => _onDown(_touchToMouse(e)), { passive: true });
  canvas.addEventListener('touchmove',  e => _onMove(_touchToMouse(e)), { passive: true });
  canvas.addEventListener('touchend',   e => _onUp(_touchToMouse(e)));
}

function _touchToMouse(e) {
  const t = e.touches[0] || e.changedTouches[0];
  return { clientX: t.clientX, clientY: t.clientY };
}

function _canvasPos(e) {
  const r  = canvas.getBoundingClientRect();
  const sx = canvas.width  / r.width;
  const sy = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * sx,
    y: (e.clientY - r.top)  * sy,
  };
}

function _getControlledState() {
  const loggedIn = typeof Auth !== 'undefined' ? Auth.getLoggedIn() : null;
  if (!loggedIn) return bjergState; // fallback: control bjerg
  return loggedIn === 'hungry' ? hungryState : bjergState;
}

function _getControlledId() {
  const loggedIn = typeof Auth !== 'undefined' ? Auth.getLoggedIn() : null;
  if (!loggedIn) return 'bjerg';
  return loggedIn;
}

function _onDown(e) {
  const pos   = _canvasPos(e);
  const id    = _getControlledId();
  const state = _getControlledState();
  const pane  = paneLayout?.[id];
  if (!pane) return;

  const cx = pos.x - pane.offX; // pane-relative x
  const sw = 12 * SCALE, sh = 21 * SCALE;

  // Hit-test character
  if (cx >= state.x - 8 && cx <= state.x + sw + 8 &&
      pos.y >= state.y - 8 && pos.y <= state.y + sh + 8) {
    state.dragging  = true;
    state.snapTarget = null;
    state.pose      = 'stand';
    state.dragOffX  = cx - state.x;
  }
}

function _onMove(e) {
  const pos   = _canvasPos(e);
  const id    = _getControlledId();
  const state = _getControlledState();
  const pane  = paneLayout?.[id];
  if (!pane || !state.dragging) return;

  const cx  = pos.x - pane.offX;
  const pW  = pane.paneW;
  const newX = cx - state.dragOffX;
  state.x       = Math.max(10, Math.min(pW - 12 * SCALE - 10, newX));
  state.targetX = state.x;
  state.idle    = true;
}

function _onUp(e) {
  const id    = _getControlledId();
  const state = _getControlledState();
  const pane  = paneLayout?.[id];
  if (!pane || !state.dragging) return;
  state.dragging = false;

  const player = Data.getPlayer(id);
  if ((player.status || 'home') !== 'home') return;

  // Snap to the closest zone within SNAP_RADIUS
  const snaps = getHomeSnapZones(pane.paneW, canvas.height);
  let closestSnap = null, closestDist = SNAP_RADIUS;
  for (const snap of snaps) {
    const dist = Math.abs(state.x - snap.x);
    if (dist < closestDist) { closestDist = dist; closestSnap = snap; }
  }
  if (closestSnap) {
    state.x          = closestSnap.x;
    state.targetX    = closestSnap.x;
    state.y          = closestSnap.y;
    state.snapTarget = closestSnap.id;
    state.pose       = closestSnap.pose;
    Data.updatePlayer(id, { pose: closestSnap.pose, snapTarget: closestSnap.id });
    return;
  }
  // No snap — stay where dropped, standing on floor
  state.y          = Math.floor(canvas.height * 0.6) - 21 * SCALE;
  state.snapTarget = null;
  state.pose       = 'stand';
  Data.updatePlayer(id, { pose: 'stand', snapTarget: null });
}

// Allow clicking floor to walk (when not dragging)
canvas?.addEventListener('click', _onClick);
function setupCanvasClick() {
  // Click is already bound above; this function exists so index.html can call it
}

function _onClick(e) {
  const pos   = _canvasPos(e);
  const id    = _getControlledId();
  const state = _getControlledState();
  const pane  = paneLayout?.[id];
  if (!pane) return;

  const player = Data.getPlayer(id);
  if ((player.status || 'home') !== 'home') return;

  const sw = 12 * SCALE, sh = 21 * SCALE;
  const cx = pos.x - pane.offX;

  // Don't walk if clicking on the character itself
  if (cx >= state.x - 4 && cx <= state.x + sw + 4 &&
      pos.y >= state.y - 4 && pos.y <= state.y + sh + 4) return;

  // Walk to clicked position
  const pW     = pane.paneW;
  const target = Math.max(10, Math.min(pW - sw - 10, cx - sw / 2));
  state.targetX    = target;
  state.snapTarget = null;
  state.pose       = 'stand';
  state.idleTimer  = 0;
  Data.updatePlayer(id, { pose: 'stand', snapTarget: null });
}
