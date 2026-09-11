(()=>{
'use strict';
let META={};
const $all=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function game(id){try{return (model?.games||[]).find(g=>g.game_id===id)||null}catch(_){return null}}
function logo(code,cls=''){const src=META?.[code]?.logo;if(!src)return`<span class="team-logo-fallback ${cls}">${esc(code)}</span>`;return`<img class="edge-team-logo ${cls}" src="${esc(src)}" alt="${esc(META?.[code]?.name||code)} logo" loading="lazy" decoding="async">`}
function pair(g,cls=''){if(!g)return'';return`<span class="matchup-logo-pair ${cls}">${logo(g.away)}${logo(g.home)}</span>`}
function decorateCommand(){
  $all('#terminalGameList .terminal-row[data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),host=el.querySelector('.game-name');if(!g||!host)return;host.insertAdjacentHTML('afterbegin',pair(g,'compact'));el.dataset.logos='1'});
}
function decorateGames(){
  $all('#gamesMatrix [data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),h=el.querySelector('h3');if(!g||!h)return;h.insertAdjacentHTML('afterbegin',pair(g,'card'));el.dataset.logos='1'});
}
function decorateMarket(){
  $all('#marketRows tr[data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),td=el.querySelector('td');if(!g||!td)return;td.insertAdjacentHTML('afterbegin',pair(g,'table'));el.dataset.logos='1'});
}
function decorateHome(){
  $all('#homeDashboard [data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game);if(!g)return;const target=el.matches('.home-featured')?el.querySelector('.hf-match h2'):el.querySelector('span b, h3, h2');if(!target)return;target.insertAdjacentHTML('afterbegin',pair(g,el.matches('.home-featured')?'featured':'home-mini'));el.dataset.logos='1'});
}
function decorateInspector(){
  $all('#gameInspector .inspector-matchup .team-chip').forEach(chip=>{const box=chip.querySelector('.team-logo');if(!box||box.dataset.logoReady==='1')return;const code=(box.textContent||'').trim();const src=META?.[code]?.logo;if(!src)return;box.innerHTML=`<img class="edge-team-logo inspector" src="${esc(src)}" alt="${esc(META?.[code]?.name||code)} logo" decoding="async">`;box.dataset.logoReady='1'});
}
function decorateAll(){decorateCommand();decorateGames();decorateMarket();decorateHome();decorateInspector()}
function wrap(name){const original=window[name];if(typeof original!=='function'||original.__edgeLogoWrapped)return;const wrapped=function(...args){const out=original.apply(this,args);queueMicrotask(decorateAll);return out};wrapped.__edgeLogoWrapped=true;window[name]=wrapped}
async function loadMeta(){try{const r=await fetch(`data/team_meta.json?v=125&t=${Date.now()}`,{cache:'no-store'});if(r.ok)META=await r.json()}catch(e){console.warn('Team logo metadata unavailable',e)}window.EDGEiQTeams=META;decorateAll()}
['renderCommand','renderGames','renderMarket','renderHome'].forEach(wrap);
document.addEventListener('edgeiq:core-ready',decorateAll);
document.addEventListener('nflops:information-refresh',decorateAll);
document.addEventListener('DOMContentLoaded',decorateAll,{once:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-game],[data-view],[data-view-jump]'))queueMicrotask(decorateAll)},true);
loadMeta();
})();