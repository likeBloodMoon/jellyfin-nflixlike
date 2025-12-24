/* =========================================================
   Jellyfin Theme: CineStream (JSInject)
   Adds body classes for scoped CSS + handles SPA navigation.
   ========================================================= */
(() => {
  const THEME_CLASS = "jf-cine";
  const CLS_SOLID = "jf-cine--headerSolid";
  const CLS_HERO  = "jf-cine--hero";
  const CLS_ADMIN = "jf-cine--admin";

  // Non-red accent pairs (persist per browser)
  const ACCENTS = [
    { a: "#22d3ee", b: "#7c5cff" }, // cyan/violet
    { a: "#60a5fa", b: "#22d3ee" }, // blue/cyan
    { a: "#a78bfa", b: "#22d3ee" }, // soft purple/cyan
    { a: "#10b981", b: "#60a5fa" }  // emerald/blue
  ];

  function safePath() {
    try { return (location.pathname || "").toLowerCase(); }
    catch { return ""; }
  }

  function isAdminRoute() {
    const p = safePath();
    // Common patterns for dashboard/admin routes
    return p.includes("/dashboard") || p.includes("dashboard.html") || p.includes("#!/dashboard");
  }

  function isDetailishRoute() {
    const p = safePath();
    // Jellyfin routes vary; keep heuristic broad but harmless
    return p.includes("details") || p.includes("item") || p.includes("movie") || p.includes("series");
  }

  function applyAccent() {
    const key = "jf_cine_accent_v1";
    let idx = parseInt(localStorage.getItem(key), 10);
    if (!Number.isFinite(idx) || idx < 0 || idx >= ACCENTS.length) {
      idx = Math.floor(Math.random() * ACCENTS.length);
      localStorage.setItem(key, String(idx));
    }
    const { a, b } = ACCENTS[idx];
    document.documentElement.style.setProperty("--cs-accent", a);
    document.documentElement.style.setProperty("--cs-accent2", b);
    document.documentElement.style.setProperty("--cs-focus", `0 0 0 3px ${hexToRgba(a, 0.28)}`);
  }

  function hexToRgba(hex, alpha) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!m) return `rgba(34,211,238,${alpha})`;
    let h = m[1];
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function updateBodyFlags() {
    const body = document.body;
    if (!body) return;

    body.classList.add(THEME_CLASS);

    const admin = isAdminRoute();
    body.classList.toggle(CLS_ADMIN, admin);
    body.classList.toggle(CLS_HERO, !admin && isDetailishRoute());

    // header solid on scroll (only for non-admin screens)
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    body.classList.toggle(CLS_SOLID, !admin && y > 18);
  }

  function hookSpaNavigation() {
    const origPush = history.pushState;
    history.pushState = function () {
      origPush.apply(this, arguments);
      setTimeout(updateBodyFlags, 50);
    };
    window.addEventListener("popstate", () => setTimeout(updateBodyFlags, 50));
  }

  function init() {
    applyAccent();
    updateBodyFlags();
    hookSpaNavigation();

    window.addEventListener("scroll", () => {
      const body = document.body;
      if (!body) return;
      const admin = isAdminRoute();
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      body.classList.toggle(CLS_SOLID, !admin && y > 18);
    }, { passive: true });

    // Keep flags applied as Jellyfin re-renders
    const mo = new MutationObserver(() => updateBodyFlags());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function waitForBody() {
    if (document.body) return init();
    requestAnimationFrame(waitForBody);
  }

  waitForBody();
})();
