(()=>{
'use strict';
const FALLBACK={ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAX:'jax',KC:'kc',LAC:'lac',LA:'lar',LV:'lv',MIA:'mia',MIN:'min',NE:'ne',NO:'no',NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SEA:'sea',SF:'sf',TB:'tb',TEN:'ten',WAS:'wsh'};
let meta={};
const codeSet=new Set(Object.keys(FALLBACK));
const logoUrl=code=>meta?.[code]?.logo||`https://a.espncdn.com/i/teamlogos/nfl/500/${FALLBACK[code]||String(code).toLowerCase()}.png`;
const img=code=>{const el=document.createElement('img');el.className='nfl-team-logo';el.src=logoUrl(code);el.alt=`${meta?.[code]?.name||code} logo`;el.loading='eager';el.decoding='async';el.referrerPolicy='no-referrer';el.onerror=()=>el.remove();return el};
function exactCode(text){const t=(text||'').trim();return codeSet.has(t)?t:null}
function decorateCodeNode(node){if(!node||node.dataset.logoReady)return;const code=exactCode(node.textContent);if(!code)return;node.dataset.logoReady='1';const wrap=document.createElement('span');wrap.className='team-with-logo';wrap.append(img(code),document.createTextNode(code));node.textContent='';node.append(wrap)}
function decorateMatchup(node){if(!node||node.dataset.logoReady)return;const raw=(node.childNodes[0]?.nodeType===3?node.childNodes[0].nodeValue:node.textContent||'').trim();const m=raw.match(/^([A-Z]{2,3})\s*@\s*([A-Z]{2,3})$/);if(!m||!codeSet.has(m[1])||!codeSet.has(m[2]))return;node.dataset.logoReady='1';const small=node.querySelector('small');node.innerHTML='';const row=document.createElement('span');row.className='matchup-with-logos';const a=document.createElement('span');a.className='team-with-logo';a.append(img(m[1]),document.createTextNode(m[1]));const h=document.createElement('span');h.className='team-with-logo';h.append(img(m[2]),document.createTextNode(m[2]));const at=document.createElement('span');at.className='matchup-at';at.textContent='@';row.append(a,at,h);node.append(row);if(small)node.append(small)}
function decorateTeamChip(chip){if(!chip||chip.dataset.logoReady)return;const code=exactCode([...chip.childNodes].map(n=>n.nodeType===3?n.nodeValue:'').join('').trim())||exactCode(chip.textContent.replace(/\s+/g,' ').trim().split(' ').pop());if(!code)return;chip.dataset.logoReady='1';const old=chip.querySelector('.team-logo');if(old){old.textContent='';old.append(img(code))}else chip.prepend(img(code))}
function installBrand(){
  document.title='EDGEiQ NFL · Operations Terminal';
  let desc=document.querySelector('meta[name="description"]');if(desc)desc.content='EDGEiQ NFL — professional NFL intelligence, live operations and frozen fair-line model terminal.';
  if(!document.querySelector('link[data-edgeiq-brand]')){const css=document.createElement('link');css.rel='stylesheet';css.href='edgeiq-brand.css';css.dataset.edgeiqBrand='1';document.head.append(css)}
  if(!document.querySelector('link[rel="icon"]')){const fav=document.createElement('link');fav.rel='icon';fav.href='assets/edgeiq-nfl-logo.svg';document.head.append(fav)}
  const app=document.querySelector('.app-id');if(app&&!app.dataset.edgeiqBrand){app.dataset.edgeiqBrand='1';app.innerHTML='<img class="edgeiq-brand-logo" src="assets/edgeiq-nfl-logo.svg" alt="EDGEiQ NFL logo"><div><strong class="edgeiq-word">EDGE<span class="iq">iQ</span> NFL</strong><span>Operations Terminal</span></div>'}
  const v=document.querySelector('.version');if(v)v.textContent='v5.7 · EDGEiQ NFL';
  const empty=document.querySelector('#inspectorEmpty .empty-icon');if(empty)empty.textContent='EDGEiQ';
  const crumb=document.querySelector('#viewEyebrow');if(crumb&&crumb.textContent==='NFL / OPS')crumb.textContent='EDGEiQ NFL / OPS';
}
function run(root=document){root.querySelectorAll?.('.terminal-row .game-name,.software-card h3,.ws-head>div:first-child>b,#contextRail>b').forEach(decorateMatchup);root.querySelectorAll?.('.inspector-matchup .team-chip').forEach(decorateTeamChip);root.querySelectorAll?.('.ws-team-title>b,#marketRows td:first-child b,#injuryRows td:first-child b,#performanceRows td:first-child,#standingsGrid .division-row b').forEach(n=>{if((n.textContent||'').includes('@'))decorateMatchup(n);else decorateCodeNode(n)})}
function observe(){let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installBrand();run()})});obs.observe(document.body,{subtree:true,childList:true});installBrand();run()}
fetch('data/team_meta.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(x=>{meta=x||{};installBrand();run()}).catch(()=>{installBrand()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();