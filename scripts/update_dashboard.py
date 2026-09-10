from pathlib import Path
from datetime import datetime,timezone
import json,requests,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; MODEL=DATA/'model_snapshot.json'; OUT=DATA/'dashboard.json'; NEWS=DATA/'news.json'
TEAM={"Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB","Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA","Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"}
HEAD={'User-Agent':'Mozilla/5.0 (compatible; NFLModelTerminal/1.0)'}
def fetch_week(model):
    try:r=requests.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=1',timeout=30,headers=HEAD);r.raise_for_status();d=r.json()
    except Exception as e:print('scoreboard refresh failed:',e);return [],{},{}
    wanted={(g['away'],g['home']):g['game_id'] for g in model['games']};out=[];records={};meta={}
    for e in d.get('events',[]):
        c=(e.get('competitions') or [{}])[0];t={}
        for x in c.get('competitors',[]):
            code=TEAM.get(x.get('team',{}).get('displayName'))
            if not code:continue
            t[x.get('homeAway')]=(code,x.get('score'));recs=x.get('records') or [];overall=next((z.get('summary') for z in recs if z.get('type')=='total'),None) or (recs[0].get('summary') if recs else None)
            if overall:records[code]=overall
        if 'away' not in t or 'home' not in t:continue
        pair=(t['away'][0],t['home'][0]);gid=wanted.get(pair)
        if not gid:continue
        st=e.get('status',{}).get('type',{});state='FINAL' if st.get('completed') else ('LIVE' if st.get('state')=='in' else 'SCHEDULED');broadcasts=[]
        for b in c.get('broadcasts') or []:broadcasts.extend(b.get('names') or [])
        item={'game_id':gid,'away':pair[0],'home':pair[1],'away_score':int(t['away'][1] or 0),'home_score':int(t['home'][1] or 0),'state':state,'detail':st.get('shortDetail') or st.get('description') or '','commence_utc':e.get('date'),'network':', '.join(dict.fromkeys(broadcasts)) if broadcasts else '','venue':(c.get('venue') or {}).get('fullName') or ''};out.append(item);meta[gid]={k:item[k] for k in ['commence_utc','network','venue']}
    return out,records,meta
def fetch_news():
    urls=['https://www.espn.com/espn/rss/nfl/news','https://www.cbssports.com/rss/headlines/nfl/']
    items=[]
    for url in urls:
        try:
            r=requests.get(url,timeout=25,headers=HEAD);r.raise_for_status();root=ET.fromstring(r.content)
            for x in root.findall('.//item')[:12]:
                title=(x.findtext('title') or '').strip();link=(x.findtext('link') or '').strip();desc=(x.findtext('description') or '').strip();pub=(x.findtext('pubDate') or '').strip()
                if title and link:items.append({'title':title,'url':link,'summary':desc[:420],'published':pub,'source':'ESPN' if 'espn' in url else 'CBS Sports'})
        except Exception as e:print('news refresh failed:',url,e)
    seen=set();clean=[]
    for x in items:
        k=x['title'].lower()
        if k in seen:continue
        seen.add(k);clean.append(x)
    return clean[:20]
def main():
    model=json.loads(MODEL.read_text(encoding='utf-8'));old=json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {};scores,records,game_meta=fetch_week(model);now=datetime.now(timezone.utc).isoformat();payload={'updated_at_utc':now,'season':2026,'week':1,'scores':scores or old.get('scores',[]),'records':records or old.get('records',{}),'game_meta':game_meta or old.get('game_meta',{}),'injuries':old.get('injuries',[])};OUT.write_text(json.dumps(payload,indent=2),encoding='utf-8');news=fetch_news();oldnews=json.loads(NEWS.read_text(encoding='utf-8')) if NEWS.exists() else {};NEWS.write_text(json.dumps({'updated_at_utc':now,'items':news or oldnews.get('items',[])},indent=2),encoding='utf-8');print(f"dashboard refreshed: scores={len(payload['scores'])} records={len(payload['records'])} news={len(news)}")
if __name__=='__main__':main()
