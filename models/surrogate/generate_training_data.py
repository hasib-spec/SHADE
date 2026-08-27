import os
import numpy as np
import pandas as pd

def generate_data(num_samples: int = 10000, seed: int = 42):
    np.random.seed(seed)
    
    # Environment features
    canopy_density = np.random.uniform(0.0, 1.0, num_samples)
    surface_albedo = np.random.uniform(0.1, 0.9, num_samples)
    aspect_ratio = np.random.uniform(0.1, 3.0, num_samples)
    humidity = np.random.uniform(10.0, 90.0, num_samples)
    wind_speed = np.random.uniform(0.0, 10.0, num_samples)
    base_temp = np.random.uniform(25.0, 50.0, num_samples)
    
    # Interventions (one-hot or probabilities, let's use categorical choices mapped to one-hot for a single intervention per row)
    # We'll just randomly select an intervention for each row (0: tree, 1: shade, 2: pave, 3: mist)
    intervention_choices = np.random.randint(0, 4, num_samples)
    int_tree = (intervention_choices == 0).astype(float)
    int_shade = (intervention_choices == 1).astype(float)
    int_pave = (intervention_choices == 2).astype(float)
    int_mist = (intervention_choices == 3).astype(float)
    
    # Calculate target: cooling_delta based on empirical physics formulas
    cooling_delta = np.zeros(num_samples)
    
    # Trees: -(1.0 + 2.8 * canopy_density - 0.02 * humidity + 0.05 * base_temp / 40.0)
    tree_mask = (intervention_choices == 0)
    cooling_delta[tree_mask] = -(1.0 + 2.8 * canopy_density[tree_mask] - 0.02 * humidity[tree_mask] + 0.05 * base_temp[tree_mask] / 40.0)
    
    # Shade Sails: -(1.5 + 1.0 * (1.0 - surface_albedo) + 0.3 * aspect_ratio)
    shade_mask = (intervention_choices == 1)
    cooling_delta[shade_mask] = -(1.5 + 1.0 * (1.0 - surface_albedo[shade_mask]) + 0.3 * aspect_ratio[shade_mask])
    
    # Cool Pavement: -(0.6 + 0.6 * (0.4 - surface_albedo) * 2.0)
    pave_mask = (intervention_choices == 2)
    cooling_delta[pave_mask] = -(0.6 + 0.6 * (0.4 - surface_albedo[pave_mask]) * 2.0)
    
    # Misting: -(3.0 + 2.0 * (1.0 - humidity / 100.0) * (base_temp / 40.0))
    mist_mask = (intervention_choices == 3)
    cooling_delta[mist_mask] = -(3.0 + 2.0 * (1.0 - humidity[mist_mask] / 100.0) * (base_temp[mist_mask] / 40.0))
    
    # Add Gaussian noise
    cooling_delta += np.random.normal(0, 0.08, num_samples)
    
    # Create DataFrame
    df = pd.DataFrame({
        'canopy_density': canopy_density,
        'surface_albedo': surface_albedo,
        'aspect_ratio': aspect_ratio,
        'humidity': humidity,
        'wind_speed': wind_speed,
        'base_temp': base_temp,
        'int_tree': int_tree,
        'int_shade': int_shade,
        'int_pave': int_pave,
        'int_mist': int_mist,
        'cooling_delta': cooling_delta
    })
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    
    # Save to CSV
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'synthetic_training_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Saved {num_samples} records to {output_path}")

if __name__ == "__main__":
    generate_data()
