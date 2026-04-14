// ================================================================
// state.js v13.6 — Façade d'état
// ================================================================
var AppState = {
  get meta(){ return META; },
  set meta(v){ META = v; },
  get run(){ return G; },
  set run(v){ G = v; },
  get duel(){ return DL; },
  set duel(v){ DL = v; },
  get page(){ return PG; },
  set page(v){ PG = v; },
  get speed(){ return SPEED; },
  set speed(v){ SPEED = v; },
  get craftTab(){ return CRAFT_TAB; },
  set craftTab(v){ CRAFT_TAB = v; },
  get invFilter(){ return INV_FILTER; },
  set invFilter(v){ INV_FILTER = v; },
  get invSelectionMode(){ return INV_SEL_MODE; },
  set invSelectionMode(v){ INV_SEL_MODE = !!v; },
  get dragUid(){ return DRAG_UID; },
  set dragUid(v){ DRAG_UID = v; },
  get currentRunType(){ return curRunType; },
  set currentRunType(v){ curRunType = v; },
  syncTop: function(){ updateTop(); },
  save: function(){ saveMeta(); },
  recompute: function(){ return recompute(); }
};
