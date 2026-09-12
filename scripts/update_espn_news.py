from pathlib import Path
from datetime import datetime, timezone
import json, re, html, requests

ROOT=Path(__file__).resolve().parents[1]
NEWS=ROOT/'data'/'news.json'
URLS=[
    'https://now.core.api.espn.com/v1/sports/news?leagues=nfl&limit=50',
    'https://now.core.api.espn.com/v1/sports/news?sport=football&limit=50',
]
HEAD={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','Accept':'application/json,text/plain,*/*','Referer':'https://www.espn.com/'}
TEAM={"Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB","Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA","Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"}
ALIASES={k:[k,k.split()[-1]] for k in TEAM}
ALIASES.update({'San Francisco 49ers':['49ers','Niners','San Francisco'],'Los Angeles Rams':['Rams'],'Los Angeles Chargers':['Chargers'],'New England Patriots':['Patriots'],'Seattle Seahawks':['Seahawks'],'Las Vegas Raiders':['Raiders'],'Tampa Bay Buccaneers':['Buccaneers','Bucs'],'Kansas City Chiefs':['Chiefs'],'Green Bay Packers':['Packers'],'New York Jets':['Jets'],'New York Giants':['Giants']})

def clean(s): return re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',html.unescape(str(s or '')))).strip()
def category(t,s=''):
    x=(t+' '+s).lower()
    if any(k in x for k in ['injur','questionable','doubtful','ruled out','practice','surgery','mri','concussion']): return 'injury'
    if any(k in x for k in ['sign','trade','waiv','release','contract','extension','roster','activated','reserve']): return 'transaction'
    if any(k in x for k in ['quarterback',' qb ','starter','starting']): return 'qb'
    return 'game'
def teams_for(text):
    s=text.lower(); found=[]
    for full,c in TEAM.items():
        if any(re.search(r'\b'+re.escape(a.lower())+r'\b',s) for a in ALIASES.get(full,[full])): found.append(c)
    return sorted(set(found))
def extract_url(x):
    for key in ('link','url','href'):
        v=x.get(key)
        if isinstance(v,str) and v.startswith('http'): return v
    links=x.get('links')
    if isinstance(links,dict):
        web=links.get('web')
        if isinstance(web,dict) and isinstance(web.get('href'),str): return web['href']
        if isinstance(web,str): return web
        for v in links.values():
            if isinstance(v,dict) and isinstance(v.get('href'),str) and 'espn' in v['href']: return v['href']
    if isinstance(links,list):
        for v in links:
            if isinstance(v,dict) and isinstance(v.get('href'),str) and 'espn' in v['href']: return v['href']
    return ''
def fetch():
    last=None
    for url in URLS:
        try:
            r=requests.get(url,headers=HEAD,timeout=25); r.raise_for_status(); d=r.json()
            rows=d.get('headlines') or d.get('articles') or d.get('items') or []
            out=[]
            for x in rows:
                if not isinstance(x,dict): continue
                t=clean(x.get('headline') or x.get('title'))
                s=clean(x.get('description') or x.get('summary') or x.get('story'))
                u=extract_url(x); p=x.get('published') or x.get('lastModified') or x.get('date') or ''
                blob=f'{t} {s} {u}'.lower()
                if not t or not u: continue
                # The sport=football fallback can include college; keep only obvious NFL/league items where metadata exists.
                cats=json.dumps(x.get('categories') or x.get('category') or '').lower()
                if 'college' in cats or 'ncaaf' in cats: continue
                out.append({'title':t,'url':u,'summary':s[:420],'published':p,'source':'ESPN NFL','source_type':'publisher','trust':'NETWORK','category':category(t,s),'teams':teams_for(t+' '+s)})
            if out: return out
        except Exception as e: last=e
    raise last or RuntimeError('No ESPN news returned')

def main():
    data=json.loads(NEWS.read_text()) if NEWS.exists() else {'items':[],'sources':{}}
    try:
        espn=fetch(); others=[x for x in data.get('items',[]) if x.get('source')!='ESPN NFL']
        merged=[]; seen=set()
        for x in espn+others:
            k=re.sub(r'\W+',' ',str(x.get('title','')).lower()).strip()
            if not k or k in seen: continue
            seen.add(k); merged.append(x)
        data['items']=merged[:80]
        data.setdefault('sources',{})['ESPN NFL']={'ok':True,'items':len(espn),'feed':'ESPN_NOW_API'}
        data['checked_at_utc']=datetime.now(timezone.utc).isoformat(); data['updated_at_utc']=data['checked_at_utc']; data['model_input']=False
        NEWS.write_text(json.dumps(data,indent=2)); print(f'ESPN_NEWS=OK items={len(espn)}')
    except Exception as e:
        data.setdefault('sources',{})['ESPN NFL']={'ok':False,'items':0,'error':type(e).__name__,'feed':'ESPN_NOW_API'}
        data['checked_at_utc']=datetime.now(timezone.utc).isoformat(); NEWS.write_text(json.dumps(data,indent=2)); print(f'ESPN_NEWS=UNAVAILABLE {type(e).__name__}')

if __name__=='__main__': main()
