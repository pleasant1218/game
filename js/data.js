// Data layer — Supabase cloud storage + localStorage fallback

const SUPABASE_URL = 'https://inbkpznkkdntyaggqbcr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYmtwem5ra2RudHlhZ2dxYmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODE4NDUsImV4cCI6MjA5MjU1Nzg0NX0.XaCOG_Bp6Aa8IcjeBMnVYxhcCBK4oH0AfqL3-rVQjCc';

// Supabase client — uses authenticated JWT for all API calls
const _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_PLAYERS = {
  bjerg: {
    id: 'bjerg', displayName: 'bjerg',
    skin: '#FFDAB9', hairColor: '#8B5E3C', hairStyle: 'short', eyeColor: '#4A90D9',
    coins: 0, outfit: 'default', ownedOutfits: ['default'], furniture: [],
    status: 'home', pose: 'stand', snapTarget: null, pin: null,
    homeLayout: {}, homeLayoutSavedAt: {},
    customStatuses: [],
    goals: [], todos: [], customRewards: [], achievements: [],
    createdAt: Date.now()
  },
  hungry: {
    id: 'hungry', displayName: 'hungry',
    skin: '#F0C89A', hairColor: '#1C1C1C', hairStyle: 'long', eyeColor: '#6B3D2A',
    coins: 0, outfit: 'default', ownedOutfits: ['default'], furniture: [],
    status: 'home', pose: 'stand', snapTarget: null, pin: null,
    homeLayout: {}, homeLayoutSavedAt: {},
    customStatuses: [],
    goals: [], todos: [], customRewards: [], achievements: [],
    createdAt: Date.now()
  }
};

// Default x positions for movable home furniture, expressed as a fraction of pane width.
const DEFAULT_HOME_LAYOUT = { desk: 0.14, sofa: 0.36, bed: 0.58 };

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
    // Always reset so index.html can check it after this call
    this._cloudHadRow = { bjerg: false, hungry: false };

    // Snapshot taken BEFORE Auth.initialize() flips everAuthed on. If false,
    // this is the first authenticated load on this device, so localStorage
    // can't possibly hold real user data — only demo-seed pollution. We must
    // not let it influence the merged state.
    const wasAuthedBefore = Auth.hasEverAuthed();

    // ── Step 1: restore Supabase auth session ──────────────────────────────
    const hasSession = await Auth.initialize();

    if (!hasSession) {
      window._supabaseOK = false;
      const raw = localStorage.getItem('coupleGame');
      this._cache = raw
        ? JSON.parse(raw)
        : { players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)), sharedMemories: [], version: 1 };
      return this._cache;
    }

    // ── Step 2: read from Supabase using authenticated client ──────────────
    let cloud = null;
    try {
      const { data, error } = await _db.from('game_state').select('id, data');
      if (error) throw error;
      cloud = {};
      data.forEach(r => { cloud[r.id] = r.data; });
      this._cloudHadRow = { bjerg: !!cloud['bjerg'], hungry: !!cloud['hungry'] };
      this._cloudReadOK = true;
      window._supabaseOK = true;
    } catch (e) {
      console.warn('[Supabase] read failed:', e.message);
      window._supabaseError = 'read: ' + e.message;
      const raw = localStorage.getItem('coupleGame');
      this._cache = raw
        ? JSON.parse(raw)
        : { players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)), sharedMemories: [], version: 1 };
      this._cloudReadOK = false;
      window._supabaseOK = false;
      return this._cache;
    }

    // ── Step 3: merge cloud + localStorage ─────────────────────────────────
    const lsRaw = localStorage.getItem('coupleGame');
    const local = lsRaw ? JSON.parse(lsRaw) : null;
    const def   = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));

    // First-time auth on this device: do NOT trust localStorage. It can only
    // hold demo-seed pollution from before the first login (real data could
    // never have been written here — there was no session). Cloud is sole
    // source of truth on first auth; defaults fill any blanks.
    const trustLocal = wasAuthedBefore;

    const merge = (id) => {
      const c = cloud[id] || null;
      const l = trustLocal ? (local?.players?.[id] || null) : null;
      if (!c && !l) return { ...def[id] };
      if (!c)       return { ...def[id], ...l };
      if (!l)       return { ...def[id], ...c };
      const cloudTime = c._savedAt || 0;
      const localTime = l._savedAt || 0;
      return cloudTime >= localTime ? { ...def[id], ...c } : { ...def[id], ...l };
    };

    this._cache = {
      players: { bjerg: merge('bjerg'), hungry: merge('hungry') },
      sharedMemories: [],
      version: 1,
    };
    localStorage.setItem('coupleGame', JSON.stringify(this._cache));

    // ── Step 4: only push rows that don't exist in cloud yet ───────────────
    // Same rule: only trust local as a source for migration when this device
    // has been authenticated before. On first auth, skip — local can't hold
    // anything but pre-login demo / defaults.
    if (trustLocal) {
      try {
        for (const id of ['bjerg', 'hungry']) {
          if (!cloud[id]) {
            const lp = local?.players?.[id];
            const hasRealData = lp && (
              lp.goals?.length || lp.todos?.length || lp.coins ||
              lp.customRewards?.length || lp.furniture?.length
            );
            if (hasRealData) {
              await this._upsertPlayer(id, this._cache.players[id]);
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase] init write failed:', e.message);
        window._supabaseError = 'write: ' + e.message;
        window._supabaseOK = false;
      }
    }

    return this._cache;
  },

  async _upsertPlayer(id, playerData) {
    const { error } = await _db.from('game_state').upsert(
      { id, data: playerData, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    if (error) throw new Error(`upsert ${id}: ${error.message}`);
  },

  _savePlayerRemote(id) {
    clearTimeout(this._saveTimers[id]);
    this._saveTimers[id] = setTimeout(async () => {
      const p = this._cache?.players?.[id];
      if (!p) return;
      // ── Data-loss guards ──────────────────────────────────────────────────
      // Never write to cloud unless we are authenticated and the cache we are
      // about to upload was actually populated from a successful cloud read.
      // Otherwise demo / empty defaults can clobber real cloud data.
      if (!Auth?._isAuthenticated) {
        console.warn('[Supabase] save skipped: not authenticated');
        return;
      }
      if (this._cloudReadOK !== true) {
        console.warn('[Supabase] save skipped: cloud read had not succeeded');
        window._supabaseError = 'save blocked: cloud read had not succeeded';
        if (typeof updateSyncStatus === 'function') updateSyncStatus();
        return;
      }
      try {
        await this._upsertPlayer(id, p);
        window._supabaseOK = true;
        if (typeof updateSyncStatus === 'function') updateSyncStatus();
      } catch (e) {
        console.warn('[Supabase] save failed:', e.message);
        window._supabaseError = 'save: ' + e.message;
        window._supabaseOK = false;
        if (typeof updateSyncStatus === 'function') updateSyncStatus();
      }
    }, 500);
  },

  // Subscribe to real-time changes — idempotent, safe to call multiple times
  setupRealtime() {
    if (this._realtimeSubscribed) return;
    this._realtimeSubscribed = true;
    try {
      _db.channel('game')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, payload => {
          const changedId = payload.new?.id;
          const loggedIn  = Auth.getLoggedIn();
          // Only apply the OTHER player's updates — don't clobber local changes
          if (changedId && changedId !== loggedIn &&
              payload.new?.data && this._cache?.players?.[changedId]) {
            this._cache.players[changedId] = { ...this._cache.players[changedId], ...payload.new.data };
            localStorage.setItem('coupleGame', JSON.stringify(this._cache));
            if (typeof renderUI === 'function') renderUI();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('[Supabase] realtime subscription failed:', e.message);
      this._realtimeSubscribed = false;
    }
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
    data.players[id] = { ...data.players[id], ...updates, _savedAt: Date.now() };
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

  // ─── Home layout ────────────────────────────────────────────────────────────
  // Both players share the same home view, so layout is merged across the two
  // player records using a per-piece last-write-wins on `homeLayoutSavedAt`.

  getDefaultHomeLayout() { return { ...DEFAULT_HOME_LAYOUT }; },

  getHomeLayout() {
    const data = this.load();
    const b = data.players.bjerg || {};
    const h = data.players.hungry || {};
    const merged = { ...DEFAULT_HOME_LAYOUT };
    for (const key of Object.keys(DEFAULT_HOME_LAYOUT)) {
      const bx = b.homeLayout?.[key], bt = b.homeLayoutSavedAt?.[key] || 0;
      const hx = h.homeLayout?.[key], ht = h.homeLayoutSavedAt?.[key] || 0;
      if (bx != null && hx != null) merged[key] = bt >= ht ? bx : hx;
      else if (bx != null)          merged[key] = bx;
      else if (hx != null)          merged[key] = hx;
    }
    return merged;
  },

  setFurniturePos(playerId, key, xPct) {
    if (!(key in DEFAULT_HOME_LAYOUT)) return;
    const player = this.getPlayer(playerId);
    const homeLayout        = { ...(player.homeLayout || {}),        [key]: xPct };
    const homeLayoutSavedAt = { ...(player.homeLayoutSavedAt || {}), [key]: Date.now() };
    this.updatePlayer(playerId, { homeLayout, homeLayoutSavedAt });
  },

  // ─── Custom statuses (player-defined empty rooms) ───────────────────────────

  getCustomStatuses(playerId) {
    return this.getPlayer(playerId).customStatuses || [];
  },

  addCustomStatus(playerId, label, emoji) {
    const player = this.getPlayer(playerId);
    const trimmed = (label || '').trim();
    if (!trimmed) return null;
    const status = {
      id: 'custom-' + Date.now().toString(),
      label: trimmed.slice(0, 24),
      emoji: (emoji || '✨').trim().slice(0, 4) || '✨',
    };
    const list = [...(player.customStatuses || []), status];
    this.updatePlayer(playerId, { customStatuses: list });
    return status;
  },

  removeCustomStatus(playerId, statusId) {
    const player = this.getPlayer(playerId);
    const list   = (player.customStatuses || []).filter(s => s.id !== statusId);
    const updates = { customStatuses: list };
    // If the player is currently in the room being deleted, send them home.
    if (player.status === statusId) updates.status = 'home';
    this.updatePlayer(playerId, updates);
  },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const EVER_AUTHED_KEY = 'coupleGame_everAuthed';

const Auth = {
  _playerId:        null,
  _isAuthenticated: false,

  // Synchronous — true once any successful sign-in has happened on this device,
  // even after sign-out. Used to suppress demo-data seeding on subsequent
  // unauthenticated loads (which used to clobber real cloud data).
  hasEverAuthed() {
    try { return localStorage.getItem(EVER_AUTHED_KEY) === '1'; }
    catch { return false; }
  },

  _markEverAuthed() {
    try { localStorage.setItem(EVER_AUTHED_KEY, '1'); } catch {}
  },

  // Called once during loadRemote() — restores existing session
  async initialize() {
    const { data: { session } } = await _db.auth.getSession();
    if (session) {
      this._isAuthenticated = true;
      this._playerId = session.user.user_metadata?.player_id || null;
      this._markEverAuthed();
    }
    return !!session;
  },

  // Synchronous — safe to call after loadRemote() has resolved
  getLoggedIn() { return this._playerId; },

  async signIn(email, password) {
    const { data, error } = await _db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this._isAuthenticated = true;
    this._playerId = data.user.user_metadata?.player_id || null;
    this._markEverAuthed();
    return { needsPlayerChoice: !this._playerId };
  },

  // Called once after first login to associate this Supabase account with bjerg/hungry
  async setPlayer(playerId) {
    const { error } = await _db.auth.updateUser({ data: { player_id: playerId } });
    if (error) throw error;
    this._playerId = playerId;
  },

  async signOut() {
    await _db.auth.signOut();
    this._playerId = null;
    this._isAuthenticated = false;
    // Clear the player cache so the next visitor doesn't inherit our data
    // through the localStorage merge path. Keep EVER_AUTHED_KEY set so the
    // demo-seed block never runs on this device again.
    try { localStorage.removeItem('coupleGame'); } catch {}
    if (Data && Data._cache) Data._cache = null;
    if (Data) Data._cloudReadOK = false;
    location.reload();
  },
};
