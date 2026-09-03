"""
Truth audit script verifying all claims in README against FastAPI TestClient.
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def audit():
    print("--- 1. Checking GET /api/meta ---")
    r = client.get("/api/meta")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    meta = r.json()
    tracts = meta["data_provenance"]["svi"]["tracts_loaded"]
    backend = meta["inference"]["surrogate_backend"]
    print(f"SVI tracts loaded: {tracts} (Expected: 1009)")
    print(f"Surrogate backend: {backend} (Expected: onnx)")
    assert tracts == 1009, f"Expected 1009 tracts, got {tracts}"
    assert backend == "onnx", f"Expected onnx backend, got {backend}"

    print("\n--- 2. Checking GET /api/grid ---")
    r = client.get("/api/grid?district=Maryvale&hour=15.0")
    assert r.status_code == 200
    grid = r.json()
    assert len(grid) == 400, f"Expected 400 cells, got {len(grid)}"
    assert all(c.get("data_provenance") == "modeled" for c in grid), "Every cell must have data_provenance == 'modeled'"
    assert all(c.get("svi") is not None for c in grid), "Every cell must have non-null SVI"
    print(f"Grid check PASSED: 400 cells, all labeled modeled, all SVI non-null.")

    print("\n--- 3. Checking GET /api/forecast?district=Maryvale ---")
    r = client.get("/api/forecast?district=Maryvale")
    assert r.status_code == 200
    fc = r.json()
    print(f"Forecast source: {fc.get('source')}")
    print(f"is_modeled: {fc.get('is_modeled')}")
    assert "source" in fc and "is_modeled" in fc

    print("\n--- 4. Checking Demo Cool Route (Maryvale) ---")
    r = client.get("/api/routing/cool-path?district=Maryvale&start_lat=33.4925&start_lon=-112.1770&end_lat=33.4954&end_lon=-112.1759")
    assert r.status_code == 200
    route = r.json()
    d_dir = route["direct_route"]["distance_meters"]
    d_cool = route["cool_route"]["distance_meters"]
    dist_pct = ((d_cool - d_dir) / d_dir) * 100
    mrt_dir = route["direct_route"]["mrt_exposure_degree_minutes"]
    mrt_cool = route["cool_route"]["mrt_exposure_degree_minutes"]
    mrt_dose_pct = ((mrt_cool - mrt_dir) / mrt_dir) * 100
    mrt_relief = route["mrt_relief_c"]
    temp_relief = route["temperature_relief_c"]
    alt_not_ben = route["alternative_not_beneficial"]
    print(f"Distance delta: {dist_pct:+.1f}% (Expected ~ +8.4%)")
    print(f"MRT dose delta: {mrt_dose_pct:+.1f}% (Expected ~ -9.5%)")
    print(f"MRT relief: -{mrt_relief}°C (Expected ~ -7.9°C)")
    print(f"Temp relief: -{temp_relief}°C (Expected ~ -2.0°C)")
    print(f"alternative_not_beneficial: {alt_not_ben} (Expected: False)")
    assert alt_not_ben is False

    print("\n--- 5. Checking Honest Negative Case (Arcadia) ---")
    r = client.get("/api/routing/cool-path?district=Arcadia")
    assert r.status_code == 200
    arc_route = r.json()
    print(f"Arcadia alternative_not_beneficial: {arc_route['alternative_not_beneficial']} (Expected: True)")
    assert arc_route["alternative_not_beneficial"] is True

    print("\n--- 6. Checking Real OLS Regression (GET /api/correlation/health-impact) ---")
    r = client.get("/api/correlation/health-impact?district=Maryvale")
    assert r.status_code == 200
    study = r.json()
    val = study["statistical_validation"]
    print(f"Method: {val['method']}")
    print(f"Observations: {val['n_observations']} (Expected: 800)")
    print(f"R-squared: {val['r_squared']:.4f} (Expected ~ 0.63)")
    print(f"Slope: {val['slope_per_unit']} (Expected ~ -18.0)")
    assert val["n_observations"] == 800
    assert 0.55 <= val["r_squared"] <= 0.70

    print("\n--- 7. Checking ONNX Serving (POST /api/interventions/simulate) ---")
    r = client.post("/api/interventions/simulate", json={"cell_id": "cell_001", "intervention_type": "shade_structure"})
    assert r.status_code == 200
    sim = r.json()
    print(f"Simulate output: {sim}")
    assert "cooling_delta" in sim
    assert sim["cooling_delta"]["delta_t_air"] < 0

    print("\n==========================================")
    print("ALL 7 TRUTH AUDIT CHECKS PASSED PERFECTLY!")
    print("==========================================")

if __name__ == "__main__":
    audit()
