from pathlib import Path
from datetime import datetime, timezone
import json, re, html, requests, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
NEWS=ROOT/'data'/'news.json'
FOX_RSS='https://api.foxsports.com/v2/content/optimized-rss?partnerKey=MB0Wehpmuj2lUhuRhQaafhBjAJqaPU244mlTDK1i&size=30&tags=fs%2Fnfl'
HEAD={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','Accept':'application/rss+xml,application/xml,text/xml,*/*','Referer':'https://www.foxsports.com/rss-feeds'}
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
def promo(x): return re.search(r'promo code|bonus bets|sportsbook promos|sign up and bet|best nfl betting promos|kalshi|polymarket',x,re.I) is not None

def fetch():
    r=requests.get(FOX_RSS,headers=HEAD,timeout=25); r.raise_for_status(); root=ET.fromstring(r.content); out=[]
    for x in root.findall('.//item')[:30]:
        t=clean(x.findtext('title')); u=(x.findtext('link') or '').strip(); d=clean(x.findtext('description')); p=(x.findtext('pubDate') or '').strip()
        if not t or not u or promo(t+' '+d): continue
        if 'foxsports.com' not in u.lower(): continue
        out.append({'title':t,'url':u,'summary':d[:420],'published':p,'source':'FOX Sports NFL','source_type':'publisher','trust':'NETWORK','category':category(t,d),'teams':teams_for(t+' '+d)})
    if not out: raise RuntimeError('No FOX Sports NFL items returned')
    return out

def main():
    data=json.loads(NEWS.read_text()) if NEWS.exists() else {'items':[],'sources':{}}
    try:
        fox=fetch(); others=[x for x in data.get('items',[]) if x.get('source')!='FOX Sports NFL']
        merged=[]; seen=set()
        for x in fox+others:
            k=re.sub(r'\W+',' ',str(x.get('title','')).lower()).strip()
            if not k or k in seen: continue
            seen.add(k); merged.append(x)
        data['items']=merged[:100]
        data.setdefault('sources',{})['FOX Sports NFL']={'ok':True,'items':len(fox),'feed':'FOX_OFFICIAL_NFL_RSS'}
        data['checked_at_utc']=datetime.now(timezone.utc).isoformat(); data['updated_at_utc']=data['checked_at_utc']; data['model_input']=False
        NEWS.write_text(json.dumps(data,indent=2)); print(f'FOX_NEWS=OK items={len(fox)}')
    except Exception as e:
        data.setdefault('sources',{})['FOX Sports NFL']={'ok':False,'items':0,'error':type(e).__name__,'feed':'FOX_OFFICIAL_NFL_RSS'}
        data['checked_at_utc']=datetime.now(timezone.utc).isoformat(); NEWS.write_text(json.dumps(data,indent=2)); print(f'FOX_NEWS=UNAVAILABLE {type(e).__name__}')

if __name__=='__main__': main()
