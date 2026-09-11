(()=>{
'use strict';
const VIEWS=['command','games','market','injuries','news','performance','standings','model'];
const META={
 command:['EDGEiQ NFL / COMMAND','NFL Command Centre','Week control, matchup access and verified game intelligence.'],
 games:['EDGEiQ NFL / GAMES','Week 1 Games','Every matchup opens into the same complete Game Control Centre.'],
 market:['EDGEiQ NFL / MARKET','Market Monitor','EDGEiQ fair line first. Market consensus and movement second.'],
 injuries:['EDGEiQ NFL / PERSONNEL','Personnel Centre','Official availability, injury status and verified personnel context.'],
 news:['EDGEiQ NFL / INTELLIGENCE','Intelligence Desk','Trusted-source NFL news and matchup context.'],
 performance:['EDGEiQ NFL / PERFORMANCE','Performance','Prospective results and immutable live evaluation.'],
 standings:['EDGEiQ NFL / STANDINGS','Standings','League and division context in the same terminal.'],
 model:['EDGEiQ NFL / MODEL','Model Console','Production architecture, controls and model status.']
};
let model={games:[]},meta={};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
async function json(path){try{const r=await fetch(`${path}?v=91&t=${Date.now()}`,{cache:'no-store'});return r.ok?await r.json():{}}catch(_){return{}}}
function hardResetOverlays(){
  $('#gameControlCentre')?.remove();$('#gameWorkstation')?.remove();$('#operatorPalette')?.remove();$('#hotkeyMap')?.remove();$('#operatorStatus')?.remove();$('#livePriorityBar')?.remove();
  document.body.classList.remove('gcc-open','focus-context');document.documentElement.style.overflow='';document.body.style.overflow='';
}
function closeGame({historyMode='none'}={}){
  try{window.EDGEiQGameCentre?.close?.()}catch(_){}
  $('#edgeiqV7')?.remove();$('#gameControlCentre')?.remove();
  document.body.classList.remove('gcc-open');document.documentElement.style.overflow='';document.body.style.overflow='';
  if(historyMode!=='none'){
    const v=currentView();const u=`${location.pathname}?view=${encodeURIComponent(v)}`;
    historyMode==='push'?history.pushState({view:v},'',u):history.replaceState({view:v},'',u);
  }
}
function currentView(){return $('.side-nav button.active')?.dataset.view||'command'}
function activateView(view,{push=false}={}){
  if(!VIEWS.includes(view))view='command';
  closeGame();
  const b=$(`.side-nav button[data-view="${view}"]`);
  if(b){
    $$('.view').forEach(x=>x.classList.remove('active'));
    $(`#view-${view}`)?.classList.add('active');
    $$('.side-nav button').forEach(x=>x.classList.toggle('active',x===b));
    try{b.onclick?.()}catch(_){}
  }
  const [ey,title]=META[view];if($('#viewEyebrow'))$('#viewEyebrow').textContent=ey;if($('#viewTitle'))$('#viewTitle').textContent=title;
  if(push)history.pushState({view},'',`${location.pathname}?view=${encodeURIComponent(view)}`);
  decorateViews();
}
async function openGame(id,{push=true}={}){
  if(!id)return;
  const exists=(model.games||[]).some(g=>g.game_id===id);if(!exists)return;
  if(push&&new URLSearchParams(location.search).get('game')!==id)history.pushState({game:id,view:currentView()},'',`${location.pathname}?game=${encodeURIComponent(id)}`);
  for(let i=0;i<100;i++){
    if(window.EDGEiQGameCentre?.open){await window.EDGEiQGameCentre.open(id);return}
    await new Promise(r=>setTimeout(r,25));
  }
  console.error('EDGEiQ Game Control Centre unavailable',id);
}
function decorateViews(){
  VIEWS.forEach(v=>{const host=$(`#view-${v}`);if(!host)return;let h=host.querySelector(':scope > .view-head');if(!h){h=document.createElement('div');h.className='view-head';host.prepend(h)}if(v==='command'){h.style.display='none';return}h.style.display='';const [ey,title,sub]=META[v];h.innerHTML=`<div><span class="label">${ey}</span><h1>${title}</h1><p class="v91-sub">${sub}</p></div>`});
  const ver=$('.version');if(ver)ver.textContent='EDGEiQ NFL · v9.1';
  $('.side-bottom')?.classList.add('v91-footer');
}
function decorateBrand(){const app=$('.app-id');if(!app)return;app.innerHTML='<img class="edgeiq-app-logo" src="assets/edgeiq-nfl-logo.svg?v=91" alt="EDGEiQ NFL">'}
function gameLogo(code){const m=meta?.[code];return m?.logo?`<img src="${esc(m.logo)}" alt="${esc(code)}">`:''}
function tickerText(g){return `${gameLogo(g.away)}<b>${esc(g.away)}</b><span>@</span>${gameLogo(g.home)}<b>${esc(g.home)}</b>`}
function ensureTicker(){
  let bar=$('.v8-seasonbar');if(!bar){bar=document.createElement('section');bar.className='v8-seasonbar';$('.command-bar')?.after(bar)}
  if(!bar)return;bar.innerHTML='<button class="v8-weekbadge" data-view-jump="games">WEEK 1</button><div class="v8-ticker"></div>';
  const wrap=$('.v8-ticker',bar);wrap.innerHTML=(model.games||[]).map(g=>`<button class="v8-tick" data-game="${esc(g.game_id)}"><span class="v91-ticker-team">${tickerText(g)}</span><small>${esc(g.our_line||'—')} · ${esc(g.market||'market pending')}</small></button>`).join('');
}
function decorateRows(){
  $$('.terminal-row[data-game],.software-card[data-game]').forEach(el=>{if(el.dataset.v91==='1')return;el.dataset.v91='1';const id=el.dataset.game,g=(model.games||[]).find(x=>x.game_id===id);if(!g)return;const name=el.querySelector('.game-name')||el.querySelector('h3');if(name&&!name.querySelector('.v91-matchup')){const small=name.querySelector('small');name.childNodes.forEach(n=>{if(n.nodeType===3)n.nodeValue=''});const w=document.createElement('span');w.className='v91-matchup';w.innerHTML=`${gameLogo(g.away)}<b>${esc(g.away)}</b><span>@</span>${gameLogo(g.home)}<b>${esc(g.home)}</b>`;name.prepend(w);if(small)name.appendChild(small)}})
}
function sanitizeLegacy(){
  $$('.v82-lowerdeck,.v82-ribbon,.v8-topline,.v8-actions').forEach(x=>x.remove());
  $('#view-command .right-rail')?.setAttribute('hidden','');$('#view-command #statStrip')?.setAttribute('hidden','');
  $('#gameWorkstation')?.remove();$('#operatorStatus')?.remove();$('#livePriorityBar')?.remove();
}
function routeFromUrl(){const q=new URLSearchParams(location.search),gid=q.get('game'),view=q.get('view');if(gid){openGame(gid,{push:false});return}activateView(VIEWS.includes(view)?view:'command',{push:false})}
function bind(){
  document.addEventListener('click',e=>{
    const nav=e.target.closest('.side-nav button[data-view], [data-view-jump]');
    if(nav){const view=nav.dataset.view||nav.dataset.viewJump;if(VIEWS.includes(view)){e.preventDefault();e.stopImmediatePropagation();activateView(view,{push:true});return}}
    const back=e.target.closest('#v7Back,.v7-back,[data-gcc-board]');if(back){e.preventDefault();e.stopImmediatePropagation();closeGame();activateView('command',{push:true});return}
    const gameEl=e.target.closest('[data-game]');if(gameEl&&!gameEl.closest('#edgeiqV7')){e.preventDefault();e.stopImmediatePropagation();openGame(gameEl.dataset.game,{push:true});return}
  },true);
  document.addEventListener('keydown',e=>{if(/^[1-8]$/.test(e.key)&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();activateView(VIEWS[Number(e.key)-1],{push:true})}if(e.key==='Escape'&&$('#edgeiqV7')){e.preventDefault();closeGame();activateView('command',{push:true})}});
  window.addEventListener('popstate',routeFromUrl);
  document.addEventListener('nflops:information-refresh',()=>setTimeout(()=>{decorateRows();sanitizeLegacy()},50));
}
async function boot(){
  hardResetOverlays();[model,meta]=await Promise.all([json('data/model_snapshot.json'),json('data/team_meta.json')]);window.NFLModel=model;decorateBrand();decorateViews();ensureTicker();sanitizeLegacy();
  setTimeout(()=>{decorateRows();sanitizeLegacy()},400);setTimeout(()=>{decorateRows();sanitizeLegacy()},1400);bind();routeFromUrl();
}
window.EDGEiQNav={go:(v)=>activateView(v,{push:true}),openGame,closeGame};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();