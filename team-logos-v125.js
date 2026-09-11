(()=>{
'use strict';
let META={};
const $all=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function game(id){try{return (model?.games||[]).find(g=>g.game_id===id)||null}catch(_){return null}}
function meta(code){return META?.[code]||{name:code,conference:'',division:'',logo:''}}
function logo(code,cls=''){const src=meta(code).logo;if(!src)return`<span class="team-logo-fallback ${cls}">${esc(code)}</span>`;return`<img class="edge-team-logo ${cls}" src="${esc(src)}" alt="${esc(meta(code).name||code)} logo" loading="lazy" decoding="async">`}
function pair(g,cls=''){if(!g)return'';return`<span class="matchup-logo-pair ${cls}" aria-hidden="true">${logo(g.away)}${logo(g.home)}</span>`}
function fullPair(g){if(!g)return'';return`${esc(meta(g.away).name||g.away)} <span class="team-name-sep">@</span> ${esc(meta(g.home).name||g.home)}`}
function decorateCommand(){
  $all('#terminalGameList .terminal-row[data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),host=el.querySelector('.game-name');if(!g||!host)return;host.insertAdjacentHTML('afterbegin',pair(g,'compact'));host.title=`${meta(g.away).name} at ${meta(g.home).name}`;el.dataset.logos='1'});
}
function decorateGames(){
  $all('#gamesMatrix [data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),h=el.querySelector('h3');if(!g||!h)return;h.insertAdjacentHTML('afterbegin',pair(g,'card'));h.insertAdjacentHTML('afterend',`<div class="matchup-full-names">${fullPair(g)}</div>`);el.dataset.logos='1'});
}
function decorateMarket(){
  $all('#marketRows tr[data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game),td=el.querySelector('td');if(!g||!td)return;td.insertAdjacentHTML('afterbegin',pair(g,'table'));td.title=`${meta(g.away).name} at ${meta(g.home).name}`;el.dataset.logos='1'});
}
function decorateHome(){
  $all('#homeDashboard [data-game]').forEach(el=>{if(el.dataset.logos==='1')return;const g=game(el.dataset.game);if(!g)return;const target=el.matches('.home-featured')?el.querySelector('.hf-match h2'):el.querySelector('span b, h3, h2');if(!target)return;target.insertAdjacentHTML('afterbegin',pair(g,el.matches('.home-featured')?'featured':'home-mini'));if(el.matches('.home-featured'))target.insertAdjacentHTML('afterend',`<div class="matchup-full-names featured-names">${fullPair(g)}</div>`);target.title=`${meta(g.away).name} at ${meta(g.home).name}`;el.dataset.logos='1'});
}
function decorateInspector(){
  const chips=$all('#gameInspector .inspector-matchup .team-chip');
  chips.forEach(chip=>{const box=chip.querySelector('.team-logo');if(!box||box.dataset.logoReady==='1')return;const code=(box.textContent||'').trim();const m=meta(code);box.innerHTML=logo(code,'inspector');box.dataset.logoReady='1';chip.classList.add('team-chip-rich');chip.setAttribute('title',m.name||code);const nodes=[...chip.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());nodes.forEach(n=>n.remove());chip.insertAdjacentHTML('beforeend',`<span class="team-chip-copy"><b>${esc(code)}</b><small>${esc(m.name||code)}</small><em>${esc(m.division||'NFL')}</em></span>`)});
}
function decorateStandings(){
  $all('#standingsGrid').forEach(host=>{$all('tr, .standing-row, .team-row',host).forEach(row=>{if(row.dataset.logos==='1')return;const text=(row.textContent||'').trim();const code=Object.keys(META).find(c=>new RegExp(`(^|\\s)${c}(\\s|$)`).test(text));if(!code)return;const target=row.querySelector('td, b, strong, span');if(!target)return;target.insertAdjacentHTML('afterbegin',logo(code,'standing'));row.dataset.logos='1'})});
}
function decoratePersonnel(){
  $all('#injuryRows tr').forEach(row=>{if(row.dataset.logos==='1')return;const td=row.querySelector('td');if(!td)return;const code=(td.textContent||'').trim();if(!META[code])return;td.insertAdjacentHTML('afterbegin',logo(code,'personnel'));td.title=meta(code).name;row.dataset.logos='1'});
}
function decorateAll(){decorateCommand();decorateGames();decorateMarket();decorateHome();decorateInspector();decorateStandings();decoratePersonnel()}
function wrap(name){const original=window[name];if(typeof original!=='function'||original.__edgeLogoWrapped)return;const wrapped=function(...args){const out=original.apply(this,args);queueMicrotask(decorateAll);return out};wrapped.__edgeLogoWrapped=true;window[name]=wrapped}
async function loadMeta(){try{const r=await fetch(`data/team_meta.json?v=126&t=${Date.now()}`,{cache:'no-store'});if(r.ok)META=await r.json()}catch(e){console.warn('Team logo metadata unavailable',e)}window.EDGEiQTeams=META;decorateAll()}
['renderCommand','renderGames','renderMarket','renderHome','renderStandings','renderInjuries'].forEach(wrap);
document.addEventListener('edgeiq:core-ready',decorateAll);
document.addEventListener('nflops:information-refresh',decorateAll);
document.addEventListener('DOMContentLoaded',decorateAll,{once:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-game],[data-view],[data-view-jump]'))queueMicrotask(decorateAll)},true);
loadMeta();
})();