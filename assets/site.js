// Ferniss — small progressive enhancements. The site works without this file;
// it adds the shelf, in-page inquiry forms, filters, lightbox and colour tint.
(() => {
  const { t, email, endpoint } = window.FERNISS;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---- Mobile menu --------------------------------------------------------
  const menuToggle = $(".menu-toggle");
  menuToggle?.addEventListener("click", () => {
    const open = $("#site-nav").classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open);
  });

  // ---- The shelf: a little wish-list kept in this browser -----------------
  const SHELF_KEY = "ferniss-shelf";
  const readShelf = () => { try { return JSON.parse(localStorage.getItem(SHELF_KEY)) ?? []; } catch { return []; } };
  const writeShelf = (items) => { try { localStorage.setItem(SHELF_KEY, JSON.stringify(items)); } catch {} renderShelf(); };
  const shelfToggle = $(".shelf-toggle");
  const shelf = $("#shelf");
  let storageWorks = true;
  try { localStorage.setItem("ferniss-test", "1"); localStorage.removeItem("ferniss-test"); } catch { storageWorks = false; }

  function renderShelf() {
    const items = readShelf();
    if (!storageWorks) return;
    shelfToggle.hidden = items.length === 0 && !$("[data-shelf-add]");
    $(".shelf-count").textContent = items.length;
    $(".shelf-list").innerHTML = items.map((item) => `<li>
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : "<span></span>"}
      <div><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>${item.price ? `<small>${escapeHtml(item.price)}</small>` : ""}</div>
      <button data-remove="${escapeHtml(item.slug)}">${escapeHtml(t.remove)}</button>
    </li>`).join("");
    $(".shelf-empty").hidden = items.length > 0;
    $(".shelf-send").hidden = items.length === 0;
    $$("[data-shelf-add]").forEach((button) => {
      const { slug } = JSON.parse(button.dataset.shelfAdd);
      const on = items.some((item) => item.slug === slug);
      button.hidden = false;
      button.textContent = on ? t.onShelf : t.addToShelf;
      button.setAttribute("aria-pressed", on);
    });
    $$("[data-use-shelf]").forEach(renderShelfInForm);
  }

  const openShelf = (open) => {
    shelf.hidden = !open;
    shelfToggle.setAttribute("aria-expanded", open);
    if (open) $(".shelf-close").focus();
  };
  shelfToggle?.addEventListener("click", () => openShelf(shelf.hidden));
  shelf?.addEventListener("click", (event) => {
    if (event.target === shelf || event.target.closest(".shelf-close")) openShelf(false);
    const remove = event.target.closest("[data-remove]");
    if (remove) writeShelf(readShelf().filter((item) => item.slug !== remove.dataset.remove));
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !shelf.hidden) openShelf(false); });

  $$("[data-shelf-add]").forEach((button) => button.addEventListener("click", () => {
    const piece = JSON.parse(button.dataset.shelfAdd);
    const items = readShelf();
    const exists = items.some((item) => item.slug === piece.slug);
    writeShelf(exists ? items.filter((item) => item.slug !== piece.slug) : [...items, piece]);
    if (!exists) {
      shelfToggle.classList.remove("bump");
      void shelfToggle.offsetWidth;
      shelfToggle.classList.add("bump");
    }
  }));

  function renderShelfInForm(form) {
    const items = readShelf();
    const box = $(".inquiry-pieces", form);
    box.hidden = items.length === 0;
    $("ul", box).innerHTML = items.map((item) => `<li data-piece="${escapeHtml(item.slug)}" data-title="${escapeHtml(item.title)}" data-url="${escapeHtml(item.url)}" data-price="${escapeHtml(item.price)}">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : ""}${escapeHtml(item.title)}${item.price ? ` <span>${escapeHtml(item.price)}</span>` : ""}
      <button type="button" data-remove-form="${escapeHtml(item.slug)}" aria-label="${escapeHtml(t.remove)}">×</button></li>`).join("");
  }
  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-form]");
    if (remove) writeShelf(readShelf().filter((item) => item.slug !== remove.dataset.removeForm));
  });

  renderShelf();

  // ---- Inquiry forms ------------------------------------------------------
  // "Ask about this piece" opens the form in place instead of leaving the page.
  $$("[data-inquire]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const panel = $(".piece-inquiry");
    panel.hidden = false;
    $("input[name=name]", panel).focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }));

  $$("form[data-inquiry]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get("_gotcha")) return; // a bot filled the hidden field
    const pieces = $$(".inquiry-pieces li[data-piece]", form).map((li) => ({ ...li.dataset }));
    const subject = pieces.length === 1 ? t.subjectOne.replace("{title}", pieces[0].title)
      : pieces.length > 1 ? t.subjectMany.replace("{n}", pieces.length) : t.subjectGeneral;
    const pieceLines = pieces.map((p) => `• ${p.title}${p.price ? ` (${p.price})` : ""} — ${location.origin}${p.url}`).join("\n");
    const status = $(".inquiry-status", form);
    const button = $("button[type=submit]", form);

    if (!endpoint) {
      const body = [data.get("message"), pieceLines && `\n${t.inquiryAbout}:\n${pieceLines}`, `\n${t.yourName}: ${data.get("name")}\n${t.yourEmail}: ${data.get("email")}`].filter(Boolean).join("\n");
      location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    button.disabled = true;
    button.textContent = t.sending;
    data.set("_subject", subject);
    data.set("pieces", pieceLines);
    try {
      const response = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(response.statusText);
      form.reset();
      status.textContent = t.sent;
      if (form.hasAttribute("data-use-shelf")) writeShelf([]);
    } catch {
      status.innerHTML = `${escapeHtml(t.failed)} <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>.`;
    } finally {
      button.disabled = false;
      button.textContent = t.send;
    }
  }));

  // ---- Filters on the works and collection pages --------------------------
  const filters = $("[data-filters]");
  if (filters) {
    const grid = $("[data-filterable]");
    let collection = new URLSearchParams(location.search).get("samling") ?? "";
    const available = $("[data-filter-available]", filters);
    const apply = () => {
      let shown = 0;
      $$(".card", grid).forEach((card) => {
        const visible = (!collection || card.dataset.collection === collection) && (!available.checked || card.dataset.status === "available");
        card.classList.toggle("is-hidden", !visible);
        shown += visible;
      });
      $$("[data-filter-collection]", filters).forEach((chip) => chip.setAttribute("aria-pressed", chip.dataset.filterCollection === collection));
      $(".empty").hidden = shown > 0;
    };
    filters.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-filter-collection]");
      if (!chip) return;
      collection = chip.dataset.filterCollection;
      const url = new URL(location.href);
      collection ? url.searchParams.set("samling", collection) : url.searchParams.delete("samling");
      history.replaceState(null, "", url);
      apply();
    });
    available.addEventListener("change", apply);
    apply();
  }

  // ---- Piece gallery + lightbox -------------------------------------------
  const main = $(".piece-main img");
  let current = 0;
  const thumbs = $$("[data-thumb]");
  const show = (index) => {
    current = (index + thumbs.length) % thumbs.length;
    const thumb = thumbs[current];
    thumbs.forEach((button) => button.setAttribute("aria-current", button === thumb));
    main.classList.add("swap");
    setTimeout(() => {
      main.removeAttribute("srcset");
      main.src = thumb.dataset.full;
      main.removeAttribute("width");
      main.removeAttribute("height");
      main.onload = () => main.classList.remove("swap");
    }, 180);
  };
  thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => show(i)));

  const lightbox = $(".lightbox");
  if (lightbox && main) {
    const images = JSON.parse(lightbox.dataset.images);
    const image = $("img", lightbox);
    let index = 0;
    const go = (i) => { index = (i + images.length) % images.length; image.src = images[index]; };
    $(".piece-main").addEventListener("click", () => { go(current); lightbox.showModal(); });
    $(".lightbox-close", lightbox).addEventListener("click", () => lightbox.close());
    $(".lightbox-prev", lightbox).addEventListener("click", () => go(index - 1));
    $(".lightbox-next", lightbox).addEventListener("click", () => go(index + 1));
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    });
    if (images.length < 2) $$(".lightbox-prev, .lightbox-next", lightbox).forEach((b) => (b.hidden = true));
  }

  // ---- Glaze tint: the page takes on a whisper of the piece's colour ------
  if (main) {
    const tint = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(main, 0, 0, 24, 24);
        const { data } = context.getImageData(0, 0, 24, 24);
        // Weight saturated pixels more, so the glaze wins over a grey backdrop.
        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          const w = 1 + ((max - min) / 255) * 6;
          r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w; weight += w;
        }
        document.documentElement.style.setProperty("--tint", `rgb(${Math.round(r / weight)} ${Math.round(g / weight)} ${Math.round(b / weight)})`);
      } catch {}
    };
    main.complete ? tint() : main.addEventListener("load", tint, { once: true });
  }

  // ---- Reveal on scroll ---------------------------------------------------
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    $$(".section .card, .collection-row, .teaser, .collection-tile").forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      observer.observe(el);
    });
  }
})();
