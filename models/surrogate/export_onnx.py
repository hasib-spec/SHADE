"""
ONE-TIME ARTIFACT GENERATION: converts the trained scikit-learn MLP surrogate to a
REAL ONNX graph so the "ONNX" claim is literally true end-to-end.

Output:
  models/surrogate/intervention_surrogate.onnx  (canonical serving artifact)

Run from repo root:  python models/surrogate/export_onnx.py
(Requires: pip install skl2onnx onnxruntime)
"""
import os
import joblib
import numpy as np
from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType

HERE = os.path.dirname(os.path.abspath(__file__))
JOBLIB = os.path.join(HERE, "surrogate_model.joblib")
ONNX_OUT = os.path.join(HERE, "intervention_surrogate.onnx")

N_FEATURES = 10  # canopy, albedo, aspect, humidity, wind, base_temp, int_tree, int_shade, int_pave, int_mist


def main():
    if not os.path.exists(JOBLIB):
        raise SystemExit(f"Trained model not found at {JOBLIB}. Run train.py first.")

    model = joblib.load(JOBLIB)
    print(f"Loaded sklearn model: {type(model).__name__}")

    # Predict a couple of sanity rows before conversion.
    X_probe = np.array([[0.06, 0.12, 1.2, 18.0, 2.0, 44.5, 0, 1, 0, 0]], dtype=np.float32)
    sklearn_pred = float(model.predict(X_probe)[0])
    print(f"sklearn sanity prediction (shade sail @ Maryvale-ish cell): {sklearn_pred:.4f} °C")

    onx = to_onnx(
        model,
        initial_types=[("float_input", FloatTensorType([None, N_FEATURES]))],
        target_opset={"": 15, "ai.onnx.ml": 3},
    )
    with open(ONNX_OUT, "wb") as f:
        f.write(onx.SerializeToString())
    print(f"Wrote {ONNX_OUT} ({os.path.getsize(ONNX_OUT)} bytes)")

    # Verify with onnxruntime — same output as sklearn within tolerance.
    import onnxruntime as ort
    sess = ort.InferenceSession(ONNX_OUT, providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name
    ort_pred = float(sess.run(None, {input_name: X_probe})[0].ravel()[0])
    print(f"onnxruntime prediction: {ort_pred:.4f} °C  (delta vs sklearn: {abs(ort_pred - sklearn_pred):.6f})")
    assert abs(ort_pred - sklearn_pred) < 1e-3, "ONNX output diverges from sklearn!"

    print("DONE — ONNX artifact verified numerically equivalent to the sklearn model.")


if __name__ == "__main__":
    main()
