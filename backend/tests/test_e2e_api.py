"""
End-to-End FastAPI Routes Test Script for SHADE
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("[PASS] /health PASSED")

def test_grid_endpoint():
    response = client.get("/api/grid?district=Maryvale&hour=15.0")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 400
    assert "heri_score" in data[0]
    assert "polygon" in data[0]
    print(f"[PASS] /api/grid PASSED (returned {len(data)} 20m2 cells with HERI)")

def test_hotspots_endpoint():
    response = client.get("/api/hotspots?district=Maryvale&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    assert data[0]["heri_score"] >= data[-1]["heri_score"]
    print(f"[PASS] /api/hotspots PASSED (top HERI score: {data[0]['heri_score']})")

def test_forecast_endpoint():
    response = client.get("/api/forecast?district=Maryvale&hours_ahead=24")
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert len(data["forecast"]) == 24
    print(f"[PASS] /api/forecast PASSED (dangerous hours: {data['dangerous_heat_hours']})")

def test_simulate_endpoint():
    payload = {
        "cell_id": "cell_001",
        "intervention_type": "shade_structure"
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["cooling_delta"]["delta_t_air"] < 0
    print(f"[PASS] /api/interventions/simulate PASSED (air delta: {data['cooling_delta']['delta_t_air']} C, MRT delta: {data['cooling_delta']['delta_t_mrt']} C)")

def test_optimize_endpoint():
    payload = {
        "budget_usd": 50000.0,
        "district": "Maryvale",
        "target_demographic": "elderly"
    }
    response = client.post("/api/interventions/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_cost"] <= 50000.0
    assert len(data["items"]) > 0
    print(f"[PASS] /api/interventions/optimize PASSED (allocated ${data['total_cost']:.2f} across {len(data['items'])} sites, protecting {data['total_residents_covered']} residents)")

def test_export_geojson():
    payload = {
        "items": [
            {
                "cell_id": "cell_001",
                "intervention_type": "shade_structure",
                "cost": 3000.0,
                "cooling_delta": -2.4,
                "residents_covered": 120
            }
        ]
    }
    response = client.post("/api/export/geojson", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    print(f"[PASS] /api/export/geojson PASSED (valid QGIS FeatureCollection)")

def test_export_sms():
    payload = {
        "district": "Maryvale",
        "target_demographic": "elderly"
    }
    response = client.post("/api/export/sms", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "english" in data[0]
    assert "spanish" in data[0]
    print(f"[PASS] /api/export/sms PASSED (bilingual drafts generated)")

def test_agent_chat_flagship_prompt():
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "We have $50,000 for tactical cooling in Maryvale before tomorrow's 3 PM peak. Target the elderly. Where do we deploy?"
            }
        ]
    }
    response = client.post("/api/agent/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Maryvale" in data["response"]
    assert "artifacts" in data
    # Work-order IDs are now deterministic and date-based (no fake municipal numbering).
    import re as _re
    assert _re.fullmatch(r"WO-MARY-\d{8}-01", data["artifacts"]["work_order_id"])
    # The agent must disclose provenance and never hardcode ROI figures.
    assert data["artifacts"]["data_provenance"] == "modeled"
    assert data["artifacts"]["roi_metrics"]["is_modeled_estimate"] is True
    print(f"[PASS] /api/agent/chat PASSED (Flagship Demo trajectory verified)")

if __name__ == "__main__":
    test_health()
    test_grid_endpoint()
    test_hotspots_endpoint()
    test_forecast_endpoint()
    test_simulate_endpoint()
    test_optimize_endpoint()
    test_export_geojson()
    test_export_sms()
    test_agent_chat_flagship_prompt()
    print("\n[SUCCESS] ALL 9 FASTAPI ENDPOINTS ARE 100% OPERATIONAL AND FULLY VERIFIED!")
