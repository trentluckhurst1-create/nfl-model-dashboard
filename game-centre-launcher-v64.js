(()=>{
'use strict';
/* v8.6: one UI stack only. Do not inject legacy v7.4/v7.5 assets. */
function gameId(el){return el?.closest?.('[data-game]')?.dataset?.game||null}
async function openGame(id){
  if(!id)return false;
  try{window.NFLWorkspace?.setGame?.(id)}catch(_){}
  for(let i=0;i<80;i++){
    if(window.EDGEiQGameCentre?.open){
      await window.EDGEiQGameCentre.open(id);
      return true;
    }
    await new Promise(r=>setTimeout(r,25));
  }
  console.error('EDGEiQ Game Control Centre unavailable:',id);
  return false;
}
document.addEventListener('click',e=>{
  const id=gameId(e.target);if(!id)return;
  e.preventDefault();e.stopImmediatePropagation();openGame(id);
},true);
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const id=gameId(e.target);if(!id)return;
  e.preventDefault();e.stopImmediatePropagation();openGame(id);
},true);
window.EDGEiQGameCentreLauncher={open:openGame};
})();
