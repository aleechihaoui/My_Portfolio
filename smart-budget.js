var state = {
  user: null,
  budget: 500,
  goal: 100,
  transactions: [],
  challenge: { target: 100 },
  editId: null
};

var STATE_KEY = "sb_state_";
var dChart = null, lChart = null, bChart = null;
var CATS = ["Nourriture","Transport","Logement","Education","Sante","Loisirs","Autre"];
var CAT_COLORS = {
  "Nourriture":"#FF9500","Transport":"#4F8EF7","Logement":"#7C5CFC",
  "Education":"#00D4A8","Sante":"#22C55E","Loisirs":"#FF6B6B",
  "Revenu":"#00D4A8","Autre":"#8B9DC3"
};

function saveState() {
  try { localStorage.setItem(STATE_KEY + (state.user ? state.user.email : ""), JSON.stringify(state)); } catch(e) {}
}
function loadState(email) {
  try { var d = localStorage.getItem(STATE_KEY + email); if (d) Object.assign(state, JSON.parse(d)); } catch(e) {}
}

function switchTab(t) {
  document.querySelectorAll(".tab-btn").forEach(function(b, i) {
    b.classList.toggle("active", (t === "login" && i === 0) || (t === "register" && i === 1));
  });
  document.getElementById("form-login").style.display = t === "login" ? "block" : "none";
  document.getElementById("form-register").style.display = t === "register" ? "block" : "none";
}

function doLogin() {
  var email = document.getElementById("l-email").value.trim();
  var pass = document.getElementById("l-pass").value;
  if (!email || !pass) { showToast("Remplissez tous les champs", "error"); return; }
  if (email === "demo@univ.tn" && pass === "demo123") {
    state.user = { email: email, prenom: "Ahmed", nom: "Hamouda", faculty: "Informatique" };
    loadState(email);
    if (!state.transactions.length) injectDemoData();
    enterApp();
    return;
  }
  showToast("Identifiants incorrects", "error");
}

function doRegister() {
  var prenom = document.getElementById("r-prenom").value.trim();
  var nom = document.getElementById("r-nom").value.trim();
  var email = document.getElementById("r-email").value.trim();
  var faculty = document.getElementById("r-faculty").value;
  var budget = parseFloat(document.getElementById("r-budget").value) || 500;
  var pass = document.getElementById("r-pass").value;
  if (!prenom || !nom || !email || !faculty || !pass) { showToast("Remplissez tous les champs", "error"); return; }
  state.user = { email: email, prenom: prenom, nom: nom, faculty: faculty };
  state.budget = budget;
  showToast("Compte cree!", "success");
  enterApp();
}

function doLogout() {
  saveState();
  state = { user: null, budget: 500, goal: 100, transactions: [], challenge: { target: 100 }, editId: null };
  document.getElementById("screen-app").classList.remove("active");
  document.getElementById("screen-auth").classList.add("active");
}

function enterApp() {
  document.getElementById("screen-auth").classList.remove("active");
  document.getElementById("screen-app").classList.add("active");
  updateSidebar();
  renderAll();
  initCharts();
  initChat();
  document.getElementById("add-date").value = new Date().toISOString().split("T")[0];
}

function injectDemoData() {
  var now = new Date();
  var y = now.getFullYear();
  var mo = String(now.getMonth() + 1).padStart(2, "0");
  state.transactions = [
    {id:1, type:"expense", desc:"Courses alimentaires", cat:"Nourriture", amount:45.5, date:y+"-"+mo+"-02"},
    {id:2, type:"expense", desc:"Bus mensuel",          cat:"Transport",  amount:30,   date:y+"-"+mo+"-03"},
    {id:3, type:"income",  desc:"Bourse universitaire", cat:"Revenu",     amount:300,  date:y+"-"+mo+"-01"},
    {id:4, type:"expense", desc:"Livre de cours",       cat:"Education",  amount:28,   date:y+"-"+mo+"-05"},
    {id:5, type:"expense", desc:"Restaurant midi",      cat:"Nourriture", amount:12,   date:y+"-"+mo+"-07"},
    {id:6, type:"expense", desc:"Pharmacie",            cat:"Sante",      amount:15,   date:y+"-"+mo+"-08"},
    {id:7, type:"income",  desc:"Job etudiant",         cat:"Revenu",     amount:150,  date:y+"-"+mo+"-15"}
  ];
  state.budget = 500;
  state.goal = 100;
}

function showPage(id, btn) {
  document.querySelectorAll(".page").forEach(function(p) { p.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function(n) { n.classList.remove("active"); });
  var pageEl = document.getElementById("page-" + id);
  if (!pageEl) return;
  pageEl.classList.add("active");
  if (btn) btn.classList.add("active");
  if (id === "dashboard") { renderDashboard(); updateCharts(); }
  if (id === "budget") renderBudget();
  if (id === "transactions") renderTransactions();
  if (id === "challenge") renderChallenge();
  if (id === "comparison") renderComparison();
}

function updateSidebar() {
  if (!state.user) return;
  var initials = (state.user.prenom.charAt(0) + (state.user.nom ? state.user.nom.charAt(0) : "")).toUpperCase();
  document.getElementById("sb-avatar").textContent = initials;
  document.getElementById("sb-name").textContent = state.user.prenom + " " + (state.user.nom || "");
  document.getElementById("sb-faculty").textContent = state.user.faculty || "Etudiant";
  updateSidebarChallenge();
}

function updateSidebarChallenge() {
  var saved = calcSaved();
  document.getElementById("sb-saved").textContent = saved.toFixed(0) + " TND";
  document.getElementById("sb-progress").style.width = Math.min(100, (saved / state.challenge.target) * 100) + "%";
}

function getMonth() {
  var n = new Date();
  return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
}
function thisMonthTrans() {
  var m = getMonth();
  return state.transactions.filter(function(t) { return t.date && t.date.indexOf(m) === 0; });
}
function calcSpent() {
  return thisMonthTrans().filter(function(t) { return t.type === "expense"; }).reduce(function(a, t) { return a + t.amount; }, 0);
}
function calcSaved() { return Math.max(0, state.budget - calcSpent()); }
function renderAll() { renderDashboard(); renderBudget(); renderTransactions(); renderChallenge(); }

function renderDashboard() {
  var spent = calcSpent(), rest = Math.max(0, state.budget - spent), saved = calcSaved();
  document.getElementById("d-budget").textContent = state.budget.toFixed(0) + " TND";
  document.getElementById("d-spent").textContent = spent.toFixed(1) + " TND";
  document.getElementById("d-rest").textContent = rest.toFixed(1) + " TND";
  document.getElementById("d-epargne").textContent = saved.toFixed(1) + " TND";
  if (state.user) document.getElementById("dash-greeting").textContent = "Bonjour, " + state.user.prenom + " !";
  var now = new Date();
  document.getElementById("dash-date").textContent = "Tableau de bord - " + now.toLocaleDateString("fr-FR", {month:"long", year:"numeric"});
  var recent = state.transactions.slice().sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,4);
  document.getElementById("dash-recent").innerHTML = recent.length ? recent.map(function(t){return itemHTML(t,false);}).join("") : "<p style='color:var(--text2);text-align:center;padding:20px'>Aucune transaction</p>";
}

function renderBudget() {
  var spent = calcSpent(), rest = Math.max(0, state.budget - spent);
  document.getElementById("b-budget").textContent = state.budget + " TND";
  document.getElementById("b-spent").textContent = spent.toFixed(1) + " TND";
  document.getElementById("b-rest").textContent = rest.toFixed(1) + " TND";
  var totals = {};
  CATS.forEach(function(c) {
    totals[c] = thisMonthTrans().filter(function(t){return t.cat===c&&t.type==="expense";}).reduce(function(a,t){return a+t.amount;},0);
  });
  document.getElementById("cat-list").innerHTML = CATS.map(function(c) {
    return "<div class='budget-item'><div class='item-dot' style='background:" + (CAT_COLORS[c]||"#8B9DC3") + "'></div><div class='item-info'><div class='item-name'>" + c + "</div></div><div class='item-amount expense'>" + totals[c].toFixed(1) + " TND</div></div>";
  }).join("");
  updateBarChart(CATS, CATS.map(function(c){return totals[c];}), CATS.map(function(c){return CAT_COLORS[c]||"#8B9DC3";}));
}

function renderTransactions() {
  var type = document.getElementById("filter-type").value;
  var list = state.transactions.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
  if (type !== "all") list = list.filter(function(t){return t.type===type;});
  document.getElementById("trans-list").innerHTML = list.length ? list.map(function(t){return itemHTML(t,true);}).join("") : "<p style='color:var(--text2);text-align:center;padding:30px'>Aucune transaction</p>";
}

function itemHTML(t, showActions) {
  var color = CAT_COLORS[t.cat] || "#8B9DC3";
  var sign = t.type === "income" ? "+" : "-";
  var cls = t.type === "income" ? "income" : "expense";
  var actions = showActions ? "<div class='item-actions'><button class='icon-btn del' onclick='deleteTrans(" + t.id + ")'>x</button></div>" : "";
  return "<div class='budget-item'><div class='item-dot' style='background:" + color + "'></div><div class='item-info'><div class='item-name'>" + t.desc + "</div><div class='item-cat'>" + t.cat + " - " + t.date + "</div></div><div class='item-amount " + cls + "'>" + sign + t.amount.toFixed(1) + " TND</div>" + actions + "</div>";
}

function openAddModal(id) {
  state.editId = id || null;
  document.getElementById("modal-add-title").textContent = id ? "Modifier" : "Nouvelle transaction";
  document.getElementById("add-type").value = "expense";
  document.getElementById("add-desc").value = "";
  document.getElementById("add-amount").value = "";
  document.getElementById("add-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-add").classList.add("open");
}

function deleteTrans(id) {
  state.transactions = state.transactions.filter(function(t){return t.id!==id;});
  saveState(); renderAll(); updateCharts(); updateSidebarChallenge();
  showToast("Transaction supprimee", "success");
}

function saveTransaction() {
  var type = document.getElementById("add-type").value;
  var desc = document.getElementById("add-desc").value.trim();
  var cat = type === "income" ? "Revenu" : document.getElementById("add-cat").value;
  var amount = parseFloat(document.getElementById("add-amount").value);
  var date = document.getElementById("add-date").value;
  if (!desc || !amount || !date) { showToast("Remplissez tous les champs", "error"); return; }
  state.transactions.push({id:Date.now(), type:type, desc:desc, cat:cat, amount:amount, date:date});
  saveState(); closeModal("modal-add"); renderAll(); updateCharts(); updateSidebarChallenge();
  showToast("Transaction ajoutee!", "success");
}

function updateAddType() {
  document.getElementById("add-cat-group").style.display = document.getElementById("add-type").value === "income" ? "none" : "block";
}

function openBudgetModal() {
  document.getElementById("edit-budget").value = state.budget;
  document.getElementById("edit-goal").value = state.goal;
  document.getElementById("modal-budget").classList.add("open");
}

function saveBudget() {
  var b = parseFloat(document.getElementById("edit-budget").value);
  var g = parseFloat(document.getElementById("edit-goal").value);
  if (!b) { showToast("Montant invalide", "error"); return; }
  state.budget = b; state.goal = g || 100;
  saveState(); closeModal("modal-budget"); renderAll(); updateCharts(); updateSidebarChallenge();
  showToast("Budget mis a jour", "success");
}

function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function setChallenge(target) {
  state.challenge.target = target;
  saveState(); renderChallenge(); updateSidebarChallenge();
  showToast("Defi mis a jour!", "success");
}

function renderChallenge() {
  var saved = calcSaved(), target = state.challenge.target;
  var pct = Math.min(100, Math.round((saved / target) * 100));
  document.getElementById("ch-saved").textContent = saved.toFixed(1) + " TND";
  document.getElementById("ch-goal").textContent = target + " TND";
  document.getElementById("ch-bar").style.width = pct + "%";
  document.getElementById("ch-pct").textContent = pct + "% accompli";
}

function initCharts() {
  var dCtx = document.getElementById("chartDoughnut");
  var lCtx = document.getElementById("chartLine");
  if (!dCtx || !lCtx || typeof Chart === "undefined") return;
  var clrs = ["#FF9500","#4F8EF7","#7C5CFC","#00D4A8","#22C55E","#FF6B6B","#8B9DC3"];
  var vals = CATS.map(function(c) {
    return thisMonthTrans().filter(function(t){return t.cat===c&&t.type==="expense";}).reduce(function(a,t){return a+t.amount;},0);
  });
  dChart = new Chart(dCtx, {
    type: "doughnut",
    data: { labels: CATS, datasets: [{data:vals, backgroundColor:clrs, borderWidth:0, hoverOffset:8}] },
    options: { plugins: { legend: { position:"right", labels:{color:"#6B90A6",font:{size:11},padding:12,boxWidth:10} } }, cutout:"75%" }
  });
  var months = ["Nov","Dec","Jan","Fev","Mar","Avr"];
  lChart = new Chart(lCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {label:"Depenses", data:[320,280,390,250,310,calcSpent()], borderColor:"#FF6B6B", backgroundColor:"rgba(255,107,107,.1)", tension:0.4, fill:true, borderWidth:2},
        {label:"Epargne",  data:[180,220,110,250,190,calcSaved()], borderColor:"#00D4A8", backgroundColor:"rgba(0,210,170,.1)",  tension:0.4, fill:true, borderWidth:2}
      ]
    },
    options: {
      plugins: { legend: { labels: {color:"#8B9DC3", font:{size:11}} } },
      scales: {
        x: { ticks:{color:"#8B9DC3"}, grid:{color:"rgba(30,45,71,.5)"} },
        y: { ticks:{color:"#8B9DC3"}, grid:{color:"rgba(30,45,71,.5)"} }
      }
    }
  });
}

function updateBarChart(labels, data, colors) {
  var ctx = document.getElementById("chartBar");
  if (!ctx || typeof Chart === "undefined") return;
  if (bChart) bChart.destroy();
  bChart = new Chart(ctx, {
    type: "bar",
    data: { labels:labels, datasets:[{data:data, backgroundColor:colors.map(function(c){return c+"CC";}), borderRadius:8, borderWidth:0}] },
    options: {
      plugins: { legend:{display:false} },
      scales: {
        x: { ticks:{color:"#6B90A6",font:{size:10}}, grid:{display:false} },
        y: { ticks:{color:"#6B90A6",font:{size:10}}, grid:{color:"rgba(26,51,71,.6)"} }
      },
      animation: { duration:600 }
    }
  });
}

function updateCharts() {
  if (!dChart || !lChart) return;
  var vals = CATS.map(function(c) {
    return thisMonthTrans().filter(function(t){return t.cat===c&&t.type==="expense";}).reduce(function(a,t){return a+t.amount;},0);
  });
  dChart.data.datasets[0].data = vals; dChart.update();
  lChart.data.datasets[0].data[5] = calcSpent();
  lChart.data.datasets[1].data[5] = calcSaved();
  lChart.update();
}

function initChat() {
  var chips = document.getElementById("chips");
  var questions = ["Mon budget restant ?", "Analyser mes depenses", "Conseils epargne", "Quel defi choisir ?"];
  chips.innerHTML = "";
  questions.forEach(function(q) {
    var div = document.createElement("div");
    div.className = "chip";
    div.textContent = q;
    div.addEventListener("click", function() { sendMessage(q); });
    chips.appendChild(div);
  });
  addMsg("bot", "Bonjour ! Je suis votre assistant financier IA. Je peux analyser vos depenses et vous aider a epargner davantage. Comment puis-je vous aider ?");
}

function sendChat() {
  var inp = document.getElementById("chat-in");
  var msg = inp.value.trim();
  if (!msg) return;
  inp.value = "";
  sendMessage(msg);
}

function sendMessage(msg) {
  addMsg("user", msg);
  var spent = calcSpent();
  var rest = Math.max(0, state.budget - spent);
  var saved = calcSaved();
  var prenom = state.user ? state.user.prenom : "etudiant";
  var m = msg.toLowerCase();
  var reply = "Je suis la pour vous aider, " + prenom + " ! Vous avez " + rest.toFixed(1) + " TND restants ce mois.";
  if (m.indexOf("budget") >= 0 || m.indexOf("restant") >= 0) {
    reply = "Votre budget restant est de " + rest.toFixed(1) + " TND sur " + state.budget + " TND. Vous avez depense " + Math.round(spent/state.budget*100) + "% de votre budget ce mois.";
  } else if (m.indexOf("pense") >= 0 || m.indexOf("analyse") >= 0) {
    reply = "Vos depenses totales ce mois : " + spent.toFixed(1) + " TND. Essayez de cuisiner a la maison pour reduire vos depenses !";
  } else if (m.indexOf("pargn") >= 0 || m.indexOf("conomis") >= 0) {
    reply = "Vous avez economise " + saved.toFixed(1) + " TND ce mois, soit " + Math.min(100,Math.round(saved/state.challenge.target*100)) + "% de votre objectif.";
  } else if (m.indexOf("conseil") >= 0) {
    reply = "Voici mes conseils : planifiez vos courses a l'avance, preparez votre dejeuner a la maison, partagez les livres avec vos camarades.";
  } else if (m.indexOf("defi") >= 0 || m.indexOf("objectif") >= 0) {
    var level = saved > 200 ? "Argent" : "Bronze";
    reply = "Base sur votre epargne de " + saved.toFixed(1) + " TND, je vous recommande le defi " + level + ".";
  }
  setTimeout(function() { addMsg("bot", reply); }, 800);
}

function addMsg(role, content) {
  var el = document.createElement("div");
  el.className = "msg " + role;
  var avatarText = role === "bot" ? "AI" : "Me";
  var bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = content;
  var avatar = document.createElement("div");
  avatar.className = "msg-avatar " + role;
  avatar.textContent = avatarText;
  el.appendChild(avatar);
  el.appendChild(bubble);
  document.getElementById("chat-messages").appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
}

function openPanel(name) {
  closePanel();
  var p = document.getElementById("panel-" + name);
  var o = document.getElementById("panel-overlay");
  if (p) p.classList.add("show");
  if (o) o.classList.add("show");
  if (name === "settings") {
    document.getElementById("s-budget").value = state.budget;
    document.getElementById("s-goal").value = state.goal;
  }
}

function closePanel() {
  document.querySelectorAll(".slide-panel").forEach(function(p) { p.classList.remove("show"); });
  var o = document.getElementById("panel-overlay");
  if (o) o.classList.remove("show");
}

function saveSettings() {
  var b = parseFloat(document.getElementById("s-budget").value);
  var g = parseFloat(document.getElementById("s-goal").value);
  if (b) { state.budget = b; state.goal = g || 100; saveState(); renderAll(); updateCharts(); updateSidebarChallenge(); }
  closePanel();
  showToast("Parametres sauvegardes!", "success");
}

function exportCSV() {
  var rows = [["Date","Type","Description","Categorie","Montant TND"]];
  state.transactions.forEach(function(t) { rows.push([t.date, t.type, t.desc, t.cat, t.amount]); });
  var csv = rows.map(function(r) { return r.join(","); }).join("\n");
  var blob = new Blob([csv], {type:"text/csv"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "smartbudget_export.csv";
  a.click();
  showToast("Export CSV telecharge!", "success");
}

function processScan(input) {
  var file = input.files[0];
  if (!file) return;
  var res = document.getElementById("scan-result");
  res.style.display = "block";
  res.innerHTML = "<div style='text-align:center;padding:20px;color:var(--text2)'>⏳ Analyse en cours...</div>";
  setTimeout(function() {
    var total = (Math.random() * 50 + 10).toFixed(2);
    res.innerHTML = "<div style='background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:20px'><div style='font-weight:700;margin-bottom:12px'>🧾 " + file.name + " — analysé</div><div style='display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--border);font-weight:700;font-size:16px'><span>Total estimé</span><span style='color:#FF7070'>" + total + " TND</span></div><div style='display:flex;gap:8px;margin-top:16px'><select id='scan-cat' style='flex:1;background:var(--bg4);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);font-size:13px;outline:none'><option>Nourriture</option><option>Transport</option><option>Loisirs</option><option>Sante</option><option>Autre</option></select><button class='btn-sm' onclick='addFromScan(" + total + ")'>+ Ajouter au budget</button></div></div>";
    input.value = "";
  }, 1800);
}

function addFromScan(amount) {
  var cat = document.getElementById("scan-cat").value;
  state.transactions.push({id: Date.now(), type: "expense", desc: "Ticket scanner", cat: cat, amount: parseFloat(amount), date: new Date().toISOString().split("T")[0]});
  saveState(); renderAll(); updateCharts(); updateSidebarChallenge();
  document.getElementById("scan-result").style.display = "none";
  showToast(amount + " TND ajoute au budget!", "success");
}

var cmpLineChart = null;
function renderComparison() {
  var ctx = document.getElementById("cmpLineChart");
  if (!ctx || typeof Chart === "undefined") return;
  if (cmpLineChart) { cmpLineChart.destroy(); cmpLineChart = null; }
  var now = new Date();
  var labels = [];
  var depData = [], epData = [], budgetData = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("fr-FR", {month:"short"}));
    var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    var txs = state.transactions.filter(function(t) { return t.date && t.date.indexOf(key) === 0; });
    var dep = txs.filter(function(t){return t.type==="expense";}).reduce(function(a,t){return a+t.amount;},0);
    depData.push(dep);
    epData.push(Math.max(0, state.budget - dep));
    budgetData.push(state.budget);
  }
  var spent = depData[5], ep = epData[5];
  document.getElementById("cmp-budget").textContent = state.budget.toFixed(0) + " TND";
  document.getElementById("cmp-dep").textContent = spent.toFixed(0) + " TND";
  document.getElementById("cmp-ep").textContent = ep.toFixed(0) + " TND";
  cmpLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {label:"Budget",    data:budgetData, borderColor:"#4F8EF7", borderDash:[6,4], tension:0.4, fill:false, borderWidth:2, pointRadius:4},
        {label:"Depenses",  data:depData,    borderColor:"#EF4444", backgroundColor:"rgba(239,68,68,.1)", tension:0.4, fill:true, borderWidth:2, pointRadius:4},
        {label:"Epargne",   data:epData,     borderColor:"#00D4A8", backgroundColor:"rgba(0,210,170,.1)", tension:0.4, fill:true, borderWidth:2, pointRadius:4}
      ]
    },
    options: {
      plugins: { legend: { labels: {color:"#6B90A6", font:{size:11}} } },
      scales: {
        x: { ticks:{color:"#6B90A6"}, grid:{color:"rgba(26,51,71,.5)"} },
        y: { ticks:{color:"#6B90A6", callback:function(v){return v+" TND";}}, grid:{color:"rgba(26,51,71,.5)"}, beginAtZero:true }
      },
      animation: { duration: 700 }
    }
  });
}

function showToast(msg, type) {
  type = type || "success";
  var t = document.getElementById("toast");
  t.textContent = (type === "success" ? "OK " : "Err ") + msg;
  t.className = "toast show " + type;
  setTimeout(function() { t.classList.remove("show"); }, 3000);
}
