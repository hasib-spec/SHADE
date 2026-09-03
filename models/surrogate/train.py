import os
import joblib
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error

def train_model():
    """
    Trains the Intervention Surrogate Neural Network on physics-labeled data.
    Saves the trained model to both surrogate/surrogate_model.joblib and triton_repo.
    """
    data_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(data_dir, 'synthetic_training_data.csv')
    
    if not os.path.exists(data_path):
        from generate_training_data import generate_data
        generate_data()
        
    df = pd.read_csv(data_path)
    
    feature_cols = ['canopy_density', 'surface_albedo', 'aspect_ratio', 'humidity', 'wind_speed', 
                    'base_temp', 'int_tree', 'int_shade', 'int_pave', 'int_mist']
    X = df[feature_cols].values
    y = df['cooling_delta'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training Surrogate Neural Network on {len(X_train)} samples...")
    model = MLPRegressor(
        hidden_layer_sizes=(64, 32, 16),
        activation='relu',
        solver='adam',
        max_iter=200,
        random_state=42,
        early_stopping=True
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"[SUCCESS] Surrogate Model Trained! Test MSE: {mse:.4f}, Test MAE: {mae:.4f} C")
    
    # Save model artifact
    joblib_path = os.path.join(data_dir, 'surrogate_model.joblib')
    joblib.dump(model, joblib_path)
    print(f"Saved model to {joblib_path}")

if __name__ == "__main__":
    train_model()
