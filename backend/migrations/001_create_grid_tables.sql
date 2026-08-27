CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS grid_cells (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    temp_2m FLOAT,
    heri_score FLOAT,
    svi FLOAT,
    canopy_cover FLOAT,
    population_density FLOAT
);

CREATE INDEX idx_grid_cells_geom ON grid_cells USING GIST (geom);

CREATE TABLE IF NOT EXISTS intervention_plans (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_budget FLOAT,
    total_impact FLOAT
);

CREATE TABLE IF NOT EXISTS planned_interventions (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES intervention_plans(id),
    cell_id INTEGER REFERENCES grid_cells(id),
    intervention_type VARCHAR(50),
    cost FLOAT,
    projected_delta FLOAT
);
