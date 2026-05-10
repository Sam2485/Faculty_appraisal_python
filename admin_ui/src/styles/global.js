const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  body{background:#080c14;font-family:'Plus Jakarta Sans',sans-serif;color:#f1f5f9}

  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(59,130,246,.22);border-radius:6px;transition:background .2s}
  ::-webkit-scrollbar-thumb:hover{background:rgba(59,130,246,.42)}

  select option{background:#0d1420;color:#f1f5f9}

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

  /* ── Page & layout ─────────────────────────────────────────────── */
  .page-enter{animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both}

  /* ── Glass cards ───────────────────────────────────────────────── */
  .glass{
    background:rgba(255,255,255,.033);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,.07);
    border-radius:14px;
    transition:border-color .25s ease,box-shadow .25s ease;
  }
  .glass:hover{
    border-color:rgba(255,255,255,.12);
    box-shadow:0 12px 40px rgba(0,0,0,.28);
  }
  .card-appear{animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both}

  /* ── Stat cards ─────────────────────────────────────────────────── */
  .stat-card{
    transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,border-color .22s ease;
    will-change:transform;
  }
  .stat-card:hover{
    transform:translateY(-4px);
    box-shadow:0 28px 60px rgba(0,0,0,.55)!important;
    border-color:rgba(255,255,255,.14)!important;
  }
  .stat-value{animation:countUp .5s cubic-bezier(.22,1,.36,1) both}

  /* ── Nav ────────────────────────────────────────────────────────── */
  .nav-item{transition:background .12s ease,color .12s ease,border-color .12s ease}
  .nav-item:hover{background:rgba(99,179,237,.07)!important;color:#bae6fd!important}
  .nav-sec-btn{transition:background .15s ease,color .15s ease!important}
  .nav-sec-btn:hover{background:rgba(255,255,255,.05)!important}
  .nav-child-btn{transition:background .12s ease,color .12s ease!important}
  .nav-child-btn:hover{background:rgba(255,255,255,.05)!important;color:#94a3b8!important}
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
      rgba(255,255,255,.04) 25%,
      rgba(255,255,255,.08) 50%,
      rgba(255,255,255,.04) 75%
    );
    background-size:200% 100%;
    animation:shimmer 1.7s ease-in-out infinite;
    border-radius:6px;
  }

  /* ── Misc utilities ─────────────────────────────────────────────── */
  .notif-dot{animation:pulseDot 2.2s infinite}
  .badge-appear{animation:scaleIn .2s cubic-bezier(.22,1,.36,1) both}
  .modal-enter{animation:scaleIn .24s cubic-bezier(.22,1,.36,1) both}
  .slide-down{animation:slideDown .2s cubic-bezier(.22,1,.36,1) both}
  .search-result:hover{background:rgba(59,130,246,.09)!important}
  .section-btn{transition:color .14s ease}
  .section-btn:hover{color:rgba(255,255,255,.75)!important}
  .float{animation:float 4s ease-in-out infinite}
  .glow-pulse{animation:glowPulse 2.5s ease-in-out infinite}
`;
document.head.appendChild(style);
