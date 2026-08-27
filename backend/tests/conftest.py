import pytest

@pytest.fixture
def sample_grid_cell():
    return {
        "id": 1,
        "temp_2m": 41.5,
        "svi": 0.85,
        "canopy_cover": 0.1,
        "population_density": 50
    }
