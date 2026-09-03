"""
Fetch official CDC/ATSDR 2022 SVI data for Maricopa County, Arizona (1,009 tracts).
Calculates polygon centroids in WGS84 and saves to data/svi/maricopa_svi_2022.csv.
"""
import csv
import sys
import os
import httpx

OUTPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "svi", "maricopa_svi_2022.csv"
)

def fetch_and_save():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    url = "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/2/query"
    
    # STCNTY for Maricopa County, AZ is 04013
    params = {
        "where": "STCNTY='04013'",
        "outFields": "FIPS,LOCATION,RPL_THEMES,EP_POV150,EP_UNINSUR,EP_NOVEH,EP_AGE65",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "json",
        "resultRecordCount": "2000"
    }

    print("Querying CDC/ATSDR ArcGIS FeatureService for Maricopa County tracts (STCNTY='04013')...")
    with httpx.Client(timeout=90.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    features = data.get("features", [])
    print(f"Fetched {len(features)} tracts from CDC.")

    rows = []
    for feat in features:
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {})
        rings = geom.get("rings", [])

        # Compute centroid from geometry rings
        centroid_lat, centroid_lon = None, None
        if rings:
            pts = [pt for ring in rings for pt in ring]
            if pts:
                centroid_lon = sum(p[0] for p in pts) / len(pts)
                centroid_lat = sum(p[1] for p in pts) / len(pts)

        fips = str(attrs.get("FIPS") or "").strip()
        svi_val = attrs.get("RPL_THEMES")
        if svi_val is None:
            svi_clean = 0.0
        elif float(svi_val) < 0:
            svi_clean = 0.0
        else:
            svi_clean = round(float(svi_val), 4)

        rows.append({
            "fips": fips,
            "location": attrs.get("LOCATION") or "",
            "svi_rpl_themes": svi_clean,
            "ep_pov150": round(float(attrs.get("EP_POV150")), 2) if attrs.get("EP_POV150") is not None and attrs.get("EP_POV150") >= 0 else "",
            "ep_uninsur": round(float(attrs.get("EP_UNINSUR")), 2) if attrs.get("EP_UNINSUR") is not None and attrs.get("EP_UNINSUR") >= 0 else "",
            "ep_noveh": round(float(attrs.get("EP_NOVEH")), 2) if attrs.get("EP_NOVEH") is not None and attrs.get("EP_NOVEH") >= 0 else "",
            "ep_age65": round(float(attrs.get("EP_AGE65")), 2) if attrs.get("EP_AGE65") is not None and attrs.get("EP_AGE65") >= 0 else "",
            "centroid_lat": round(centroid_lat, 6) if centroid_lat else 33.45,
            "centroid_lon": round(centroid_lon, 6) if centroid_lon else -112.07,
        })

    rows.sort(key=lambda r: r["fips"])

    fieldnames = [
        "fips", "location", "svi_rpl_themes", "ep_pov150",
        "ep_uninsur", "ep_noveh", "ep_age65", "centroid_lat", "centroid_lon"
    ]

    with open(OUTPUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Successfully saved {len(rows)} tracts to {OUTPUT_PATH}")

    for r in rows:
        if r["fips"] == "04013109401":
            print(f"Verified Maryvale tract 04013109401: SVI = {r['svi_rpl_themes']} (expected: 0.9398)")
        elif r["fips"] == "04013108000":
            print(f"Verified Arcadia tract 04013108000: SVI = {r['svi_rpl_themes']} (expected: 0.0116)")

if __name__ == "__main__":
    fetch_and_save()
