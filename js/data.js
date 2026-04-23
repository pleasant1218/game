// Data layer - localStorage persistence

const DEFAULT_PLAYERS = {
  bjerg: {
    id: 'bjerg',
    displayName: 'bjerg',
    skin: '#FFDAB9',
    hairColor: '#8B5E3C',
    hairStyle: 'short',
    eyeColor: '#4A90D9',
    coins: 0,
    outfit: 'default',
    furniture: [],
    status: 'home',
    pose: 'stand',
    snapTarget: null,
    goals: [],
    todos: [],
    customRewards: [],
    achievements: [],
    createdAt: Date.now()
  },
  hungry: {
    id: 'hungry',
    displayName: 'hungry',
    skin: '#F0C89A',
    hairColor: '#1C1C1C',
    hairStyle: 'long',
    eyeColor: '#6B3D2A',
    coins: 0,
    outfit: 'default',
    furniture: [],
    status: 'home',
    pose: 'stand',
    snapTarget: null,
    goals: [],
    todos: [],
    customRewards: [],
    achievements: [],
    createdAt: Date.now()
  }
};

const SHOP_ITEMS = {
  outfits: [
    { id: 'default',    name: 'Default',      price: 0,    color: null,    preview: 'default' },
    { id: 'red',        name: 'Red Dress',    price: 150,  color: '#E74C3C', preview: 'dress' },
    { id: 'blue',       name: 'Blue Suit',    price: 150,  color: '#2980B9', preview: 'suit' },
    { id: 'green',      name: 'Green Hoodie', price: 120,  color: '#27AE60', preview: 'hoodie' },
    { id: 'purple',     name: 'Purple Robe',  price: 200,  color: '#8E44AD', preview: 'robe' },
    { id: 'yellow',     name: 'Yellow Jacket',price: 180,  color: '#F1C40F', preview: 'jacket' },
    { id: 'pink',       name: 'Pink Sweater', price: 160,  color: '#E91E8C', preview: 'sweater' },
    { id: 'black',      name: 'Black Outfit', price: 220,  color: '#2C3E50', preview: 'black' },
  ],
  furniture: [
    { id: 'plant',      name: 'Cute Plant',   price: 80,   emoji: '🌱' },
    { id: 'lamp',       name: 'Cozy Lamp',    price: 100,  emoji: '🪔' },
    { id: 'bookshelf',  name: 'Bookshelf',    price: 150,  emoji: '📚' },
    { id: 'cat',        name: 'Pet Cat',      price: 300,  emoji: '🐱' },
    { id: 'flowers',    name: 'Flower Vase',  price: 90,   emoji: '🌸' },
    { id: 'music',      name: 'Music Box',    price: 200,  emoji: '🎵' },
  ]
};

const COIN_REWARDS = {
  todoComplete: 10,
  goalMilestone25: 50,
  goalMilestone50: 100,
  goalMilestone75: 150,
  goalComplete: 500,
  streak7: 100,
  streak30: 500,
};

const Data = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;
    const raw = localStorage.getItem('coupleGame');
    if (raw) {
      this._cache = JSON.parse(raw);
    } else {
      this._cache = {
        players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)),
        sharedMemories: [],
        version: 1
      };
      this.save();
    }
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
    return data.players[id];
  },

  addGoal(playerId, goal) {
    const player = this.getPlayer(playerId);
    const newGoal = {
      id: Date.now().toString(),
      title: goal.title,
      description: goal.description || '',
      type: goal.type || 'number',
      target: goal.target,
      current: goal.current || 0,
      unit: goal.unit || '',
      isPrivate: goal.isPrivate || false,
      milestones: { 25: false, 50: false, 75: false, 100: false },
      createdAt: Date.now(),
      completedAt: null
    };
    const goals = [...player.goals, newGoal];
    this.updatePlayer(playerId, { goals });
    return newGoal;
  },

  updateGoalProgress(playerId, goalId, newValue) {
    const player = this.getPlayer(playerId);
    const goals = player.goals.map(g => {
      if (g.id !== goalId) return g;
      const updated = { ...g, current: newValue };
      const pct = Math.min(100, (newValue / g.target) * 100);
      let coinsEarned = 0;

      if (pct >= 25 && !g.milestones[25]) { updated.milestones = { ...g.milestones, 25: true }; coinsEarned += COIN_REWARDS.goalMilestone25; }
      if (pct >= 50 && !g.milestones[50]) { updated.milestones = { ...updated.milestones, 50: true }; coinsEarned += COIN_REWARDS.goalMilestone50; }
      if (pct >= 75 && !g.milestones[75]) { updated.milestones = { ...updated.milestones, 75: true }; coinsEarned += COIN_REWARDS.goalMilestone75; }
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

  addCustomReward(playerId, reward) {
    const player = this.getPlayer(playerId);
    const newReward = {
      id: Date.now().toString(),
      name: reward.name,
      price: reward.price,
      isCouple: reward.isCouple || false,
      emoji: reward.emoji || '🎁',
      redeemed: false,
      createdBy: playerId
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
      id: Date.now().toString(),
      type: 'reward',
      playerId,
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
    this.updatePlayer(playerId, {
      coins: player.coins - item.price,
      ownedOutfits: [...owned, outfitId]
    });
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
    this.updatePlayer(playerId, {
      coins: player.coins - item.price,
      furniture: [...player.furniture, furnitureId]
    });
    return true;
  },

  setStatus(playerId, status) {
    this.updatePlayer(playerId, { status });
  },

  addCoins(playerId, amount) {
    const player = this.getPlayer(playerId);
    this.updatePlayer(playerId, { coins: player.coins + amount });
  },

  getShopItems() { return SHOP_ITEMS; },
  getCoinRewards() { return COIN_REWARDS; }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const Auth = {
  getLoggedIn() {
    return sessionStorage.getItem('activePlayer'); // 'bjerg' | 'hungry' | null
  },
  login(playerId, pin) {
    const stored = localStorage.getItem(`pin_${playerId}`);
    if (stored && stored !== String(pin)) return false;
    sessionStorage.setItem('activePlayer', playerId);
    return true;
  },
  logout() {
    sessionStorage.removeItem('activePlayer');
    location.reload();
  },
  setPin(playerId, pin) {
    if (pin) localStorage.setItem(`pin_${playerId}`, String(pin));
    else     localStorage.removeItem(`pin_${playerId}`);
  },
  hasPin(playerId) {
    return !!localStorage.getItem(`pin_${playerId}`);
  },
};
