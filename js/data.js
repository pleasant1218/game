// Data layer — Supabase cloud storage + localStorage fallback

const SUPABASE_URL = 'https://inbkpznkkdntyaggqbcr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYmtwem5ra2RudHlhZ2dxYmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODE4NDUsImV4cCI6MjA5MjU1Nzg0NX0.XaCOG_Bp6Aa8IcjeBMnVYxhcCBK4oH0AfqL3-rVQjCc';

const DEFAULT_PLAYERS = {
  bjerg: {
    id: 'bjerg', displayName: 'bjerg',
    skin: '#FFDAB9', hairColor: '#8B5E3C', hairStyle: 'short', eyeColor: '#4A90D9',
    coins: 0, outfit: 'default', ownedOutfits: ['default'], furniture: [],
    status: 'home', pose: 'stand', snapTarget: null, pin: null,
    goals: [], todos: [], customRewards: [], achievements: [],
    createdAt: Date.now()
  },
  hungry: {
    id: 'hungry', displayName: 'hungry',
    skin: '#F0C89A', hairColor: '#1C1C1C', hairStyle: 'long', eyeColor: '#6B3D2A',
    coins: 0, outfit: 'default', ownedOutfits: ['default'], furniture: [],
    status: 'home', pose: 'stand', snapTarget: null, pin: null,
    goals: [], todos: [], customRewards: [], achievements: [],
    createdAt: Date.now()
  }
};

const SHOP_ITEMS = {
  outfits: [
    { id: 'default',    name: 'Default',       price: 0,    color: null      },
    { id: 'red',        name: 'Red Dress',     price: 150,  color: '#E74C3C' },
    { id: 'blue',       name: 'Blue Suit',     price: 150,  color: '#2980B9' },
    { id: 'green',      name: 'Green Hoodie',  price: 120,  color: '#27AE60' },
    { id: 'purple',     name: 'Purple Robe',   price: 200,  color: '#8E44AD' },
    { id: 'yellow',     name: 'Yellow Jacket', price: 180,  color: '#F1C40F' },
    { id: 'pink',       name: 'Pink Sweater',  price: 160,  color: '#E91E8C' },
    { id: 'black',      name: 'Black Outfit',  price: 220,  color: '#2C3E50' },
  ],
  furniture: [
    { id: 'plant',     name: 'Cute Plant',   price: 80,  emoji: '🌱' },
    { id: 'lamp',      name: 'Cozy Lamp',    price: 100, emoji: '🪔' },
    { id: 'bookshelf', name: 'Bookshelf',    price: 150, emoji: '📚' },
    { id: 'cat',       name: 'Pet Cat',      price: 300, emoji: '🐱' },
    { id: 'flowers',   name: 'Flower Vase',  price: 90,  emoji: '🌸' },
    { id: 'music',     name: 'Music Box',    price: 200, emoji: '🎵' },
  ]
};

const COIN_REWARDS = {
  todoComplete: 10,
  goalMilestone25: 50, goalMilestone50: 100, goalMilestone75: 150,
  goalComplete: 500, streak7: 100, streak30: 500,
};

const Data = {
  _cache: null,
  _saveTimers: {},

  // ─── Remote (Supabase) ───────────────────────────────────────────────────────

  async loadRemote() {
    // ── Step 1: read from Supabase ──────────────────────────────────────────
    let cloud = null;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/game_state?select=id,data`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
      }
      const rows = await res.json();
      cloud = {};
      rows.forEach(r => cloud[r.id] = r.data);
    } catch (e) {
      console.warn('[Supabase] read failed:', e.message);
      window._supabaseError = 'read: ' + e.message;
      // Fallback to localStorage
      const raw = localStorage.getItem('coupleGame');
      this._cache = raw
        ? JSON.parse(raw)
        : { players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)), sharedMemories: [], version: 1 };
      window._supabaseOK = false;
      return this._cache;
    }

    // ── Step 2: merge cloud + localStorage ─────────────────────────────────
    const lsRaw = localStorage.getItem('coupleGame');
    const local = lsRaw ? JSON.parse(lsRaw) : null;
    const def   = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));

    const merge = (id) => {
      const c = cloud[id] || {};
      const l = local?.players?.[id] || {};
      const base = { ...def[id], ...c };
      // Fill gaps from localStorage (migration: cloud row exists but was created empty)
      if (!(c.goals?.length)         && l.goals?.length)         base.goals         = l.goals;
      if (!(c.todos?.length)         && l.todos?.length)         base.todos         = l.todos;
      if (!(c.customRewards?.length) && l.customRewards?.length) base.customRewards = l.customRewards;
      if (!c.coins  && l.coins)  base.coins  = l.coins;
      if (!c.outfit && l.outfit) base.outfit = l.outfit;
      if (!c.ownedOutfits?.length && l.ownedOutfits?.length) base.ownedOutfits = l.ownedOutfits;
      if (!c.furniture?.length   && l.furniture?.length)    base.furniture    = l.furniture;
      // Migrate legacy localStorage PIN
      const legacyPin = localStorage.getItem(`pin_${id}`);
      if (legacyPin) { base.pin = legacyPin; localStorage.removeItem(`pin_${id}`); }
      else if (!c.pin && l.pin) base.pin = l.pin;
      return base;
    };

    this._cache = {
      players: { bjerg: merge('bjerg'), hungry: merge('hungry') },
      sharedMemories: [],
      version: 1,
    };
    localStorage.setItem('coupleGame', JSON.stringify(this._cache));

    // ── Step 3: write merged state back to Supabase ─────────────────────────
    try {
      for (const id of ['bjerg', 'hungry']) {
        await this._upsertPlayer(id, this._cache.players[id]);
      }
      window._supabaseOK = true;
    } catch (e) {
      console.warn('[Supabase] write failed:', e.message);
      window._supabaseError = 'write: ' + e.message;
      window._supabaseOK = false; // can read but can't write
    }

    return this._cache;
  },

  async _upsertPlayer(id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/game_state`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`upsert ${id}: ${res.status} ${body}`);
    }
  },

  _savePlayerRemote(id) {
    clearTimeout(this._saveTimers[id]);
    this._saveTimers[id] = setTimeout(() => {
      const p = this._cache?.players?.[id];
      if (p) this._upsertPlayer(id, p);
    }, 500);
  },

  // ─── Local (synchronous, used by game loop) ───────────────────────────────

  load() {
    if (this._cache) return this._cache;
    const raw = localStorage.getItem('coupleGame');
    this._cache = raw
      ? JSON.parse(raw)
      : { players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)), sharedMemories: [], version: 1 };
    return this._cache;
  },

  save() {
    localStorage.setItem('coupleGame', JSON.stringify(this._cache));
  },

  getPlayer(id) {
    return this.load().players[id];
  },

  updatePlayer(id, updates) {
    const data = this.load();
    data.players[id] = { ...data.players[id], ...updates };
    this._cache = data;
    this.save();
    this._savePlayerRemote(id); // async cloud save, debounced
    return data.players[id];
  },

  // ─── Goals ───────────────────────────────────────────────────────────────────

  addGoal(playerId, goal) {
    const player = this.getPlayer(playerId);
    const newGoal = {
      id: Date.now().toString(),
      title: goal.title, description: goal.description || '',
      type: goal.type || 'number', target: goal.target,
      current: goal.current || 0, unit: goal.unit || '',
      isPrivate: goal.isPrivate || false,
      milestones: { 25: false, 50: false, 75: false, 100: false },
      createdAt: Date.now(), completedAt: null
    };
    this.updatePlayer(playerId, { goals: [...player.goals, newGoal] });
    return newGoal;
  },

  updateGoalProgress(playerId, goalId, newValue) {
    const player = this.getPlayer(playerId);
    const goals = player.goals.map(g => {
      if (g.id !== goalId) return g;
      const updated = { ...g, current: newValue };
      const pct = Math.min(100, (newValue / g.target) * 100);
      let coinsEarned = 0;
      if (pct >= 25  && !g.milestones[25])  { updated.milestones = { ...g.milestones, 25: true };           coinsEarned += COIN_REWARDS.goalMilestone25; }
      if (pct >= 50  && !g.milestones[50])  { updated.milestones = { ...updated.milestones, 50: true };     coinsEarned += COIN_REWARDS.goalMilestone50; }
      if (pct >= 75  && !g.milestones[75])  { updated.milestones = { ...updated.milestones, 75: true };     coinsEarned += COIN_REWARDS.goalMilestone75; }
      if (pct >= 100 && !g.milestones[100]) {
        updated.milestones = { ...updated.milestones, 100: true };
        updated.completedAt = Date.now();
        coinsEarned += COIN_REWARDS.goalComplete;
      }
      return { goal: updated, coinsEarned };
    });
    let totalCoins = 0;
    const cleanGoals = goals.map(item => {
      if (item.coinsEarned !== undefined) { totalCoins += item.coinsEarned; return item.goal; }
      return item;
    });
    this.updatePlayer(playerId, { goals: cleanGoals, coins: player.coins + totalCoins });
    return totalCoins;
  },

  deleteGoal(playerId, goalId) {
    const player = this.getPlayer(playerId);
    this.updatePlayer(playerId, { goals: player.goals.filter(g => g.id !== goalId) });
  },

  // ─── Todos ───────────────────────────────────────────────────────────────────

  addTodo(playerId, text, isPrivate = false) {
    const player = this.getPlayer(playerId);
    const todo = { id: Date.now().toString(), text, isPrivate, done: false, createdAt: Date.now() };
    this.updatePlayer(playerId, { todos: [...player.todos, todo] });
    return todo;
  },

  completeTodo(playerId, todoId) {
    const player = this.getPlayer(playerId);
    const todos = player.todos.map(t =>
      t.id === todoId ? { ...t, done: true, completedAt: Date.now() } : t
    );
    this.updatePlayer(playerId, { todos, coins: player.coins + COIN_REWARDS.todoComplete });
    return COIN_REWARDS.todoComplete;
  },

  deleteTodo(playerId, todoId) {
    const player = this.getPlayer(playerId);
    this.updatePlayer(playerId, { todos: player.todos.filter(t => t.id !== todoId) });
  },

  // ─── Shop ────────────────────────────────────────────────────────────────────

  addCustomReward(playerId, reward) {
    const player = this.getPlayer(playerId);
    const newReward = {
      id: Date.now().toString(), name: reward.name, price: reward.price,
      isCouple: reward.isCouple || false, emoji: reward.emoji || '🎁',
      redeemed: false, createdBy: playerId
    };
    this.updatePlayer(playerId, { customRewards: [...player.customRewards, newReward] });
    return newReward;
  },

  redeemCustomReward(playerId, rewardId) {
    const player = this.getPlayer(playerId);
    const reward = player.customRewards.find(r => r.id === rewardId);
    if (!reward || player.coins < reward.price) return false;
    const customRewards = player.customRewards.map(r =>
      r.id === rewardId ? { ...r, redeemed: true, redeemedAt: Date.now() } : r
    );
    this.updatePlayer(playerId, { customRewards, coins: player.coins - reward.price });
    const data = this.load();
    data.sharedMemories.push({
      id: Date.now().toString(), type: 'reward', playerId,
      text: `${player.displayName} redeemed "${reward.name}"! 🎉`,
      timestamp: Date.now()
    });
    this._cache = data;
    this.save();
    return true;
  },

  buyOutfit(playerId, outfitId) {
    const player = this.getPlayer(playerId);
    const item = SHOP_ITEMS.outfits.find(i => i.id === outfitId);
    if (!item || player.coins < item.price) return false;
    const owned = player.ownedOutfits || ['default'];
    if (owned.includes(outfitId)) return false;
    this.updatePlayer(playerId, { coins: player.coins - item.price, ownedOutfits: [...owned, outfitId] });
    return true;
  },

  wearOutfit(playerId, outfitId) {
    const player = this.getPlayer(playerId);
    const owned = player.ownedOutfits || ['default'];
    if (!owned.includes(outfitId)) return false;
    this.updatePlayer(playerId, { outfit: outfitId });
    return true;
  },

  buyFurniture(playerId, furnitureId) {
    const player = this.getPlayer(playerId);
    const item = SHOP_ITEMS.furniture.find(i => i.id === furnitureId);
    if (!item || player.coins < item.price) return false;
    if (player.furniture.includes(furnitureId)) return false;
    this.updatePlayer(playerId, { coins: player.coins - item.price, furniture: [...player.furniture, furnitureId] });
    return true;
  },

  setStatus(playerId, status) { this.updatePlayer(playerId, { status }); },
  addCoins(playerId, amount) {
    const player = this.getPlayer(playerId);
    this.updatePlayer(playerId, { coins: player.coins + amount });
  },

  getShopItems()   { return SHOP_ITEMS; },
  getCoinRewards() { return COIN_REWARDS; },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const Auth = {
  getLoggedIn() {
    return sessionStorage.getItem('activePlayer');
  },
  login(playerId, pin) {
    const player = Data.getPlayer(playerId);
    // Support both new (player.pin) and legacy (localStorage) PIN storage
    const stored = player?.pin || localStorage.getItem(`pin_${playerId}`) || null;
    if (stored && stored !== String(pin)) return false;
    sessionStorage.setItem('activePlayer', playerId);
    return true;
  },
  logout() {
    sessionStorage.removeItem('activePlayer');
    location.reload();
  },
  setPin(playerId, pin) {
    if (pin) {
      Data.updatePlayer(playerId, { pin: String(pin) });
    } else {
      Data.updatePlayer(playerId, { pin: null });
    }
    localStorage.removeItem(`pin_${playerId}`); // clear legacy
  },
  hasPin(playerId) {
    const player = Data.getPlayer(playerId);
    return !!(player?.pin || localStorage.getItem(`pin_${playerId}`));
  },
};
