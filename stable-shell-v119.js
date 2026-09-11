(()=>{
'use strict';
const VIEWS=['home','command','games','market','injuries','news','performance','standings','model'];
const TITLES={home:['EDGEiQ NFL / HOME','NFL Intelligence Home'],command:['EDGEiQ NFL / COMMAND','NFL Command Centre'],games:['EDGEiQ NFL / GAMES','Week 1 Games'],market:['EDGEiQ NFL / MARKET','Market Monitor'],injuries:['EDGEiQ NFL / PERSONNEL','Personnel Centre'],news:['EDGEiQ NFL / INTELLIGENCE','Intelligence Desk'],performance:['EDGEiQ NFL / PERFORMANCE','Performance'],standings:['EDGEiQ NFL / STANDINGS','Standings'],model:['EDGEiQ NFL / MODEL','Model Console']};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function renderView(view){
  if(!VIEWS.includes(view))view='home';
  $$('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  $$('.side-nav [data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  const t=TITLES[view]||TITLES.home;
  if($('#viewEyebrow'))$('#viewEyebrow').textContent=t[0];
  if($('#viewTitle'))$('#viewTitle').textContent=t[1];
  document.title=`EDGEiQ NFL · ${t[1]}`;
  const fn={home:'renderHome',command:'renderCommand',games:'renderGames',market:'renderMarket',injuries:'renderInjuries',news:'renderNews',performance:'renderPerformance',standings:'renderStandings'}[view];
  if(fn&&typeof window[fn]==='function'){try{window[fn]()}catch(e){console.warn('EDGEiQ view render failed',view,e)}}
  return view;
}
function setUrl(view,game){
  const u=new URL(location.href);u.search='';u.searchParams.set('view',view);if(game)u.searchParams.set('game',game);history.pushState({view,game},'',u.pathname+'?'+u.searchParams.toString());
}
function openGame(id){
  if(!id)return;
  renderView('command');
  if(typeof window.selectGame==='function')window.selectGame(id);
  else if(typeof selectGame==='function')selectGame(id);
  setUrl('command',id);
}
function go(view){renderView(view);setUrl(view,null)}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-view],[data-view-jump]');
  if(nav){const view=nav.dataset.view||nav.dataset.viewJump;if(VIEWS.includes(view)){e.preventDefault();e.stopPropagation();go(view);return}}
  const game=e.target.closest('[data-game]');
  if(game){e.preventDefault();e.stopPropagation();openGame(game.dataset.game)}
},true);
window.addEventListener('popstate',()=>{const q=new URLSearchParams(location.search),view=q.get('view')||'home',game=q.get('game');renderView(view);if(game&&typeof window.selectGame==='function')window.selectGame(game)});
function boot(){
  const q=new URLSearchParams(location.search),game=q.get('game'),view=game?'command':(q.get('view')||'home');
  renderView(view);
  if(game&&typeof window.selectGame==='function')window.selectGame(game);
  const ver=document.querySelector('.version');if(ver)ver.textContent='EDGEiQ NFL · v11.9 STABLE';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();