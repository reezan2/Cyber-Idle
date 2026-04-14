// ================================================================
// ui.js v13.2 — Rendu DOM
// ================================================================
var PG = 'home';
var INV_FILTER = 'all';
var INV_SEL_MODE = false;   // mode sélection inventaire
var INV_SEL = {};           // uid → true
var DRAG_UID = null;
var DETAIL_UID = null;
var CRAFT_TAB = 'enhance';
var POPUP = { type: null, cb: null };

var ITEM_ICON_BY_KIND = {arme:'⚔️',skin:'👕',implant:'💿',chaussures:'👟',relique:'⚗️',piece:'🔩'};
var HERO_FALLBACK_ICON = {berserker:'⚔️',warden:'🛡️'};

function escapeHtml(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function getItemIcon(it){return(it&&it.icon)||ITEM_ICON_BY_KIND[(it&&(it.sl||it.type))]||'📦';}
function getHeroFallbackIcon(heroId){return HERO_FALLBACK_ICON[heroId]||'🦸';}
function setText(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
function setBar(id,v,m){var e=document.getElementById(id);if(e)e.style.width=pct(v,m)+'%';}
function setDuelView(mode){
  var sel=document.getElementById('duel-sel'),fight=document.getElementById('duel-fight'),res=document.getElementById('duel-result');
  if(sel)sel.style.display=mode==='selection'?'':'none';
  if(fight)fight.style.display=mode==='fight'?'flex':'none';
  if(res)res.style.display=mode==='result'?'flex':'none';
}
function hideGameOver(){var el=document.getElementById('ov-go');if(el)el.classList.add('hidden');updateRunNotif();}
function showTutorial(){var el=document.getElementById('ov-tuto');if(el)el.classList.remove('hidden');updateRunNotif();}
function hideTutorial(){var el=document.getElementById('ov-tuto');if(el)el.classList.add('hidden');updateRunNotif();}
function setCraftLog(msg){var el=document.getElementById('ce-log');if(el)el.textContent=msg||'';}


// ── Sélection inventaire ──────────────────────────────────────────
function toggleSelMode(){
  INV_SEL_MODE=!INV_SEL_MODE; INV_SEL={};
  renderInv();
}
function toggleInvSel(uid){
  if(INV_SEL[uid])delete INV_SEL[uid]; else INV_SEL[uid]=true;
  var cell=document.querySelector('.inv-cell[data-uid="'+uid+'"]');
  if(cell){
    cell.classList.toggle('selected',!!INV_SEL[uid]);
    var chk=cell.querySelector('.sel-check');
    if(chk)chk.textContent=INV_SEL[uid]?'✓':'';
  }
  renderInvSelBar();
}
function selectRarInv(rar){
  META.inv.forEach(function(it){if(it.rar===rar&&!it.perm&&!isEquipped(it.uid))INV_SEL[it.uid]=true;});
  renderInv();
}
function clearInvSel(){INV_SEL={};renderInv();}
function sellSelected(){
  var uids=Object.keys(INV_SEL);var total=0;
  uids.forEach(function(uid){var it=byUid(uid);if(!it||it.perm||isEquipped(uid))return;var p=SELL[it.rar]||30;if(it.relicCount)p=Math.floor(p*(1+it.relicCount*0.2));total+=p;META.cr+=p;});
  META.inv=META.inv.filter(function(x){return!INV_SEL[x.uid]||x.perm||isEquipped(x.uid);});
  INV_SEL={};
  recompute();updateTop();renderInv();saveMeta();
}
function renderInvSelBar(){
  var bar=document.getElementById('inv-sel-bar');if(!bar)return;
  var count=Object.keys(INV_SEL).length;
  if(!count){bar.classList.add('hidden');return;}
  bar.classList.remove('hidden');
  var total=0;
  Object.keys(INV_SEL).forEach(function(uid){var it=byUid(uid);if(!it)return;var p=SELL[it.rar]||30;if(it.relicCount)p=Math.floor(p*(1+it.relicCount*0.2));total+=p;});
  bar.querySelector('#sel-count').textContent=count+' item'+(count>1?'s':'');
  bar.querySelector('#sel-total').textContent=fmt(total)+'₵';
}
// ── Reset comp / sorts ────────────────────────────────────────────
function resetSkillPts(){
  var h=META.hero,total=0;
  SDEF.forEach(function(sd){total+=h.st[sd.id]||0;h.st[sd.id]=0;});
  h.skPts+=total;recompute();renderHero();saveMeta();
}
function resetSpellPts(){
  var h=META.hero,total=0,sp;
  for(sp in h.spLvPwr){total+=h.spLvPwr[sp]||0;h.spLvPwr[sp]=0;}
  for(sp in h.spLvCd) {total+=h.spLvCd[sp] ||0;h.spLvCd[sp]=0;}
  h.spPts+=total;renderHero();saveMeta();
}

// ── SPELL CONFIG ─────────────────────────────────────────────────
// bg: gradient de l'icône · ico: emoji/picto · pour img: assets/spells/{id}.png
var SP_CFG = {
  adren:{bg:'linear-gradient(135deg,#7c1d00,#ff4500)',ico:'⚡'},
  rage: {bg:'linear-gradient(135deg,#7f0000,#dc2626)',ico:'🔥'},
  lame: {bg:'linear-gradient(135deg,#003380,#0088ff)',ico:'⚔️'},
  nstim:{bg:'linear-gradient(135deg,#004020,#00cc55)',ico:'💉'},
  ovchg:{bg:'linear-gradient(135deg,#5a3a00,#f59e0b)',ico:'⚡'},
  chain:{bg:'linear-gradient(135deg,#003344,#00d4ff)',ico:'⛓️'},
  sacri:{bg:'linear-gradient(135deg,#440000,#cc0022)',ico:'💀'},
  saign:{bg:'linear-gradient(135deg,#550010,#ff0030)',ico:'🩸'},
  apoc: {bg:'linear-gradient(135deg,#222233,#778899)',ico:'💥'},
  omega:{bg:'linear-gradient(135deg,#3a0800,#ff4400)',ico:'Ω'},
  armv: {bg:'linear-gradient(135deg,#001a44,#2255cc)',ico:'🛡️'},
  fort: {bg:'linear-gradient(135deg,#003322,#00aa55)',ico:'🏰'},
  nano: {bg:'linear-gradient(135deg,#001844,#004499)',ico:'🔬'},
  ishll:{bg:'linear-gradient(135deg,#1a2233,#445566)',ico:'⬡'},
  repdr:{bg:'linear-gradient(135deg,#002233,#0077aa)',ico:'🚁'},
  barr: {bg:'linear-gradient(135deg,#001133,#1133aa)',ico:'▣'},
  reflt:{bg:'linear-gradient(135deg,#220055,#7733dd)',ico:'🔄'},
  fortm:{bg:'linear-gradient(135deg,#112211,#335533)',ico:'🔒'},
  bunk: {bg:'linear-gradient(135deg,#1a0044,#5500bb)',ico:'◉'},
  titan:{bg:'linear-gradient(135deg,#220055,#6600ff)',ico:'👊'},
};

function spIco(id,sz){
  var c=SP_CFG[id]||{bg:'#333',ico:'?'};
  sz=sz||36;
  var r=Math.round(sz*0.22);
  // Container position:relative · img absolute → emoji stays on top (z-index:1, relative)
  return '<div class="sp-ico-wrap" style="width:'+sz+'px;height:'+sz+'px;border-radius:'+r+'px;background:'+c.bg+'">'
    +'<img src="assets/spells/'+id+'.png" onerror="this.style.display=\'none\'" alt=""/>'
    +'<span style="font-size:'+Math.round(sz*0.52)+'px">'+c.ico+'</span>'
    +'</div>';
}

function itemIco(it,sz){
  sz=sz||36;
  var ico=getItemIcon(it);
  var bg='linear-gradient(135deg,#111827,#1c2438)';
  // Image asset si disponible
  var src=it.sl?'assets/items/'+it.sl+'/'+it.rar+'.png':'assets/mats/'+it.type+'/'+it.rar+'.png';
  return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:'+Math.round(sz*0.22)+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;flex-shrink:0">'
    +'<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;position:absolute;inset:0" onerror="this.style.display=\'none\'" alt=""/>'
    +'<span style="font-size:'+Math.round(sz*0.5)+'px;line-height:1;position:relative">'+ico+'</span>'
    +'</div>';
}

function heroImg(hid,w,h){
  var hero=getH(hid||'berserker');
  var fallback=getHeroFallbackIcon(hid);
  // img absolute fills container; span hidden by default, shown via onerror
  return '<div class="hero-img-wrap" style="width:'+w+'px;height:'+h+'px;border-radius:8px;background:linear-gradient(180deg,#1c2438,#0c1020)">'
    +'<img src="'+hero.portrait+'" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'" alt=""/>'
    +'<span style="font-size:'+Math.round(w*0.5)+'px;display:none">'+fallback+'</span>'
    +'</div>';
}

function enemyImg(portrait,sz,fallback){
  sz=sz||56;
  return '<div style="width:'+sz+'px;height:'+Math.round(sz*1.2)+'px;border-radius:8px;overflow:hidden;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:'+Math.round(sz*0.6)+'px;position:relative">'
    +'<img src="'+portrait+'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\'" alt=""/>'
    +(fallback||'👾')
    +'</div>';
}

// ── TOP BAR ──────────────────────────────────────────────────────
function hasVisiblePopup(){
  var ids=['ov-sel','ov-go','ov-tuto','craft-popup','item-detail'];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(el && !el.classList.contains('hidden')) return true;
  }
  return !!(G&&G.pendingGO);
}
function updateRunNotif(){
  var dot=document.getElementById('run-notif-dot');
  if(!dot)return;
  var show=hasVisiblePopup() && PG!=='home';
  dot.classList.toggle('hidden', !show);
}
function updateTop(){
  var rc=document.getElementById('rc');
  var rg=document.getElementById('rg');
  if(rc)rc.innerHTML='<span>₵</span><strong>'+fmt(META.cr)+'</strong>';
  if(rg)rg.innerHTML='<span>💎</span><strong>'+META.gems+'</strong>';
  updateRunNotif();
}

// ── NAVIGATION ───────────────────────────────────────────────────
function navigate(pg){
  PG=pg;
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('active');});
  var t=document.getElementById('pg-'+pg);if(t)t.classList.add('active');
  document.querySelectorAll('.nb').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-pg')===pg);});
  if(pg==='home'&&G&&G.pendingGO){G.pendingGO=false;showGO();}
  if(pg==='duel'&&DL&&DL.pendingResult){DL.pendingResult=false;showDuelResult(DL.resultWon);}
  refresh();
  updateRunNotif();
}

function refresh(){
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

// ── HOME ─────────────────────────────────────────────────────────
function buildHomeStructure(){
  var root=document.getElementById('home-root');if(!root)return;
  if(!G||G.over){
    G=null;curRunType=null;SPEED=1;
    var h='<div class="run-page"><div class="sec-hdr" style="padding:0 0 10px;border:none">CHOISIR UN RUN</div>';
    RUN_TYPES.forEach(function(rr,i){
      var gc={e:'#00e87c',m:'#00d4ff',h:'#ff3355'}[rr.diff];
      var dlbl={e:'FACILE',m:'NORMAL',h:'HARDCORE'}[rr.diff];
      h+='<div class="run-card" data-action="start-run" data-run-index="'+i+'" style="border-left:3px solid '+gc+'">'
        +'<div class="run-card-bg" style="background:url('+rr.bg+') center/cover,linear-gradient(135deg,var(--bg2),var(--bg3))"></div>'
        +'<div class="run-card-veil"></div>'
        +'<div class="run-card-body">'
        +'<div class="run-card-name" style="color:'+gc+'">'+rr.name+'</div>'
        +'<div class="run-card-desc">'+rr.desc+'</div>'
        +'<div class="run-card-tags">'+rr.tags+'</div>'
        +'</div>'
        +'<div class="run-card-badge" style="background:'+gc+'22;color:'+gc+';border:1px solid '+gc+'44">'+dlbl+'</div>'
        +'</div>';
    });
    h+='</div>';
    root.innerHTML=h;return;
  }
  // Active run
  var hero=getH(META.heroId),spH='';
  hero.spells.forEach(function(sp){
    if(!isActive(sp.id)&&!sp.passive)return;
    var unl=META.hero.lv>=sp.ulv;
    spH+='<div class="sp-mini'+(sp.passive?' passive':'')+(unl?'':' locked')+'" title="'+sp.name+'">'+spIco(sp.id,38);
    if(sp.passive)     spH+='<span class="sp-cd-txt" style="color:var(--green)">PASSIF</span>';
    else if(!unl)      spH+='<span class="sp-cd-txt" style="color:var(--text4)">Nv.'+sp.ulv+'</span>';
    else spH+='<span class="sp-cd-txt" id="sp-tm-'+sp.id+'">—</span>'
      +'<button class="sp-cast btn-cast" id="sp-cast-'+sp.id+'" data-sid="'+sp.id+'">▶</button>'
      +'<button class="sp-auto btn-auto'+(G&&G.autoSp[sp.id]?' on':'')+'" id="sp-auto-'+sp.id+'" data-sid="'+sp.id+'">AUTO</button>';
    spH+='</div>';
  });
  var sb='<div class="spd-row"><span class="spd-label">VITESSE</span>';
  [1,2,5,10].forEach(function(sv){sb+='<button class="spd-btn'+(SPEED===sv?' active':'')+'" data-action="set-speed" data-speed="'+sv+'" data-spd="'+sv+'">×'+sv+'</button>';});
  sb+='</div>';
  var rt=curRunType;
  root.innerHTML='<div class="run-active-wrap">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
    +'<span style="font-size:.72rem;color:var(--text4)">'+((rt&&rt.name)||'RUN')+'</span>'+sb+'</div>'
    +'<div class="combat-grid">'
    +'<div class="cpanel"><div class="cpanel-lbl">JOUEUR</div><div class="cpanel-name" id="d-pname"></div>'
    +'<div class="hp-line"><span id="d-php">PV —</span></div><div class="bar-wrap"><div class="bar-fill bar-hp" id="d-bar-hp" style="width:100%"></div></div>'
    +'<div class="hp-line"><span id="d-psh">Boucl —</span></div><div class="bar-wrap"><div class="bar-fill bar-sh" id="d-bar-sh" style="width:100%"></div></div>'
    +'<div class="stat-mini"><span>DPS <strong id="d-dps">—</strong></span><span>Rgn <strong id="d-rgn">—</strong></span></div>'
    +'<div id="d-gear" style="font-size:.66rem;margin-top:4px"></div></div>'
    +'<div class="cpanel"><div class="cpanel-lbl">ENNEMI</div>'
    +'<div class="enemy-row"><div class="enemy-img-box" id="d-enemy-img"></div>'
    +'<div style="flex:1"><div class="cpanel-name" id="d-ename">—</div>'
    +'<div class="hp-line"><span id="d-ehp"></span></div><div class="bar-wrap"><div class="bar-fill bar-en" id="d-bar-en" style="width:0"></div></div>'
    +'<div id="d-edps" style="font-size:.68rem;color:var(--text3);margin-top:3px"></div></div></div></div>'
    +'</div>'
    +'<div class="cpanel"><div class="cpanel-lbl">SORTS ACTIFS</div><div class="spells-strip" id="d-spells">'+spH+'</div></div>'
    +'<div style="font-size:.74rem;color:var(--text3)" id="d-sit"></div>'
    +'<div class="run-log" id="clog"></div>'
    +'</div>';
  updateHomeDynamic();
}

function setSpeed(s){
  SPEED=s;
  document.querySelectorAll('.spd-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.getAttribute('data-spd'))===s);});
}

function updateHomeDynamic(){
  if(!G)return;
  var h=META.hero,fx=G.fx;
  setText('d-pname',META.hero.name||getH(META.heroId).name);
  setText('d-php','PV: '+Math.floor(G.pHp)+' / '+P.mHp);setBar('d-bar-hp',G.pHp,P.mHp);
  setText('d-psh','Boucl: '+Math.floor(G.pSh)+' / '+P.mSh);setBar('d-bar-sh',G.pSh,P.mSh);
  setText('d-dps',P.dps+(fx.dM!==1?' ×'+fx.dM.toFixed(1):''));setText('d-rgn',P.rgn+'/s');
  var gear='<div class="gear-strip">';
  ['arme','skin','implant1','implant2','chaussures'].forEach(function(sl){var u=META.eq[sl];if(!u)return;var it=byUid(u);if(!it)return;var ico=it.icon||{arme:'⚔️',skin:'👕',implant:'💿',chaussures:'👟'}[it.sl]||'📦';gear+='<span class="gear-ico '+RAR[it.rar].cls+'" title="'+it.nm+'">'+ico+'</span>';});
  gear+='</div>';
  var gEl=document.getElementById('d-gear');if(gEl)gEl.innerHTML=gear;
  var fxS='';if(fx.dM!==1&&fx.dM_t>0)fxS+=' ⚡×'+fx.dM.toFixed(1);if(fx.inv)fxS+=' INVULN';if(fx.dot_t>0)fxS+=' DOT';
  setText('d-sit','Vague '+G.wave+' — '+(G.eIdx+1)+'/'+CFG.E_WAVE+' | Nv.'+h.lv+(fxS?' ·'+fxS:''));
  if(G.enemy){
    var e=G.enemy;
    var imgEl=document.getElementById('d-enemy-img');
    if(imgEl)imgEl.innerHTML=enemyImg(e.portrait,50,{1:'🤖',2:'👾',3:'💀'}[e.tier]);
    setText('d-ename',e.nm);setText('d-ehp',fmt(e.hp)+' / '+fmt(e.mHp));setBar('d-bar-en',e.hp,e.mHp);
    setText('d-edps','DPS '+e.dps.toFixed(1)+' · '+e.rwd+'₵');
  }else{var ig=document.getElementById('d-enemy-img');if(ig)ig.innerHTML='';setText('d-ename','Prochain…');setText('d-ehp','');setBar('d-bar-en',0,1);}
  var hero=getH(META.heroId);
  hero.spells.forEach(function(sp){
    if(sp.passive||META.hero.lv<sp.ulv||!isActive(sp.id))return;
    var tm=G.spTm[sp.id]||0,rdy=tm<=0,over=G.over;
    var tmEl=document.getElementById('sp-tm-'+sp.id);var castEl=document.getElementById('sp-cast-'+sp.id);var autoEl=document.getElementById('sp-auto-'+sp.id);
    if(tmEl){tmEl.textContent=rdy?'PRÊT':tm.toFixed(1)+'s';tmEl.className='sp-cd-txt'+(rdy?' rdy':'');}
    if(castEl)castEl.disabled=(!rdy||over);
    if(autoEl){var on=G.autoSp[sp.id]||false;autoEl.textContent='AUTO:'+(on?'ON':'OFF');autoEl.classList.toggle('on',on);autoEl.disabled=over;}
  });
  var logEl=document.getElementById('clog');if(!logEl)return;
  logEl.innerHTML=G.log.slice(0,14).map(function(l){return'<div class="log-line">'+l.m+'</div>';}).join('');
}

// ── DUEL ─────────────────────────────────────────────────────────
function renderDuelSel(){
  var c=document.getElementById('opp-cards');if(!c)return;
  var dL={e:'FACILE',m:'NORMAL',h:'DIFFICILE'};
  var gc={e:'var(--green)',m:'var(--cyan)',h:'var(--red)'};
  var emo={rookie:'🤖',vet:'👾',champ:'💀'};
  c.innerHTML=OPPONENTS.map(function(o,i){
    var sc=oppScaled(o),wins=META.duelWins[o.id]||0;
    return '<div class="opp-card" data-action="start-duel" data-opp-index="'+i+'">'
      +'<div class="opp-art">'+emo[o.id]
      +'<img src="'+o.portrait+'" alt="" onerror="this.style.display=\'none\'"/></div>'
      +'<div class="opp-body">'
      +'<div class="opp-diff" style="color:'+gc[o.diff]+'">'+dL[o.diff]+(wins>0?' · Revanche #'+wins+' (×'+Math.pow(1.15,wins).toFixed(2)+')':'')+'</div>'
      +'<div class="opp-name">'+o.name+'</div><div class="opp-arch">'+o.archetype+'</div>'
      +'<div class="opp-desc">'+o.desc+'</div>'
      +'<div class="opp-stats">PV:'+sc.hp+' · Boucl:'+sc.sh+' · ATQ:'+sc.atk+'</div>'
      +'<div class="opp-stats" style="margin-top:3px">💎 '+o.rewardGems+' · '+o.rewardRarMin+'→'+o.rewardRarMax+'</div>'
      +'<div class="opp-cta" style="margin-top:6px">DÉFIER →</div>'
      +'</div></div>';
  }).join('');
}

function renderDuelFight(){
  if(!DL)return;
  var d=DL,opp=d.opp;
  var badge=document.getElementById('df-turn-badge');
  badge.textContent=d.phase==='player'?'▶ VOTRE TOUR':'⏳ ENNEMI';
  badge.className='turn-badge '+(d.phase==='player'?'turn-p':'turn-e');
  setText('df-turn-n','Tour '+d.turn);
  document.getElementById('btn-endturn').disabled=(d.phase!=='player');
  setText('dop-name',opp.name);
  setText('dop-hp',Math.floor(d.oppHp)+' / '+d.oppMHp);setBar('dop-bar-hp',d.oppHp,d.oppMHp);
  setText('dop-sh','Boucl: '+Math.floor(d.oppSh)+' / '+d.oppMSh);setBar('dop-bar-sh',d.oppSh,d.oppMSh);
  document.getElementById('dop-stats').textContent='ATQ: '+Math.floor(duelAtkVal(d.eEff,d.oppAtk));
  setText('dop-eff',d.eEff.map(function(e){return'['+e.label+']';}).join(' '));
  setText('dme-name',(META.hero.name||getH(META.heroId).name)+' Nv.'+META.hero.lv);
  setText('dme-hp',Math.floor(d.pHp)+' / '+d.pMHp);setBar('dme-bar-hp',d.pHp,d.pMHp);
  setText('dme-sh','Boucl: '+Math.floor(d.pSh)+' / '+d.pMSh);setBar('dme-bar-sh',d.pSh,d.pMSh);
  document.getElementById('dme-stats').textContent='ATQ: '+Math.floor(duelAtkVal(d.pEff,d.pAtk))+' · Crit: '+Math.round(d.pCrit*100)+'%';
  setText('dme-eff',d.pEff.map(function(e){return'['+e.label+']';}).join(' '));
  var pips='';for(var ei=0;ei<CFG.DUEL_ENERGY;ei++)pips+='<div class="en-pip'+(ei<d.pEn?' full':'')+'"></div>';
  document.getElementById('energy-pips').innerHTML=pips;setText('energy-txt',d.pEn+'/'+CFG.DUEL_ENERGY+' ⚡');
  var hero=getH(META.heroId),isP=d.phase==='player';
  var eqArme=META.eq['arme']?byUid(META.eq['arme']):null;
  var actH='<button class="da btn-dact" data-act="weapon"'+(isP&&d.pEn>=1?'':' disabled')+'>'
    +'🗡 '+(eqArme?eqArme.nm:'Poing')+' <span class="ec">1⚡</span></button>';
  hero.spells.forEach(function(sp2){
    if(sp2.passive||META.hero.lv<sp2.ulv||!isActive(sp2.id))return;
    var canA=isP&&d.pEn>=sp2.energy,cfg=SP_CFG[sp2.id]||{ico:'?'};
    actH+='<button class="da btn-dact" data-act="'+sp2.id+'"'+(canA?'':' disabled')+'>'+cfg.ico+' '+sp2.name+' <span class="ec">'+sp2.energy+'⚡</span></button>';
  });
  document.getElementById('duel-act-btns').innerHTML=actH;
  var logEl=document.getElementById('duel-log');if(!logEl)return;
  logEl.innerHTML=d.log.slice(0,20).map(function(l){return'<div class="dl-'+l.t+'">'+l.m+'</div>';}).join('');
}

// ── HÉROS ────────────────────────────────────────────────────────
function renderHero(){
  var el=document.getElementById('hr-c');if(!el)return;
  var h=META.hero,hero=getH(META.heroId||'berserker'),bd=computeBreakdown();
  var xpMax=h.lv<CFG.H_MAX_LV?xpReq(h.lv):1;
  el.innerHTML='<div class="hero-page">'
    +renderHeroProfileCard(h,hero,xpMax)
    +renderHeroSkillsSection(h)
    +renderHeroStatsSection(bd)
    +renderHeroSpellsSection(hero,h)
    +'</div>';
  syncHeroNameInput(h,hero);
}

function renderHeroProfileCard(h,hero,xpMax){
  return '<div class="hero-rpg"><div class="hero-rpg-top">'
    +'<div class="hero-portrait">'+heroImg(META.heroId,94,122)+'</div>'
    +'<div class="hero-info">'
    +'<input id="hero-name-inp" class="hero-name-inp" maxlength="20" data-change="rename-hero">'
    +'<div class="hero-arch">'+hero.arch+'</div>'
    +'<div class="hero-lv-row">Niveau <strong>'+h.lv+'</strong><span style="color:var(--text4)">/ '+CFG.H_MAX_LV+'</span></div>'
    +'<div class="bar-wrap" style="height:5px;margin:3px 0"><div class="bar-fill bar-xp" style="width:'+(h.lv<CFG.H_MAX_LV?pct(h.xp,xpMax):100)+'%"></div></div>'
    +'<div style="font-size:.7rem;color:var(--text3)">XP: '+fmt(h.xp)+' / '+(h.lv<CFG.H_MAX_LV?fmt(xpMax):'MAX')+'</div>'
    +renderHeroPointChips(h)
    +'<div style="display:flex;gap:5px;margin-top:5px">'
    +'<button class="btn-reset" data-action="reset-skills" title="Rembourse tous les points de compétence">↺ Comp.</button>'
    +'<button class="btn-reset" data-action="reset-spells" title="Rembourse tous les points de sorts">↺ Sorts</button>'
    +'</div>'
    +'</div></div></div>';
}

function renderHeroPointChips(h){
  return '<div class="pts-chips" style="margin-top:6px">'
    +(h.skPts>0?'<span class="chip chip-sk">'+h.skPts+' comp.</span>':'')
    +(h.spPts>0?'<span class="chip chip-sp">'+h.spPts+' sorts</span>':'')
    +'</div>';
}

function renderHeroSkillsSection(h){
  return '<div class="skills-sect"><div class="sec-hdr" style="padding:0 0 6px;border:none;font-size:.68rem">COMPÉTENCES</div><div class="skills-grid">'
    +SDEF.map(function(sd){return renderHeroSkillCell(sd,h);}).join('')
    +'</div></div>';
}

function renderHeroSkillCell(sd,h){
  var val=h.st[sd.id]||0;
  return '<div class="sk-cell"><span class="sk-name">'+sd.icon+' '+sd.nm+'</span><span class="sk-val">'+val+'</span><button class="sk-btn btn-stat" data-stat="'+sd.id+'"'+(h.skPts>0?'':' disabled')+' title="'+sd.d+'">+</button></div>';
}

function renderHeroStatsSection(bd){
  return '<div class="stats-sect"><div class="sec-hdr" style="padding:0 0 6px;border:none;font-size:.68rem">STATS</div><div class="stat-boxes">'
    +sBox('⚔️','ATQ',P.atk)+sBox('⚡','VitAtq',P.aspd.toFixed(2)+'/s')+sBox('≋','DPS',fmt(P.dps))
    +sBox('♥','PV',fmt(P.mHp))+sBox('◈','Bouclier',fmt(P.mSh))+sBox('⟳','Regen',P.rgn+'/s')
    +sBox('★','Crit',Math.round(P.crit*100)+'%')+sBox('◌','Esquive',Math.round(P.dodge*100)+'%')
    +sBox('🌟','Pros.',P.pros)+sBox('₵','Mult.',P.mult.toFixed(2)+'×')
    +'</div>'
    +renderHeroDetailsTable(bd)
    +'</div>';
}

function renderHeroDetailsTable(bd){
  var rows=''
    +dRow('ATQ',bd.atk)
    +dRow('VitAtq',bd.aspd)
    +dRow('PV',bd.hp)
    +dRow('Bouclier',bd.sh)
    +dRow('Regen',bd.rgn)
    +dRow('Crit',bd.crit,'pct')
    +dRow('Esquive',bd.dodge,'pct')
    +dRow('Prospérité',bd.pros)
    +dRow('Crédits',bd.mult,'pct');
  return '<details class="stats-details"><summary>▸ Détail du calcul</summary>'
    +'<table class="dtbl stats-dtbl stats-dtbl-compact" style="margin-top:7px"><tr><th style="text-align:left;font-size:.66rem;color:var(--text4);padding:3px 5px">Stat</th><th style="font-size:.66rem;color:var(--text4);text-align:right;padding:3px 5px">Base</th><th style="font-size:.66rem;color:var(--green);text-align:right;padding:3px 5px">+Comp</th><th style="font-size:.66rem;color:var(--rar-r);text-align:right;padding:3px 5px">+Équip</th><th style="font-size:.66rem;color:var(--cyan);text-align:right;padding:3px 5px">+Lab</th><th style="font-size:.66rem;color:var(--text);text-align:right;padding:3px 5px">Total</th></tr>'
    +rows
    +'</table></details>';
}

function renderHeroSpellsSection(hero,h){
  return '<div class="hero-rpg" style="margin-top:0"><div class="spells-sect"><div class="sec-hdr" style="padding:12px 12px 6px;border:none;font-size:.68rem">SORTS — '+hero.spells.length+' DISPONIBLES (MAX '+CFG.MAX_ACTIVE_SP+' ACTIFS)</div><div class="spells-2col">'
    +hero.spells.map(function(sp){return renderHeroSpellCard(sp,h);}).join('')
    +'</div></div></div>';
}

function renderHeroSpellCard(sp,h){
  var unl=h.lv>=sp.ulv,lvP=h.spLvPwr[sp.id]||0,lvC=h.spLvCd[sp.id]||0;
  var canP=!sp.passive&&unl&&h.spPts>0&&lvP<CFG.SP_MAX_LV;
  var canC=!sp.passive&&unl&&h.spPts>0&&lvC<CFG.SP_MAX_LV;
  var act=isActive(sp.id);
  var canToggle=!sp.passive&&unl;
  return '<div class="sp-card'+(unl?'':' locked')+(sp.passive?' passive':'')+(act?' active-sp':'')+'">'
    +'<div class="sp-card-top">'
    +'<div class="sp-card-img" style="background:'+(SP_CFG[sp.id]||{bg:'#333'}).bg+'">'+spIco(sp.id,34)+'</div>'
    +'<div style="flex:1"><div class="sp-card-name">'+sp.name+'</div><div class="sp-card-meta">'
    +(sp.passive?'<span style="color:var(--green)">PASSIF</span>'
      :unl?'Nv.P:'+lvP+' CD:'+lvC+' · '+spCd(sp).toFixed(0)+'s · '+sp.energy+'⚡'
      :'<span style="color:var(--text4)">Nv.'+sp.ulv+'</span>')
    +'</div></div>'
    +(canToggle?renderHeroSpellToggle(sp.id,act):'')
    +'</div>'
    +'<div class="sp-card-desc">'+sp.desc+'</div>'
    +(!sp.passive&&unl?'<div class="sp-card-btns"><button class="btn btn-sm btn-spwr" data-spell="'+sp.id+'"'+(canP?'':' disabled')+'>↑ Puiss.</button><button class="btn btn-sm btn-scd" data-spell="'+sp.id+'"'+(canC?'':' disabled')+'>↓ CD</button></div>':'')
    +(!sp.passive&&!unl?'<div style="font-size:.65rem;color:var(--text4)">Débloqué Nv.'+sp.ulv+'</div>':'')
    +'</div>';
}

function renderHeroSpellToggle(spellId,active){
  return '<button data-action="toggle-spell" data-spell-id="'+spellId+'" style="flex-shrink:0;padding:3px 7px;border-radius:6px;border:1px solid '+(active?'rgba(0,212,255,.4)':'var(--border)')+';background:'+(active?'rgba(0,212,255,.08)':'transparent')+';color:'+(active?'var(--cyan)':'var(--text4)')+';font-size:.65rem;cursor:pointer;font-family:var(--font)">'+(active?'★ Actif':'○ Inactif')+'</button>';
}

function syncHeroNameInput(h,hero){
  var nameInput=document.getElementById('hr-c').querySelector('#hero-name-inp');
  if(nameInput)nameInput.value=h.name||hero.name;
}

function sBox(ico,lbl,val){return'<div class="stat-bx"><span class="stat-bx-ico">'+ico+'</span><span class="stat-bx-lbl">'+lbl+'</span><span class="stat-bx-val">'+val+'</span></div>';}
function fmtSigned(v,d){ if(v===undefined||v===null||v===0)return '—'; if(typeof v==='number'&&d!==undefined)return (v>0?'+':'')+v.toFixed(d); return (v>0?'+':'')+v; }
function dRow(lbl,s,mode){ var comp=(s.skills||0)+(s.passive||0),eq=s.equip||0,lab=s.upg||0; return '<tr><td>'+lbl+'</td><td style="text-align:right">'+(mode==='pct'?Math.round(s.base*100)+'%':s.base)+'</td><td style="text-align:right;color:var(--green)">'+(comp?(mode==='pct'?fmtSigned(comp*100):fmtSigned(comp)):'—')+'</td><td style="text-align:right;color:var(--rar-r)">'+(eq?(mode==='pct'?fmtSigned(eq*100):fmtSigned(eq)):'—')+'</td><td style="text-align:right;color:var(--cyan)">'+(lab?(mode==='pct'?fmtSigned(lab*100):fmtSigned(lab)):'—')+'</td><td style="text-align:right;font-weight:700">'+(mode==='pct'?Math.round(s.total*100)+'%':s.total)+'</td></tr>'; }

function getUpgradeCategory(u){
  if(u&&u.cat)return u.cat;
  var stat=u&&u.stat;
  if(stat==='atk'||stat==='crit'||stat==='aspd')return 'attaque';
  if(stat==='hp'||stat==='sh')return 'defense';
  return 'utilitaire';
}

// ── LABS ─────────────────────────────────────────────────────
function renderUpg(){
  var groups=[
    {id:'attaque',lbl:'⚔️ Attaque'},
    {id:'defense',lbl:'🛡️ Défense'},
    {id:'utilitaire',lbl:'🧰 Utilitaire'}
  ];
  var wrap=document.getElementById('upg-grid');
  if(!wrap)return;
  wrap.innerHTML='<div class="lab-groups-stack">'+groups.map(function(g){
    var items=UPGRADES.filter(function(u){ return getUpgradeCategory(u)===g.id; });
    return '<section class="lab-group-block"><div class="lab-group-title">'+g.lbl+' <span style="color:var(--text4);font-size:.62rem">('+items.length+')</span></div><div class="lab-grid">'
      +items.map(function(u){
        var lv=META.upgLv[u.id]||0,c=uCost(u),mx=lv>=u.max,ca=!mx&&META.cr>=c;
        var bonus='';
        if(lv>0){
          if(u.stat==='atk')bonus='+'+Math.floor(PRE.atk*lv*0.01)+' ATQ';
          else if(u.stat==='hp')bonus='+'+Math.floor(PRE.hp*lv*0.01)+' PV';
          else if(u.stat==='sh')bonus='+'+Math.floor(PRE.sh*lv*0.01)+' Boucl.';
          else if(u.stat==='aspd')bonus='+'+parseFloat((PRE.aspd*lv*0.01).toFixed(2))+' VitAtq';
          else if(u.stat==='crit')bonus='+'+Math.round(lv*0.5)+'% Crit';
          else if(u.stat==='pros')bonus='+'+parseFloat((lv*0.5).toFixed(1))+' Pros.';
          else if(u.stat==='mult')bonus='+'+parseFloat((lv*0.5).toFixed(1))+'% crédits';
          else if(u.stat==='spPwr')bonus='+'+Math.round(lv*0.5)+'% sorts';
        }
        return '<div class="lab-bubble"><div class="lab-bubble-ico">'+u.icon+'</div><div class="lab-bubble-name">'+u.name+'</div>'
          +'<div class="lab-bubble-lv">Lv '+lv+'/'+u.max+'</div>'
          +'<div class="lab-bubble-bonus">'+(bonus||u.desc)+'</div>'
          +'<div class="lab-bubble-cost">'+(mx?'MAX':fmt(c)+' ₵')+'</div>'
          +'<button class="btn btn-sm'+(ca?' btn-green':'')+' btn-upg" data-id="'+u.id+'"'+(ca?'':' disabled')+'>'+(mx?'MAX':'+1')+'</button></div>';
      }).join('')+'</div></section>';
  }).join('')+'</div>';
}

function renderMissions(){
  generateMissions(false);
  var wrap=document.getElementById('missions-list'); if(!wrap)return;
  var list=(META.missions&&META.missions.list)||[];
  wrap.innerHTML=list.map(function(m){
    var prog=getMissionProgress(m), done=prog>=m.target, pctv=Math.max(0,Math.min(100,Math.round((prog/m.target)*100)));
    return '<div class="mission-card"><div class="mission-top"><div><div class="mission-name">'+missionLabel(m.type,m.target)+'</div><div class="mission-sub">Progression uniquement après génération de la mission</div></div><div class="mission-reward">'+fmt(m.rewardCr)+'₵ · '+m.rewardGems+'💎</div></div>'
      +'<div class="bar-wrap" style="margin:8px 0 6px"><div class="bar-fill bar-xp" style="width:'+pctv+'%"></div></div>'
      +'<div class="mission-progress">'+prog+' / '+m.target+'</div>'
      +'<div class="mission-actions"><button class="btn btn-sm'+(done&&!m.claimed?' btn-green':'')+'" data-action="claim-mission" data-mission-id="'+m.id+'" '+(done&&!m.claimed?'':'disabled')+'>'+(m.claimed?'Réclamée':(done?'Récupérer':'En cours'))+'</button></div></div>';
  }).join('');
}

function renderOptions(){
  var root=document.getElementById('options-root'); if(!root)return;
  root.innerHTML='<div class="options-grid">'
    +'<div class="option-card"><div class="option-title">Musique</div><input type="range" min="0" max="100" value="'+(META.options.music||60)+'" data-change="option-music"/></div>'
    +'<div class="option-card"><div class="option-title">Graphisme</div><div class="option-row"><button class="btn btn-sm">Bas</button><button class="btn btn-sm btn-green">Normal</button><button class="btn btn-sm">Élevé</button></div></div>'
    +'<div class="option-card"><div class="option-title">FPS</div><div class="option-row"><button class="btn btn-sm">30</button><button class="btn btn-sm btn-green">60</button><button class="btn btn-sm">120</button></div></div>'
    +'<div class="option-card"><div class="option-title">Langue</div><div class="option-row"><button class="btn btn-sm btn-green">FR</button><button class="btn btn-sm">EN</button></div></div>'
    +'<div class="option-card"><div class="option-title">Pseudo</div><input class="hero-name-inp" value="'+escapeHtml(META.hero.name||getH(META.heroId||'berserker').name)+'" data-change="rename-hero"/></div>'
    +'<div class="option-card"><div class="option-title">Compte</div><div class="option-row"><button class="btn btn-sm">Connexion</button><button class="btn btn-sm">Créer</button></div></div>'
    +'</div>';
}

// ── BOUTIQUE ─────────────────────────────────────────────────────
var BOUT_FILTER='all';
function renderBout(){
  var items=getBoutDisplay();
  var types=[{id:'all',lbl:'Tout'},{id:'arme',lbl:'⚔️ Armes'},{id:'skin',lbl:'👕 Skins'},{id:'implant',lbl:'💿 Implants'},{id:'chaussures',lbl:'👟 Chaussures'}];
  document.getElementById('shop-filters').innerHTML=types.map(function(tp){
    return'<button class="flt-btn'+(BOUT_FILTER===tp.id?' active':'')+'" data-action="set-bout-filter" data-filter="'+tp.id+'">'+tp.lbl+'</button>';
  }).join('');
  var grouped={};
  items.forEach(function(b){if(!grouped[b.sl])grouped[b.sl]=[];grouped[b.sl].push(b);});
  var slabs={arme:'⚔️ Armes',skin:'👕 Skins',implant:'💿 Implants',chaussures:'👟 Chaussures'};
  var html='';
  Object.keys(slabs).forEach(function(sl){
    if(BOUT_FILTER!=='all'&&BOUT_FILTER!==sl)return;
    var grp=grouped[sl];if(!grp||!grp.length)return;
    html+='<div class="shop-cat-title">'+slabs[sl]+'</div><div class="shop-grid">';
    grp.slice(0,6).forEach(function(b){
      var r=RAR[b.rar],bought=META.bought.indexOf(b.id)!==-1;
      var okG=b.cost<=0||META.gems>=b.cost,okC=b.costCr<=0||META.cr>=b.costCr,okL=META.hero.lv>=b.lrq;
      var canB=!bought&&okG&&okC&&okL;
      var parts=[];if(b.cost>0)parts.push(b.cost+'💎');if(b.costCr>0)parts.push(fmt(b.costCr)+'₵');
      html+='<div class="shop-card"><div class="shop-card-top">'
        +'<span class="shop-card-ico">'+(b.icon||'📦')+'</span>'
        +'<div><div class="shop-card-name '+r.cls+'">'+b.nm+'</div><div class="shop-card-rar '+r.cls+'">'+r.lbl+' · Nv.'+b.lrq+'</div></div></div>'
        +'<div class="shop-card-stats">'+stStr(b.st)+'</div>'
        +'<div class="shop-card-footer">'
        +(bought?'<span class="shop-bought">✔ Acheté</span>':'<span class="shop-card-cost">'+(parts.join(' + ')||'Gratuit')+'</span>')
        +(!bought?'<button class="btn btn-sm'+(canB?' btn-green':'')+' btn-bout" data-id="'+b.id+'"'+(canB?'':' disabled')+'>'+(canB?'Acheter':'N/A')+'</button>':'')
        +'</div></div>';
    });
    html+='</div>';
  });
  document.getElementById('shop-body').innerHTML=html||'<p style="color:var(--text4);padding:16px">Aucun article.</p>';
}

// ── INVENTAIRE ────────────────────────────────────────────────────
function renderInv(){
  var hero=getH(META.heroId||'berserker'),h=META.hero;
  document.getElementById('d3-equip').innerHTML=renderInventoryEquipLayout(hero,h);
  document.getElementById('sp-slots-row').innerHTML=renderInventoryActiveSpellSlots(hero,h);
  document.getElementById('inv-filters').innerHTML=renderInventoryFilters();
  document.getElementById('sell-all-row').innerHTML=renderInventoryQuickSelection();
  document.getElementById('inv-grid').innerHTML=renderInventoryGrid();
  renderInvSelBar();
  if(!INV_SEL_MODE)hideItemDetail();
}

function renderInventoryEquipLayout(heroData,h){
  var heroName=escapeHtml(h.name||heroData.name);
  return '<div class="d3-col-l">'+renderInventoryEquipSlot('arme','Arme','⚔️')+'</div>'
    +'<div class="d3-center">'
    +'<div class="d3-hero-portrait">'
    +'<img src="'+heroData.portrait+'" onerror="this.style.display=\'none\'" alt=""/>'
    +'<span class="fallback-ico">'+getHeroFallbackIcon(META.heroId)+'</span>'
    +'</div>'
    +'<div class="d3-hero-name">'+heroName+'</div>'
    +'</div>'
    +'<div class="d3-col-r">'+renderInventoryEquipSlot('skin','Skin','👕')+'</div>'
    +'<div class="d3-bottom-row">'
    +renderInventoryEquipSlot('implant1','Impl. 1','💿')
    +renderInventoryEquipSlot('implant2','Impl. 2','💿')
    +renderInventoryEquipSlot('chaussures','Chaus.','👟')
    +'</div>';
}

function renderInventoryEquipSlot(sl,lbl,ico){
  var uid=META.eq[sl],it=uid?byUid(uid):null;
  var rar=it?RAR[it.rar].cls:'';
  var tooltip=it?escapeHtml(it.nm+'\n'+stStr(it.st)):'';
  return '<div class="d3-slot'+(it?' filled':'')+'" title="'+tooltip+'" '
    +(it?'data-action="open-item" data-uid="'+it.uid+'" ':'')
    +'data-drop-slot="'+sl+'">'
    +'<span class="d3-slot-ico '+(it?rar:'')+'">'+(it?getItemIcon(it):ico)+'</span>'
    +'<span class="d3-slot-lbl">'+lbl+'</span>'
    +(it?'<span class="d3-slot-nm '+rar+'">'+it.nm+'</span>':'')
    +'</div>';
}

function renderInventoryActiveSpellSlots(hero,h){
  return hero.spells.filter(function(sp){return!sp.passive;}).map(function(sp){
    var unl=h.lv>=sp.ulv,act=isActive(sp.id),cfg=SP_CFG[sp.id]||{ico:'?'};
    return '<div class="sp-slot-mini'+(act?' active':'')+(unl?'':' locked')+'"'+(unl?' data-action="toggle-spell" data-spell-id="'+sp.id+'"':'')+'>'+cfg.ico+'<span class="sp-slot-mini-cost">'+sp.energy+'⚡</span></div>';
  }).join('');
}

function renderInventoryFilters(){
  var html=[{id:'all',lbl:'Tout'},{id:'equip-arme',lbl:'⚔️'},{id:'equip-skin',lbl:'👕'},{id:'equip-implant',lbl:'💿'},{id:'equip-chaussures',lbl:'👟'},{id:'relique',lbl:'⚗️'},{id:'piece',lbl:'🔩'}].map(function(f){
    return '<button class="flt-btn'+(INV_FILTER===f.id?' active':'')+'" data-action="set-inv-filter" data-filter="'+f.id+'">'+f.lbl+'</button>';
  }).join('');
  return html+'<button class="flt-btn'+(INV_SEL_MODE?' active':'')+'" data-action="toggle-sel-mode" style="margin-left:auto">☑</button>';
}

function renderInventoryQuickSelection(){
  var sarH='';
  if(!INV_SEL_MODE)return sarH;
  sarH='<span style="font-size:.68rem;color:var(--text4);padding:0 4px">Sél.:</span>';
  RAR_K.forEach(function(rk){
    var cnt=META.inv.filter(function(x){return x.rar===rk&&!x.perm&&!isEquipped(x.uid);}).length;
    if(!cnt)return;
    sarH+='<span class="rar-dot '+RAR[rk].cls+'" data-action="select-rarity" data-rarity="'+rk+'" title="Tout '+RAR[rk].lbl+' ('+cnt+')">'+cnt+'</span>';
  });
  sarH+='<span class="rar-dot" data-action="clear-inv-selection" style="color:var(--text4)" title="Désélectionner tout">✕</span>';
  return sarH;
}

function getFilteredInventoryStacks(){
  return stackItems().filter(function(s){
    if(INV_FILTER==='all')return true;
    if(INV_FILTER.indexOf('equip-')===0)return s.item.type==='equip'&&s.item.sl===INV_FILTER.slice(6);
    return s.item.type===INV_FILTER;
  });
}

function renderInventoryGrid(){
  var filtered=getFilteredInventoryStacks();
  if(!filtered.length)return '<p style="color:var(--text4);padding:14px;font-size:.78rem">Inventaire vide.</p>';
  return filtered.map(function(s){return renderInventoryCell(s,INV_SEL_MODE);}).join('');
}

function renderInventoryCell(stack,isSelectionMode){
  var it=stack.item,r=RAR[it.rar],eq=isEquipped(it.uid),isSel=isSelectionMode&&!!INV_SEL[it.uid];
  return '<div class="inv-cell'+(isSel?' selected':'')+'" data-uid="'+it.uid+'" '
    +'draggable="'+(!isSelectionMode?'true':'false')+'"'
    +(!isSelectionMode?' data-drag-uid="'+it.uid+'" data-drop-uid="'+it.uid+'"':'')
    +' data-action="'+(isSelectionMode?'toggle-inv-sel':'open-item')+'">'
    +(eq?'<div class="inv-eq-badge">EQ</div>':'')
    +(isSelectionMode?'<div class="sel-check">'+(isSel?'✓':'')+'</div>':'')
    +'<span class="inv-cell-ico">'+getItemIcon(it)+'</span>'
    +'<span class="inv-cell-nm '+r.cls+'">'+it.nm+'</span>'
    +(stack.count>1?'<span class="inv-count">×'+stack.count+'</span>':'')
    +'</div>';
}


function stackItems(){
  var stacks={},i,it,key;
  for(i=0;i<META.inv.length;i++){
    it=META.inv[i];
    if(it.relicCount||isEquipped(it.uid))key=it.uid;
    else key=it.type+'_'+it.rar+'_'+(it.sl||'')+'_'+it.nm;
    if(!stacks[key])stacks[key]={item:it,uids:[],count:0};
    stacks[key].uids.push(it.uid);stacks[key].count++;
  }
  return Object.values(stacks).sort(function(a,b){
    var ta={equip:0,relique:1,piece:2}[a.item.type]||3,tb={equip:0,relique:1,piece:2}[b.item.type]||3;
    if(ta!==tb)return ta-tb;return RAR_K.indexOf(b.item.rar)-RAR_K.indexOf(a.item.rar);
  });
}

// Drag & Drop
function readDragUid(e){
  var uid=DRAG_UID;
  if(!uid&&e&&e.dataTransfer){
    try{ uid=e.dataTransfer.getData('application/x-cyberidle-uid')||e.dataTransfer.getData('text/plain')||uid; }catch(err){}
  }
  return uid;
}
function dragStart(e,uid){
  DRAG_UID=uid;
  var cell=e.target&&e.target.closest?e.target.closest('.inv-cell'):null;
  if(cell)cell.classList.add('drag-src');
  if(e.dataTransfer){
    e.dataTransfer.effectAllowed='move';
    try{e.dataTransfer.setData('text/plain',uid);e.dataTransfer.setData('application/x-cyberidle-uid',uid);}catch(err){}
  }
}
function allowDrop(e){
  e.preventDefault();
  if(e.dataTransfer)e.dataTransfer.dropEffect='move';
  var slotEl=e.target&&e.target.closest?e.target.closest('[data-drop-slot]'):null;
  document.querySelectorAll('.d3-slot.drop-hover').forEach(function(el){el.classList.remove('drop-hover');});
  if(slotEl)slotEl.classList.add('drop-hover');
}
function dropCell(e,targetUid){
  e.preventDefault();
  document.querySelectorAll('.d3-slot.drop-hover').forEach(function(el){el.classList.remove('drop-hover');});
  document.querySelectorAll('.inv-cell.drag-src').forEach(function(el){el.classList.remove('drag-src');});
  var uid=readDragUid(e);DRAG_UID=null;if(!uid||uid===targetUid)return;renderInv();
}
function dropIntoSlot(e,sl){
  e.preventDefault();
  document.querySelectorAll('.d3-slot.drop-hover').forEach(function(el){el.classList.remove('drop-hover');});
  document.querySelectorAll('.inv-cell.drag-src').forEach(function(el){el.classList.remove('drag-src');});
  var uid=readDragUid(e);DRAG_UID=null;
  if(!uid)return;
  var it=byUid(uid);
  if(!it||it.type!=='equip')return;
  var compatible=(it.sl==='implant'&&(sl==='implant1'||sl==='implant2'))||(it.sl===sl);
  if(!compatible)return;
  equipIt(uid,sl);
}

// Item detail
function openItemDetail(uid){
  DETAIL_UID=uid;var it=byUid(uid);if(!it)return;
  var el=document.getElementById('item-detail');if(!el)return;
  el.classList.remove('hidden');
  updateRunNotif();
  var eq=isEquipped(uid),r=RAR[it.rar];
  var price=SELL[it.rar]||30;if(it.relicCount)price=Math.floor(price*(1+it.relicCount*0.2));
  var ico=getItemIcon(it);
  document.getElementById('item-detail-content').innerHTML=
    '<div class="item-detail-top"><span class="item-detail-ico">'+ico+'</span><div>'
    +'<div class="item-detail-nm '+r.cls+'">'+it.nm+(it.relicCount?'<span style="color:var(--gold)"> ⚗×'+it.relicCount+'</span>':'')+'</div>'
    +'<div class="item-detail-rar '+r.cls+'">'+r.lbl+' · '+cap(it.type)+(it.sl?' '+it.sl:'')+'</div>'
    +'</div></div>'
    +'<div class="item-detail-stats">'+stStr(it.st||{})+'</div>'
    +'<div class="item-detail-btns">'
    +(it.type==='equip'&&!eq?'<button class="btn btn-sm btn-green btn-eq" data-uid="'+uid+'">Équiper</button>':'')
    +(it.type==='equip'&&eq?'<button class="btn btn-sm btn-orange" data-action="unequip-detail">Retirer</button>':'')
    +(!it.perm?'<button class="btn btn-sm btn-red btn-sell" data-uid="'+uid+'">Vendre '+fmt(price)+'₵</button>':'<span style="font-size:.7rem;color:var(--text4)">[Permanent]</span>')
    +'<button class="btn btn-sm" data-action="hide-item-detail">✕</button>'
    +'</div>';
}
function hideItemDetail(){var el=document.getElementById('item-detail');if(el)el.classList.add('hidden');DETAIL_UID=null;updateRunNotif();}
function unequipDetail(){if(!DETAIL_UID)return;var it=byUid(DETAIL_UID);if(!it)return;['arme','skin','implant1','implant2','chaussures'].forEach(function(sl){if(META.eq[sl]===DETAIL_UID)META.eq[sl]=null;});recompute();renderInv();saveMeta();hideItemDetail();}

// ── CRAFT ────────────────────────────────────────────────────────
function renderCraft(){
  document.querySelectorAll('.craft-tab').forEach(function(t){t.classList.toggle('active',t.getAttribute('data-tab')===CRAFT_TAB);});
  document.getElementById('craft-enhance').classList.toggle('hidden',CRAFT_TAB!=='enhance');
  document.getElementById('craft-recipes').classList.toggle('hidden',CRAFT_TAB!=='forge');
  if(CRAFT_TAB==='enhance')renderEnhance();
  else renderRecipes();
}

function renderEnhance(){
  var eItem=byUid(CRAFT.enhItem);
  var ceItem=document.getElementById('ce-item-slot');if(!ceItem)return;
  if(eItem){
    ceItem.innerHTML='<div class="enhance-slot has"><div style="font-size:2rem">'+(eItem.icon||'📦')+'</div><div class="enhance-slot-content"><div class="'+RAR[eItem.rar].cls+'"><strong>'+eItem.nm+'</strong></div><div style="font-size:.72rem;color:var(--text2)">'+stStr(eItem.st)+'</div><div style="font-size:.7rem;color:var(--gold)">Reliques: '+((eItem.relicCount||0)+'/'+CFG.MAX_RELICS_PER_ITEM)+'</div></div><button class="btn btn-sm btn-red" data-action="clear-enhance-item" style="flex-shrink:0">✕</button></div>';
  }else{
    ceItem.innerHTML='<div class="enhance-slot" data-action="open-popup" data-popup-type="item" style="cursor:pointer"><div class="enhance-slot-add">+</div><div class="enhance-slot-lbl">Équipement à améliorer</div></div>';
  }
  var allRels=META.inv.filter(function(x){return x.type==='relique';});
  var ceRel=document.getElementById('ce-rel-slot');if(!ceRel)return;
  var relH='<div class="sec-hdr" style="padding:0 0 8px;border:none;font-size:.66rem">RELIQUES SÉLECTIONNÉES ('+CRAFT.enhRels.length+'/2)</div>';
  allRels.forEach(function(rel){
    var selected=CRAFT.enhRels.indexOf(rel.uid)!==-1;
    var compat=eItem?isRelicCompatible(rel,eItem):true;
    var maxed=CRAFT.enhRels.length>=2&&!selected;
    var dis=!compat||maxed;
    var relEntry=REL_TYPES.filter(function(x){return x.id===rel.subtype;})[0];
    var col=relEntry?relEntry.col:'#888';
    relH+='<div class="popup-item'+(selected?' active-sp':'')+(dis?' disabled':'')+'"'+(dis?'':(selected?' data-action="remove-craft-relic"':' data-action="toggle-craft-relic"'))+(dis?'':' data-uid="'+rel.uid+'"')+'>'+
      '<span style="font-size:1.4rem">'+(relEntry?relEntry.icon:'⚗️')+'</span>'
      +'<div style="flex:1"><div style="color:'+col+';font-weight:700;font-size:.8rem">'+rel.nm+'</div>'
      +'<div class="'+RAR[rel.rar].cls+'" style="font-size:.7rem">'+RAR[rel.rar].lbl+' +'+Math.round((REL_BONUS[rel.rar]||0)*100)+'%</div></div>'
      +(selected?'<span style="color:var(--green)">✔</span>':'')
      +(!compat&&!maxed?'<span style="font-size:.66rem;color:var(--red)">Incompat.</span>':'')
      +'</div>';
  });
  if(!allRels.length)relH+='<p style="color:var(--text4);font-size:.76rem;padding:8px 0">Aucune relique.</p>';
  ceRel.innerHTML=relH;
  var prev='',sm={atk:'atk',aspd:'aspd',vit:'hp',res:'sh',rgn:'rgn'};
  if(eItem&&CRAFT.enhRels.length){
    CRAFT.enhRels.forEach(function(ru){var rel=byUid(ru);if(!rel)return;var stat=rel.subtype==='univ'?mainStat(eItem.st):sm[rel.subtype];if(stat&&eItem.st[stat]!==undefined)prev+='+'+Math.floor(eItem.st[stat]*(REL_BONUS[rel.rar]||0))+' '+stat+' ';else prev+='[incompat.] ';});
  }
  var prevEl=document.getElementById('enhance-preview');if(prevEl)prevEl.textContent=prev?'Résultat: '+prev:'';
  var btnE=document.getElementById('btn-enhance');if(btnE)btnE.disabled=!(eItem&&CRAFT.enhRels.length&&prev&&prev.indexOf('incompat.')===-1);
}

function removeCraftRelic(uid){var idx=CRAFT.enhRels.indexOf(uid);if(idx!==-1)CRAFT.enhRels.splice(idx,1);renderCraft();}

function renderRecipes(){
  document.getElementById('recipes-list').innerHTML=RECIPES.map(function(rec){
    var can=canCraft(rec);
    var rarColor={'p':'var(--rar-p)','r':'var(--rar-r)','e':'var(--rar-e)','l':'var(--rar-l)'}[rec.result]||'var(--text)';
    return '<div class="recipe-card"><div class="recipe-result-box"><span class="recipe-result-ico">'+rec.icon+'</span>'
      +'<span class="recipe-result-rar" style="color:'+rarColor+'">'+RAR[rec.result].lbl+'</span></div>'
      +'<div class="recipe-body"><div class="recipe-name">'+rec.nm+'</div><div class="recipe-desc">'+rec.desc+'</div>'
      +'<div class="recipe-lvl">Niveau requis conseillé : '+Math.max(1,META.hero.lv-5)+'</div>'
      +'<div class="recipe-ings">'+rec.req.map(function(rq){var have=countInv(rq.type,rq.rar), names=rq.type==='piece'?(PIECE_NAMES[rq.rar]||[]):['Équipement '+RAR[rq.rar].lbl];return'<div class="recipe-ing'+(have>=rq.count?' ok':' nok')+'"><span class="recipe-ing-ico">'+{piece:'🔩',equip:'📦'}[rq.type]+'</span><span style="font-size:.65rem">'+rq.count+'×</span><span class="'+RAR[rq.rar].cls+'" style="font-size:.65rem">'+RAR[rq.rar].lbl+'</span><span style="font-size:.65rem">'+escapeHtml(names.join(' / '))+'</span><span style="font-size:.65rem;color:'+(have>=rq.count?'var(--green)':'var(--red)')+'">'+have+'</span></div>';}).join('')+'</div>'
      +'<button class="btn btn-sm'+(can?' btn-green':'')+'" data-action="do-craft" data-recipe-id="'+rec.id+'"'+(can?'':' disabled')+'>⚙ Forger</button>'
      +'</div></div>';
  }).join('');
}

// Popup sélection item/relique
function openPopup(type){
  POPUP.type=type;
  var el=document.getElementById('craft-popup');if(!el)return;
  el.classList.remove('hidden');
  updateRunNotif();
  var items=[];
  if(type==='item')items=META.inv.filter(function(x){return x.type==='equip'&&(x.relicCount||0)<CFG.MAX_RELICS_PER_ITEM;});
  if(!items.length){el.querySelector('#popup-list').innerHTML='<p style="color:var(--text4);padding:10px">Aucun item disponible.</p>';el.classList.remove('hidden');updateRunNotif();return;}
  el.querySelector('#popup-list').innerHTML=items.map(function(it){
    return '<div class="popup-item" data-action="select-popup-item" data-uid="'+it.uid+'">'
      +'<span class="popup-item-ico">'+getItemIcon(it)+'</span>'
      +'<div><div class="'+RAR[it.rar].cls+'" style="font-weight:700;font-size:.82rem">'+it.nm+'</div>'
      +'<div style="font-size:.72rem;color:var(--text2)">'+stStr(it.st)+(it.relicCount?' ⚗×'+it.relicCount+'/'+CFG.MAX_RELICS_PER_ITEM:'')+'</div></div>'
      +'</div>';
  }).join('');
}
function closePopup(){var el=document.getElementById('craft-popup');if(el)el.classList.add('hidden');updateRunNotif();}
function selectPopupItem(uid){CRAFT.enhItem=uid;CRAFT.enhRels=[];closePopup();renderCraft();}

// ── OVERLAYS ─────────────────────────────────────────────────────
function showSel(){
  document.getElementById('ov-sel').classList.remove('hidden');
  updateRunNotif();
  document.getElementById('hcards').innerHTML=HEROES.map(function(he){
    return '<div class="hcard" data-action="choose-hero" data-hero-id="'+he.id+'">'
      +'<img class="hcard-img" src="'+he.portrait+'" onerror="this.outerHTML=\'<span style=&quot;font-size:4rem;margin:.5rem auto&quot;>'+getHeroFallbackIcon(he.id)+'</span>\'" alt=""/>'
      +'<div class="hcard-name">'+he.name+'</div>'
      +'<div class="hcard-arch">'+he.arch+'</div>'
      +'<div class="hcard-desc">'+he.desc+'</div>'
      +'<div class="hcard-stats">ATQ:'+he.baseAtk+' · VitAtq:'+he.baseAspd+'/s<br>PV:'+he.baseHp+' · Boucl:'+he.baseSh+'</div>'
      +'<div class="hcard-cta">CHOISIR</div>'
      +'</div>';
  }).join('');
}
function chooseHero(hid){META.heroId=hid;initActiveSp();saveMeta();document.getElementById('ov-sel').classList.add('hidden');updateRunNotif();navigate('hero');}

function showGO(){
  document.getElementById('ov-go').classList.remove('hidden');
  updateRunNotif();
  var rs=G.rs,el=Math.floor((Date.now()-rs.t0)/1000);
  setText('go-inf','Vague:'+G.wave+' — '+((curRunType&&curRunType.name)||''));
  document.getElementById('go-tbl').innerHTML=
    '<tr><td>Kills</td><td>'+fmt(rs.kills)+'</td></tr><tr><td>Vagues</td><td>'+rs.waves+'</td></tr>'
    +'<tr><td>Crédits</td><td>'+fmt(rs.crEarned)+'</td></tr><tr><td>Gemmes</td><td>'+rs.gmEarned+'</td></tr>'
    +'<tr><td>Niveau</td><td>'+META.hero.lv+'</td></tr><tr><td>Durée</td><td>'+fmtT(Math.floor((Date.now()-rs.t0)/1000))+'</td></tr>';
}

function renderDuelResultScreen(result){
  setDuelView('result');
  var tEl=document.getElementById('dr-title'),rEl=document.getElementById('dr-rewards');
  if(!tEl||!rEl)return;
  if(result&&result.won){
    tEl.innerHTML='<div style="font-size:2.5rem">🏆</div><div style="font-family:var(--font-h);font-size:1.1rem;color:var(--gold);letter-spacing:.08em">VICTOIRE !</div>';
    rEl.innerHTML=result.rewardHtml||'';
    return;
  }
  tEl.innerHTML='<div style="font-size:2.5rem">💀</div><div style="font-family:var(--font-h);font-size:1.1rem;color:var(--red);letter-spacing:.08em">DÉFAITE</div>';
  rEl.innerHTML=(result&&result.rewardHtml)||'<div style="color:var(--text4)">Aucune récompense.</div>';
}

function onToggleSp(sid){
  toggleActiveSp(sid);
  if(PG==='inv')renderInv();
  if(PG==='hero')renderHero();
  if(G&&!G.over&&PG==='home')buildHomeStructure();
}
