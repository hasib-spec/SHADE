# Intervention Surrogate Model

This directory contains the ML components for SHADE's L3 Inference Layer.

## What is it?
Instead of hardcoding deterministic formulas for the effect of cooling interventions, we train a lightweight neural network surrogate model to predict the cooling delta (`ΔT_2m`) based on micro-environmental features at the cell level.

This serves two purposes:
1. It validates the NVIDIA ecosystem integration (Triton Inference Server).
2. It allows for complex nonlinear interactions (e.g., adding a tree in an already highly-shaded canyon has diminishing returns compared to an open parking lot).

## Features
- `canopy_density`: Baseline canopy %
- `surface_albedo`: Estimated albedo of the cell
- `aspect_ratio`: Urban canyon geometry indicator
- `humidity`: Local relative humidity
- `wind_speed`: Local wind speed
- `base_temp`: Initial 2m temperature
- `intervention_type_onehot`: Categorical indicator (0=Tree, 1=Shade Structure, 2=Cool Pavement, 3=Misting)

## Training
Run `python generate_training_data.py` to create the synthetic dataset.
Run `python train.py` to train the model and export it to ONNX for Triton.
