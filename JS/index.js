// [word, part of speech, category, meaning]
const W = [
  ["horse", "Noun", "Animal", "A big animal people ride"],
  ["tiger", "Noun", "Animal", "A big cat with stripes"],
  ["snake", "Noun", "Animal", "A long reptile with no legs"],
  ["mouse", "Noun", "Animal", "A small rodent, also a computer device"],
  ["eagle", "Noun", "Animal", "A large bird of prey"],
  ["whale", "Noun", "Animal", "The biggest mammal in the ocean"],
  ["zebra", "Noun", "Animal", "A horse-like animal with stripes"],
  ["sheep", "Noun", "Animal", "A farm animal that gives wool"],
  ["chair", "Noun", "Object", "Furniture you sit on"],
  ["table", "Noun", "Object", "Furniture with a flat top and legs"],
  ["clock", "Noun", "Object", "It shows what time it is"],
  ["phone", "Noun", "Object", "You use it to call people"],
  ["knife", "Noun", "Object", "A tool used to cut food"],
  ["torch", "Noun", "Object", "A light you carry in the dark"],
  ["smile", "Verb", "Action", "To show happiness with your mouth"],
  ["dance", "Verb", "Action", "To move your body to music"],
  ["think", "Verb", "Action", "To use your mind"],
  ["sleep", "Verb", "Action", "To rest with your eyes closed"],
  ["climb", "Verb", "Action", "To go up using hands and feet"],
  ["laugh", "Verb", "Action", "To make sounds when something is funny"],
  ["happy", "Adjective", "Feeling", "Feeling joy"],
  ["angry", "Adjective", "Feeling", "Feeling very mad"],
  ["brave", "Adjective", "Quality", "Not afraid of danger"],
  ["quick", "Adjective", "Quality", "Moving or happening fast"],
  ["sweet", "Adjective", "Quality", "Tasting like sugar"],
  ["tired", "Adjective", "Feeling", "Needing rest or sleep"]
].filter(w => w[0].length === 5);

const ROWS = 6, MAX = 3;
let ans, r, c, g, over, used, ks, busy = false, introOpen = true;
const $ = id => document.getElementById(id);
const board = $("board"), kb = $("kb"), msg = $("msg"), hints = $("hints"), bulb = $("bulb"), intro = $("intro");

function build() {
  board.innerHTML = "";
  g = [];
  for (let i = 0; i < ROWS; i++) {
    const row = document.createElement("div");
    row.className = "row";
    const ts = [];
    for (let j = 0; j < 5; j++) {
      const t = document.createElement("div");
      t.className = "t";
      row.appendChild(t);
      ts.push(t);
    }
    board.appendChild(row);
    g.push(ts);
  }
  kb.innerHTML = "";
  ks = {};
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach(l => {
    const kr = document.createElement("div");
    kr.className = "kr";
    [...l].forEach(ch => {
      const b = document.createElement("button");
      b.className = "k";
      b.textContent = ch;
      b.onclick = () => key(ch);
      ks[ch] = b;
      kr.appendChild(b);
    });
    kb.appendChild(kr);
  });
}

function start() {
  ans = W[Math.floor(Math.random() * W.length)];
  r = 0; c = 0; over = false; used = 0; busy = false;
  build();
  hints.innerHTML = "";
  msg.textContent = "";
  $("new").style.display = "none";
  $("left").textContent = MAX;
  bulb.disabled = false;
}

function openIntro() {
  introOpen = true;
  intro.style.display = "flex";
}

function closeIntro() {
  introOpen = false;
  intro.style.display = "none";
}

function key(k) {
  if (introOpen) {
    if (k === "Enter") closeIntro();
    return;
  }
  if (over || busy) return;
  if (k === "Enter") return submit();
  if (k === "Backspace") {
    if (c > 0) {
      c--;
      g[r][c].textContent = "";
      g[r][c].classList.remove("f");
    }
    return;
  }
  if (/^[a-z]$/i.test(k) && c < 5) {
    g[r][c].textContent = k.toLowerCase();
    g[r][c].classList.add("f");
    c++;
  }
}

const cache = {};
async function isWord(w) {
  if (W.some(x => x[0] === w)) return true;
  if (w in cache) return cache[w];
  try {
    const res = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + w);
    cache[w] = res.status !== 404;
    return cache[w];
  } catch (e) {
    return true; // offline: do not block the game
  }
}

function shake() {
  const rw = board.children[r];
  rw.classList.remove("shake");
  void rw.offsetWidth;
  rw.classList.add("shake");
}

async function submit() {
  if (c < 5) {
    msg.textContent = "Not enough letters";
    shake();
    return;
  }
  const guess = g[r].map(t => t.textContent).join("");
  busy = true;
  msg.textContent = "Checking...";
  if (!(await isWord(guess))) {
    busy = false;
    msg.textContent = "That word does not exist";
    shake();
    return;
  }
  const target = ans[0].split(""), res = Array(5).fill("no");
  for (let i = 0; i < 5; i++) if (guess[i] === target[i]) { res[i] = "ok"; target[i] = null; }
  for (let i = 0; i < 5; i++) if (res[i] === "no") {
    const p = target.indexOf(guess[i]);
    if (p > -1) { res[i] = "mid"; target[p] = null; }
  }
  const rank = { no: 1, mid: 2, ok: 3 };
  msg.textContent = "";
  const row = r;
  for (let i = 0; i < 5; i++) setTimeout(() => {
    const t = g[row][i];
    t.classList.remove("f");
    t.classList.add("flip");
    setTimeout(() => {
      t.classList.add(res[i]);
      const b = ks[guess[i]];
      const cur = ["ok", "mid", "no"].find(x => b.classList.contains(x));
      if (!cur || rank[res[i]] > rank[cur]) {
        b.classList.remove("ok", "mid", "no");
        b.classList.add(res[i]);
      }
    }, 250);
  }, i * 220);
  r++; c = 0;
  setTimeout(() => {
    busy = false;
    if (guess === ans[0]) {
      g[row].forEach((t, i) => {
        t.style.animationDelay = i * 90 + "ms";
        t.classList.remove("flip");
        t.classList.add("win");
      });
      end(true);
    } else if (r === ROWS) end(false);
  }, 5 * 220 + 300);
}

function end(win) {
  over = true;
  bulb.disabled = true;
  msg.textContent = win ? "🎉 You got it!" : "The word was: " + ans[0].toUpperCase();
  $("new").style.display = "block";
}

bulb.onclick = () => {
  bulb.blur();
  if (introOpen || over || used >= MAX) return;
  used++;
  const d = document.createElement("div");
  d.className = "hint";
  if (used === 1) d.textContent = "💡 1/3 · Part of speech: " + ans[1];
  else if (used === 2) d.textContent = "💡 2/3 · Category: " + ans[2];
  else d.textContent = "💡 3/3 · " + ans[3] + " · Starts with “" + ans[0][0].toUpperCase() + "”";
  hints.appendChild(d);
  $("left").textContent = MAX - used;
  if (used >= MAX) bulb.disabled = true;
};

$("start").onclick = closeIntro;
$("help").onclick = () => { $("help").blur(); openIntro(); };
$("new").onclick = start;

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter") e.preventDefault(); // avoids re-clicking a focused button
  key(e.key);
});

start();