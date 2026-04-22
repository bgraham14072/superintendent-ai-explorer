(function() {
  const SIZE_LABELS = {
    xs: "< 500",
    sm: "< 1,000",
    md: "< 3,000",
    lg: "< 8,000",
    xl: "15,000+"
  };

  const SIZE_BANDS = [
    {
      key: "xs",
      label: "Districts under 500 students",
      blurb: "The superintendent is the curriculum director, the HR director, and often the high school principal. The workflows here protect your time and let you do the three exclusive-to-superintendent jobs well — governance, budget, and community trust — without falling behind on everything else."
    },
    {
      key: "sm",
      label: "Districts under 1,000 students",
      blurb: "A small cabinet, every conversation carries weight across the whole system. The job rewards disciplined delegation and a clear handful of strategic priorities you can actually hold in your head."
    },
    {
      key: "md",
      label: "Districts under 3,000 students",
      blurb: "The 'goldilocks' size where a superintendent still knows every teacher's name and most families. Central office is real but lean — the workflows here help you use the structure you have without recreating it."
    },
    {
      key: "lg",
      label: "Districts under 8,000 students",
      blurb: "A full cabinet, multiple unions, multiple buildings, and politics that resemble a small city. The workflows here help the superintendent stay the person who sees the whole — rather than becoming the senior manager of an org chart."
    },
    {
      key: "xl",
      label: "Big-city districts (15,000+ students)",
      blurb: "You are running a small city. The workflows here assume a deep staff, media scrutiny, and strategic questions that move policy beyond the district. The job is less about execution and more about coherence across very large systems."
    }
  ];

  const state = { tool: "all", domain: "all", size: "all", query: "", view: "grid" };

  const grid = document.getElementById("cardGrid");
  const sized = document.getElementById("sizedView");
  const empty = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");
  const searchInput = document.getElementById("searchInput");
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  const filterControls = document.getElementById("filterControls");

  function filterList(list) {
    const q = state.query.trim().toLowerCase();
    return list.filter(w => {
      if (state.tool !== "all" && w.tool !== state.tool) return false;
      if (state.domain !== "all" && w.domain !== state.domain) return false;
      if (state.size !== "all" && !(w.sizes || []).includes(state.size)) return false;
      if (q) {
        const hay = `${w.title} ${w.description} ${w.toolLabel} ${w.domainLabel} ${w.why}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function cardHTML(w) {
    const sizeBadges = (w.sizes || []).map(s => `<span class="size-badge" title="${SIZE_LABELS[s]} students">${SIZE_LABELS[s]}</span>`).join("");
    return `
      <button class="card${w.featured ? " featured" : ""}" data-id="${w.id}" aria-label="Open workflow: ${escapeAttr(w.title)}">
        ${w.featured ? '<span class="featured-flag">Featured</span>' : ""}
        <div class="card-tags">
          <span class="tag tag-tool">${w.toolLabel}</span>
          <span class="tag tag-domain">${w.domainLabel}</span>
        </div>
        <h3>${escape(w.title)}</h3>
        <p>${escape(w.description)}</p>
        <div class="size-row">${sizeBadges}</div>
        <span class="card-cta">Open workflow</span>
      </button>
    `;
  }

  function renderGrid() {
    const filtered = filterList(WORKFLOWS);
    resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "workflow" : "workflows"}`;
    empty.hidden = filtered.length !== 0;
    grid.innerHTML = filtered.map(cardHTML).join("");
    bindCardClicks(grid);
  }

  function renderSized() {
    // In sized view, we ignore the "size" filter chip but keep tool/domain/query filters.
    const q = state.query.trim().toLowerCase();
    const baseFiltered = WORKFLOWS.filter(w => {
      if (state.tool !== "all" && w.tool !== state.tool) return false;
      if (state.domain !== "all" && w.domain !== state.domain) return false;
      if (q) {
        const hay = `${w.title} ${w.description} ${w.toolLabel} ${w.domainLabel} ${w.why}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    resultCount.textContent = `${baseFiltered.length} ${baseFiltered.length === 1 ? "workflow" : "workflows"} across 5 size bands`;
    empty.hidden = baseFiltered.length !== 0;

    const html = SIZE_BANDS.map(band => {
      const items = baseFiltered.filter(w => (w.sizes || []).includes(band.key));
      if (items.length === 0) return "";
      return `
        <section class="size-band" data-size="${band.key}">
          <header class="size-band-header">
            <div class="size-band-label">${SIZE_LABELS[band.key]} students</div>
            <h3 class="size-band-title">${escape(band.label)}</h3>
            <p class="size-band-blurb">${escape(band.blurb)}</p>
            <div class="size-band-count">${items.length} ${items.length === 1 ? "workflow" : "workflows"}</div>
          </header>
          <div class="card-grid">
            ${items.map(cardHTML).join("")}
          </div>
        </section>
      `;
    }).join("");

    sized.innerHTML = html;
    bindCardClicks(sized);
  }

  function render() {
    if (state.view === "grid") {
      grid.hidden = false;
      sized.hidden = true;
      renderGrid();
    } else {
      grid.hidden = true;
      sized.hidden = false;
      renderSized();
    }
  }

  function bindCardClicks(root) {
    root.querySelectorAll(".card").forEach(c => {
      c.addEventListener("click", () => openModal(parseInt(c.dataset.id, 10)));
    });
  }

  function openModal(id) {
    const w = WORKFLOWS.find(x => x.id === id);
    if (!w) return;
    const sizeBadges = (w.sizes || []).map(s => `<span class="size-badge">${SIZE_LABELS[s]}</span>`).join("");
    modalContent.innerHTML = `
      <div class="card-tags">
        <span class="tag tag-tool">${w.toolLabel}</span>
        <span class="tag tag-domain">${w.domainLabel}</span>
      </div>
      <h2 id="modalTitle">${escape(w.title)}</h2>
      <p class="description">${escape(w.description)}</p>

      <div class="modal-section">
        <div class="modal-section-label">Best fit for district size</div>
        <div class="size-row">${sizeBadges}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-label">Why it matters</div>
        <p>${escape(w.why)}</p>
      </div>

      <div class="modal-section">
        <div class="modal-section-label">Setup</div>
        <p>${escape(w.setup)}</p>
      </div>

      <div class="modal-section">
        <div class="modal-section-label">The Prompt</div>
        <div class="prompt-box">
          <button class="copy-btn" id="copyBtn">Copy</button>
          <pre id="promptText">${escape(w.prompt)}</pre>
        </div>
      </div>
    `;
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    document.getElementById("copyBtn").addEventListener("click", async () => {
      const btn = document.getElementById("copyBtn");
      try {
        await navigator.clipboard.writeText(w.prompt);
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1800);
      } catch {
        btn.textContent = "Press \u2318C";
      }
    });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  filterControls.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      state[filter] = value;
      filterControls.querySelectorAll(`.chip[data-filter="${filter}"]`).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      document.querySelectorAll(".view-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      // Size chips are hidden in sized view to avoid confusion (handled via CSS on body class)
      document.body.classList.toggle("view-sized", state.view === "sized");
      render();
    });
  });

  searchInput.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });

  function escape(s) {
    return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function escapeAttr(s) { return escape(s); }

  render();
})();
