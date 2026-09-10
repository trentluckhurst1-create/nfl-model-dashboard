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
            roster.append({
                "id": str(p.get("id") or ""),
                "name": p.get("fullName") or p.get("displayName") or p.get("shortName") or "",
                "position": pos or "",
                "jersey": p.get("jersey") or "",
                "status": (p.get("status") or {}).get("name") or (p.get("status") or {}).get("type") or "ACTIVE",
                "headshot": (p.get("headshot") or {}).get("href") or ""
            })
    return [x for x in roster if x["name"]]

def normalize_depth(data):
    chart = {}
    # Site API shape can vary, so support common list/dict variants without inventing entries.
    candidates = data.get("depthChart") or data.get("depthcharts") or data.get("items") or data.get("positions") or []
    if isinstance(candidates, dict):
        candidates = candidates.get("items") or candidates.get("positions") or list(candidates.values())
    if not isinstance(candidates, list):
        return chart
    for group in candidates:
        if not isinstance(group, dict):
            continue
        pos = group.get("position") or group.get("name") or group.get("displayName") or group.get("abbreviation")
        if isinstance(pos, dict):
            pos = pos.get("abbreviation") or pos.get("name") or pos.get("displayName")
        athletes = group.get("athletes") or group.get("items") or group.get("players") or []
        if isinstance(athletes, dict):
            athletes = athletes.get("items") or []
        rows = []
        for i, p in enumerate(athletes if isinstance(athletes, list) else []):
            if not isinstance(p, dict):
                continue
            athlete = p.get("athlete") if isinstance(p.get("athlete"), dict) else p
            name = athlete.get("fullName") or athlete.get("displayName") or athlete.get("shortName") or ""
            if name:
                rows.append({"name": name, "rank": p.get("rank") or p.get("order") or i + 1, "starter": i == 0})
        if pos and rows:
            chart[str(pos)] = rows
    return chart

def main():
    now = datetime.now(timezone.utc).isoformat()
    teams = {}
    roster_ok = 0
    depth_ok = 0
    errors = []

    for code, espn_code in TEAM_MAP.items():
        entry = {"as_of": now, "roster": [], "depth_chart": [], "source": "ESPN_PUBLIC_TEAM_ENDPOINTS"}
        try:
            roster = get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{espn_code}/roster")
            entry["roster"] = parse_roster(roster)
            if entry["roster"]:
                roster_ok += 1
        except Exception as e:
            errors.append(f"{code}:roster:{type(e).__name__}")

        try:
            depth = get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{espn_code}/depthcharts")
            entry["depth_chart"] = normalize_depth(depth)
            if entry["depth_chart"]:
                depth_ok += 1
        except Exception as e:
            errors.append(f"{code}:depth:{type(e).__name__}")

        teams[code] = entry

    status = "LIVE" if roster_ok == 32 else ("PARTIAL" if roster_ok else "SOURCE_UNAVAILABLE")
    payload = {
        "schema_version": "1.1",
        "status": status,
        "updated_at_utc": now,
        "source": "ESPN_PUBLIC_TEAM_ENDPOINTS",
        "coverage": {"rosters": roster_ok, "depth_charts": depth_ok, "teams": 32},
        "policy": {
            "model_input": False,
            "purpose": "INFORMATION_LAYER_ONLY",
            "notes": "Roster/depth data is informational only and must never mutate or refit frozen 008A. Missing depth data is displayed as unavailable, never inferred."
        },
        "errors": errors[:20],
        "teams": teams
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"personnel refreshed: rosters={roster_ok}/32 depth={depth_ok}/32 status={status}")

if __name__ == "__main__":
    main()
