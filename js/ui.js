// UI panel management

let currentPanel = 'goals';
let activePlayer = 'bjerg';
let showAddGoal = false;
let showAddTodo = false;
let showAddReward = false;
let notification = null;
let notifTimer = null;

function setActivePlayer(id) { activePlayer = id; renderUI(); }
function getActivePlayer() {
  // If logged in, always return logged-in player as active
  const loggedIn = typeof Auth !== 'undefined' ? Auth.getLoggedIn() : null;
  return loggedIn || activePlayer;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function showLoginScreen() {
  document.getElementById('login-overlay').style.display = 'flex';
}
function hideLoginScreen() {
  document.getElementById('login-overlay').style.display = 'none';
}

function renderLoginScreen() {
  const container = document.getElementById('login-cards');

  // Authenticated via Supabase but player not chosen yet → show character picker
  if (Auth._isAuthenticated && !Auth._playerId) {
    const data = Data.load();
    container.innerHTML = ['bjerg', 'hungry'].map(id => {
      const p = data.players[id];
      return `<div class="login-card" onclick="selectLoginPlayer('${id}')">
        <div class="login-avatar" style="background:${p.skin};border-color:${p.hairColor}">
          <div class="login-hair" style="background:${p.hairColor};height:${p.hairStyle==='long'?'60%':'40%'}"></div>
          <div class="login-eyes">
            <div style="background:${p.eyeColor}"></div>
            <div style="background:${p.eyeColor}"></div>
          </div>
        </div>
        <div class="login-name">${p.displayName}</div>
        <div class="login-coins">🪙 ${p.coins}</div>
      </div>`;
    }).join('');
    return;
  }

  // Not authenticated → show email + password form
  container.innerHTML = `
    <div class="login-email-form">
      <input type="email" id="login-email" class="input-full" placeholder="Email address"
             onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()">
      <input type="password" id="login-password" class="input-full" placeholder="Password"
             style="margin-top:8px"
             onkeydown="if(event.key==='Enter')submitEmailLogin()">
      <div id="login-error" style="color:#E74C3C;font-size:8px;min-height:16px;margin-top:6px;text-align:center"></div>
      <div class="form-actions" style="margin-top:8px;justify-content:center">
        <button class="btn-primary" onclick="submitEmailLogin()">Sign In ▶</button>
      </div>
    </div>`;
}

async function selectLoginPlayer(id) {
  try {
    await Auth.setPlayer(id);
    _finishLogin(id);
  } catch (e) {
    showNotification('Error: ' + e.message, 'warn');
  }
}

async function submitEmailLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errEl    = document.getElementById('login-error');
  if (!email || !password) { if (errEl) errEl.textContent = 'Enter email and password'; return; }
  if (errEl) errEl.textContent = 'Signing in…';
  try {
    const result = await Auth.signIn(email, password);
    if (result.needsPlayerChoice) {
      renderLoginScreen(); // show character picker
    } else {
      _finishLogin(Auth.getLoggedIn());
    }
  } catch (e) {
    if (errEl) errEl.textContent = e.message;
  }
}

async function _finishLogin(id) {
  activePlayer = id;
  // Now that we're authenticated, reload data from Supabase + subscribe to realtime
  await Data.loadRemote();
  Data.setupRealtime();
  updateSyncStatus();
  hideLoginScreen();
  renderUI();
  document.getElementById('logout-btn').style.display = 'inline-flex';
  document.getElementById('logout-btn').querySelector('.logout-name').textContent = id;
}

function doLogout() {
  Auth.signOut();
}

function updateSyncStatus() {
  const syncEl = document.getElementById('sync-status');
  if (!syncEl) return;
  const base = 'position:absolute;top:12px;right:12px;font-family:"Press Start 2P",monospace;font-size:7px;padding:4px 8px;border-radius:6px;z-index:10;';
  if (window._supabaseOK) {
    syncEl.textContent = '☁️ synced';
    syncEl.title = '';
    syncEl.style.cssText = base + 'pointer-events:none;color:#4CAF50;background:rgba(76,175,80,0.15);border:1px solid rgba(76,175,80,0.3)';
  } else {
    const errMsg = window._supabaseError || (Auth._isAuthenticated ? 'Unknown Supabase error' : 'Not signed in');
    syncEl.textContent = '💾 offline';
    syncEl.title = errMsg;
    syncEl.style.cssText = base + 'pointer-events:auto;cursor:help;color:#E74C3C;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3)';
    console.error('[Supabase]', errMsg);
  }
}

function showNotification(msg, type = 'coins') {
  clearTimeout(notifTimer);
  notification = { msg, type };
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.className = `notification show ${type}`;
  notifTimer = setTimeout(() => {
    el.classList.remove('show');
    notification = null;
  }, 3000);
}

function renderUI() {
  renderPlayerTabs();
  renderPanel();
  renderCoinDisplay();
}

function renderPlayerTabs() {
  const data     = Data.load();
  const bjerg    = data.players.bjerg;
  const hungry   = data.players.hungry;
  const loggedIn = typeof Auth !== 'undefined' ? Auth.getLoggedIn() : null;
  const cur      = getActivePlayer();

  // When logged in, only show own tab (other is read-only, shown as info)
  const canSwitch = !loggedIn;

  document.getElementById('tab-bjerg').innerHTML = `
    <div class="player-tab ${cur === 'bjerg' ? 'active' : ''} ${loggedIn && loggedIn !== 'bjerg' ? 'readonly' : ''}"
         onclick="${canSwitch ? "setActivePlayer('bjerg')" : ''}">
      <div class="tab-avatar" style="background:${bjerg.skin};border-color:${bjerg.hairColor}"></div>
      <span>bjerg</span>
      <span class="tab-coins">🪙 ${bjerg.coins}</span>
    </div>`;
  document.getElementById('tab-hungry').innerHTML = `
    <div class="player-tab ${cur === 'hungry' ? 'active' : ''} ${loggedIn && loggedIn !== 'hungry' ? 'readonly' : ''}"
         onclick="${canSwitch ? "setActivePlayer('hungry')" : ''}">
      <div class="tab-avatar" style="background:${hungry.skin};border-color:${hungry.hairColor}"></div>
      <span>hungry</span>
      <span class="tab-coins">🪙 ${hungry.coins}</span>
    </div>`;
}

function renderCoinDisplay() {
  const player = Data.getPlayer(activePlayer);
  document.getElementById('coin-count').textContent = player.coins;
}

function switchPanel(panel) {
  currentPanel = panel;
  showAddGoal = false;
  showAddTodo = false;
  showAddReward = false;
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-panel="${panel}"]`).classList.add('active');
  renderPanel();
}

function renderPanel() {
  const container = document.getElementById('panel-content');
  switch (currentPanel) {
    case 'goals':   container.innerHTML = renderGoalsPanel();   break;
    case 'todos':   container.innerHTML = renderTodosPanel();   break;
    case 'shop':    container.innerHTML = renderShopPanel();    break;
    case 'status':  container.innerHTML = renderStatusPanel();  break;
  }
}

// ─── GOALS PANEL ────────────────────────────────────────────────────────────

function renderGoalsPanel() {
  const player = Data.getPlayer(activePlayer);
  const otherPlayer = Data.getPlayer(activePlayer === 'bjerg' ? 'hungry' : 'bjerg');
  const visibleGoals = player.goals.filter(g => !g.completedAt || g.milestones[100]);
  const otherVisibleGoals = otherPlayer.goals.filter(g => !g.isPrivate);

  let html = `<div class="panel-section">
    <div class="section-header">
      <span>✨ My Goals</span>
      <button class="btn-add" onclick="toggleAddGoal()">+ Add</button>
    </div>`;

  if (showAddGoal) html += renderAddGoalForm();

  if (visibleGoals.length === 0 && !showAddGoal) {
    html += `<div class="empty-state">No goals yet.<br>Add one to start earning coins! 🪙</div>`;
  }

  visibleGoals.forEach(goal => {
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
    const completed = goal.completedAt !== null;
    html += `
      <div class="goal-card ${completed ? 'completed' : ''}">
        <div class="goal-header">
          <span class="goal-title">${goal.isPrivate ? '🔒 ' : ''}${escHtml(goal.title)}</span>
          ${completed ? '<span class="badge-done">✓ Done!</span>' : ''}
          <button class="btn-icon" onclick="deleteGoal('${goal.id}')">✕</button>
        </div>
        <div class="goal-progress-row">
          <span class="goal-value">${goal.current} / ${goal.target} ${escHtml(goal.unit)}</span>
          <span class="goal-pct">${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${pct >= 100 ? 'full' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="milestone-row">
          ${[25,50,75,100].map(m => `<span class="milestone ${goal.milestones[m] ? 'earned' : ''}">
            ${m}%${goal.milestones[m] ? '✓' : ''}
          </span>`).join('')}
        </div>
        ${!completed ? `
        <div class="goal-update-row">
          <input type="number" id="upd-${goal.id}" placeholder="New value" class="input-small" value="${goal.current}">
          <button class="btn-sm" onclick="updateGoalProgress('${goal.id}')">Update</button>
        </div>` : ''}
      </div>`;
  });

  html += `</div>`;

  if (otherVisibleGoals.length > 0) {
    html += `<div class="panel-section">
      <div class="section-header"><span>👀 ${otherPlayer.displayName}'s Goals</span></div>`;
    otherVisibleGoals.forEach(goal => {
      const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
      html += `
        <div class="goal-card other">
          <div class="goal-header">
            <span class="goal-title">${escHtml(goal.title)}</span>
            ${goal.completedAt ? '<span class="badge-done">✓</span>' : ''}
          </div>
          <div class="goal-progress-row">
            <span class="goal-value">${goal.current} / ${goal.target} ${escHtml(goal.unit)}</span>
            <span class="goal-pct">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  return html;
}

function renderAddGoalForm() {
  return `
    <div class="add-form">
      <input type="text" id="goal-title" placeholder="Goal name (e.g. Lose weight)" class="input-full">
      <div class="input-row">
        <input type="number" id="goal-current" placeholder="Current" class="input-half">
        <input type="number" id="goal-target"  placeholder="Target"  class="input-half">
        <input type="text"   id="goal-unit"    placeholder="Unit (kg, km...)" class="input-half">
      </div>
      <label class="checkbox-label">
        <input type="checkbox" id="goal-private"> 🔒 Keep private
      </label>
      <div class="form-actions">
        <button class="btn-cancel" onclick="toggleAddGoal()">Cancel</button>
        <button class="btn-primary" onclick="submitGoal()">Add Goal</button>
      </div>
    </div>`;
}

function toggleAddGoal() { showAddGoal = !showAddGoal; renderPanel(); }

function submitGoal() {
  const title   = document.getElementById('goal-title').value.trim();
  const current = parseFloat(document.getElementById('goal-current').value) || 0;
  const target  = parseFloat(document.getElementById('goal-target').value);
  const unit    = document.getElementById('goal-unit').value.trim();
  const isPrivate = document.getElementById('goal-private').checked;
  if (!title || isNaN(target) || target <= 0) {
    showNotification('Please fill in the goal name and target! ⚠️', 'warn');
    return;
  }
  Data.addGoal(activePlayer, { title, current, target, unit, isPrivate });
  showAddGoal = false;
  showNotification('Goal added! Start working towards it 💪', 'info');
  renderUI();
}

function deleteGoal(goalId) {
  Data.deleteGoal(activePlayer, goalId);
  renderUI();
}

function updateGoalProgress(goalId) {
  const input = document.getElementById(`upd-${goalId}`);
  const val = parseFloat(input.value);
  if (isNaN(val)) return;
  const coinsEarned = Data.updateGoalProgress(activePlayer, goalId, val);
  if (coinsEarned > 0) {
    showNotification(`Milestone reached! +${coinsEarned} 🪙`, 'coins');
  } else {
    showNotification('Progress updated! Keep going! 🎯', 'info');
  }
  renderUI();
}

// ─── TODOS PANEL ────────────────────────────────────────────────────────────

function renderTodosPanel() {
  const player = Data.getPlayer(activePlayer);
  const pending = player.todos.filter(t => !t.done);
  const done = player.todos.filter(t => t.done).slice(-5);

  let html = `<div class="panel-section">
    <div class="section-header">
      <span>📝 To-Do List</span>
      <button class="btn-add" onclick="toggleAddTodo()">+ Add</button>
    </div>
    <div class="coins-hint">Complete a task → +${Data.getCoinRewards().todoComplete} 🪙</div>`;

  if (showAddTodo) {
    html += `<div class="add-form">
      <input type="text" id="todo-text" placeholder="What do you need to do?" class="input-full">
      <label class="checkbox-label">
        <input type="checkbox" id="todo-private"> 🔒 Keep private
      </label>
      <div class="form-actions">
        <button class="btn-cancel" onclick="toggleAddTodo()">Cancel</button>
        <button class="btn-primary" onclick="submitTodo()">Add Task</button>
      </div>
    </div>`;
  }

  if (pending.length === 0 && !showAddTodo) {
    html += `<div class="empty-state">All done! 🎉<br>Add more tasks to earn coins.</div>`;
  }

  pending.forEach(todo => {
    html += `
      <div class="todo-item">
        <button class="todo-check" onclick="completeTodo('${todo.id}')">○</button>
        <span class="todo-text ${todo.isPrivate ? 'private' : ''}">${todo.isPrivate ? '🔒 ' : ''}${escHtml(todo.text)}</span>
        <button class="btn-icon" onclick="deleteTodo('${todo.id}')">✕</button>
      </div>`;
  });

  if (done.length > 0) {
    html += `<div class="section-sub">Recently done:</div>`;
    done.reverse().forEach(todo => {
      html += `
        <div class="todo-item done">
          <span class="todo-check done-check">✓</span>
          <span class="todo-text done-text">${escHtml(todo.text)}</span>
          <button class="btn-icon" onclick="deleteTodo('${todo.id}')">✕</button>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

function toggleAddTodo() { showAddTodo = !showAddTodo; renderPanel(); }

function submitTodo() {
  const text = document.getElementById('todo-text').value.trim();
  const isPrivate = document.getElementById('todo-private').checked;
  if (!text) return;
  Data.addTodo(activePlayer, text, isPrivate);
  showAddTodo = false;
  renderUI();
}

function completeTodo(todoId) {
  const coins = Data.completeTodo(activePlayer, todoId);
  showNotification(`Task done! +${coins} 🪙`, 'coins');
  renderUI();
}

function deleteTodo(todoId) {
  Data.deleteTodo(activePlayer, todoId);
  renderUI();
}

// ─── SHOP PANEL ─────────────────────────────────────────────────────────────

function renderShopPanel() {
  const player = Data.getPlayer(activePlayer);
  const shopItems = Data.getShopItems();
  const ownedOutfits = player.ownedOutfits || ['default'];

  let html = `<div class="panel-section">
    <div class="section-header"><span>👗 Outfits</span><span class="coins-display">🪙 ${player.coins}</span></div>
    <div class="shop-grid">`;

  shopItems.outfits.forEach(item => {
    const owned = ownedOutfits.includes(item.id);
    const wearing = player.outfit === item.id;
    const canBuy = !owned && player.coins >= item.price;
    html += `
      <div class="shop-item ${wearing ? 'wearing' : ''} ${owned && !wearing ? 'owned' : ''}">
        <div class="shop-preview" style="background:${item.color || '#A0C4FF'}">
          <div class="outfit-icon">👕</div>
        </div>
        <div class="shop-name">${item.name}</div>
        ${wearing ? '<div class="shop-status">Wearing ✓</div>'
          : owned ? `<button class="btn-sm" onclick="wearOutfit('${item.id}')">Wear</button>`
          : `<button class="btn-sm ${canBuy ? '' : 'disabled'}" onclick="buyOutfit('${item.id}')">🪙 ${item.price}</button>`}
      </div>`;
  });

  html += `</div></div>
  <div class="panel-section">
    <div class="section-header"><span>🪑 Furniture</span></div>
    <div class="shop-grid">`;

  shopItems.furniture.forEach(item => {
    const owned = player.furniture.includes(item.id);
    const canBuy = !owned && player.coins >= item.price;
    html += `
      <div class="shop-item ${owned ? 'owned' : ''}">
        <div class="shop-preview furniture-prev">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        ${owned ? '<div class="shop-status">Owned ✓</div>'
          : `<button class="btn-sm ${canBuy ? '' : 'disabled'}" onclick="buyFurniture('${item.id}')">🪙 ${item.price}</button>`}
      </div>`;
  });

  html += `</div></div>`;

  // Custom rewards
  html += renderCustomRewardsSection(player);
  return html;
}

function renderCustomRewardsSection(player) {
  const rewards = player.customRewards;
  let html = `<div class="panel-section">
    <div class="section-header">
      <span>🎁 Custom Rewards</span>
      <button class="btn-add" onclick="toggleAddReward()">+ Add</button>
    </div>
    <div class="rewards-hint">Set real-world rewards to save up for!</div>`;

  if (showAddReward) {
    html += `<div class="add-form">
      <input type="text" id="reward-name" placeholder="e.g. Go eat sushi 🍣" class="input-full">
      <div class="input-row">
        <input type="number" id="reward-price" placeholder="Coin price" class="input-half">
        <input type="text" id="reward-emoji" placeholder="Emoji" class="input-half" maxlength="2">
      </div>
      <div class="form-actions">
        <button class="btn-cancel" onclick="toggleAddReward()">Cancel</button>
        <button class="btn-primary" onclick="submitReward()">Add Reward</button>
      </div>
    </div>`;
  }

  if (rewards.length === 0 && !showAddReward) {
    html += `<div class="empty-state">No custom rewards yet!<br>Add something fun to work towards 🌟</div>`;
  }

  rewards.forEach(reward => {
    const canRedeem = !reward.redeemed && player.coins >= reward.price;
    const pct = Math.min(100, Math.round((player.coins / reward.price) * 100));
    html += `
      <div class="reward-card ${reward.redeemed ? 'redeemed' : ''}">
        <div class="reward-emoji">${reward.emoji}</div>
        <div class="reward-info">
          <div class="reward-name">${escHtml(reward.name)}</div>
          <div class="reward-price">🪙 ${reward.price}</div>
          ${!reward.redeemed ? `
          <div class="progress-bar mini">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="reward-progress-text">${player.coins}/${reward.price} (${pct}%)</div>
          ` : '<div class="redeemed-label">🎉 Redeemed!</div>'}
        </div>
        ${!reward.redeemed ? `
        <button class="btn-redeem ${canRedeem ? '' : 'disabled'}" onclick="redeemReward('${reward.id}')">
          ${canRedeem ? 'Redeem! 🎉' : `Need ${reward.price - player.coins} more 🪙`}
        </button>` : ''}
      </div>`;
  });

  html += `</div>`;
  return html;
}

function toggleAddReward() { showAddReward = !showAddReward; renderPanel(); }

function submitReward() {
  const name  = document.getElementById('reward-name').value.trim();
  const price = parseInt(document.getElementById('reward-price').value);
  const emoji = document.getElementById('reward-emoji').value.trim() || '🎁';
  if (!name || isNaN(price) || price <= 0) {
    showNotification('Please fill in name and price! ⚠️', 'warn');
    return;
  }
  Data.addCustomReward(activePlayer, { name, price, emoji });
  showAddReward = false;
  showNotification('Custom reward added! Start saving up 💰', 'info');
  renderUI();
}

function redeemReward(rewardId) {
  const ok = Data.redeemCustomReward(activePlayer, rewardId);
  if (ok) {
    showNotification('🎉 Reward redeemed! Enjoy your treat!', 'celebrate');
    triggerCelebration();
  } else {
    showNotification('Not enough coins yet! 🪙', 'warn');
  }
  renderUI();
}

function buyOutfit(outfitId) {
  const ok = Data.buyOutfit(activePlayer, outfitId);
  if (ok) {
    const item = Data.getShopItems().outfits.find(i => i.id === outfitId);
    showNotification(`Got ${item.name}! 🛍️`, 'coins');
    renderUI();
    window.gameNeedsRedraw = true;
  } else {
    showNotification('Not enough coins! 🪙', 'warn');
  }
}

function wearOutfit(outfitId) {
  Data.wearOutfit(activePlayer, outfitId);
  renderUI();
  window.gameNeedsRedraw = true;
}

function buyFurniture(furnitureId) {
  const ok = Data.buyFurniture(activePlayer, furnitureId);
  if (ok) {
    const item = Data.getShopItems().furniture.find(i => i.id === furnitureId);
    showNotification(`Got ${item.name}! ${item.emoji}`, 'coins');
    renderUI();
    window.gameNeedsRedraw = true;
  } else {
    showNotification('Not enough coins! 🪙', 'warn');
  }
}

// ─── STATUS PANEL ────────────────────────────────────────────────────────────

function renderStatusPanel() {
  const player = Data.getPlayer(activePlayer);
  const statuses = [
    { id: 'home',      label: 'At Home',     emoji: '🏠' },
    { id: 'classroom', label: 'In Class',    emoji: '📚' },
    { id: 'office',    label: 'At Work',     emoji: '💼' },
    { id: 'cafe',      label: 'At Café',     emoji: '☕' },
  ];

  let html = `<div class="panel-section">
    <div class="section-header"><span>📍 Current Status</span></div>
    <div class="status-grid">`;

  statuses.forEach(s => {
    html += `
      <div class="status-item ${player.status === s.id ? 'active' : ''}" onclick="setStatus('${s.id}')">
        <div class="status-emoji">${s.emoji}</div>
        <div class="status-label">${s.label}</div>
        ${player.status === s.id ? '<div class="status-check">✓</div>' : ''}
      </div>`;
  });

  html += `</div></div>`;

  // Stats summary
  const totalGoals     = player.goals.length;
  const completedGoals = player.goals.filter(g => g.completedAt).length;
  const doneTodos      = player.todos.filter(t => t.done).length;

  html += `<div class="panel-section">
    <div class="section-header"><span>📊 Stats</span></div>
    <div class="stats-grid">
      <div class="stat-item"><div class="stat-val">🪙 ${player.coins}</div><div class="stat-label">Coins</div></div>
      <div class="stat-item"><div class="stat-val">🎯 ${completedGoals}/${totalGoals}</div><div class="stat-label">Goals Done</div></div>
      <div class="stat-item"><div class="stat-val">✅ ${doneTodos}</div><div class="stat-label">Tasks Done</div></div>
    </div>
  </div>

  <div class="panel-section">
    <div class="section-header"><span>🪙 Coin Cheatsheet</span></div>
    <div class="cheatsheet">
      <div>✅ Complete a task → +10</div>
      <div>🎯 25% milestone → +50</div>
      <div>🎯 50% milestone → +100</div>
      <div>🎯 75% milestone → +150</div>
      <div>🏆 Complete goal → +500</div>
    </div>
  </div>

  `;

  return html;
}

function setStatus(statusId) {
  Data.setStatus(getActivePlayer(), statusId);
  renderUI();
  window.gameNeedsRedraw = true;
}

// ─── CELEBRATION ─────────────────────────────────────────────────────────────

function triggerCelebration() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    color: ['#FFD700','#FF69B4','#87CEEB','#98FB98','#DDA0DD'][Math.floor(Math.random()*5)],
    size: Math.random() * 10 + 5,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.2
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    frame++;
    if (frame < 120) requestAnimationFrame(animate);
    else { canvas.style.display = 'none'; ctx.clearRect(0,0,canvas.width,canvas.height); }
  }
  animate();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
