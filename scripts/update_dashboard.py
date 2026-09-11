from pathlib import Path
from datetime import datetime, timezone
import json, requests, xml.etree.ElementTree as ET, re, html

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; MODEL=DATA/'model_snapshot.json'; OUT=DATA/'dashboard.json'; NEWS=DATA/'news.json'; CHANGES=DATA/'changes.json'
HEAD={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','Accept':'application/json,text/plain,*/*','Referer':'https://www.espn.com/'}
TEAM={"Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB","Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA","Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"}
ABBR_ALIAS={'LAR':'LA','WSH':'WAS','JAC':'JAX'}
ALIASES={k:[k,k.split()[-1]] for k in TEAM}; ALIASES.update({'San Francisco 49ers':['49ers','Niners','San Francisco'],'Los Angeles Rams':['Rams'],'Los Angeles Chargers':['Chargers'],'New England Patriots':['Patriots'],'Seattle Seahawks':['Seahawks'],'Las Vegas Raiders':['Raiders'],'Tampa Bay Buccaneers':['Buccaneers','Bucs'],'Kansas City Chiefs':['Chiefs'],'Green Bay Packers':['Packers'],'New York Jets':['Jets'],'New York Giants':['Giants']})
TRUSTED=[{'name':'ESPN NFL','url':'https://www.espn.com/espn/rss/nfl/news','tier':'NETWORK'},{'name':'CBS Sports NFL','url':'https://www.cbssports.com/rss/headlines/nfl/','tier':'NETWORK'}]
REPORTERS=[{'name':'Ian Rapoport','org':'NFL Network','handle':'@RapSheet','profile':'https://x.com/RapSheet','tier':'INSIDER'},{'name':'Adam Schefter','org':'ESPN','handle':'@AdamSchefter','profile':'https://x.com/AdamSchefter','tier':'INSIDER'},{'name':'Tom Pelissero','org':'NFL Network','handle':'@TomPelissero','profile':'https://x.com/TomPelissero','tier':'INSIDER'}]

def code(t):
    if not isinstance(t,dict): return None
    a=t.get('abbreviation'); return ABBR_ALIAS.get(a,a) if a else TEAM.get(t.get('displayName'))

def get_json(url):
    r=requests.get(url,timeout=30,headers=HEAD); r.raise_for_status(); return r.json()

def find_events(obj):
    if isinstance(obj,dict):
        ev=obj.get('events')
        if isinstance(ev,list) and ev and isinstance(ev[0],dict) and ('competitions' in ev[0] or 'date' in ev[0]): return ev
        for k in ('content','scoreboard','gamepackageJSON','sports'):
            if k in obj:
                found=find_events(obj[k])
                if found: return found
        for v in obj.values():
            found=find_events(v)
            if found: return found
    elif isinstance(obj,list):
        for v in obj:
            found=find_events(v)
            if found: return found
    return []

def get_scoreboard(season,week):
    urls=[
        ('ESPN_SITE',f'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates={season}&seasontype=2&week={week}'),
        ('ESPN_CDN','https://cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50'),
        ('ESPN_CDN_SCHEDULE',f'https://cdn.espn.com/core/nfl/schedule?xhr=1&year={season}&week={week}')
    ]
    errs=[]
    for source,url in urls:
        try:
            data=get_json(url); events=find_events(data)
            if events: return {'events':events},source
            errs.append(f'{source}: no events')
        except Exception as e: errs.append(f'{source}: {type(e).__name__} {e}')
    raise RuntimeError(' | '.join(errs))

def parse_stats(sm):
    out={}
    for b in (sm.get('boxscore') or {}).get('teams') or []:
        c=code(b.get('team') or {}); stats={}
        if not c: continue
        for s in b.get('statistics') or []:
            k=s.get('name') or s.get('label')
            if k: stats[k]={'display':s.get('displayValue') if s.get('displayValue') is not None else s.get('value')}
        out[c]=stats
    return out

def parse_players(sm):
    out={}
    for b in (sm.get('boxscore') or {}).get('players') or []:
        c=code(b.get('team') or {}); cats={}
        if not c: continue
        for cat in b.get('statistics') or []:
            k=cat.get('name') or cat.get('displayName') or 'Stats'; rows=[]
            for a in cat.get('athletes') or []:
                n=(a.get('athlete') or {}).get('displayName')
                if n: rows.append({'name':n,'stats':a.get('stats') or [],'starter':bool(a.get('starter'))})
            if rows: cats[k]=rows[:12]
        out[c]=cats
    return out

def fetch_week(model,old):
    season=int(model.get('season',2026)); week=int(model.get('week',1)); now=datetime.now(timezone.utc).isoformat()
    data,score_source=get_scoreboard(season,week)
    wanted={(g['away'],g['home']):g['game_id'] for g in model.get('games',[])}; scores=[]; records={}; meta={}; rich={}
    for event in data.get('events',[]):
        comp=(event.get('competitions') or [{}])[0]; teams={}; competitors=comp.get('competitors') or []
        for x in competitors:
            c=code(x.get('team') or {})
            if not c: continue
            teams[x.get('homeAway')]={'code':c,'score':int(x.get('score') or 0),'id':str((x.get('team') or {}).get('id') or '')}
            recs=x.get('records') or []; overall=next((z.get('summary') for z in recs if z.get('type')=='total'),None) or (recs[0].get('summary') if recs else None)
            if overall: records[c]=overall
        if 'away' not in teams or 'home' not in teams: continue
        pair=(teams['away']['code'],teams['home']['code']); gid=wanted.get(pair)
        if not gid: continue
        status=event.get('status') or {}; st=status.get('type') or {}; state='FINAL' if st.get('completed') else ('LIVE' if st.get('state')=='in' else 'SCHEDULED'); sit=comp.get('situation') or {}
        poss=''; pid=str(sit.get('possession') or '')
        if pid: poss=next((v['code'] for v in teams.values() if v['id']==pid),'')
        broadcasts=[]
        for b in comp.get('broadcasts') or []: broadcasts.extend(b.get('names') or [])
        item={'game_id':gid,'espn_event_id':str(event.get('id') or ''),'away':pair[0],'home':pair[1],'away_score':teams['away']['score'],'home_score':teams['home']['score'],'state':state,'detail':st.get('shortDetail') or st.get('description') or '','clock':status.get('displayClock') or '','period':status.get('period') or 0,'down_distance':sit.get('downDistanceText') or '','possession':poss,'last_play':(sit.get('lastPlay') or {}).get('text') or '','commence_utc':event.get('date'),'network':', '.join(dict.fromkeys(broadcasts)),'venue':(comp.get('venue') or {}).get('fullName') or '','source':score_source,'updated_at_utc':now}
        scores.append(item); meta[gid]={k:item[k] for k in ['commence_utc','network','venue','espn_event_id']}
        if state in {'LIVE','FINAL'} and event.get('id'):
            try:
                sm=get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={event['id']}")
                plays=[]
                for p in (sm.get('plays') or [])[-80:]: plays.append({'period':(p.get('period') or {}).get('number'),'clock':(p.get('clock') or {}).get('displayValue'),'text':p.get('text') or p.get('shortText') or '','scoring':bool(p.get('scoringPlay')),'away_score':p.get('awayScore'),'home_score':p.get('homeScore')})
                rich[gid]={'source':'ESPN_GAME_SUMMARY','updated_at_utc':now,'team_stats':parse_stats(sm),'player_stats':parse_players(sm),'recent_plays':plays}
            except Exception:
                if gid in (old.get('live_stats') or {}): rich[gid]=old['live_stats'][gid]
    if not scores: raise RuntimeError(f'{score_source} returned no matching Week games')
    return scores,records,meta,rich,now,score_source

def clean_text(s): return re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',html.unescape(s or ''))).strip()
def category(t,s=''):
    x=(t+' '+s).lower()
    if any(k in x for k in ['injur','questionable','doubtful','ruled out','practice','surgery','mri','concussion']): return 'injury'
    if any(k in x for k in ['sign','trade','waiv','release','contract','extension','roster','activated','reserve']): return 'transaction'
    return 'game'
def teams_for(text):
    s=text.lower(); found=[]
    for full,c in TEAM.items():
        if any(re.search(r'\b'+re.escape(a.lower())+r'\b',s) for a in ALIASES.get(full,[full])): found.append(c)
    return sorted(set(found))
def promo(x): return re.search(r'promo code|bonus bets|sportsbook promos|sign up and bet|best nfl betting promos',x,re.I) is not None

def fetch_news():
    items=[]
    for src in TRUSTED:
        try:
            rr=requests.get(src['url'],timeout=25,headers=HEAD); rr.raise_for_status(); root=ET.fromstring(rr.content)
            for x in root.findall('.//item')[:30]:
                t=clean_text(x.findtext('title')); u=(x.findtext('link') or '').strip(); d=clean_text(x.findtext('description')); p=(x.findtext('pubDate') or '').strip()
                if t and u and not promo(t+' '+d): items.append({'title':t,'url':u,'summary':d[:420],'published':p,'source':src['name'],'source_type':'publisher','trust':src['tier'],'category':category(t,d),'teams':teams_for(t+' '+d)})
        except Exception as e: print('news refresh failed',src['name'],type(e).__name__)
    seen=set(); out=[]
    for x in items:
        k=re.sub(r'\W+',' ',x['title'].lower()).strip()
        if k not in seen: seen.add(k); out.append(x)
    return out[:50]

def build_changes(old,new,oldnews,newnews,prior,now):
    fresh=[]; om={x.get('game_id'):x for x in old.get('scores',[])}
    for s in new.get('scores',[]):
        p=om.get(s.get('game_id'),{})
        if p.get('state')!=s.get('state') or p.get('away_score')!=s.get('away_score') or p.get('home_score')!=s.get('home_score'):
            fresh.append({'ts':now,'type':'GAME','game_id':s.get('game_id'),'title':f"{s.get('away')} @ {s.get('home')}",'detail':f"{s.get('state')} · {s.get('away')} {s.get('away_score')} – {s.get('home_score')} {s.get('home')}"})
    old_titles={x.get('title') for x in oldnews.get('items',[])}
    for n in newnews.get('items',[])[:15]:
        if n.get('title') not in old_titles: fresh.append({'ts':now,'type':'NEWS','title':n.get('title'),'detail':n.get('summary','')[:180],'teams':n.get('teams',[]),'url':n.get('url')})
    items=fresh+(prior.get('items',[]) if prior else []); seen=set(); out=[]
    for x in items:
        k=(x.get('type'),x.get('game_id'),x.get('title'),x.get('detail'))
        if k in seen: continue
        seen.add(k); out.append(x)
    return {'updated_at_utc':now,'items':out[:120]}

def main():
    model=json.loads(MODEL.read_text()); old=json.loads(OUT.read_text()) if OUT.exists() else {}; oldnews=json.loads(NEWS.read_text()) if NEWS.exists() else {}; prior=json.loads(CHANGES.read_text()) if CHANGES.exists() else {'items':[]}
    checked=datetime.now(timezone.utc).isoformat(); score_ok=True; score_source=old.get('score_source','ESPN_SCOREBOARD')
    try: scores,records,meta,rich,source_ts,score_source=fetch_week(model,old)
    except Exception as e:
        print('scoreboard refresh failed:',e); score_ok=False; scores=old.get('scores',[]); records=old.get('records',{}); meta=old.get('game_meta',{}); rich=old.get('live_stats',{}); source_ts=old.get('updated_at_utc')
    payload={'updated_at_utc':source_ts,'checked_at_utc':checked,'feed_health':{'scoreboard_ok':score_ok,'checked_at_utc':checked,'source':score_source},'season':int(model.get('season',2026)),'week':int(model.get('week',1)),'score_source':score_source,'scores':scores,'records':records,'game_meta':meta,'live_stats':rich,'injuries':old.get('injuries',[])}
    if not scores: raise RuntimeError('No scoreboard state available')
    fresh=fetch_news(); news_ok=bool(fresh); news_ts=checked if news_ok else oldnews.get('updated_at_utc'); news={'updated_at_utc':news_ts,'checked_at_utc':checked,'policy':'CURATED_TRUSTED_SOURCES_ONLY','items':fresh or oldnews.get('items',[]),'reporters':REPORTERS}
    changes=build_changes(old,payload,oldnews,news,prior,checked)
    OUT.write_text(json.dumps(payload,indent=2)); NEWS.write_text(json.dumps(news,indent=2)); CHANGES.write_text(json.dumps(changes,indent=2))
    print(f"ops refresh scoreboard_ok={score_ok} source={score_source} games={len(scores)} news_ok={news_ok} changes={len(changes['items'])}")
if __name__=='__main__': main()
