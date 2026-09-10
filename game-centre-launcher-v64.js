(()=>{
'use strict';
function launchFrom(el){
  const row=el?.closest?.('[data-game]');
  const id=row?.dataset?.game;
  if(!id)return false;
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
// Capture phase prevents older row handlers from swallowing the launch event.
document.addEventListener('click',e=>{launchFrom(e.target)},true);
document.addEventListener('pointerup',e=>{
  if(e.pointerType==='touch') launchFrom(e.target);
},true);
// Also open when another part of the app changes the selected matchup context.
document.addEventListener('nflops:context',e=>{
  const id=e?.detail?.game?.game_id||e?.detail?.game;
  if(!id)return;
  // Do not auto-open during initial workspace restoration; only when the user has interacted.
  if(document.documentElement.dataset.edgeiqUserGameIntent==='1'){
    setTimeout(()=>window.EDGEiQGameCentre?.open?.(id),0);
  }
});
document.addEventListener('pointerdown',e=>{
  if(e.target?.closest?.('[data-game]')) document.documentElement.dataset.edgeiqUserGameIntent='1';
},true);
window.EDGEiQGameCentreLauncher={open:id=>window.EDGEiQGameCentre?.open?.(id)};
})();
