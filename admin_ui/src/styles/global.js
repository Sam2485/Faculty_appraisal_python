const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  body{background:#080c14;font-family:'Plus Jakarta Sans',sans-serif;color:#f1f5f9}

  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(99,179,237,.28);border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(99,179,237,.5)}

  select option{background:#0d1420;color:#f1f5f9}

  @keyframes fadeUp{
    from{opacity:0;transform:translateY(18px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes fadeIn{
    from{opacity:0}
    to{opacity:1}
  }
  @keyframes slideInLeft{
    from{opacity:0;transform:translateX(-10px)}
    to{opacity:1;transform:translateX(0)}
  }
  @keyframes expandDown{
    from{opacity:0;transform:scaleY(0);transform-origin:top}
    to{opacity:1;transform:scaleY(1);transform-origin:top}
  }
  @keyframes pulseDot{
    0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,.55)}
    50%{box-shadow:0 0 0 5px rgba(248,113,113,0)}
  }
  @keyframes shimmer{
    0%{background-position:-200% 0}
    100%{background-position:200% 0}
  }

  .page-enter{animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both}
  .nav-section-enter{animation:slideInLeft .2s ease both}
  .nav-children{animation:expandDown .18s cubic-bezier(.22,1,.36,1) both}

  .stat-card{transition:transform .2s ease,box-shadow .2s ease}
  .stat-card:hover{transform:translateY(-3px);box-shadow:0 20px 48px rgba(0,0,0,.5)!important}

  .nav-item{transition:background .12s ease,color .12s ease,border-color .12s ease}
  .nav-item:hover{background:rgba(99,179,237,.07)!important;color:#bae6fd!important}

  .act-btn{transition:filter .15s ease,transform .15s ease,opacity .15s ease}
  .act-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
  .act-btn:active{transform:translateY(0);filter:brightness(.97)}

  .tr-row{transition:background .1s ease}
  .tr-row:hover{background:rgba(59,130,246,.055)!important}

  .glass{
    background:rgba(255,255,255,.03);
    backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,.07);
    border-radius:14px
  }

  .ifield{transition:border-color .15s,box-shadow .15s}
  .ifield:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,.15)!important;outline:none}

  .toggle-bg{transition:background .22s ease}
  .toggle-dot{transition:left .22s cubic-bezier(.34,1.56,.64,1)}

  .notif-dot{animation:pulseDot 2s infinite}

  .search-result:hover{background:rgba(59,130,246,.09)!important}

  .section-btn{transition:color .14s ease}
  .section-btn:hover{color:rgba(255,255,255,.75)!important}

  .progress-fill{transition:width 1s cubic-bezier(.22,1,.36,1)}

  .card-appear{animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both}
`;
document.head.appendChild(style);
