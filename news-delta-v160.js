(()=>{
'use strict';
const KEY='edgeiq:nfl:news-snapshot:v160';
const norm=s=>String(s||'').toLowerCase().replace(/https?:\/\/\S+/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const id=x=>String(x?.url||'').trim()||norm(x?.title||x?.summary||'');
const mins=ts=>{const t=Date.parse(ts||'');return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):null};
function pri(x){const t=`${x?.category||''} ${x?.title||''} ${x?.summary||''}`.toLowerCase();if(x?.operational_corroboration)return 3;if(/ruled out|inactive|will not play|injured reserve|acl|achilles|starting quarterback|qb1|trade agreed|traded|fired|benched/.test(t))return 3;if(/questionable|doubtful|limited|did not practice|concussion|starter|quarterback|signed|released|weather|wind|rain|snow/.test(t))return 2;return 1}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function write(items){try{const rows={};for(const x of items||[]){const k=id(x);if(!k)continue;rows[k]={p:pri(x),c:Number(x.corroboration)||1,published:x.published||null,title:x.title||''}}localStorage.setItem(KEY,JSON.stringify({at:new Date().toISOString(),items:rows}))}catch(_){}}
function apply(){const W=window.EDGEiQNews;if(!W||!Array.isArray(W.items))return;const prev=read(),old=prev?.items||{},first=!prev;let changes=0,newCount=0,escalated=0,corrUp=0,fresh=0;
for(const x of W.items){const k=id(x),o=old[k],m=mins(x.published),tags=[];if(m!=null&&m<=60){tags.push('FRESH <1H');fresh++}if(!first&&!o){tags.push('NEW');newCount++;changes++}else if(o){const cp=pri(x),cc=Number(x.corroboration)||1;if(cp>Number(o.p||1)){tags.push('ESCALATED');escalated++;changes++}if(cc>Number(o.c||1)){tags.push(`CORROBORATION +${cc-Number(o.c||1)}`);corrUp++;changes++}}x.delta_tags=tags;x.delta_material=tags.includes('NEW')||tags.includes('ESCALATED')||tags.some(t=>t.startsWith('CORROBORATION +'));x.freshness_minutes=m}
W.delta_summary={baseline:first,changes,new:newCount,escalated,corroboration_up:corrUp,fresh_under_60m:fresh,compared_at:prev?.at||null,generated_at:new Date().toISOString(),policy:'OPERATIONAL_CHANGE_DETECTION_ONLY',model_input:false};window.EDGEiQNews=W;write(W.items);document.dispatchEvent(new CustomEvent('edgeiq:news-delta',{detail:W.delta_summary}));}
document.addEventListener('edgeiq:news-loaded',apply);document.addEventListener('nflops:information-refresh',()=>setTimeout(apply,0));
if(window.EDGEiQNews?.items?.length)queueMicrotask(apply);
})();