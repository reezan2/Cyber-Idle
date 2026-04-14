// ================================================================
// main.js v13.6 — bootstrap + event binding
// ================================================================
var MAIN_EL=document.getElementById('main');
var TOP_EL=document.getElementById('top');

(function init(){
  AppActions.init();
})();

document.getElementById('btn-rep').addEventListener('click',function(){
  hideGameOver();
  G=null;
  startRun(curRunType||RUN_TYPES[0]);
});

document.getElementById('btn-goH').addEventListener('click',function(){
  hideGameOver();
  G=null;
  curRunType=null;
  SPEED=1;
  buildHomeStructure();
  AppRenderers.navigate('home');
});

document.getElementById('btn-rst').addEventListener('click',function(){
  AppActions.resetAll();
});

document.getElementById('btn-endturn').addEventListener('click', duelEndPlayerTurn);
document.getElementById('btn-duel-quit').addEventListener('click', showDuelSel);
document.getElementById('btn-duel-again').addEventListener('click', function(){ showDuelSel(); renderDuelSel(); });
document.getElementById('btn-reroll').addEventListener('click', rerollBout);

MAIN_EL.addEventListener('click',function(e){
  var actionEl=e.target.closest('[data-action]');
  if(actionEl&&this.contains(actionEl)&&AppActions.handleAction(actionEl.getAttribute('data-action'), actionEl)) return;

  var t=e.target.closest('button');
  if(!t||!this.contains(t)) return;

  var id=t.getAttribute('data-id');
  var uid=t.getAttribute('data-uid');
  var stat=t.getAttribute('data-stat');
  var spell=t.getAttribute('data-spell');
  var sid=t.getAttribute('data-sid');
  var act=t.getAttribute('data-act');

  if(t.classList.contains('btn-upg'))  { buyUpg(id); return; }
  if(t.classList.contains('btn-bout')) { buyBout(id); return; }
  if(t.classList.contains('btn-eq'))   { equipIt(uid); return; }
  if(t.classList.contains('btn-sell')) { sellItem(uid); hideItemDetail(); return; }
  if(t.classList.contains('btn-stat')) { spendSt(stat); return; }
  if(t.classList.contains('btn-spwr')) { upgSpPwr(spell); return; }
  if(t.classList.contains('btn-scd'))  { upgSpCd(spell); return; }
  if(t.classList.contains('btn-cast')) { manualCast(sid); return; }
  if(t.classList.contains('btn-auto')) { toggleAutoSp(sid); if(PG==='home') updateHomeDynamic(); return; }
  if(t.classList.contains('btn-dact')) { duelPlayerAction(act); return; }
});

MAIN_EL.addEventListener('change',function(e){
  var changeEl=e.target.closest('[data-change]');
  if(changeEl&&this.contains(changeEl)) AppActions.handleChange(changeEl.getAttribute('data-change'), changeEl);
});

MAIN_EL.addEventListener('dragstart',function(e){
  var dragEl=e.target.closest('[data-drag-uid]');
  if(!dragEl||!this.contains(dragEl)||INV_SEL_MODE)return;
  dragStart(e,dragEl.getAttribute('data-drag-uid'));
});

MAIN_EL.addEventListener('dragover',function(e){
  var dropEl=e.target.closest('[data-drop-slot],[data-drop-uid]');
  if(dropEl&&this.contains(dropEl)) allowDrop(e);
});

MAIN_EL.addEventListener('dragleave',function(e){
  var slotEl=e.target.closest('[data-drop-slot]');
  if(slotEl&&this.contains(slotEl)) slotEl.classList.remove('drop-hover');
});

MAIN_EL.addEventListener('drop',function(e){
  var slotEl=e.target.closest('[data-drop-slot]');
  var cellEl=e.target.closest('[data-drop-uid]');
  if(slotEl&&this.contains(slotEl)){dropIntoSlot(e,slotEl.getAttribute('data-drop-slot'));return;}
  if(cellEl&&this.contains(cellEl)){dropCell(e,cellEl.getAttribute('data-drop-uid'));}
});

TOP_EL.addEventListener('click',function(e){
  var actionEl=e.target.closest('[data-action]');
  if(actionEl&&this.contains(actionEl)) AppActions.handleAction(actionEl.getAttribute('data-action'), actionEl);
});

document.body.addEventListener('click',function(e){
  var actionEl=e.target.closest('[data-action]');
  if(actionEl&&!MAIN_EL.contains(actionEl)&&!TOP_EL.contains(actionEl)) {
    AppActions.handleAction(actionEl.getAttribute('data-action'), actionEl);
  }
});

MAIN_EL.addEventListener('dragend',function(){
  DRAG_UID=null;
  document.querySelectorAll('.d3-slot.drop-hover').forEach(function(el){el.classList.remove('drop-hover');});
  document.querySelectorAll('.inv-cell.drag-src').forEach(function(el){el.classList.remove('drag-src');});
});
