#!/usr/bin/env python
"""
Verify that every trained model artifact loads.

Run after installing dependencies or after dropping a fresh training run into
backend/artifacts/. Exits non-zero if anything is missing or unreadable, so it
works as an installer and CI gate as well as a manual check.

    python backend/verify_artifacts.py
    python backend/verify_artifacts.py --smoke   # also run one assessment
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--smoke", action="store_true",
                    help="also run a sample assessment through the full engine")
    args = ap.parse_args()

    try:
        from services import get_artifacts
    except Exception as e:  # noqa: BLE001 - report anything, do not crash the installer
        print(f"  FAILED to import the model layer: {type(e).__name__}: {e}")
        return 1

    try:
        status = get_artifacts().status()
    except Exception as e:  # noqa: BLE001
        print(f"  FAILED to read artifacts: {type(e).__name__}: {e}")
        return 1

    for name, info in sorted(status["artifacts"].items()):
        if info["loaded"]:
            print(f"  ok      {name:24s} (rows={info['rows']})")
        else:
            print(f"  MISSING {name:24s} {info.get('error', '')}")

    if not status["healthy"]:
        print()
        print(f"  Artifact directory: {status['artifact_dir']}")
        print(f"  {status.get('error', '')}")
        print("  Re-export the artifacts from the training notebook into")
        print("  backend/artifacts/.")
        return 1

    print(f"  All {len(status['artifacts'])} artifacts loaded.")

    # The cascade's behaviour depends on which layers are present, so say so
    # rather than leaving a Layer-B-only deployment looking fully featured.
    print(f"  Layer A (MIMIC-IV): "
          f"{'enabled' if status['layer_a_enabled'] else 'DISABLED'}")
    if status["disabled_features"]:
        print(f"  Disabled optional features: "
              f"{', '.join(status['disabled_features'])}")

    if args.smoke:
        from services import get_engine
        # A realistic cardiac presentation: it should escalate on the red flag,
        # return a cardiac differential, and find linked treatments.
        result = get_engine().analyze(
            symptoms=[{"name": "sharp chest pain", "severity": "high"},
                      {"name": "shortness of breath", "severity": "moderate"},
                      {"name": "fatigue", "severity": "low"}],
            age=58, sex="male",
            profile={"bmi": 31.4, "smoker_status": 1, "general_health": 4,
                     "high_blood_pressure": True, "high_cholesterol": True,
                     "exercise": False},
            vitals={"spo2": 92},
        )
        sev, dx = result["severity"], result["diagnosis"]
        print()
        print(f"  smoke test: severity={sev['level']} "
              f"({sev['escalation_override'] or 'no override'})")
        print(f"              diagnosis={dx.get('top_disease')} "
              f"({dx['confidence']['label']} confidence)")
        tx = result["treatment"]
        print(f"              risk={result['risk']['available']} "
              f"treatment_layer={tx['layer']} gate={tx['gate_reason']} "
              f"drugs={len(tx['drugs'])}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
