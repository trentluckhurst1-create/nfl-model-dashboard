(()=>{
'use strict';
function ensureV65(){
  if(!document.querySelector('link[href="game-control-v65.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='game-control-v65.css';document.head.appendChild(l);
  }
  if(!document.querySelector('script[src="game-control-v65.js"]')){
    const s=document.createElement('script');s.src='game-control-v65.js';s.defer=true;document.body.appendChild(s);
  }
  const ver=document.querySelector('.version');if(ver)ver.textContent='v6.5 · mockup fidelity';
}
function launchFrom(el){
  const row=el?.closest?.('[data-game]');
  const id=row?.dataset?.game;
  if(!id)return false;
  ensureV65();
  try{window.NFLWorkspace?.setGame?.(id)}catch(_){}
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(window.EDGEiQGameCentre?.open){
      clearInterval(timer);
      window.EDGEiQGameCentre.open(id);
    }else if(tries>40){
      clearInterval(timer);
      console.error('EDGEiQ Game Centre unavailable for',id);
    }
  },25);
  return true;
}
ensureV65();
document.addEventListener('click',e=>{launchFrom(e.target)},true);
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')launchFrom(e.target)},true);
document.addEventListener('nflops:context',e=>{
  const id=e?.detail?.game?.game_id||e?.detail?.game;
  if(!id)return;
  if(document.documentElement.dataset.edgeiqUserGameIntent==='1')setTimeout(()=>window.EDGEiQGameCentre?.open?.(id),0);
});
document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('[data-game]'))document.documentElement.dataset.edgeiqUserGameIntent='1'},true);
window.EDGEiQGameCentreLauncher={open:id=>{ensureV65();window.EDGEiQGameCentre?.open?.(id)}};
})();
