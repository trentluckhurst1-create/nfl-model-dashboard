from pathlib import Path
from datetime import datetime, timezone
import json
import requests

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "personnel.json"
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; EDGEiQ-NFL/1.0)"}
YEAR = 2026
TEAM_IDS = {
    "ARI":22,"ATL":1,"BAL":33,"BUF":2,"CAR":29,"CHI":3,"CIN":4,"CLE":5,
    "DAL":6,"DEN":7,"DET":8,"GB":9,"HOU":34,"IND":11,"JAX":30,"KC":12,
    "LAC":24,"LA":14,"LV":13,"MIA":15,"MIN":16,"NE":17,"NO":18,"NYG":19,
    "NYJ":20,"PHI":21,"PIT":23,"SEA":26,"SF":25,"TB":27,"TEN":10,"WAS":28
}

def get_json(url):
    r = requests.get(url, timeout=30, headers=HEAD)
    r.raise_for_status()
    return r.json()

def first_json(urls):
    last = None
    for url in urls:
        try:
            return get_json(url), url
        except Exception as exc:
            last = exc
    if last:
        raise last
    raise RuntimeError("no endpoint candidates")

def parse_roster(data):
    roster = []
    groups = data.get("athletes") or []
    if isinstance(groups, dict):
        groups = list(groups.values())
    for group in groups if isinstance(groups, list) else []:
        if not isinstance(group, dict):
            continue
        position_group = group.get("position") or group.get("displayName") or ""
        items = group.get("items")
        if items is None and (group.get("id") or group.get("displayName") or group.get("fullName")):
            items = [group]
        for p in items or []:
            if not isinstance(p, dict):
                continue
            pos_obj = p.get("position") or {}
            pos = pos_obj.get("abbreviation") or pos_obj.get("name") or position_group
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
    if not isinstance(obj, dict):
        return ""
    a = obj.get("athlete") if isinstance(obj.get("athlete"), dict) else obj
    return a.get("fullName") or a.get("displayName") or a.get("shortName") or ""

def normalize_depth(data):
    chart = {}
    groups = data.get("depthCharts") or data.get("depthcharts") or data.get("items") or []
    if isinstance(groups, dict):
        groups = [groups]
    for group in groups if isinstance(groups, list) else []:
        if not isinstance(group, dict):
            continue
        positions = group.get("positions") or {}
        iterable = positions.values() if isinstance(positions, dict) else (positions if isinstance(positions, list) else [])
        for slot in iterable:
            if not isinstance(slot, dict):
                continue
            pobj = slot.get("position") or {}
            pos = pobj.get("abbreviation") or pobj.get("name") or slot.get("abbreviation") or slot.get("name")
            athletes = slot.get("athletes") or slot.get("items") or []
            rows = []
            for i, p in enumerate(athletes if isinstance(athletes, list) else []):
                name = athlete_name(p)
                if name:
                    rank = p.get("rank") or p.get("order") or i + 1
                    rows.append({"name": name, "rank": rank, "starter": rank == 1})
            if pos and rows:
                chart.setdefault(str(pos), []).extend(rows)
    return chart

def main():
    now = datetime.now(timezone.utc).isoformat()
    teams, errors = {}, []
    roster_ok = depth_ok = 0
    for code, team_id in TEAM_IDS.items():
        entry = {"as_of": now, "roster": [], "depth_chart": {}, "source": "ESPN_PUBLIC_TEAM_ENDPOINTS", "roster_endpoint": None, "depth_endpoint": None}
        roster_urls = [
            f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/roster",
            f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}?enable=roster,projection,stats"
        ]
        depth_urls = [
            f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/depthcharts",
            f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{YEAR}/teams/{team_id}/depthcharts"
        ]
        try:
            data, used = first_json(roster_urls)
            entry["roster"] = parse_roster(data)
            entry["roster_endpoint"] = used
            roster_ok += bool(entry["roster"])
            if not entry["roster"]:
                errors.append(f"{code}:roster:EMPTY")
        except Exception as exc:
            errors.append(f"{code}:roster:{type(exc).__name__}")
        try:
            data, used = first_json(depth_urls)
            entry["depth_chart"] = normalize_depth(data)
            entry["depth_endpoint"] = used
            depth_ok += bool(entry["depth_chart"])
            if not entry["depth_chart"]:
                errors.append(f"{code}:depth:EMPTY")
        except Exception as exc:
            errors.append(f"{code}:depth:{type(exc).__name__}")
        teams[code] = entry
    if roster_ok == 32 and depth_ok == 32:
        status = "LIVE"
    elif roster_ok or depth_ok:
        status = "PARTIAL"
    else:
        status = "SOURCE_UNAVAILABLE"
    payload = {
        "schema_version": "1.3",
        "status": status,
        "updated_at_utc": now,
        "source": "ESPN_PUBLIC_TEAM_ENDPOINTS",
        "coverage": {"rosters": roster_ok, "depth_charts": depth_ok, "teams": 32},
        "policy": {
            "model_input": False,
            "purpose": "INFORMATION_LAYER_ONLY",
            "notes": "Roster/depth data is informational only and never mutates frozen 008A. Missing source data remains unavailable, never inferred."
        },
        "errors": errors[:64],
        "teams": teams
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"personnel refreshed: rosters={roster_ok}/32 depth={depth_ok}/32 status={status}")

if __name__ == "__main__":
    main()
