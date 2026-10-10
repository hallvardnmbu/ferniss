// "Hylla": pieces a visitor sets aside, kept in their browser, sent as one email.
const load = () => {
  try { return JSON.parse(localStorage.getItem("hylla")) ?? []; } catch { return []; }
};
const save = (items) => {
  try { localStorage.setItem("hylla", JSON.stringify(items)); } catch {}
  render();
};

function render() {
  const items = load();
  document.querySelector(".shelf-link").hidden = items.length === 0;
  document.querySelector(".shelf-count").textContent = items.length;

  for (const button of document.querySelectorAll(".shelf-add")) {
    button.hidden = false;
    button.textContent = items.some((i) => i.url === button.dataset.url) ? "Fjern fra hylla" : "Legg på hylla";
  }

  const shelf = document.getElementById("hylla");
  if (!shelf) return;
  shelf.hidden = items.length === 0;
  shelf.querySelector(".shelf-list").innerHTML = items
    .map((i) => `<li><a href="${i.url}">${i.title}</a>${i.price ? ` · ${i.price}` : ""} <button data-remove="${i.url}">Fjern</button></li>`)
    .join("");
  const send = shelf.querySelector(".shelf-send");
  const lines = items.map((i) => `– ${i.title}${i.price ? ` (${i.price})` : ""}: ${location.origin}${i.url}`);
  send.href = `mailto:${send.dataset.email}?subject=${encodeURIComponent(`Forespørsel om ${items.length} verk`)}&body=${encodeURIComponent(`Hei!\n\nJeg er interessert i disse:\n${lines.join("\n")}\n`)}`;
}

document.addEventListener("click", (event) => {
  const add = event.target.closest(".shelf-add");
  const remove = event.target.closest("[data-remove]");
  if (add) {
    const items = load();
    const { url, title, price } = add.dataset;
    save(items.some((i) => i.url === url) ? items.filter((i) => i.url !== url) : [...items, { url, title, price }]);
  }
  if (remove) save(load().filter((i) => i.url !== remove.dataset.remove));
});

render();
