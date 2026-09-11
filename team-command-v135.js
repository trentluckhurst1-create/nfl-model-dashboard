(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let META={};
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function meta(c){return META[c]||null}
function logo(c){const m=meta(c);return m?.logo?`<img class="team-link-logo" src="${esc(m.logo)}" alt="" loading="lazy" decoding="async">`:''}
function codeFromText(t){const x=String(t||'').trim();return Object.keys(META).find(c=>x===c||x===META[c]?.name)||null}
function teamButton(c,label=null){const m=meta(c);if(!m)return'';return `<button class="edge-team-link" data-open-team="${esc(c)}" title="Open ${esc(m.name)} intelligence">${logo(c)}<span>${esc(label||m.name)}</span></button>`}
function decorateRows(){
 qsa('#injuryRows tr').forEach(r=>{if(r.dataset.teamLink)return;const td=r.querySelector('td');const c=codeFromText(td?.textContent);if(c&&td){td.innerHTML=teamButton(c,META[c].name);r.dataset.teamLink='1'}});
 qsa('#standingsGrid tr,.standing-row,.team-row').forEach(r=>{if(r.dataset.teamLink)return;const txt=r.textContent||'';const c=Object.keys(META).find(k=>new RegExp(`(^|\\s)${k}(\\s|$)`).test(txt)||txt.includes(META[k].name));if(!c)return;const t=r.querySelector('td,b,strong,span');if(t){t.innerHTML=teamButton(c,t.textContent.trim()||META[c].name);r.dataset.teamLink='1'}});
 qsa('#newsFeed article,.news-item').forEach(a=>{if(a.dataset.teamLinks)return;const txt=a.textContent||'';const teams=Object.keys(META).filter(c=>new RegExp(`(^|\\W)${c}(\\W|$)`).test(txt)||txt.includes(META[c].name)).slice(0,3);if(teams.length){a.insertAdjacentHTML('beforeend',`<div class="news-team-links">${teams.map(c=>teamButton(c,c)).join('')}</div>`)}a.dataset.teamLinks='1'});
}
function decorateInspector(){const host=document.querySelector('#gameInspector .inspector-content');if(!host||host.querySelector('.inspector-team-nav'))return;const id=new URLSearchParams(location.search).get('game');let g=null;try{g=(model?.games||[]).find(x=>x.game_id===id)}catch(_){}if(!g)return;host.insertAdjacentHTML('afterbegin',`<div class="inspector-team-nav"><span>TEAM INTELLIGENCE</span>${teamButton(g.away)}<i>VS</i>${teamButton(g.home)}</div>`)}
function decorate(){if(!Object.keys(META).length)return;decorateRows();decorateInspector()}
function open(c){if(window.EDGEiQOpenTeam)window.EDGEiQOpenTeam(c)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open-team]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();open(b.dataset.openTeam)},true);
document.addEventListener('edgeiq:core-ready',()=>queueMicrotask(decorate));document.addEventListener('nflops:information-refresh',()=>queueMicrotask(decorate));document.addEventListener('click',e=>{if(e.target.closest('[data-game],[data-view]'))queueMicrotask(decorate)},true);
async function boot(){META=window.EDGEiQTeams||{};if(!Object.keys(META).length)try{META=await fetch('data/team_meta.json?v=135',{cache:'no-store'}).then(r=>r.ok?r.json():{})}catch(_){}decorate();const v=document.querySelector('.version');if(v)v.textContent='EDGEiQ NFL · v13.5 STABLE'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();