"use strict";
// Учебные данные — замените на реальные из партнёрского API/CSV.
const CREDITS = [
  { bank: "Ipoteka Bank", rate: 23.5, fee: 1.0, max: 60 },
  { bank: "Xalq banki", rate: 24.0, fee: 0.5, max: 60 },
  { bank: "Kapitalbank", rate: 25.5, fee: 0, max: 36 },
  { bank: "Anorbank", rate: 26.0, fee: 0, max: 24 },
  { bank: "TBC Bank", rate: 27.0, fee: 0, max: 36 },
  { bank: "Asaka Bank", rate: 24.5, fee: 1.5, max: 84 },
];
const DEPOSITS = [
  { bank: "Uzum Bank", rates: { 3: 17, 6: 19, 12: 21, 24: 20 }, min: 100000 },
  { bank: "Anorbank", rates: { 3: 16, 6: 18, 12: 20.5, 24: 20 }, min: 500000 },
  {
    bank: "Hamkorbank",
    rates: { 3: 16.5, 6: 18.5, 12: 20, 24: 19 },
    min: 1000000,
  },
  { bank: "Xalq banki", rates: { 3: 15, 6: 17, 12: 19, 24: 18 }, min: 1000000 },
  { bank: "SQB", rates: { 3: 15.5, 6: 17.5, 12: 19.5, 24: 19 }, min: 2000000 },
];
const TRANSFERS = [
  { bank: "Kapitalbank", pct: 0.8, fix: 0, min: 1, time: "до 5 минут" },
  { bank: "TBC Bank", pct: 1.0, fix: 0, min: 1, time: "до 10 минут" },
  { bank: "Asaka Bank", pct: 1.5, fix: 1, min: 3, time: "1 день" },
  { bank: "Xalq banki", pct: 1.2, fix: 0, min: 2, time: "до 1 часа" },
  { bank: "Ipoteka Bank", pct: 2.0, fix: 0, min: 3, time: "до 30 минут" },
];
const RATES = {
  USD: [
    { bank: "Kapitalbank", buy: 12680, sell: 12760 },
    { bank: "Xalq banki", buy: 12650, sell: 12770 },
    { bank: "Anorbank", buy: 12690, sell: 12750 },
    { bank: "Asaka Bank", buy: 12640, sell: 12790 },
  ],
  EUR: [
    { bank: "Kapitalbank", buy: 14750, sell: 14980 },
    { bank: "Xalq banki", buy: 14720, sell: 15010 },
    { bank: "Anorbank", buy: 14770, sell: 14950 },
    { bank: "Asaka Bank", buy: 14700, sell: 15030 },
  ],
  RUB: [
    { bank: "Kapitalbank", buy: 135, sell: 145 },
    { bank: "Xalq banki", buy: 133, sell: 147 },
    { bank: "Anorbank", buy: 136, sell: 144 },
    { bank: "Asaka Bank", buy: 132, sell: 148 },
  ],
};

const $ = (id) => document.getElementById(id);
const fmt = (n) =>
  Math.round(n)
    .toLocaleString("ru-RU")
    .replace(/\u00a0/g, " ");
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function annuity(p, rate, n) {
  const r = rate / 100 / 12;
  return r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
}

// Выводит таблицу; rows — [{cells:[html,...], info}], первая строка — лучшая.
function draw(tableId, head, rows, kind) {
  const t = $(tableId);
  if (!rows.length) {
    t.innerHTML =
      "<tr><td>Нет подходящих предложений. Измените сумму или срок.</td></tr>";
    return;
  }
  const th = head
    .map(
      (h, i) =>
        `<th class="${i > 0 && i < head.length - 1 ? "num" : ""}">${h}</th>`,
    )
    .join("");
  const body = rows
    .map((r, i) => {
      const tds = r.cells
        .map(
          (c, j) =>
            `<td class="${j > 0 ? "num" : ""}">${j === 0 && i === 0 ? c + '<span class="badge">лучшее</span>' : c}</td>`,
        )
        .join("");
      return `<tr class="${i === 0 ? "best" : ""}">${tds}<td class="num"><button class="cta" data-info="${esc(r.info)}" data-kind="${kind}">Оставить заявку</button></td></tr>`;
    })
    .join("");
  t.innerHTML = `<thead><tr>${th}</tr></thead><tbody>${body}</tbody>`;
}

function renderCredit() {
  const sum = +$("c-sum").value,
    term = +$("c-term").value;
  if (!(sum > 0 && term > 0)) {
    draw("c-table", [], [], "credit");
    return;
  }
  const rows = CREDITS.filter((c) => term <= c.max)
    .map((c) => {
      const pay = annuity(sum, c.rate, term);
      const fee = (sum * c.fee) / 100;
      const over = pay * term - sum + fee;
      return {
        over,
        cells: [
          `<span class="bank">${c.bank}</span><span class="small">комиссия ${c.fee}%</span>`,
          c.rate + "%",
          fmt(pay) + " сум",
          fmt(over) + " сум",
        ],
        info: `${c.bank}: кредит ${fmt(sum)} сум на ${term} мес.`,
      };
    })
    .sort((a, b) => a.over - b.over);
  draw(
    "c-table",
    ["Банк", "Ставка", "Платёж в месяц", "Переплата", ""],
    rows,
    "credit",
  );
}

function renderDeposit() {
  const sum = +$("d-sum").value,
    term = +$("d-term").value;
  const rows = DEPOSITS.filter((d) => sum >= d.min)
    .map((d) => {
      const rate = d.rates[term];
      const end = sum * Math.pow(1 + rate / 100 / 12, term);
      return {
        end,
        cells: [
          `<span class="bank">${d.bank}</span><span class="small">от ${fmt(d.min)} сум</span>`,
          rate + "%",
          fmt(end - sum) + " сум",
          fmt(end) + " сум",
        ],
        info: `${d.bank}: вклад ${fmt(sum)} сум на ${term} мес.`,
      };
    })
    .sort((a, b) => b.end - a.end);
  draw(
    "d-table",
    ["Банк", "Ставка", "Доход", "Итого на счёте", ""],
    rows,
    "deposit",
  );
}

function renderTransfer() {
  const sum = +$("t-sum").value;
  if (!(sum > 0)) {
    draw("t-table", [], [], "transfer");
    return;
  }
  const rows = TRANSFERS.map((t) => {
    const fee = Math.max((sum * t.pct) / 100, t.min) + t.fix;
    return {
      fee,
      cells: [
        `<span class="bank">${t.bank}</span>`,
        t.time,
        fee.toFixed(2) + " USD",
        (sum - fee).toFixed(2) + " USD",
      ],
      info: `${t.bank}: перевод ${sum} USD`,
    };
  }).sort((a, b) => a.fee - b.fee);
  draw(
    "t-table",
    ["Банк", "Срок", "Комиссия", "Получатель получит", ""],
    rows,
    "transfer",
  );
}

function renderRates() {
  const cur = $("r-cur").value,
    mode = $("r-mode").value;
  // Покупаем валюту — банк продаёт (sell), выгоднее меньше. Продаём — банк покупает (buy), выгоднее больше.
  const rows = RATES[cur]
    .slice()
    .sort((a, b) => (mode === "buy" ? a.sell - b.sell : b.buy - a.buy))
    .map((r) => ({
      cells: [
        `<span class="bank">${r.bank}</span>`,
        fmt(r.buy),
        fmt(r.sell),
        fmt(r.sell - r.buy),
      ],
      info: `${r.bank}: курс ${cur}`,
    }));
  draw("r-table", ["Банк", "Покупка", "Продажа", "Спред", ""], rows, "rates");
}

const renderers = {
  credit: renderCredit,
  deposit: renderDeposit,
  transfer: renderTransfer,
  rates: renderRates,
};

document.querySelectorAll(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".tabs button")
      .forEach((x) => x.setAttribute("aria-selected", x === b));
    document
      .querySelectorAll(".panel")
      .forEach((p) => (p.hidden = p.id !== b.dataset.tab));
    renderers[b.dataset.tab]();
  }),
);
["c-sum", "c-term"].forEach((i) =>
  $(i).addEventListener("input", renderCredit),
);
["d-sum", "d-term"].forEach((i) =>
  $(i).addEventListener("input", renderDeposit),
);
$("t-sum").addEventListener("input", renderTransfer);
["r-cur", "r-mode"].forEach((i) =>
  $(i).addEventListener("change", renderRates),
);

// Заявка (лид)
let lead = null;
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-info]");
  if (!b) return;
  lead = { info: b.dataset.info, kind: b.dataset.kind };
  $("m-info").textContent = lead.info;
  $("m-form").hidden = false;
  $("m-done").hidden = true;
  $("m-err").textContent = "";
  $("modal").hidden = false;
  $("m-name").focus();
});
const closeModal = () => {
  $("modal").hidden = true;
};
$("m-close").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
$("m-send").addEventListener("click", () => {
  const name = $("m-name").value.trim(),
    phone = $("m-phone").value.replace(/\D/g, "");
  if (name.length < 2) {
    $("m-err").textContent = "Введите имя.";
    return;
  }
  if (phone.length < 9) {
    $("m-err").textContent = "Введите телефон полностью.";
    return;
  }
  // Здесь отправьте лид на свой сервер: fetch('/api/leads', {method:'POST', body:JSON.stringify({...lead,name,phone})})
  console.log("lead", { ...lead, name, phone });
  $("m-form").hidden = true;
  $("m-done").hidden = false;
});

renderCredit();
