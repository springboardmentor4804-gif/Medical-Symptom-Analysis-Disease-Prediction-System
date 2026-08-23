"""
Startup health check.

Loads every artifact on the request path ONCE, at process start, and logs what
came up: which models loaded, whether Layer A is enabled, the active gate
thresholds, and row counts. A worker that gets past this has already paid the
1-2 s load cost, so the first real request runs at the normal ~10 ms.

Failing loudly here is the point. A missing required artifact must stop the
process with the filename in the message, not surface later as a 500 on a
patient's assessment - or worse, as a confident answer computed from whatever
happened to load.

model3_text_condition.joblib (100 MB) is deliberately excluded: it is lazy by
design and warming it here would add seconds and ~1 GB of RSS per worker for a
path most requests never take.
"""

from __future__ import annotations

import logging
import time

from .artifacts import ArtifactsUnavailable, get_artifacts
from .treatment_cascade import get_cascade

logger = logging.getLogger("medassist.startup")


def startup_health_check(strict: bool = True) -> dict:
    """
    Verify and warm the model layer.

    `strict=True` re-raises ArtifactsUnavailable so the process refuses to
    start. Tests pass strict=False to get the report without aborting.
    """
    art = get_artifacts()
    started = time.perf_counter()

    try:
        report = art.health_check()
        art.preload()
    except ArtifactsUnavailable as e:
        logger.error("MODEL LAYER UNAVAILABLE: %s", e)
        if strict:
            raise
        return {"healthy": False, "error": str(e)}

    elapsed = time.perf_counter() - started

    logger.info("=" * 68)
    logger.info("MedAssist model layer ready in %.2fs", elapsed)
    logger.info("Artifacts: %s", report["artifact_dir"])
    for name, info in sorted(report["artifacts"].items()):
        logger.info("  %-24s loaded  rows=%s", name, info.get("rows"))

    cascade = get_cascade().status()
    report["cascade"] = cascade

    if cascade["layer_a_enabled"]:
        g = cascade["gate"]
        logger.info("  Layer A (MIMIC-IV)       ENABLED  %d admissions",
                    cascade["mimic_admissions"])
        logger.info("    gate: sim_floor=%s  min_support=%s  cat_threshold=%s",
                    g["sim_floor"], g["min_support"], g["cat_threshold"])
    else:
        logger.warning("  Layer A (MIMIC-IV)       DISABLED - cascade will "
                       "answer from drug reviews only")

    logger.info("  Layer B (drug reviews)   %d conditions, %d disease links",
                cascade["layer_b_conditions"], cascade["disease_links"])
    logger.info("    condition match floor: %s", cascade["condition_match_floor"])
    logger.info("  Text classifier (100MB)  %s (lazy)",
                "available" if cascade["text_condition_available"] else "ABSENT")
    logger.info("  Similar-case notes       %s",
                "enabled" if cascade["note_layer_enabled"] else "disabled")

    if report["disabled_features"]:
        logger.warning("  Disabled optional features: %s",
                       ", ".join(report["disabled_features"]))
    logger.info("=" * 68)

    report["load_seconds"] = round(elapsed, 3)
    return report
