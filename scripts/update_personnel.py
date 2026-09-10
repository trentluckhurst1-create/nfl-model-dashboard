from pathlib import Path
from datetime import datetime, timezone
import json
import requests

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "personnel.json"
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; EDGEiQ-NFL/1.0)"}

TEAM_MAP = {
    "ARI":"ari","ATL":"atl","BAL":"bal","BUF":"buf","CAR":"car","CHI":"chi","CIN":"cin","CLE":"cle",
    "DAL":"dal","DEN":"den","DET":"det","GB":"gb","HOU":"hou","IND":"ind","JAX":"jax","KC":"kc",
    "LAC":"lac","LA":"lar","LV":"lv","MIA":"mia","MIN":"min","NE":"ne","NO":"no","NYG":"nyg",
    "NYJ":"nyj","PHI":"phi","PIT":"pit","SEA":"sea","SF":"sf","TB":"tb","TEN":"ten","WAS":"wsh"
}

def get_json(url):
    r = requests.get(url, timeout=30, headers=HEAD)
    r.raise_for_status()
    return r.json()

def parse_roster(data):
    roster = []
    for group in data.get("athletes") or []:
        position_group = group.get("position") or group.get("displayName") or ""
        for p in group.get("items") or []:
            pos = (p.get("position") or {}).get("abbreviation") or (p.get("position") or {}).get("name") or position_group
            status = p.get("status") or {}
            roster.append({
                "id": str(p.get("id") or ""),
                "name": p.get("fullName") or p.get("displayName") or p.get("shortName") or "",
                "position": pos or "",
                "jersey": p.get("jersey") or "",
                "status": status.get("name") or status.get("type") or "ACTIVE",
                "headshot": (p.get("headshot") or {}).get("href") or ""
            })
    return [x for x in roster if x["name"]]

def athlete_name(obj):
    if not isinstance(obj, dict): return ""
    a = obj.get("athlete") if isinstance(obj.get("athlete"), dict) else obj
    return a.get("fullName") or a.get("displayName") or a.get("shortName") or ""

def normalize_depth(data):
    chart = {}
    # ESPN site shape: depthCharts[] -> positions{slot:{position,athletes[]}}
    groups = data.get("depthCharts") or data.get("depthcharts") or data.get("items") or []
    if isinstance(groups, dict): groups = [groups]
    for group in groups if isinstance(groups, list) else []:
        if not isinstance(group, dict): continue
        positions = group.get("positions") or {}
        if isinstance(positions, dict):
            iterable = positions.values()
        elif isinstance(positions, list):
            iterable = positions
        else:
            iterable = []
        for slot in iterable:
            if not isinstance(slot, dict): continue
            pobj = slot.get("position") or {}
            pos = pobj.get("abbreviation") or pobj.get("name") or slot.get("abbreviation") or slot.get("name")
            athletes = slot.get("athletes") or slot.get("items") or []
            rows = []
            for i,p in enumerate(athletes if isinstance(athletes,list) else []):
                name = athlete_name(p)
                if name:
                    rows.append({"name":name,"rank":p.get("rank") or p.get("order") or i+1,"starter":(p.get("rank") or i+1)==1})
            if pos and rows:
                chart.setdefault(str(pos),[]).extend(rows)
    return chart

def main():
    now = datetime.now(timezone.utc).isoformat()
    teams, errors = {}, []
    roster_ok = depth_ok = 0
    for code, espn_code in TEAM_MAP.items():
        entry={"as_of":now,"roster":[],"depth_chart":{},"source":"ESPN_PUBLIC_TEAM_ENDPOINTS"}
        try:
            entry["roster"]=parse_roster(get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{espn_code}/roster"))
            roster_ok += bool(entry["roster"])
        except Exception as e: errors.append(f"{code}:roster:{type(e).__name__}")
        try:
            entry["depth_chart"]=normalize_depth(get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{espn_code}/depthcharts"))
            depth_ok += bool(entry["depth_chart"])
        except Exception as e: errors.append(f"{code}:depth:{type(e).__name__}")
        teams[code]=entry
    status="LIVE" if roster_ok==32 else ("PARTIAL" if roster_ok else "SOURCE_UNAVAILABLE")
    payload={"schema_version":"1.2","status":status,"updated_at_utc":now,"source":"ESPN_PUBLIC_TEAM_ENDPOINTS","coverage":{"rosters":roster_ok,"depth_charts":depth_ok,"teams":32},"policy":{"model_input":False,"purpose":"INFORMATION_LAYER_ONLY","notes":"Roster/depth data is informational only and never mutates frozen 008A. Missing source data remains unavailable, never inferred."},"errors":errors[:40],"teams":teams}
    OUT.write_text(json.dumps(payload,indent=2),encoding="utf-8")
    print(f"personnel refreshed: rosters={roster_ok}/32 depth={depth_ok}/32 status={status}")

if __name__ == "__main__": main()
