const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  :root,
  html[data-theme="dark"]{
    color-scheme:dark;
    --c-bg:#080c14;
    --c-surf:#0d1420;
    --c-card:rgba(255,255,255,.033);
    --c-card-hover-border:rgba(255,255,255,.12);
    --c-border:rgba(255,255,255,.07);
    --c-divider:rgba(255,255,255,.06);
    --c-row-border:rgba(255,255,255,.03);
    --c-text:#f1f5f9;
    --c-muted:#64748b;
    --c-subtle:#94a3b8;
    --c-input-bg:rgba(255,255,255,.04);
    --c-input-border:rgba(255,255,255,.09);
    --c-btn-border:rgba(255,255,255,.1);
    --c-soft-bg:rgba(255,255,255,.05);
    --c-shadow:rgba(0,0,0,.28);
    --c-stat-shadow:rgba(0,0,0,.55);
    --c-select-bg:#0d1420;
    --c-skeleton-a:rgba(255,255,255,.04);
    --c-skeleton-b:rgba(255,255,255,.08);
    --c-section-hover:rgba(255,255,255,.75);
    --c-track:rgba(255,255,255,.07);
    --c-sidebar-bg:linear-gradient(180deg,#070c15 0%,#050a11 100%);
    --c-sidebar-border:rgba(255,255,255,.06);
    --c-sidebar-text:#f1f5f9;
    --c-sidebar-muted:#94a3b8;
    --c-sidebar-icon-bg:rgba(255,255,255,.05);
    --c-sidebar-icon-border:rgba(255,255,255,.07);
    --c-sidebar-tree:rgba(255,255,255,.06);
    --c-sidebar-card-bg:rgba(255,255,255,.03);
    --c-sidebar-card-border:rgba(255,255,255,.07);
    --c-sidebar-divider:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
    --c-sidebar-toggle-bg:rgba(255,255,255,.035);
    --c-sidebar-toggle-border:rgba(255,255,255,.08);
  }

  html[data-theme="light"]{
    color-scheme:light;

    /* ── Page & surface ───────────────────────── */
    --c-bg:#eef2f7;
    --c-surf:#ffffff;
    --c-card:rgba(255,255,255,.96);
    --c-card-hover-border:rgba(59,130,246,.28);
    --c-border:rgba(15,23,42,.1);
    --c-divider:rgba(15,23,42,.08);
    --c-row-border:rgba(15,23,42,.055);

    /* ── Typography ───────────────────────────── */
    --c-text:#0f172a;
    --c-muted:#64748b;
    --c-subtle:#334155;

    /* ── Inputs ───────────────────────────────── */
    --c-input-bg:#ffffff;
    --c-input-border:rgba(15,23,42,.15);
    --c-btn-border:rgba(15,23,42,.13);
    --c-soft-bg:#f8fafc;
    --c-select-bg:#ffffff;

    /* ── Shadows ──────────────────────────────── */
    --c-shadow:rgba(15,23,42,.1);
    --c-stat-shadow:rgba(15,23,42,.15);

    /* ── Skeletons ────────────────────────────── */
    --c-skeleton-a:rgba(15,23,42,.06);
    --c-skeleton-b:rgba(15,23,42,.13);

    /* ── Misc ─────────────────────────────────── */
    --c-section-hover:rgba(15,23,42,.8);
    --c-track:rgba(15,23,42,.1);

    /* ── Sidebar — kept DARK for contrast ─────── */
    --c-sidebar-bg:linear-gradient(180deg,#1e293b 0%,#0f172a 100%);
    --c-sidebar-border:rgba(255,255,255,.06);
    --c-sidebar-text:#f1f5f9;
    --c-sidebar-muted:#94a3b8;
    --c-sidebar-icon-bg:rgba(255,255,255,.06);
    --c-sidebar-icon-border:rgba(255,255,255,.09);
    --c-sidebar-tree:rgba(255,255,255,.07);
    --c-sidebar-card-bg:rgba(255,255,255,.04);
    --c-sidebar-card-border:rgba(255,255,255,.09);
    --c-sidebar-divider:linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent);
    --c-sidebar-toggle-bg:rgba(255,255,255,.06);
    --c-sidebar-toggle-border:rgba(255,255,255,.1);
  }

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  html,body{transition:background-color .25s ease,color .25s ease}
  body{background:var(--c-bg);font-family:'Plus Jakarta Sans',sans-serif;color:var(--c-text)}

  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(59,130,246,.22);border-radius:6px;transition:background .2s}
  ::-webkit-scrollbar-thumb:hover{background:rgba(59,130,246,.42)}

  select option{background:var(--c-select-bg);color:var(--c-text)}

  /* ── Keyframes ─────────────────────────────────────────────────── */
  @keyframes fadeUp{
    from{opacity:0;transform:translateY(20px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes fadeIn{from{opacity:0} to{opacity:1}}
  @keyframes scaleIn{
    from{opacity:0;transform:scale(.9)}
    to{opacity:1;transform:scale(1)}
  }
  @keyframes slideInLeft{
    from{opacity:0;transform:translateX(-12px)}
    to{opacity:1;transform:translateX(0)}
  }
  @keyframes slideDown{
    from{opacity:0;transform:translateY(-8px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes expandDown{
    from{opacity:0;max-height:0;transform:translateY(-4px)}
    to{opacity:1;max-height:400px;transform:translateY(0)}
  }
  @keyframes pulse{
    0%,100%{opacity:.3;transform:scale(.85)}
    50%{opacity:1;transform:scale(1.25)}
  }
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{
    0%{background-position:-200% 0}
    100%{background-position:200% 0}
  }
  @keyframes pulseDot{
    0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}
    50%{box-shadow:0 0 0 6px rgba(52,211,153,0)}
  }
  @keyframes glowPulse{
    0%,100%{opacity:.55}
    50%{opacity:1}
  }
  @keyframes countUp{
    from{opacity:0;transform:translateY(10px) scale(.92)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes float{
    0%,100%{transform:translateY(0)}
    50%{transform:translateY(-4px)}
  }
  @keyframes accentLine{
    from{width:0;opacity:0}
    to{width:40px;opacity:1}
  }
  @keyframes drawerIn{
    from{opacity:0;transform:translateX(24px)}
    to{opacity:1;transform:translateX(0)}
  }

  /* ── Page & layout ─────────────────────────────────────────────── */
  .page-enter{animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both}

  /* ── Glass cards ───────────────────────────────────────────────── */
  .glass{
    background:var(--c-card);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border:1px solid var(--c-border);
    border-radius:14px;
    transition:background .25s ease,border-color .25s ease,box-shadow .25s ease;
  }
  .glass:hover{
    border-color:var(--c-card-hover-border);
    box-shadow:0 12px 40px var(--c-shadow);
  }
  .card-appear{animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both}

  /* ── Stat cards ─────────────────────────────────────────────────── */
  .stat-card{
    transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,border-color .22s ease;
    will-change:transform;
  }
  .stat-card:hover{
    transform:translateY(-4px);
    box-shadow:0 28px 60px var(--c-stat-shadow)!important;
    border-color:var(--c-card-hover-border)!important;
  }
  .stat-value{animation:countUp .5s cubic-bezier(.22,1,.36,1) both}

  /* ── Nav ────────────────────────────────────────────────────────── */
  .nav-item{transition:background .12s ease,color .12s ease,border-color .12s ease}
  .nav-item:hover{background:rgba(99,179,237,.07)!important;color:#bae6fd!important}
  .nav-sec-btn{transition:background .15s ease,color .15s ease!important}
  .nav-sec-btn:hover{background:var(--c-sidebar-icon-bg)!important}
  .nav-child-btn{transition:background .12s ease,color .12s ease!important}
  .nav-child-btn:hover{background:var(--c-sidebar-icon-bg)!important;color:var(--c-sidebar-muted)!important}
  .nav-children{animation:expandDown .22s cubic-bezier(.22,1,.36,1) both}

  /* ── Buttons ────────────────────────────────────────────────────── */
  .act-btn{
    transition:filter .15s ease,transform .15s cubic-bezier(.22,1,.36,1),
              box-shadow .15s ease,opacity .15s ease;
    will-change:transform;
  }
  .act-btn:hover{filter:brightness(1.12);transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.28)}
  .act-btn:active{transform:translateY(0) scale(.97);filter:brightness(.96)}
  .signout-btn{transition:background .15s ease,border-color .15s ease!important}
  .signout-btn:hover{background:rgba(248,113,113,.12)!important;border-color:rgba(248,113,113,.28)!important}

  /* ── Table rows ─────────────────────────────────────────────────── */
  .tr-row{transition:background .12s ease}
  .tr-row:hover{background:rgba(59,130,246,.06)!important}

  /* ── Inputs ─────────────────────────────────────────────────────── */
  .ifield{transition:border-color .18s ease,box-shadow .18s ease}
  .ifield:focus{
    border-color:#3b82f6!important;
    box-shadow:0 0 0 3px rgba(59,130,246,.18)!important;
    outline:none
  }

  /* ── Toggle ─────────────────────────────────────────────────────── */
  .toggle-bg{transition:background .22s ease}
  .toggle-dot{transition:left .22s cubic-bezier(.34,1.56,.64,1)}

  /* ── Progress bar ───────────────────────────────────────────────── */
  .progress-fill{
    transition:width 1.1s cubic-bezier(.22,1,.36,1);
    position:relative;
    overflow:hidden;
  }
  .progress-fill::after{
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.2) 50%,transparent 100%);
    background-size:200% 100%;
    animation:shimmer 2.4s ease-in-out infinite;
  }

  /* ── Skeleton loading ───────────────────────────────────────────── */
  .skeleton{
    background:linear-gradient(
      90deg,
      var(--c-skeleton-a) 25%,
      var(--c-skeleton-b) 50%,
      var(--c-skeleton-a) 75%
    );
    background-size:200% 100%;
    animation:shimmer 1.7s ease-in-out infinite;
    border-radius:6px;
  }

  /* ── Light-theme overrides ──────────────────────────────────────── */
  [data-theme="light"] .glass{
    background:#ffffff;
    border-color:rgba(15,23,42,.08);
    box-shadow:0 1px 3px rgba(15,23,42,.07),0 4px 16px rgba(15,23,42,.06);
  }
  [data-theme="light"] .glass:hover{
    border-color:rgba(59,130,246,.28);
    box-shadow:0 4px 20px rgba(15,23,42,.1),0 1px 4px rgba(15,23,42,.07);
  }
  [data-theme="light"] .nav-item:hover{
    background:rgba(59,130,246,.09)!important;
    color:#1d4ed8!important;
  }
  [data-theme="light"] .nav-child-btn:hover{
    background:rgba(59,130,246,.07)!important;
    color:#1e40af!important;
  }
  [data-theme="light"] .act-btn:hover{
    box-shadow:0 4px 14px rgba(15,23,42,.14)!important;
  }
  [data-theme="light"] .tr-row:hover{
    background:rgba(59,130,246,.05)!important;
  }
  [data-theme="light"] .progress-fill::after{
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%);
  }
  [data-theme="light"] body{
    background:var(--c-bg);
  }

  /* ── Misc utilities ─────────────────────────────────────────────── */
  .notif-dot{animation:pulseDot 2.2s infinite}
  .badge-appear{animation:scaleIn .2s cubic-bezier(.22,1,.36,1) both}
  .modal-enter{animation:scaleIn .24s cubic-bezier(.22,1,.36,1) both}
  .slide-down{animation:slideDown .2s cubic-bezier(.22,1,.36,1) both}
  .search-result:hover{background:rgba(59,130,246,.09)!important}
  .section-btn{transition:color .14s ease}
  .section-btn:hover{color:var(--c-section-hover)!important}
  .float{animation:float 4s ease-in-out infinite}
  .glow-pulse{animation:glowPulse 2.5s ease-in-out infinite}

  /* ── Faculty Marks — premium card & block interactions ─────── */
  .faculty-card{
    transition:transform .32s cubic-bezier(.22,1,.36,1),
               box-shadow .32s ease,
               border-color .32s ease;
    will-change:transform;
  }
  .faculty-card:hover{
    transform:translateY(-5px);
    box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;
  }
  [data-theme="light"] .faculty-card:hover{
    box-shadow:0 20px 60px rgba(15,23,42,.14),0 0 0 1px rgba(59,130,246,.18)!important;
  }
  .score-block{
    transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease;
    cursor:default;
  }
  .score-block:hover{
    transform:translateY(-3px) scale(1.04);
    box-shadow:0 12px 32px rgba(0,0,0,.35);
  }

  /* ── Gradient heading text ──────────────────────────────────── */
  .gradient-title{
    background:linear-gradient(135deg,#f1f5f9 0%,#cbd5e1 55%,#94a3b8 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
  }
  [data-theme="light"] .gradient-title{
    background:linear-gradient(135deg,#0f172a 0%,#1e40af 55%,#2563eb 100%);
    -webkit-background-clip:text;
    background-clip:text;
  }

  /* ── Decorative background orbs ────────────────────────────── */
  @keyframes orbFloat{
    0%,100%{transform:translate(0,0) scale(1)}
    33%{transform:translate(22px,-18px) scale(1.08)}
    66%{transform:translate(-16px,10px) scale(.93)}
  }
  .orb-float{animation:orbFloat 9s ease-in-out infinite}
  .orb-float-alt{animation:orbFloat 12s ease-in-out infinite reverse}

  /* ── Stat number glow ───────────────────────────────────────── */
  @keyframes statEnter{
    from{opacity:0;transform:translateY(14px) scale(.88)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  .stat-enter{animation:statEnter .5s cubic-bezier(.22,1,.36,1) both}

  /* ── Pill badge pop ─────────────────────────────────────────── */
  @keyframes pillPop{
    0%{transform:scale(.75);opacity:0}
    70%{transform:scale(1.08)}
    100%{transform:scale(1);opacity:1}
  }
  .pill-pop{animation:pillPop .4s cubic-bezier(.34,1.56,.64,1) both}

  /* ── Remarks expand ─────────────────────────────────────────── */
  .remarks-expand{animation:expandDown .25s cubic-bezier(.22,1,.36,1) both}
`;

document.head.appendChild(style);
