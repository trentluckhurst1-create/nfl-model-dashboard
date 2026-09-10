(()=>{
'use strict';
function openGame(id){if(!id)return;try{window.NFLWorkspace?.setGame?.(id)}catch(_){}window.EDGEiQGameCentre?.open?.(id)}
function gameId(el){return el?.closest?.('[data-game]')?.dataset?.game||null}
document.addEventListener('click',e=>{const id=gameId(e.target);if(!id)return;e.preventDefault();e.stopImmediatePropagation();openGame(id)},true);
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const id=gameId(e.target);if(!id)return;e.preventDefault();e.stopImmediatePropagation();openGame(id)},true);
window.EDGEiQGameCentreLauncher={open:openGame};
const ver=document.querySelector('.version');if(ver)ver.textContent='v7.1 · game research terminal';
})();