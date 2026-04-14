// ================================================================
// actions.js v13.6 — Actions UI / contrôleurs
// ================================================================
var AppActions = {
  init: function(){
    recompute();
    updateTop();
    document.querySelectorAll('.nb').forEach(function(b){
      b.addEventListener('click',function(){ AppRenderers.navigate(b.getAttribute('data-pg')); });
    });
    if(!META.heroId) showSel();
    else AppRenderers.navigate('hero');
    setInterval(saveMeta, 30000);
    window.addEventListener('beforeunload', saveMeta);
    setInterval(function(){
      if(!G||G.over)return;
      if(PG==='upg') renderUpg();
      if(PG==='bout') renderBout();
      if(PG==='craft') renderCraft();
      if(PG==='missions') renderMissions();
    }, 3000);
    setInterval(function(){
      if(G&&!G.over&&PG==='home') updateHomeDynamic();
      if(PG==='missions') renderMissions();
      updateTop();
    }, CFG.TICK_MS*2);
  },
  handleAction: function(action, el){
    switch(action){
      case 'show-tutorial': showTutorial(); return true;
      case 'hide-tutorial': hideTutorial(); return true;
      case 'start-run': startRun(RUN_TYPES[parseInt(el.getAttribute('data-run-index'),10)]); return true;
      case 'set-speed': setSpeed(parseInt(el.getAttribute('data-speed'),10)); return true;
      case 'start-duel': startDuel(OPPONENTS[parseInt(el.getAttribute('data-opp-index'),10)]); return true;
      case 'reset-skills': resetSkillPts(); return true;
      case 'reset-spells': resetSpellPts(); return true;
      case 'toggle-spell': onToggleSp(el.getAttribute('data-spell-id')); return true;
      case 'set-bout-filter': BOUT_FILTER=el.getAttribute('data-filter'); renderBout(); return true;
      case 'set-inv-filter': INV_FILTER=el.getAttribute('data-filter'); renderInv(); return true;
      case 'toggle-sel-mode': toggleSelMode(); return true;
      case 'select-rarity': selectRarInv(el.getAttribute('data-rarity')); return true;
      case 'clear-inv-selection': clearInvSel(); return true;
      case 'toggle-inv-sel': toggleInvSel(el.getAttribute('data-uid')); return true;
      case 'open-item': openItemDetail(el.getAttribute('data-uid')); return true;
      case 'hide-item-detail': hideItemDetail(); return true;
      case 'unequip-detail': unequipDetail(); return true;
      case 'clear-enhance-item': CRAFT.enhItem=null; CRAFT.enhRels=[]; renderCraft(); return true;
      case 'open-popup': openPopup(el.getAttribute('data-popup-type')); return true;
      case 'close-popup': closePopup(); return true;
      case 'toggle-craft-relic': toggleCraftRelic(el.getAttribute('data-uid')); return true;
      case 'remove-craft-relic': removeCraftRelic(el.getAttribute('data-uid')); return true;
      case 'do-craft': doCraft(el.getAttribute('data-recipe-id')); return true;
      case 'select-popup-item': selectPopupItem(el.getAttribute('data-uid')); return true;
      case 'choose-hero': chooseHero(el.getAttribute('data-hero-id')); return true;
      case 'set-craft-tab': CRAFT_TAB=el.getAttribute('data-tab'); renderCraft(); return true;
      case 'do-enhance': doEnhance(); return true;
      case 'sell-selected': sellSelected(); return true;
      case 'open-options': AppRenderers.navigate('options'); return true;
      case 'restart-missions': restartMissions(); if(PG==='missions') renderMissions(); return true;
      case 'claim-mission': claimMission(el.getAttribute('data-mission-id')); if(PG==='missions') renderMissions(); updateTop(); return true;
    }
    return false;
  },
  handleChange: function(action, el){
    switch(action){
      case 'rename-hero':
        META.hero.name=el.value.trim()||null;
        saveMeta();
        if(PG==='inv') renderInv();
        if(PG==='options') renderOptions();
        return true;
      case 'option-music':
        META.options.music=parseInt(el.value,10)||0;
        saveMeta();
        return true;
    }
    return false;
  },
  resetAll: function(){
    if(!confirm('Réinitialiser toute la progression ? Irréversible.')) return;
    clearInterval(TK);
    TK=null;
    G=null;
    curRunType=null;
    DL=null;
    SPEED=1;
    META=mkMeta();
    saveMeta();
    hideGameOver();
    showSel();
    updateTop();
  }
};

function handleAction(action, el){ return AppActions.handleAction(action, el); }
function handleChange(action, el){ return AppActions.handleChange(action, el); }
