(()=>{
'use strict';
function ensureV74(){
  if(!document.querySelector('link[href^="game-control-v74.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='game-control-v74.css?v=74';document.head.appendChild(l)}
  if(!document.querySelector('script[src^="game-control-v74.js"]')){const s=document.createElement('script');s.src='game-control-v74.js?v=74';s.defer=true;document.body.appendChild(s)}
}
function openGame(id){if(!id)return;ensureV74();try{window.NFLWorkspace?.setGame?.(id)}catch(_){}window.EDGEiQGameCentre?.open?.(id)}
function gameId(el){return el?.closest?.('[data-game]')?.dataset?.game||null}
document.addEventListener('click',e=>{const id=gameId(e.target);if(!id)return;e.preventDefault();e.stopImmediatePropagation();openGame(id)},true);
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const id=gameId(e.target);if(!id)return;e.preventDefault();e.stopImmediatePropagation();openGame(id)},true);
window.EDGEiQGameCentreLauncher={open:openGame};ensureV74();
const ver=document.querySelector('.version');if(ver)ver.textContent='v7.4 · decision desk';
})();
