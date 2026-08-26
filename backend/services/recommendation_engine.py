"""
Healthcare Recommendation Workflow Engine.

Consolidates outputs from the four existing model components (disease
prediction, chronic risk assessment, severity/triage, treatment recommendation)
into a single, human-readable action plan.

This is NOT an ML model - it's deterministic, auditable rule logic following
the same design pattern as severity_engine.py: all thresholds, mappings, and
phrasing live in recommendation_config.json, so tuning never requires touching
code.

Design principles:
  1. Every recommendation field cites which upstream component(s) it derives from
  2. Nothing is fabricated - only information traceable to model outputs
  3. Config-driven logic for transparency and auditability
  4. Consistent with existing severity engine implementation patterns
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

from .artifacts import get_artifacts

logger = logging.getLogger(__name__)


def _cfg():
    """Load recommendation configuration from artifacts."""
    return get_artifacts().recommendation_config


# ---------------------------------------------------------------------------
# Turning model features back into statements about THIS patient
# ---------------------------------------------------------------------------
#
# The risk model's drivers arrive as BRFSS column codes and numeric codes
# (`_BMI5: 33.5`, `GENHLTH: 4.0`). Naming the feature alone - "contributing
# factors include Body mass index, Self-rated general health" - is true of
# every patient the model has ever scored, which makes it advice nobody can
# act on. Decoding the value is what makes it this patient's finding.

# BRFSS categorical encodings, from the training notebook's codebook.
_GENHLTH = {1: "Excellent", 2: "Very good", 3: "Good", 4: "Fair", 5: "Poor"}
_SMOKER = {1: "smokes every day", 2: "smokes some days",
           3: "former smoker", 4: "never smoked"}
_YESNO = {1: "yes", 2: "no", 7: "unsure", 9: "declined to answer"}


def _ordinal(n) -> str:
    """86 -> '86th'. Used when quoting percentiles back to the patient."""
    try:
        i = int(round(float(n)))
    except (TypeError, ValueError):
        return str(n)
    if 10 <= i % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(i % 10, "th")
    return f"{i}{suffix}"


def _age_band(code: float) -> str:
    """
    _AGEG5YR is 1-13. Band 1 is 18-24 (a seven-year band); the five-year
    bands start at 25, so band i>=2 begins at 25 + (i-2)*5.
    """
    i = int(code)
    if i >= 13:
        return "80 or older"
    if i <= 1:
        return "18-24"
    lo = 25 + (i - 2) * 5
    return f"{lo}-{lo + 4}"


def _bmi_band(v: float) -> str:
    if v < 18.5:
        return "underweight"
    if v < 25:
        return "healthy range"
    if v < 30:
        return "overweight"
    if v < 35:
        return "obese class I"
    if v < 40:
        return "obese class II"
    return "obese class III"


def _format_driver(feature: str, label: str, value) -> Optional[str]:
    """
    Render one risk driver as a specific statement about this patient.

    Returns None when the value is missing - an absent answer is not a
    finding, and padding the list with "Told high blood pressure: unknown"
    would dilute the drivers that ARE real.
    """
    if value is None:
        return None
    f = (feature or "").upper()

    # Non-modifiable demographics carry real predictive weight, but naming
    # them as something to "discuss with your provider" is not actionable -
    # and the raw code ("Sex: 1") is not even readable. Age is kept because
    # it sets screening schedules; sex and race are dropped.
    if f in ("SEX", "_SEX", "SEXVAR") or "RACE" in f:
        return None

    try:
        v = float(value)
    except (TypeError, ValueError):
        return f"{label}: {value}"

    if "BMI" in f:
        return f"BMI {v:.1f} ({_bmi_band(v)})"
    if f == "GENHLTH":
        word = _GENHLTH.get(int(v))
        return f"self-rated health '{word}'" if word else None
    if f == "_AGEG5YR":
        return f"age band {_age_band(v)}"
    if "SMOKER" in f:
        word = _SMOKER.get(int(v))
        return f"smoking status: {word}" if word else None
    if f in ("PHYSHLTH", "_PHYS14D", "physical_health_days".upper()):
        return f"{int(v)} physically unwell days in the last 30"
    if f in ("MENTHLTH", "_MENT14D", "mental_health_days".upper()):
        return f"{int(v)} mentally unwell days in the last 30"
    if f.startswith("BPHIGH"):
        return "told they have high blood pressure" if int(v) == 1 else None
    if f.startswith("TOLDHI") or "CHOL" in f:
        return "told they have high cholesterol" if int(v) == 1 else None
    if f.startswith("EXERANY") or "TOTINDA" in f:
        return "no physical activity in the last 30 days" if int(v) in (2, 0) else None
    if "DRNK" in f or "ALCD" in f:
        return "reported heavy drinking" if int(v) == 1 else None
    # Unrecognised feature: still better to show the number than the bare label.
    return f"{label}: {v:g}"


def _normalize_specialist(specialist: Optional[str]) -> Optional[str]:
    """Normalize specialist names for comparison."""
    if not specialist:
        return None
    # Clean and lowercase
    normalized = str(specialist).strip().lower()
    # Remove common suffixes and normalize spacing
    normalized = re.sub(r'\s+', ' ', normalized)
    normalized = normalized.rstrip(',. ')
    return normalized if normalized else None


def _extract_red_flag_category(red_flags: List[str]) -> Optional[str]:
    """
    Identify which red flag category (cardiac, neurological, etc.) applies
    based on the reported red flags.
    """
    if not red_flags:
        return None
    
    cfg = _cfg()
    patterns = cfg.get("red_flag_patterns", {})
    
    # Count matches per category
    category_scores = {}
    for category, flag_list in patterns.items():
        score = 0
        for flag in red_flags:
            flag_lower = str(flag).lower()
            for pattern in flag_list:
                if pattern.lower() in flag_lower:
                    score += 1
        if score > 0:
            category_scores[category] = score
    
    # Return category with highest match count
    if category_scores:
        return max(category_scores.items(), key=lambda x: x[1])[0]
    
    return None


def _get_specialist_from_disease(disease_lookup: Dict, disease: str,
                                 severity_level: str) -> Optional[str]:
    """
    Extract specialist recommendation from disease lookup data.
    
    Args:
        disease_lookup: Disease information dict with 'doctor' field
        disease: Disease name
        severity_level: Current severity level (EMERGENCY/URGENT/MODERATE/MILD)
    
    Returns:
        Normalized specialist name or None
    """
    if not disease or not disease_lookup:
        return None
    
    info = disease_lookup.get(disease) or disease_lookup.get(disease.lower())
    if not info or not isinstance(info, dict):
        return None
    
    specialist = info.get("doctor")
    return _normalize_specialist(specialist)


def _prioritize_specialist(candidates: List[str], severity_level: str,
                           red_flag_category: Optional[str]) -> Optional[str]:
    """
    Select the most appropriate specialist from multiple candidates based on
    severity and red flag context.
    
    Args:
        candidates: List of specialist names
        severity_level: EMERGENCY/URGENT/MODERATE/MILD
        red_flag_category: Category of red flags (cardiac, neurological, etc.)
    
    Returns:
        Prioritized specialist name or None
    """
    if not candidates:
        return None
    
    cfg = _cfg()
    
    # For high-severity cases with red flags, prioritize by red flag category
    if red_flag_category and severity_level in ["EMERGENCY", "URGENT"]:
        priority_specialists = cfg.get("red_flag_specialist_map", {}).get(
            red_flag_category, [])
        for priority in priority_specialists:
            for candidate in candidates:
                if priority.lower() in candidate.lower():
                    return candidate
    
    # Prioritize by severity level
    severity_priorities = cfg.get("specialist_priority_map", {}).get(
        severity_level, [])
    for priority in severity_priorities:
        for candidate in candidates:
            if priority.lower() in candidate.lower():
                return candidate
    
    # Return first candidate if no priority match
    return candidates[0] if candidates else None


# ---------------------------------------------------------------------------
# Disease-directed prevention
# ---------------------------------------------------------------------------
#
# The chronic-risk notes below only exist when a lifestyle profile was
# supplied AND the model flagged a condition, so a symptom-only assessment
# produced an empty preventive section. Prevention keyed to the PREDICTED
# DISEASE always applies, which is what makes the section available for all
# 684 conditions rather than only the profiled ones.
#
# Each entry is (matcher, focus, actions). The focus names what is being
# prevented - recurrence, transmission, progression, complication - because
# those are genuinely different goals and collapsing them into "stay healthy"
# is the generic advice this is meant to avoid.
_PREVENTION_RULES = (
    ("infection_transmission",
     re.compile(r"\b(infection|infectious|abscess|cellulitis|impetigo|"
                r"pneumonia|bronchitis|influenza|tuberculosis|hepatitis|"
                r"hiv|syphilis|gonorrhea|chlamydia|herpes|hpv|warts|"
                r"conjunctivitis|tonsillitis|pharyngitis|sinusitis|otitis|"
                r"meningitis|encephalitis|chickenpox|measles|mumps|rubella|"
                r"mononucleosis|thrush|candid|tinea|scabies|lice|parasit|"
                r"aspergill|cryptococc|malaria|dengue|typhoid|cholera|appendic|"
                r"cholangitis|endocarditis|epididymitis|balanitis|croup|"
                r"cysticercosis|acariasis|cold sore|common cold|"
                r"bronchiolitis|caries|cholesteatoma|athlete|granuloma|"
                r"osteomyelitis|peritonitis|cervicitis|prostatitis|flu|gum|"
                r"herpangina|erythema multiforme|drug reaction)"),
     "Limiting spread and preventing recurrence",
     ["complete the full course of any prescribed anti-infective rather than "
      "stopping when symptoms settle",
      "hand hygiene and not sharing towels, razors or bedding until cleared",
      "ask your clinician which vaccinations apply to this infection"]),

    ("cardiometabolic_progression",
     re.compile(r"\b(diabet|hypertension|blood pressure|cholesterol|"
                r"atherosclerosis|coronary|angina|myocardial|heart failure|"
                r"cardiomyopathy|arrhythmia|fibrillation|stroke|ischemi|"
                r"thrombosis|embolism|obesity|metabolic|insulin|thyroid|"
                r"hyperlipid|aneurysm|valve|cardiac arrest|congenital heart|"
                r"hypertensive|atrial|ventricular|heart block|"
                r"pulmonary hypertension|heart attack|myocardial infarction|fluid overload|hypovolemia)"),
     "Slowing progression and preventing a vascular event",
     ["blood pressure, lipid and HbA1c monitoring at the interval your "
      "clinician sets - these are silent until they are not",
      "smoking cessation, which changes vascular risk faster than any other "
      "single change",
      "regular aerobic activity and a reduced-sodium, reduced-saturated-fat diet"]),

    ("respiratory_trigger",
     re.compile(r"\b(asthma|copd|emphysema|bronchospasm|bronchiect|"
                r"respiratory|pulmonary|pneumothorax|atelectasis|"
                r"interstitial lung|pleur)"),
     "Avoiding triggers and preventing exacerbations",
     ["identify and reduce your specific triggers - smoke, cold air, dust, "
      "pets, aerosols",
      "annual influenza and pneumococcal vaccination unless contraindicated",
      "inhaler technique review; poor technique is the most common reason a "
      "controller appears to stop working"]),

    ("musculoskeletal_recurrence",
     re.compile(r"\b(arthritis|arthro|osteo|joint|tendon|tendin|bursitis|"
                r"sprain|strain|back pain|lumbago|sciatica|disc|spine|spinal|"
                r"muscle|myalgia|fibromyalgia|epicondylitis|capsulitis|"
                r"fracture|dislocation|carpal tunnel|bunion|fasciitis|gout|"
                r"ankylosing|avascular necrosis|bone|chondromalacia|"
                r"de quervain|knee pain|chronic pain|complex regional|"
                r"hammer toe|flat feet|scoliosis|hemarthrosis)"),
     "Preventing recurrence and protecting the joint",
     ["graded strengthening and stretching rather than complete rest, which "
      "deconditions the supporting muscle",
      "review lifting technique, workstation set-up and footwear",
      "maintain a healthy weight - load through weight-bearing joints scales "
      "with body mass"]),

    ("mental_health_relapse",
     re.compile(r"\b(depress|anxiety|anxious|panic|bipolar|schizo|psychos|"
                r"psychotic|stress|adjustment|dissociat|somatiz|conversion|"
                r"obsessive|ptsd|post traumatic|insomnia|mood|suicid|"
                r"attention deficit|autism|asperger|conduct disorder|"
                r"impulse control|eating disorder|anorexia|bulimia|"
                r"substance|alcohol|opiate|drug abuse|withdrawal)"),
     "Preventing relapse and protecting function",
     ["keep a consistent sleep and activity routine - sleep disruption is "
      "one of the earliest relapse signals",
      "agree a written plan for what to do if symptoms escalate, and who to "
      "contact",
      "do not stop psychiatric medication abruptly; discontinuation needs "
      "a tapering plan"]),

    ("gi_recurrence",
     re.compile(r"\b(gastr|reflux|gerd|esophag|oesophag|ulcer|dyspep|"
                r"indigestion|colitis|crohn|bowel|intestin|diverticul|"
                r"constipat|diarrh|hemorrhoid|anal|rectal|pancreat|"
                r"hepat|liver|cirrhosis|gallbladder|gallstone|cholecyst|"
                r"celiac|malabsorption|lactose|hernia|achalasia|choledocholithiasis|"
                r"hirschsprung|volvulus|ileus)"),
     "Preventing recurrence and protecting the gut and liver",
     ["identify dietary triggers with a symptom diary rather than "
      "eliminating food groups speculatively",
      "limit alcohol and NSAIDs, both of which directly injure the "
      "gastric and hepatic mucosa",
      "smaller, earlier evening meals if reflux features at all"]),

    ("renal_urinary_recurrence",
     re.compile(r"\b(kidney|renal|nephr|urinary|bladder|cystitis|urethr|"
                r"prostat|incontinen|stone|calculi|dialysis|hydronephrosis|"
                r"hydrocele|erectile dysfunction|atrophy of the corpus)"),
     "Preventing recurrence and preserving renal function",
     ["fluid intake sufficient to keep urine pale - the single most "
      "effective measure against stone and infection recurrence",
      "do not delay voiding, and empty the bladder after intercourse",
      "avoid NSAID courses without advice; they reduce renal perfusion"]),

    ("neuro_progression",
     re.compile(r"\b(seizure|epilep|migraine|headache|neuralgia|neuropath|"
                r"parkinson|alzheimer|dementia|sclerosis|palsy|paralysis|"
                r"neuritis|myasthenia|vertigo|meniere|tremor|dystonia|"
                r"concussion|head injury|hydrocephalus|delirium|cerebral edema|"
                r"autonomic|dysautonomia|polyneuropathy|encephalopathy|"
                r"hemiplegia|cerebral palsy|down syndrome|congenital malformation|"
                r"developmental disability|cystic fibrosis|guillain barre|"
                r"extrapyramidal|vacterl|spina bifida)"),
     "Reducing attack frequency and protecting neurological function",
     ["keep a trigger and frequency diary - it is what makes preventive "
      "treatment decisions possible",
      "protect sleep, hydration and meal regularity; all three are common "
      "precipitants",
      "discuss driving, swimming and working at height if loss of "
      "awareness is possible"]),

    ("skin_recurrence",
     re.compile(r"\b(dermatit|eczema|psorias|acne|rosacea|urticaria|hives|"
                r"pruritus|itch|rash|skin|cutaneous|alopecia|nail|"
                r"keratosis|melanoma|wart|callus|ulcer of the skin|"
                r"hidradenitis|lichen|intertrigo|dyshidro|hyperhidro|hirsut|"
                r"alopec|melasma|vitiligo|allergy|allergic|food allergy)"),
     "Preventing flares and protecting the skin barrier",
     ["daily emollient even when clear - barrier repair is prevention, "
      "not treatment",
      "identify contact triggers: detergents, fragrance, nickel, gloves",
      "daily broad-spectrum sun protection, which reduces both "
      "pigmentation change and skin-cancer risk"]),

    ("eye_ear_protection",
     re.compile(r"\b(eye|ocular|cornea|retina|retinal|conjunctiv|uveitis|"
                r"glaucoma|cataract|macular|vision|blind|floaters|"
                r"blephar|ear|hearing|tinnitus|auditory|labyrinth|amblyopia|"
                r"aphakia|astigmat|ectropion|chorioretin|endophthalmitis|"
                r"myopia|hyperopia|presbyopia|strabismus|chalazion|stye|"
                r"cyst of the eyelid|eyelid)"),
     "Protecting vision and hearing from further loss",
     ["attend the scheduled review even if symptoms settle - much visual "
      "and hearing loss is painless and irreversible",
      "eye protection for power tools, sport and chemical handling; "
      "hearing protection above 85 dB",
      "do not use topical steroid drops without supervision"]),

    ("obstetric_gynae",
     re.compile(r"\b(pregnan|gestation|obstetric|menstru|menorrh|amenorrh|"
                r"uterine|uterus|ovarian|ovary|cervi|vaginal|vagin|"
                r"endometri|fibroid|breast|lactation|postpartum|"
                r"contracept|fertility|menopaus|eclampsia|abortion|hyperemesis|"
                r"hydatidiform|fibroadenoma|infertility)"),
     "Protecting reproductive health and the next pregnancy",
     ["attend cervical and breast screening at the interval for your age",
      "folate and iodine before and during any planned pregnancy",
      "discuss contraception and pre-conception review before the next "
      "pregnancy"]),

    ("cancer_screening",
     re.compile(r"\b(cancer|carcinoma|sarcoma|lymphoma|leukemia|leukaemia|"
                r"myeloma|tumor|tumour|neoplas|malignan|metasta|polyp)"),
     "Surveillance and early detection",
     ["keep to the surveillance interval your specialist sets - interval "
      "detection is what changes outcome",
      "report new or changing symptoms between appointments rather than "
      "waiting for the next one",
      "smoking cessation and alcohol reduction, which affect recurrence "
      "risk for most solid tumours"]),

    ("injury_prevention",
     re.compile(r"\b(wound|injury|trauma|burn|frostbite|hypothermia|"
                r"poison|overdose|envenomation|bite|foreign body|"
                r"crushing|contusion|hematoma|laceration)"),
     "Preventing a repeat injury",
     ["review how this happened and remove the specific hazard - most "
      "repeat injuries share a cause with the first",
      "keep tetanus immunisation current for any breach of the skin",
      "store medicines and chemicals out of reach and in original labelled "
      "containers"]),

    ("endocrine_monitoring",
     re.compile(r"\b(thyroid|goiter|goitre|adrenal|pituitary|cushing|"
                r"addison|hormone|prolactin|testosterone|estrogen|"
                r"osteoporosis|calcium|vitamin|deficiency|electrolyte|"
                r"kalemia|natremia|calcemia|glycemia|acanthosis|graves|"
                r"gynecomastia|galactorrhea|insipidus|anemia|anaemia|"
                r"hemophil|coagulation|aplastic|hyperkalemia|hypokalemia|"
                r"hypercalcemia|hypocalcemia|hypernatremia|hyponatremia|"
                r"hyperglycemia|hypoglycemia|hyperphosphatemia|"
                r"hypercholesterolemia|hypertriglyceridemia|"
                r"hypogonadism|hypoestrogenism|hyperprolactinemia)"),
     "Keeping levels in range and preventing complications",
     ["blood tests at the recall interval set for you - these conditions "
      "are managed by trend, not by symptoms",
      "take replacement therapy at a consistent time and do not change "
      "dose without a test",
      "weight-bearing exercise plus adequate calcium and vitamin D to "
      "protect bone density"]),
)

# Applies when nothing above matches. Still specific about WHAT to do next,
# because "look after yourself" is not a preventive measure.
_PREVENTION_DEFAULT = (
    "general",
    "Preventing deterioration and catching change early",
    ["note which symptoms are improving and which are not, with dates - "
     "this is the single most useful thing to bring to a review",
     "seek reassessment if symptoms worsen, or if new symptoms appear that "
     "were not part of this assessment",
     "keep vaccinations, blood pressure and routine screening up to date "
     "while this is being investigated"],
)


def _classify_prevention(disease: Optional[str]):
    """Pick the prevention focus for a predicted disease. Never returns None."""
    d = (disease or "").lower()
    for key, pattern, focus, actions in _PREVENTION_RULES:
        if pattern.search(d):
            return key, focus, actions
    return _PREVENTION_DEFAULT


def _generate_disease_prevention(diagnosis: Dict, treatment: Dict,
                                 severity: Dict) -> List[Dict]:
    """
    Prevention advice tied to the predicted condition, so the section is
    populated for every assessment rather than only profiled ones.
    """
    preds = (diagnosis or {}).get("predictions") or []
    if not preds:
        return []
    top = preds[0]
    disease = top.get("disease")
    key, focus, actions = _classify_prevention(disease)

    actions = list(actions)
    # The management pathway changes what prevention means. A surgical or
    # emergency condition should not be answered with lifestyle advice alone.
    category = (treatment or {}).get("management_category")
    if category == "surgical":
        actions.insert(0, "attend the surgical assessment that has been "
                          "recommended - delay is the main avoidable harm here")
    elif category == "emergency":
        actions.insert(0, "this is time-critical: prevention starts with "
                          "immediate emergency assessment, not self-management")
    elif category == "dietary":
        actions.insert(0, "a dietitian referral is the definitive preventive "
                          "step for this condition")

    level = (severity or {}).get("level")
    if level in ("EMERGENCY", "URGENT"):
        actions.insert(0, f"the {level} triage rating takes priority - arrange "
                          f"assessment before acting on any advice below")

    return [{
        "condition": disease,
        "condition_label": str(disease).title(),
        "focus": focus,
        "prevention_key": key,
        "recommended_actions": actions[:4],
        "message": (f"Prevention focus for {str(disease).title()}: "
                    f"{focus.lower()}."),
        "source": "disease_prediction",
    }]


def _generate_preventive_care_notes(chronic_risks: Dict) -> List[Dict]:
    """
    Generate preventive care recommendations for elevated chronic risk conditions
    that the patient isn't currently symptomatic for.
    
    Only generated when chronic risk score is above threshold and based on
    actual contributing risk factors.
    
    Args:
        chronic_risks: Chronic risk assessment output from risk model
    
    Returns:
        List of preventive care note dicts with condition, factors, and message
    """
    if not chronic_risks or not chronic_risks.get("available"):
        return []
    
    cfg = _cfg()
    threshold = cfg.get("chronic_risk_threshold", 60)
    templates = cfg.get("preventive_care_templates", {})
    
    conditions_data = chronic_risks.get("conditions", {})
    notes = []
    
    for condition, data in conditions_data.items():
        risk_score = data.get("risk_score", 0)

        # The risk model tunes a threshold PER CONDITION and reports the
        # outcome as `flagged` - the UI already tells the user that each
        # condition is judged against its own cut-off, not a shared one.
        # A single hardcoded score (60) silently overrode that: it stayed
        # quiet on a flagged condition scoring 55, and fired on an unflagged
        # one scoring 65. Defer to the model, and keep the config score as a
        # fallback only when the model did not express an opinion.
        flagged = data.get("flagged")
        if flagged is None:
            if risk_score < threshold:
                continue
        elif not flagged:
            continue

        # Get top contributing factors
        drivers = data.get("drivers", [])
        if not drivers:
            continue
        
        # Use condition-specific template or default
        template_data = templates.get(condition, templates.get("default", {}))
        template = template_data.get("template", "")
        action_map = template_data.get("actions", {})
        
        if not template:
            continue
        
        # Build factor description and action list
        factor_names = []      # decoded, patient-specific findings
        factor_labels = []     # bare feature names, kept for the audit trail
        action_items = []
        for driver in drivers:
            feature = driver.get("feature", "")
            label = driver.get("label", feature)
            patient_value = driver.get("patient_value")
            if not feature:
                continue
            described = _format_driver(feature, label, patient_value)
            if not described:
                continue
            factor_names.append(described)
            factor_labels.append(label)
            action = action_map.get(feature) or action_map.get(label)
            if action and action not in action_items:
                action_items.append(action)
            if len(factor_names) >= 3:
                break

        if not factor_names:
            continue

        # Format the message
        factors_str = ", ".join(factor_names[:3])
        actions_str = ", ".join(action_items[:3]) if action_items else "preventive care strategies"

        message = template.format(
            condition=data.get("label", condition),
            factors=factors_str,
            actions=actions_str
        )
        # Lead with where this patient actually sits. "Elevated likelihood"
        # is not a number; "86th percentile against 1.1M BRFSS respondents"
        # is, and it is the same figure the risk panel already shows.
        percentile = data.get("percentile", risk_score)
        message = (f"Ranks in the {_ordinal(percentile)} percentile against "
                   f"1.1M CDC BRFSS respondents. ") + message

        notes.append({
            "condition": condition,
            "condition_label": data.get("label", condition),
            "risk_score": risk_score,
            "percentile": percentile,
            "risk_band": data.get("band", "elevated"),
            "flagged_by_model": bool(flagged),
            "contributing_factors": factor_names,
            "contributing_features": factor_labels,
            "recommended_actions": action_items,
            "message": message,
            "source": "chronic_risk_model"
        })
    
    return notes


def _generate_self_care_suggestions(treatment_options: Dict,
                                    severity_level: str,
                                    has_red_flags: bool) -> List[Dict]:
    """
    Generate self-care suggestions from treatment options when appropriate.
    
    Only for MILD/MODERATE severity with no red flags, pulled from existing
    cures/OTC fields in disease/treatment data.
    
    Args:
        treatment_options: Treatment recommendation output
        severity_level: Current severity level
        has_red_flags: Whether any red flags are present
    
    Returns:
        List of self-care suggestion dicts
    """
    cfg = _cfg()
    allowed_severities = cfg.get("self_care_severity_limit", ["MILD", "MODERATE"])
    exclude_for_red_flags = cfg.get("self_care_red_flag_exclusion", True)
    
    # Check eligibility
    if severity_level not in allowed_severities:
        return []
    
    if exclude_for_red_flags and has_red_flags:
        return []
    
    if not treatment_options or not treatment_options.get("available"):
        return []
    
    suggestions = []
    
    # Extract from disease reference data
    reference = treatment_options.get("reference")
    if reference and isinstance(reference, dict):
        cures = reference.get("cures", "")
        if cures:
            # Parse cures field for OTC/self-care items
            cure_items = [c.strip() for c in str(cures).split(",")]
            
            # Common OTC/self-care keywords
            otc_keywords = [
                "over-the-counter", "otc", "rest", "fluids", "hydration",
                "lifestyle", "self-care", "home care", "monitoring",
                "acetaminophen", "ibuprofen", "aspirin", "antihistamine"
            ]
            
            for item in cure_items:
                item_lower = item.lower()
                if any(keyword in item_lower for keyword in otc_keywords):
                    suggestions.append({
                        "suggestion": item.strip(),
                        "type": "otc_or_lifestyle",
                        "source": "disease_lookup_cures"
                    })
    
    # Extract from treatment drugs marked as OTC
    drugs = treatment_options.get("drugs", [])
    for drug in drugs[:5]:  # Limit to top 5
        drug_name = drug.get("drug", "")
        
        # Check if it's an OTC medication (heuristic)
        otc_indicators = [
            "acetaminophen", "ibuprofen", "aspirin", "antihistamine",
            "guaifenesin", "dextromethorphan", "loperamide", "omeprazole"
        ]
        
        if any(indicator in drug_name.lower() for indicator in otc_indicators):
            suggestions.append({
                "suggestion": f"{drug_name} (over-the-counter)",
                "type": "otc_medication",
                "source": "treatment_recommendations",
                "drug_class": drug.get("drug_class", "")
            })
    
    return suggestions[:5]  # Limit to 5 suggestions


def _generate_clinical_insights(diagnosis: Dict, treatment: Dict,
                                severity: Dict) -> List[Dict]:
    """
    The findings specific to THIS assessment, each traceable to one component.

    Deliberately quantified. "Discuss your symptoms with a doctor" applies to
    every user of this tool and therefore tells this one nothing; "Ileus at
    20% confidence, and predictions in that band were right 34% of the time"
    is a fact about this run that changes how much weight to give it.

    Every insight carries `source`, so a clinician can see which model spoke.
    """
    insights: List[Dict] = []

    # -- what was predicted, and how much to trust it ----------------------
    preds = (diagnosis or {}).get("predictions") or []
    if (diagnosis or {}).get("available") and preds:
        top = preds[0]
        conf = (diagnosis or {}).get("confidence") or {}
        calibrated = conf.get("calibrated_pct")
        raw = top.get("confidence_pct")
        text = (f"Top prediction is {str(top.get('disease','')).title()} at "
                f"{raw}% raw confidence.")
        if calibrated is not None:
            text += (f" On held-out data, predictions in this band were "
                     f"correct {calibrated}% of the time - treat it as a "
                     f"shortlist, not a conclusion.")
        matched = top.get("matched_symptoms") or []
        if matched:
            text += f" Driven by: {', '.join(matched[:4])}."
        insights.append({"type": "diagnostic_confidence", "text": text,
                         "source": "disease_model"})

        # A near-tie is a different clinical situation from a clear leader,
        # and the patient cannot see that from a single headline number.
        if len(preds) > 1:
            second = preds[1]
            gap = (top.get("confidence_pct") or 0) - (second.get("confidence_pct") or 0)
            if gap < 10:
                insights.append({
                    "type": "close_differential",
                    "text": (f"{str(second.get('disease','')).title()} is close "
                             f"behind at {second.get('confidence_pct')}% - the "
                             f"model is not separating these two. Both are "
                             f"worth raising with a clinician."),
                    "source": "disease_model"})

    # -- what the treatment layer actually means ---------------------------
    t = treatment or {}
    if t.get("drugs"):
        layer = t.get("layer")
        n = len(t.get("drugs") or [])
        if layer == "mimic":
            text = (f"{n} option(s) drawn from what clinicians actually "
                    f"prescribed during similar real admissions. This is "
                    f"hospital prescribing behaviour, not proof of efficacy.")
        else:
            text = (f"{n} option(s) ranked from aggregated patient-reported "
                    f"satisfaction for '{t.get('condition')}'. This reflects "
                    f"how patients rated their experience - not efficacy, "
                    f"safety, or suitability for this patient.")
        insights.append({"type": "treatment_provenance", "text": text,
                         "source": f"treatment_cascade:{layer}"})
    elif t.get("gate_reason") == "no_pharmacological_treatment":
        insights.append({
            "type": "non_pharmacological",
            "text": (t.get("management_note") or "").strip(),
            "source": "treatment_cascade"})
    elif t.get("gate_reason") == "no_condition_match":
        insights.append({
            "type": "treatment_data_gap",
            "text": ("No treatment data is held for this condition in either "
                     "source. That is an absence of data, not evidence that "
                     "no treatment exists - ask a clinician directly."),
            "source": "treatment_cascade"})

    # -- what actually drove the triage score ------------------------------
    components = (severity or {}).get("components") or {}
    contributing = sorted(
        ((k, c) for k, c in components.items() if (c or {}).get("contribution", 0) > 0),
        key=lambda kv: kv[1].get("contribution", 0), reverse=True)
    if contributing:
        top_c = contributing[0][1]
        insights.append({
            "type": "severity_driver",
            "text": (f"The largest contributor to the {severity.get('level')} "
                     f"rating was {top_c.get('label','').lower()} "
                     f"({top_c.get('contribution', 0):.3f} of "
                     f"{severity.get('score', 0):.2f})."),
            "source": "severity_engine"})

    for flag in ((severity or {}).get("critical_red_flags") or [])[:3]:
        insights.append({
            "type": "red_flag",
            "text": (f"'{flag}' is a red-flag symptom and overrides the "
                     f"score on its own. Seek urgent assessment."),
            "source": "severity_engine"})

    return insights


def generate_healthcare_recommendation(
    severity_result: Dict,
    disease_predictions: Dict,
    chronic_risks: Dict,
    treatment_options: Dict
) -> Dict:
    """
    Generate consolidated healthcare recommendation from all model outputs.
    
    Takes the outputs of all four existing components and produces one unified,
    rule-based healthcare recommendation with clear action guidance.
    
    Args:
        severity_result: Output from severity_engine.compute_severity()
        disease_predictions: Output from disease_model.predict()
        chronic_risks: Output from risk_model.assess()
        treatment_options: Output from treatment_cascade.recommend()
    
    Returns:
        Dictionary with six fields:
            - primary_action: Clear instruction based on severity level
            - urgency_timeline: Follow-up window (immediate / same-day / etc.)
            - recommended_specialist: Consolidated specialist recommendation
            - preventive_care_notes: List of preventive care recommendations
            - self_care_suggestions: List of self-care options (when appropriate)
            - disclaimer: Standard medical disclaimer
        
        Plus metadata about which components contributed to each field.
    """
    cfg = _cfg()
    
    # Extract severity level
    severity_level = severity_result.get("level", "MODERATE")
    
    # Get primary action and urgency from config
    severity_actions = cfg.get("severity_actions", {})
    action_config = severity_actions.get(severity_level, {})
    
    primary_action = action_config.get(
        "primary_action",
        "Consult with a healthcare provider"
    )
    urgency_timeline = action_config.get("urgency_timeline", "as needed")
    urgency_description = action_config.get(
        "urgency_description",
        "Contact your healthcare provider for guidance"
    )
    
    # Identify red flags
    critical_flags = severity_result.get("critical_red_flags", [])
    serious_flags = severity_result.get("serious_red_flags", [])
    all_red_flags = critical_flags + serious_flags
    has_red_flags = len(all_red_flags) > 0
    red_flag_category = _extract_red_flag_category(all_red_flags)
    
    # Determine recommended specialist
    specialist_candidates = []
    specialist_sources = []
    
    # From disease prediction
    if disease_predictions and disease_predictions.get("available"):
        predictions = disease_predictions.get("predictions", [])
        if predictions:
            top_disease = predictions[0].get("disease")
            reference = predictions[0].get("reference")
            
            if reference and isinstance(reference, dict):
                specialist = _normalize_specialist(reference.get("doctor"))
                if specialist:
                    specialist_candidates.append(specialist)
                    specialist_sources.append({
                        "source": "disease_prediction",
                        "disease": top_disease,
                        "rank": 1
                    })
    
    # From treatment options
    if treatment_options and treatment_options.get("reference"):
        reference = treatment_options.get("reference", {})
        if isinstance(reference, dict):
            specialist = _normalize_specialist(reference.get("doctor"))
            if specialist and specialist not in specialist_candidates:
                specialist_candidates.append(specialist)
                specialist_sources.append({
                    "source": "treatment_reference",
                    "disease": treatment_options.get("for_disease")
                })
    
    # Prioritize specialist based on severity and red flags
    recommended_specialist = _prioritize_specialist(
        specialist_candidates,
        severity_level,
        red_flag_category
    )
    
    # If no specialist found, provide generic recommendation based on severity
    specialist_note = None
    if not recommended_specialist:
        if severity_level == "EMERGENCY":
            recommended_specialist = "emergency medicine physician"
            specialist_note = "Seek emergency care immediately"
        elif severity_level == "URGENT":
            recommended_specialist = "primary care physician or urgent care"
            specialist_note = "Contact your healthcare provider today"
        else:
            recommended_specialist = "primary care physician"
            specialist_note = "Schedule an appointment with your regular doctor"
    
    # Generate preventive care notes
    # Two independent sources, and the section must be present either way.
    # Chronic-risk notes are the more specific of the two (they quote the
    # patient's own measurements), so they lead; disease-directed prevention
    # is what guarantees the section is never empty.
    preventive_care_notes = _generate_preventive_care_notes(chronic_risks)
    preventive_care_notes += _generate_disease_prevention(
        disease_predictions, treatment_options, severity_result)
    
    # Generate self-care suggestions
    self_care_suggestions = _generate_self_care_suggestions(
        treatment_options,
        severity_level,
        has_red_flags
    )
    
    # Findings specific to this assessment, not to the tool in general.
    clinical_insights = _generate_clinical_insights(
        disease_predictions, treatment_options, severity_result)

    # Build the recommendation
    recommendation = {
        "primary_action": primary_action,
        "urgency_timeline": urgency_timeline,
        "urgency_description": urgency_description,
        "recommended_specialist": recommended_specialist,
        "specialist_note": specialist_note,
        "clinical_insights": clinical_insights,
        "preventive_care_notes": preventive_care_notes,
        "self_care_suggestions": self_care_suggestions,
        "disclaimer": cfg.get("disclaimer", ""),
        
        # Metadata for transparency
        "metadata": {
            "severity_level": severity_level,
            "severity_score": severity_result.get("score"),
            "has_red_flags": has_red_flags,
            "red_flag_category": red_flag_category,
            "specialist_candidates": specialist_candidates,
            "specialist_sources": specialist_sources,
            "specialist_selection_reason": (
                f"Prioritized based on {severity_level} severity"
                + (f" with {red_flag_category} red flags" if red_flag_category else "")
            ) if specialist_candidates else "Default based on severity level",
            "components_used": {
                "severity_engine": True,
                "disease_prediction": disease_predictions.get("available", False),
                "chronic_risk_model": chronic_risks.get("available", False),
                "treatment_model": treatment_options.get("available", False)
            }
        }
    }
    
    return recommendation
