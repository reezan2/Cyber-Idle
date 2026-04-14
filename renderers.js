// ================================================================
// renderers.js v13.6 — Orchestration des rendus
// ================================================================
var AppRenderers = {
  navigate: function(pg){
    PG=pg;
    document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('active');});
    var t=document.getElementById('pg-'+pg);if(t)t.classList.add('active');
    document.querySelectorAll('.nb').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-pg')===pg);});
    if(pg==='home'&&G&&G.pendingGO){G.pendingGO=false;showGO();}
    if(pg==='duel'&&DL&&DL.pendingResult){DL.pendingResult=false;showDuelResult(DL.resultWon);}
    AppRenderers.refresh();
  },
  refresh: function(){
    updateTop();
    if(PG==='home') {buildHomeStructure();if(G&&!G.over)updateHomeDynamic();}
    if(PG==='duel') renderDuelSel();
    if(PG==='hero') renderHero();
    if(PG==='upg')  renderUpg();
    if(PG==='missions') renderMissions();
    if(PG==='bout') renderBout();
    if(PG==='inv')  renderInv();
    if(PG==='craft')renderCraft();
    if(PG==='options')renderOptions();
  }
};

function navigate(pg){ return AppRenderers.navigate(pg); }
function refresh(){ return AppRenderers.refresh(); }
