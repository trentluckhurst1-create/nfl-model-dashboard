(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const games=()=>window.NFLModel?.games||[];
function gameFromText(text){const t=String(text||'').toUpperCase().replace(/\s+/g,' ');return games().find(g=>t.includes(`${g.away} @ ${g.home}`))||null}
function linkRows(){['#marketRows','#performanceRows'].forEach(sel=>{$$(sel+' tr').forEach(tr=>{if(tr.dataset.game)return;const g=gameFromText(tr.cells?.[0]?.innerText||tr.innerText);if(!g)return;tr.dataset.game=g.game_id;tr.tabIndex=0;tr.title='Open Game Control Centre'})});$$('#standingsGrid .division-row').forEach(r=>{if(r.dataset.edgeiqLinked)return;r.dataset.edgeiqLinked='1';r.tabIndex=0;r.title='Open this team in Week 1 games';r.addEventListener('click',()=>{const team=r.querySelector('b')?.innerText?.trim();const input=$('#globalSearch');if(input&&team)input.value=team;window.EDGEiQNav?.go?.('games');setTimeout(()=>{if(input)input.dispatchEvent(new Event('input',{bubbles:true}))},0)});r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();r.click()}})})}
function classify(card){const t=card.innerText.toLowerCase();if(/injur|questionable|doubtful|out\b|practice/.test(t))return'injury';if(/trade|waiv|sign|release|transaction|roster/.test(t))return'transaction';return'game'}
function wireNews(){const btns=$$('.news-filter');btns.forEach(b=>{if(b.dataset.edgeiqWired)return;b.dataset.edgeiqWired='1';b.addEventListener('click',()=>{btns.forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.newsFilter||'all';$$('#newsFeed .news-card').forEach(card=>card.hidden=f!=='all'&&classify(card)!==f)})})}
function keyboard(){document.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const el=e.target.closest?.('[data-game]');if(!el||el.closest('#edgeiqV7'))return;e.preventDefault();window.EDGEiQNav?.openGame?.(el.dataset.game)})}
function markCards(){$$('.software-card[data-game],.terminal-row[data-game],.v8-tick[data-game]').forEach(x=>{if(!x.hasAttribute('tabindex'))x.tabIndex=0;x.setAttribute('role','button')})}
function scan(){linkRows();wireNews();markCards()}
function boot(){scan();keyboard();new MutationObserver(()=>scan()).observe(document.body,{childList:true,subtree:true});document.addEventListener('nflops:information-refresh',scan);document.addEventListener('edgeiq:core-ready',scan)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();