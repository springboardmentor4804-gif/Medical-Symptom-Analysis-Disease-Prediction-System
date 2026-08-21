import joblib
import os

MODEL_PATH = "app/ai/models/model.pkl"

print("=" * 60)
print("MEDASSIST AI - MODEL INSPECTION")
print("=" * 60)

print("\nModel path:")
print(MODEL_PATH)

print("\nFile exists:")
print(os.path.exists(MODEL_PATH))

model = joblib.load(MODEL_PATH)

print("\nModel type:")
print(type(model))

print("\nModel class:")
print(model.__class__.__name__)

print("\nModel parameters:")

try:
    print(model.get_params())
except Exception:
    print("Model does not expose get_params().")

print("\nNumber of classes:")

try:
    print(len(model.classes_))
except Exception:
    print("classes_ not available.")

print("\nClasses:")

try:
    print(model.classes_)
except Exception:
    print("classes_ not available.")

print("\nFeature information:")

try:
    print("n_features_in_:", model.n_features_in_)
except Exception:
    print("n_features_in_ not available.")

try:
    print("feature_names_in_:", model.feature_names_in_)
except Exception:
    print("feature_names_in_ not available.")

print("\nModel attributes:")

for name in [
    "coef_",
    "feature_importances_",
    "n_estimators",
    "max_depth",
]:
    if hasattr(model, name):
        value = getattr(model, name)

        try:
            print(
                f"{name}: "
                f"{getattr(value, 'shape', None)}"
            )
        except Exception:
            print(f"{name}: available")

print("\n" + "=" * 60)
print("INSPECTION COMPLETE")
print("=" * 60)