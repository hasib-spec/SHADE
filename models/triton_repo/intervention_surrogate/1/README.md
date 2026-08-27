# Model Directory

This directory should contain the `model.onnx` file after running the training script.

To generate the model:
1. `cd ../../surrogate`
2. `python generate_training_data.py`
3. `python train.py`

This will automatically populate this directory with the `.onnx` file for Triton Inference Server.
