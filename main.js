/* main.js v2
   Offline 9:16 game with PACKS, Inventory, Medals, Statuses, Profile, Stats
   All data in localStorage key 'vg_player_v2'
*/

const STORAGE_KEY = "vg_player_v2";
const POINTS_PER_LEVEL = 500;
const NORMAL_REWARD = { money: 200, diamonds: 5, rubyChancePercent: 0.0001 };
const RANKED_MIN = 20, RANKED_MAX = 150;

/* Rank tiers */
const RANK_TIERS = [
  ["🐣 Новичок", 3],
  ["🥉 Бронза", 5],
  ["🥈 Серебро", 8],
  ["🥇 Золото", 12],
  ["💎 Алмаз", 15],
  ["🟢 Изумруд", 18],
  ["💟 Аметист", 22],
  ["🔴 Рубин", 25],
  ["👑 Повелитель", 40],
  ["🔮 Magical Legend", 70],
  ["🪬 The Enlightened One", 100],
  ["🌍 World Legend", 200],
];

/* Active PACKS taken/trimmed from your Python file */
const PACKS = {
  "Halloween_2025": {
    enabled: true,
    name: "🎃 Halloween 2025",
    cost_diamonds: 6666,
    grants: {
      balance: 66666,
      diamonds: 6666,
      rubies: 666,
      statuses: ["Статус: Halloween 2025"],
      medals: ["🎃 Медаль: Тыква Джека"],
      monsters: [{"name":"Джейсон","level":666},{"name":"Pumpking","level":666},{"name":"Ghost","level":666}]
    }
  },
  "Тёмный_рыцарь": {
    enabled: true,
    name: "Темный рыцарь",
    cost_diamonds: 3200,
    grants: {
      balance: 10000,
      diamonds: 1600,
      rubies: 500,
      statuses: ["Статус: Хранитель тьмы 🛡"],
      medals: ["🌑 Медаль: Тень"],
      monsters: [{"name":"Рыцарь тьмы","level":1},{"name":"Тёмный Волк","level":4},{"name":"Демон-хранитель","level":6}]
    }
  },
  "MagicPack2025": {
    enabled: true,
    name: "✨ Magic 2025",
    cost_diamonds: 6000,
    grants: {
      balance: 16000,
      diamonds: 5500,
      rubies: 1300,
      statuses: ["Статус: Magic ✨"],
      medals: ["🔮 Медаль: Magic 2025"],
      monsters: [{"name":"Мишка Play","level":1},{"name":"Wizard","level":1},{"name":"Magician","level":1},{"name":"Witch","level":1}]
    }
  },
  "Labubu_2025": {
    enabled: true,
    name: "Labubu 2025",
    cost_diamonds: 4000,
    grants: {
      balance: 50000,
      diamonds: 3000,
      rubies: 232,
      medals: ["🧸 Медаль: Labubu"],
      monsters: [{"name":"Labubu Дракон","level":400},{"name":"Labubu Милый","level":400}]
    }
  },
  "Italian_Brainrot": {
    enabled: true,
    name: "🐊 Italian Brainrot",
    cost_diamonds: 15000,
    grants: {
      balance: 1500000,
      diamonds: 8000,
      rubies: 1000,
      medals: ["🦈 Медаль: Italian Brainrot"],
      monsters: [{"name":"Tralalelo Tralala","level":1000},{"name":"Tung Tung Sagur","level":800},{"name":"Ta Ta Ta Ta Ta Sagur","level":400}]
    }
  }
};

/* Small monsters database (subset). For display & power value. */
const MONSTERS = {
  "Джейсон": {"base_power":80},
  "Pumpking": {"base_power":666},
  "Ghost": {"base_power":66},
  "Рыцарь тьмы": {"base_power":2000},
  "Тёмный Волк": {"base_power":1500},
  "Демон-хранитель": {"base_power":3000},
  "Мишка Play": {"base_power":1000},
  "Wizard": {"base_power":700},
  "Magician": {"base_power":800},
  "Witch": {"base_power":900},
  "Labubu Дракон": {"base_power":40},
  "Labubu Милый": {"base_power":40},
  "Tralalelo Tralala": {"base_power":1000},
  "Tung Tung Sagur": {"base_power":800},
  "Ta Ta Ta Ta Ta Sagur": {"base_power":400}
};

/* Default player */
const defaultPlayer = {
  nick: "Игрок",
  level: 1,
  cups: 0,
  money: 10000,
  diamonds: 10000,
  rubies: 0,
  rankPoints: 0,
  stats: { wins:0, losses:0, games:0, ranked_games:0 },
  inventory: { monsters: [], medals: {}, statuses: {} }, // medals/statuses stored as keys -> true
  active_medal: null,
  active_status: null,
  last_visit: null,
  autosaveAt: Date.now()
};

let player = loadPlayer();

/* --- Storage --- */
function savePlayer(){ player.autosaveAt = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(player)); }
function loadPlayer(){
  try{
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!v) return {...defaultPlayer};
    // merge to ensure fields
    return Object.assign({}, defaultPlayer, v, { inventory: Object.assign({}, defaultPlayer.inventory, v.inventory || {}) });
  } catch(e){ return {...defaultPlayer};}
}
function resetPlayerConfirm(){
  if(confirm("Сбросить все данные локально? Это действие нельзя отменить.")){
    localStorage.removeItem(STORAGE_KEY);
    player = loadPlayer();
    player.last_visit = Date.now();
    savePlayer();
    notify("Данные сброшены");
    updateUI();
    showMainMenu();
  }
}

/* --- UI helpers --- */
function $(id){return document.getElementById(id);}
function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden")); $(id).classList.remove("hidden");}
function notify(text, ms=2500){ const n = $("notify"); n.textContent = text; n.classList.remove("hidden"); clearTimeout(n._t); n._t = setTimeout(()=>n.classList.add("hidden"), ms); }

/* --- Rank helpers --- */
function getRankFromPoints(total){
  let pts = Math.max(0, total);
  for(let i=0;i<RANK_TIERS.length;i++){
    const [name, levels] = RANK_TIERS[i];
    const cap = levels * POINTS_PER_LEVEL;
    if(pts < cap){
      const lvl = Math.floor(pts / POINTS_PER_LEVEL) + 1;
      const within = pts % POINTS_PER_LEVEL;
      const pct = Math.round((within / POINTS_PER_LEVEL)*100);
      return { rankIndex:i, rankName:name, levels, levelIndex:lvl, withinLevel:within, progressPercent:pct, toNextLevel: POINTS_PER_LEVEL-within, capacity:cap };
    } else pts -= cap;
  }
  const last = RANK_TIERS[RANK_TIERS.length-1];
  return { rankIndex:RANK_TIERS.length-1, rankName:last[0], levels:last[1], levelIndex:last[1], withinLevel:POINTS_PER_LEVEL-1, progressPercent:100, toNextLevel:0, capacity:last[1]*POINTS_PER_LEVEL };
}

/* --- UI updates --- */
function updateUI(){
  // main menu basics
  $("ui-nick").textContent = player.nick;
  $("ui-level").textContent = player.level;
  $("ui-cups").textContent = player.cups;
  $("ui-money").textContent = player.money;
  $("ui-diamonds").textContent = player.diamonds;
  $("ui-rubies").textContent = player.rubies;

  // rank block
  const rank = getRankFromPoints(player.rankPoints);
  $("ui-rank-name").textContent = `${rank.rankName} — ${rank.levelIndex}/${rank.levels}`;
  $("ui-rank-progress-fill").style.width = Math.min(100, rank.progressPercent) + "%";
  $("ui-rank-points").textContent = `${rank.withinLevel} / ${POINTS_PER_LEVEL} (${rank.progressPercent}%)`;

  // profile fields
  $("p-nick").textContent = player.nick;
  $("p-level").textContent = player.level;
  $("p-cups").textContent = player.cups;
  $("p-money").textContent = player.money;
  $("p-diamonds").textContent = player.diamonds;
  $("p-rubies").textContent = player.rubies;
  $("p-rank").textContent = rank.rankName + ` (${rank.levelIndex}/${rank.levels})`;
  $("p-medal").textContent = player.active_medal || "—";
  $("p-status").textContent = player.active_status || "—";
  $("p-last").textContent = player.last_visit ? new Date(player.last_visit).toLocaleString() : "—";

  // stats
  const s = player.stats;
  $("stats-list").innerHTML = `<div>Побед: ${s.wins}</div><div>Поражений: ${s.losses}</div><div>Всего игр: ${s.games}</div><div>Рейтинговых игр: ${s.ranked_games}</div>`;

  savePlayer();
}

/* --- PACKS / Shop --- */
function buildShop(){
  const container = $("shop-list");
  container.innerHTML = "";
  Object.entries(PACKS).forEach(([id, cfg])=>{
    if(!cfg.enabled) return;
    // hide if owned already
    const owned = player.inventory.packs_owned && player.inventory.packs_owned[id];
    if(owned) return;
    const card = document.createElement("div"); card.className = "shop-card";
    const title = document.createElement("div"); title.className = "shop-title"; title.textContent = `${cfg.name} — ${cfg.cost_diamonds} 💎`;
    const rewards = document.createElement("div"); rewards.className = "shop-rewards";
    const list = [];
    if(cfg.grants.balance) list.push(`₽ ${cfg.grants.balance}`);
    if(cfg.grants.diamonds) list.push(`💎 ${cfg.grants.diamonds}`);
    if(cfg.grants.rubies) list.push(`🔴 ${cfg.grants.rubies}`);
    if(cfg.grants.medals) list.push(...cfg.grants.medals.map(m=>`🏅 ${m}`));
    if(cfg.grants.statuses) list.push(...cfg.grants.statuses.map(s=>`🔖 ${s}`));
    if(cfg.grants.monsters) list.push(...cfg.grants.monsters.map(m=>`👾 ${m.name} (ур.${m.level})`));
    rewards.textContent = list.join(" | ");
    const bottom = document.createElement("div"); bottom.className = "shop-bottom";
    const buyBtn = document.createElement("button"); buyBtn.className = "btn small"; buyBtn.textContent = "Купить";
    buyBtn.onclick = ()=> buyPack(id);
    bottom.appendChild(buyBtn);
    card.appendChild(title); card.appendChild(rewards); card.appendChild(bottom);
    container.appendChild(card);
  });
  if(container.children.length === 0) container.innerHTML = "<div>Нет доступных пакетов.</div>";
}

function buyPack(packId){
  const cfg = PACKS[packId];
  if(!cfg) return;
  if(player.diamonds < cfg.cost_diamonds){
    notify("Недостаточно алмазов 💎");
    return;
  }
  if(!player.inventory.packs_owned) player.inventory.packs_owned = {};
  // charge
  player.diamonds -= cfg.cost_diamonds;
  // grant currencies
  if(cfg.grants.balance) player.money += cfg.grants.balance;
  if(cfg.grants.diamonds) player.diamonds += cfg.grants.diamonds;
  if(cfg.grants.rubies) player.rubies += cfg.grants.rubies;
  // medals and statuses -> put flags into inventory
  const inv = player.inventory;
  if(cfg.grants.medals) cfg.grants.medals.forEach(md => inv.medals[md] = true);
  if(cfg.grants.statuses) cfg.grants.statuses.forEach(st => inv.statuses[st] = true);
  // monsters -> push into inventory.monsters as objects
  if(cfg.grants.monsters){
    cfg.grants.monsters.forEach(m => {
      const name = m.name;
      const lvl = m.level || 1;
      const bp = MONSTERS[name] ? MONSTERS[name].base_power : 10;
      inv.monsters.push({ name, level: lvl, power: bp + (lvl-1)*0.05 });
    });
  }
  // mark owned
  inv.packs_owned = inv.packs_owned || {};
  inv.packs_owned[packId] = true;
  savePlayer();
  updateUI();
  buildShop();
  notify(`Пакет ${cfg.name} куплен!`);
}

/* --- Inventory UI & actions --- */
let invTab = "monsters";
function openInventory(){
  invTab = "monsters";
  renderInv();
  showScreen("screen-inventory");
}
function renderInv(){
  const el = $("inv-content");
  el.innerHTML = "";
  if(invTab === "monsters"){
    if(player.inventory.monsters.length === 0){ el.innerHTML = "<div>Нет монстров.</div>"; return; }
    player.inventory.monsters.forEach((m, idx)=>{
      const row = document.createElement("div"); row.className = "inv-item";
      row.innerHTML = `<div>
        <div style="font-weight:800">${m.name} (ур. ${m.level})</div>
        <div class="meta">Сила: ${Math.round(m.power)}</div>
        </div>`;
      el.appendChild(row);
    });
  } else if(invTab === "medals"){
    const medals = Object.keys(player.inventory.medals || {});
    if(medals.length === 0){ el.innerHTML = "<div>Нет медалей.</div>"; return; }
    medals.forEach(md=>{
      const row = document.createElement("div"); row.className = "inv-item";
      const applied = player.active_medal === md;
      row.innerHTML = `<div><div style="font-weight:800">${md}</div></div>`;
      const actions = document.createElement("div"); actions.className = "inv-actions";
      const applyBtn = document.createElement("button"); applyBtn.className="btn small"; applyBtn.textContent=applied?"Снята":"Применить";
      applyBtn.onclick = ()=> {
        if(applied){ player.active_medal = null; notify("Медаль снята"); }
        else { player.active_medal = md; notify("Медаль применена"); }
        savePlayer(); renderInv(); updateUI();
      };
      actions.appendChild(applyBtn);
      row.appendChild(actions);
      el.appendChild(row);
    });
  } else if(invTab === "statuses"){
    const statuses = Object.keys(player.inventory.statuses || {});
    if(statuses.length === 0){ el.innerHTML = "<div>Нет статусов.</div>"; return; }
    statuses.forEach(st=>{
      const row = document.createElement("div"); row.className = "inv-item";
      const applied = player.active_status === st;
      row.innerHTML = `<div><div style="font-weight:800">${st}</div></div>`;
      const actions = document.createElement("div"); actions.className = "inv-actions";
      const applyBtn = document.createElement("button"); applyBtn.className="btn small"; applyBtn.textContent=applied?"Снять":"Применить";
      applyBtn.onclick = ()=> {
        if(applied){ player.active_status = null; notify("Статус снят"); }
        else { player.active_status = st; notify("Статус применён"); }
        savePlayer(); renderInv(); updateUI();
      };
      actions.appendChild(applyBtn);
      row.appendChild(actions);
      el.appendChild(row);
    });
  }
}

/* --- Battle simulation --- */
let currentBattleMode = null;
function startBattle(mode){
  currentBattleMode = mode;
  $("battle-mode-title").textContent = mode === "normal" ? "Обычное сражение" : "Рейтинговое сражение";
  $("battle-log").textContent = `Режим: ${mode}\nНажмите "Начать бой"`;
  showScreen("screen-battle");
}
function simulateBattleOnce(){
  const log = $("battle-log");
  log.textContent = "Бой начинается...\n";
  const steps = ["Подготовка...", "Атака!", "Контратака!", "Результаты..."];
  let i=0;
  const t = setInterval(()=>{
    if(i < steps.length){ log.textContent += steps[i] + "\n"; i++; }
    else { clearInterval(t);
      const win = Math.random() < 0.6;
      if(win){
        log.textContent += "\nВы выиграли! 🎉\n";
        player.stats.wins++;
        applyRewards(currentBattleMode, true);
      } else {
        log.textContent += "\nВы проиграли.\n";
        player.stats.losses++;
        // consolation
        if(currentBattleMode === "normal"){ player.money += 20; notify("+20 ₽ (утешение)"); }
      }
      player.stats.games++;
      if(currentBattleMode==="ranked") player.stats.ranked_games++;
      updateUI(); savePlayer();
    }
  }, 650);
}
function applyRewards(mode, isWin){
  if(mode==="normal"){
    player.money += NORMAL_REWARD.money;
    player.diamonds += NORMAL_REWARD.diamonds;
    const p = NORMAL_REWARD.rubyChancePercent/100;
    if(Math.random() < p){ player.rubies += 1; notify("Удача! Получен 1 🔴"); }
    notify(`+${NORMAL_REWARD.money} ₽, +${NORMAL_REWARD.diamonds} 💎`);
  } else {
    const pts = Math.floor(Math.random()*(RANKED_MAX-RANKED_MIN+1))+RANKED_MIN;
    player.rankPoints += pts;
    notify(`+${pts} очк. звания`);
  }
  savePlayer();
}

/* --- Listeners & init --- */
function setupListeners(){
  $("btn-play").addEventListener("click", ()=> showScreen("screen-mode"));
  $("btn-shop").addEventListener("click", ()=> { buildShop(); showScreen("screen-shop"); });
  $("btn-inventory").addEventListener("click", openInventory);
  $("btn-stats").addEventListener("click", ()=> { updateUI(); showScreen("screen-stats"); });
  $("btn-profile").addEventListener("click", ()=> { updateUI(); showScreen("screen-profile"); });

  $("btn-change-nick").addEventListener("click", changeNick);
  $("btn-reset").addEventListener("click", resetPlayerConfirm);

  $("btn-back-to-menu").addEventListener("click", showMainMenu);
  $("btn-normal").addEventListener("click", ()=> startBattle("normal"));
  $("btn-ranked").addEventListener("click", ()=> startBattle("ranked"));
  $("btn-start-battle").addEventListener("click", simulateBattleOnce);
  $("btn-battle-quit").addEventListener("click", showMainMenu);

  $("btn-shop-back").addEventListener("click", showMainMenu);

  $("tab-monsters").addEventListener("click", ()=> { invTab="monsters"; renderInv(); });
  $("tab-medals").addEventListener("click", ()=> { invTab="medals"; renderInv(); });
  $("tab-statuses").addEventListener("click", ()=> { invTab="statuses"; renderInv(); });
  $("btn-inv-back").addEventListener("click", showMainMenu);

  $("btn-profile-back").addEventListener("click", showMainMenu);
  $("btn-stats-back").addEventListener("click", showMainMenu);
}

/* nick change */
function changeNick(){
  const name = prompt("Введите ник (макс 20 символов):", player.nick);
  if(name && name.trim()){ player.nick = name.trim().slice(0,20); player.last_visit = Date.now(); savePlayer(); updateUI(); notify("Ник обновлён"); }
}

/* loading simulation and start */
function startLoading(){
  showScreen("screen-loading");
  const fill = $("loading-bar-fill");
  const txt = $("loading-text");
  let p = 0;
  clearInterval(window._lt);
  window._lt = setInterval(()=>{
    p += Math.random()*18 + 6;
    if(p >= 100) p = 100;
    fill.style.width = p + "%";
    txt.textContent = `Загрузка... ${Math.floor(p)}%`;
    if(p === 100){ clearInterval(window._lt); setTimeout(()=> { player.last_visit = Date.now(); savePlayer(); updateUI(); showMainMenu(); }, 500); }
  }, 180);
}
function showMainMenu(){ updateUI(); showScreen("screen-menu"); }

/* autosave */
function setupAutosave(){
  setInterval(()=> savePlayer(), 10000);
  window.addEventListener("visibilitychange", ()=> { if(document.visibilityState === "hidden") savePlayer(); });
}

/* initial binding */
window.addEventListener("load", ()=>{
  setupListeners();
  setupAutosave();
  buildShop();
  updateUI();
  startLoading();
});
