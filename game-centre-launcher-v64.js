(()=>{
'use strict';
let loading=null;
function ensureV7(){
  if(!document.querySelector('link[href="game-control-v70.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='game-control-v70.css?v=70';document.head.appendChild(l);
  }
  if(window.EDGEiQGameCentre?.render&&document.querySelector('script[src^="game-control-v70.js"]'))return Promise.resolve();
  if(loading)return loading;
  loading=new Promise(resolve=>{
    let s=document.querySelector('script[src^="game-control-v70.js"]');
    if(!s){s=document.createElement('script');s.src='game-control-v70.js?v=70';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)}else resolve();
  });
  const ver=document.querySelector('.version');if(ver)ver.textContent='v7.0 · approved game centre';
  return loading;
}
async function launchFrom(el){
  const row=el?.closest?.('[data-game]');const id=row?.dataset?.game;if(!id)return false;
  try{window.NFLWorkspace?.setGame?.(id)}catch(_){}
  await ensureV7();
  window.EDGEiQGameCentre?.open?.(id);
  return true;
}
ensureV7();
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-game]')){e.preventDefault();e.stopPropagation();launchFrom(e.target)}},true);
document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('[data-game]'))document.documentElement.dataset.edgeiqUserGameIntent='1'},true);
window.EDGEiQGameCentreLauncher={open:async id=>{await ensureV7();window.EDGEiQGameCentre?.open?.(id)}};
})();
