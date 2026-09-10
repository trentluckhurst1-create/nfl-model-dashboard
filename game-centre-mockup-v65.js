(()=>{
'use strict';
function enhance(){
  const host=document.querySelector('#gameControlCentre');
  if(!host||host.classList.contains('hidden')) return;
  const head=host.querySelector('.gcc-head');
  if(head&&!head.querySelector('.gcc-brandbar')){
    const bar=document.createElement('div');
    bar.className='gcc-brandbar';
    bar.innerHTML='<div class="gcc-brandlock"><img src="assets/edgeiq-nfl-logo.svg" alt="EDGEiQ NFL"><div>EDGEiQ NFL<small>Professional Game Intelligence</small></div></div><div class="gcc-title"><h1>GAME CONTROL CENTRE</h1><span>Complete game intelligence · one screen</span></div><div class="gcc-brandtag">DATA · DISCIPLINE · EDGE.</div>';
    head.prepend(bar);
  }
  const match=host.querySelector('.gcc-match');
  if(match&&!host.querySelector('.gcc-actions')){
    const actions=document.createElement('div');
    actions.className='gcc-actions';
    actions.innerHTML='<button data-gcc-action="note">＋ Add Note</button><button data-gcc-action="report">Matchup Report</button><button data-gcc-action="market">Line Movement</button><button data-gcc-action="newtab">Open in New Tab</button>';
    match.after(actions);
  }
  const mid=host.querySelector('.gcc-mid');
  if(mid&&!mid.querySelector('.gcc-countdown')){
    const box=document.createElement('div');box.className='gcc-countdown';box.innerHTML='<small>Kickoff in</small><strong>--:--:--</strong>';mid.appendChild(box);
  }
  const cards=[...host.querySelectorAll('.gcc-card')];
  const kinds=['game','injury','weather','market','stats','intel','depth-away','depth-home','model'];
  cards.forEach((c,i)=>{if(!c.dataset.kind&&kinds[i])c.dataset.kind=kinds[i]});
  const ver=document.querySelector('.version');if(ver)ver.textContent='v6.5 · mockup fidelity';
}
function countdown(){
 const host=document.querySelector('#gameControlCentre:not(.hidden)');if(!host)return;
 const strong=host.querySelector('.gcc-countdown strong'); if(!strong)return;
 const g=window.NFLWorkspace?.getGame?.();
 let ko=null;
 try{const m=(typeof model!=='undefined'&&model?.games||[]).find(x=>x.game_id===g);ko=m&&typeof kickoff==='function'?kickoff(m):null}catch(_){}
 if(!ko){strong.textContent='--:--:--';return}
 const ms=new Date(ko).getTime()-Date.now(); if(ms<=0){strong.textContent='LIVE / STARTED';return}
 const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);strong.textContent=[h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
}
const obs=new MutationObserver(()=>enhance());
function boot(){enhance();obs.observe(document.body,{childList:true,subtree:true});setInterval(()=>{enhance();countdown()},1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();