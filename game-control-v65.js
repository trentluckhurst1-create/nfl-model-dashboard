(()=>{
'use strict';
function classifyCards(host){
  host.querySelectorAll('.gcc-card').forEach(card=>{
    const t=(card.querySelector('header span')?.textContent||'').toLowerCase();
    let kind='';
    if(t.includes('game state')) kind='game';
    else if(t.includes('injur')) kind='injury';
    else if(t.includes('weather')) kind='weather';
    else if(t.includes('market')) kind='market';
    else if(t.includes('matchup stats')) kind='stats';
    else if(t.includes('intelligence')) kind='intel';
    else if(t.includes('model control')) kind='model';
    else if(t.includes('personnel')||t.includes('depth')) kind=card.dataset.kind||'depth';
    if(kind) card.dataset.kind=kind;
  });
  const depths=[...host.querySelectorAll('.gcc-card')].filter(c=>(c.querySelector('header span')?.textContent||'').toLowerCase().match(/personnel|depth/));
  if(depths[0])depths[0].dataset.kind='depth-away';
  if(depths[1])depths[1].dataset.kind='depth-home';
}
function addChrome(host){
  const head=host.querySelector('.gcc-head');
  if(!head)return;
  if(!head.querySelector('.gcc-brandbar')){
    const bar=document.createElement('div');
    bar.className='gcc-brandbar';
    bar.innerHTML=`<div class="gcc-brandlock"><img src="assets/edgeiq-nfl-logo.svg" alt="EDGEiQ NFL"><div>EDGEiQ NFL<small>Operations Terminal</small></div></div><div class="gcc-title"><h1>GAME CONTROL CENTRE</h1><span>Complete game intelligence · one screen</span></div><div class="gcc-brandtag">Data · Discipline · Edge</div>`;
    head.prepend(bar);
  }
  if(!host.querySelector('.gcc-actions')){
    const actions=document.createElement('div');
    actions.className='gcc-actions';
    actions.innerHTML='<button type="button">Matchup Report</button><button type="button">Depth Charts</button><button type="button">Line Movement</button><button type="button">Add Note</button>';
    const tabs=host.querySelector('.gcc-tabs');
    tabs?.after(actions);
  }
}
function getKickoffText(host){return host.querySelector('.gcc-mid span')?.textContent||''}
function addCountdown(host){
  const mid=host.querySelector('.gcc-mid');
  if(!mid||mid.querySelector('.gcc-countdown'))return;
  const box=document.createElement('div');
  box.className='gcc-countdown';
  box.innerHTML='<small>Game status</small><strong>PRE-GAME</strong>';
  mid.appendChild(box);
  const gameId=(host.querySelector('.gcc-breadcrumb span')?.textContent||'').split('/').pop()?.trim();
  let kickoff=null;
  try{
    const g=(typeof model!=='undefined'&&model?.games||[]).find(x=>x.game_id===gameId);
    kickoff=typeof window.kickoff==='function'?window.kickoff(g):null;
  }catch(_){}
  const strong=box.querySelector('strong');
  const tick=()=>{
    if(!document.body.contains(box))return;
    if(kickoff){
      const ms=new Date(kickoff)-Date.now();
      if(Number.isFinite(ms)&&ms>0){const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);strong.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;return;}
    }
    const state=host.querySelector('.gcc-mid b')?.textContent||'PRE-GAME';strong.textContent=state.split('·')[0].trim();
  };
  tick();setInterval(tick,1000);
}
function polish(){const host=document.querySelector('#gameControlCentre');if(!host||host.classList.contains('hidden'))return;addChrome(host);addCountdown(host);classifyCards(host)}
const obs=new MutationObserver(()=>polish());
function boot(){const root=document.body;obs.observe(root,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(polish,0),true);document.addEventListener('nflops:information-refresh',()=>setTimeout(polish,0));polish()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
