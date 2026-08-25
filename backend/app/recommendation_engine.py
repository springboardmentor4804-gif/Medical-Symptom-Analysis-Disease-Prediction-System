"""
Milestone 3 Recommendation Engine

Generates comprehensive personalized health recommendations based on:
- Predicted disease and confidence level
- Patient medical history and existing conditions
- Risk assessment level
- Patient demographics (age, gender, etc.)
- Symptom severity and frequency

Recommendation categories:
1. Treatment Suggestions: Medications and therapeutic interventions
2. Preventive Care Advice: Preventive measures and screening
3. Lifestyle Advice: Diet, exercise, sleep, stress management
4. Follow-up Guidance: When and how to follow up with provider
"""

from typing import List, Optional, Dict, Any
from enum import Enum
import json


class RecommendationType(str, Enum):
    """Types of recommendations in the recommendation engine."""
    TREATMENT = "treatment"
    PREVENTIVE = "preventive"
    LIFESTYLE = "lifestyle"
    FOLLOW_UP = "follow-up"


class Priority(str, Enum):
    """Priority levels for recommendations."""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RecommendationItem:
    """Represents a single recommendation."""
    
    def __init__(
        self,
        recommendation: str,
        recommendation_type: RecommendationType,
        medicine: Optional[str] = None,
        priority: Priority = Priority.MEDIUM,
        additional_notes: Optional[str] = None
    ):
        self.recommendation = recommendation
        self.recommendation_type = recommendation_type
        self.medicine = medicine
        self.priority = priority
        self.additional_notes = additional_notes
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            'recommendation': self.recommendation,
            'recommendation_type': self.recommendation_type.value,
            'medicine': self.medicine,
            'priority': self.priority.value,
            'additional_notes': self.additional_notes,
        }


class RecommendationEngine:
    """
    Generates personalized health recommendations based on patient profile,
    disease prediction, and risk assessment.
    """
    
    # Disease-specific treatment recommendations
    DISEASE_TREATMENTS = {
        'flu': {
            'medicines': ['Oseltamivir (Tamiflu)', 'Ibuprofen', 'Paracetamol'],
            'treatment': 'Antiviral therapy, symptomatic relief, rest, and hydration',
            'priority': Priority.HIGH,
        },
        'influenza': {
            'medicines': ['Oseltamivir (Tamiflu)', 'Baloxavir marboxil'],
            'treatment': 'Antiviral treatment within 48 hours of symptom onset',
            'priority': Priority.HIGH,
        },
        'covid': {
            'medicines': ['Paxlovid', 'Remdesivir', 'Monoclonal antibodies'],
            'treatment': 'Antiviral therapy for high-risk patients, oxygen support as needed',
            'priority': Priority.HIGH,
        },
        'diabetes': {
            'medicines': ['Metformin', 'Insulin', 'GLP-1 agonists', 'SGLT2 inhibitors'],
            'treatment': 'Glycemic control through medication and lifestyle management',
            'priority': Priority.HIGH,
        },
        'hypertension': {
            'medicines': ['ACE inhibitors', 'Beta-blockers', 'Calcium channel blockers', 'Diuretics'],
            'treatment': 'Blood pressure management through medication and lifestyle changes',
            'priority': Priority.HIGH,
        },
        'asthma': {
            'medicines': ['Salbutamol (Albuterol)', 'Inhaled corticosteroids', 'Leukotriene modifiers'],
            'treatment': 'Asthma control with bronchodilators and anti-inflammatory agents',
            'priority': Priority.HIGH,
        },
        'heart disease': {
            'medicines': ['Aspirin', 'Statins', 'ACE inhibitors', 'Beta-blockers', 'Nitrates'],
            'treatment': 'Cardiac management with medications and cardiac rehabilitation',
            'priority': Priority.URGENT,
        },
        'pneumonia': {
            'medicines': ['Antibiotics (Amoxicillin, Azithromycin)', 'Oxygen therapy'],
            'treatment': 'Antibiotic therapy and supportive care',
            'priority': Priority.HIGH,
        },
        'arthritis': {
            'medicines': ['NSAIDs', 'Corticosteroids', 'Biologic agents'],
            'treatment': 'Anti-inflammatory medications and physical therapy',
            'priority': Priority.MEDIUM,
        },
        'migraine': {
            'medicines': ['Triptans', 'NSAIDs', 'Preventive agents'],
            'treatment': 'Acute and preventive migraine management',
            'priority': Priority.MEDIUM,
        },
        'anxiety': {
            'medicines': ['SSRIs', 'Benzodiazepines (short-term)', 'Buspirone'],
            'treatment': 'Psychotherapy and medication management',
            'priority': Priority.MEDIUM,
        },
        'depression': {
            'medicines': ['SSRIs', 'SNRIs', 'Tricyclic antidepressants'],
            'treatment': 'Antidepressant therapy and psychotherapy',
            'priority': Priority.HIGH,
        },
    }
    
    # Preventive care recommendations by disease
    PREVENTIVE_MEASURES = {
        'flu': [
            'Annual flu vaccination',
            'Hand hygiene - wash hands frequently',
            'Avoid close contact with sick individuals',
        ],
        'influenza': [
            'Annual influenza vaccine',
            'COVID-19 vaccination (provides cross-protection)',
            'Maintain healthy immune system',
        ],
        'covid': [
            'COVID-19 vaccination and boosters',
            'Regular handwashing and hygiene',
            'Wear mask in crowded settings if high-risk',
        ],
        'diabetes': [
            'Regular blood glucose screening',
            'Annual eye examination (retinopathy screening)',
            'Annual kidney function tests',
            'Regular foot checks',
            'Annual cardiovascular assessment',
        ],
        'hypertension': [
            'Regular blood pressure monitoring (daily at home)',
            'Annual cardiovascular assessment',
            'Regular kidney function tests',
            'Cholesterol screening',
        ],
        'asthma': [
            'Peak flow monitoring',
            'Regular spirometry testing',
            'Allergy testing and management',
            'Annual respiratory assessment',
        ],
        'heart disease': [
            'Regular ECG monitoring',
            'Stress testing as recommended',
            'Regular echocardiography',
            'Lipid panel screening',
            'Comprehensive cardiovascular assessment',
        ],
        'pneumonia': [
            'Pneumococcal vaccination',
            'Avoid smoking',
            'Maintain healthy immune system',
        ],
        'arthritis': [
            'Regular joint assessment',
            'Bone density screening (if osteoarthritis)',
            'Rheumatoid factor screening (if rheumatoid)',
        ],
    }
    
    # Lifestyle recommendations by disease
    LIFESTYLE_RECOMMENDATIONS = {
        'flu': {
            'diet': 'Maintain fluid intake, consume vitamin C-rich foods, avoid alcohol',
            'exercise': 'Rest during acute phase, light walking when improving',
            'sleep': 'Aim for 8-10 hours daily during recovery',
            'stress': 'Minimize stress to aid immune recovery',
        },
        'influenza': {
            'diet': 'Balanced diet with immune-boosting foods (citrus, berries, garlic)',
            'exercise': 'Rest and light activity during illness',
            'sleep': '8+ hours daily for recovery',
            'stress': 'Stress management for immune health',
        },
        'covid': {
            'diet': 'Anti-inflammatory diet, adequate protein, vitamins C and D',
            'exercise': 'Gradual return to activity post-recovery',
            'sleep': '8-9 hours daily, especially post-illness',
            'stress': 'Mindfulness and stress reduction techniques',
        },
        'diabetes': {
            'diet': 'Low glycemic index diet, controlled carbohydrates, limited sugar and processed foods',
            'exercise': '150 minutes moderate aerobic activity + 2 days resistance training weekly',
            'sleep': '7-9 hours nightly, consistent sleep schedule',
            'stress': 'Regular stress management and meditation',
        },
        'hypertension': {
            'diet': 'DASH diet (rich in vegetables, fruits, lean proteins), limit salt to <2.3g daily',
            'exercise': '150 minutes moderate aerobic activity weekly',
            'sleep': '7-9 hours nightly, avoid caffeine before bed',
            'stress': 'Stress reduction techniques, yoga, meditation',
        },
        'asthma': {
            'diet': 'Anti-inflammatory diet, avoid known food triggers',
            'exercise': 'Regular moderate exercise, avoid cold air triggers',
            'sleep': '8+ hours nightly, elevated head position',
            'stress': 'Stress management - triggers can worsen asthma',
        },
        'heart disease': {
            'diet': 'Mediterranean diet, limit sodium, avoid saturated fats',
            'exercise': 'Cardiac rehabilitation, gradually increase activity as tolerated',
            'sleep': '7-9 hours nightly, sleep apnea screening if snoring',
            'stress': 'Cardiac stress reduction, meditation, counseling',
        },
        'pneumonia': {
            'diet': 'Nutrient-dense foods, adequate protein for immune function',
            'exercise': 'Gradual return to activity post-recovery',
            'sleep': '8-10 hours daily during recovery',
            'stress': 'Rest and stress reduction for immune recovery',
        },
        'arthritis': {
            'diet': 'Anti-inflammatory diet, omega-3 fatty acids, limit inflammatory foods',
            'exercise': 'Low-impact exercises (swimming, tai chi), daily range of motion',
            'sleep': '7-9 hours, proper mattress and pillows',
            'stress': 'Pain management and stress reduction techniques',
        },
        'migraine': {
            'diet': 'Identify and avoid triggers (MSG, aged cheeses, caffeine withdrawal)',
            'exercise': 'Regular moderate exercise, avoid excessive exertion',
            'sleep': '7-9 hours nightly, consistent schedule',
            'stress': 'Stress management, relaxation techniques, biofeedback',
        },
        'anxiety': {
            'diet': 'Regular meals, limit caffeine, alcohol moderation',
            'exercise': 'Regular aerobic exercise 30 min daily',
            'sleep': '7-9 hours, good sleep hygiene',
            'stress': 'Meditation, deep breathing, therapy, mindfulness',
        },
        'depression': {
            'diet': 'Regular balanced nutrition, adequate B vitamins and omega-3s',
            'exercise': 'Regular exercise 30-60 min most days - mood enhancing',
            'sleep': '7-9 hours, maintain consistent schedule',
            'stress': 'Therapy, social support, stress reduction activities',
        },
    }
    
    # Follow-up guidance by disease and risk level
    FOLLOWUP_GUIDANCE = {
        'urgent': {
            'schedule': 'Within 2-3 days',
            'reason': 'Close monitoring needed for serious condition',
            'contact_if': 'Symptoms worsen, new concerning symptoms develop, unable to tolerate medications',
        },
        'high': {
            'schedule': 'Within 1-2 weeks',
            'reason': 'Regular follow-up to monitor condition management',
            'contact_if': 'No improvement in symptoms, side effects from medications, complications develop',
        },
        'medium': {
            'schedule': 'Within 2-4 weeks',
            'reason': 'Monitor response to treatment and lifestyle changes',
            'contact_if': 'Limited symptom improvement after 1 week, new symptoms, medication issues',
        },
        'low': {
            'schedule': 'Within 4-6 weeks',
            'reason': 'Routine follow-up and monitoring',
            'contact_if': 'Symptoms persist beyond 2 weeks, new health concerns, routine reassessment',
        },
    }
    
    def __init__(self):
        """Initialize the recommendation engine."""
        self.recommendations = []
    
    def generate_recommendations(
        self,
        predicted_disease: str,
        confidence: float,
        patient_profile: Optional[Dict[str, Any]] = None,
        risk_level: Optional[str] = None,
        medical_history: Optional[str] = None,
        symptom_severity: Optional[str] = None,
    ) -> List[RecommendationItem]:
        """
        Generate comprehensive personalized recommendations.
        
        Args:
            predicted_disease: The disease prediction
            confidence: Confidence score of prediction (0-1)
            patient_profile: Dictionary with patient demographics
            risk_level: Risk assessment level (low, medium, high, urgent)
            medical_history: Patient's medical history
            symptom_severity: Severity of current symptoms
            
        Returns:
            List of RecommendationItem objects
        """
        self.recommendations = []
        disease = (predicted_disease or '').strip().lower()
        
        # Determine priority based on confidence and risk
        priority = self._determine_priority(confidence, risk_level)
        
        # Generate treatment recommendations
        self._generate_treatment_recommendations(disease, priority)
        
        # Generate preventive care recommendations
        self._generate_preventive_recommendations(disease, priority)
        
        # Generate lifestyle recommendations
        self._generate_lifestyle_recommendations(disease, patient_profile, medical_history)
        
        # Generate follow-up guidance
        self._generate_followup_recommendations(priority)
        
        return self.recommendations
    
    def _determine_priority(self, confidence: float, risk_level: Optional[str]) -> Priority:
        """Determine overall priority based on confidence and risk."""
        risk_level = (risk_level or '').lower().strip()
        
        # Map risk level to priority
        risk_priority_map = {
            'urgent': Priority.URGENT,
            'high': Priority.HIGH,
            'medium': Priority.MEDIUM,
            'low': Priority.LOW,
        }
        
        if risk_level in risk_priority_map:
            return risk_priority_map[risk_level]
        
        # Fallback to confidence-based priority
        if confidence >= 0.9:
            return Priority.HIGH
        elif confidence >= 0.7:
            return Priority.MEDIUM
        else:
            return Priority.LOW
    
    def _generate_treatment_recommendations(self, disease: str, priority: Priority) -> None:
        """Generate treatment-specific recommendations."""
        # Find matching disease in our database
        matched_disease = None
        disease_lower = disease.lower()
        
        for db_disease in self.DISEASE_TREATMENTS.keys():
            if db_disease in disease_lower or disease_lower in db_disease:
                matched_disease = db_disease
                break
        
        if matched_disease:
            treatment_info = self.DISEASE_TREATMENTS[matched_disease]
            medicines = ', '.join(treatment_info['medicines'][:2])  # First 2 medicines
            
            rec = RecommendationItem(
                recommendation=treatment_info['treatment'],
                recommendation_type=RecommendationType.TREATMENT,
                medicine=medicines,
                priority=max(priority, treatment_info['priority']),  # Use higher priority
                additional_notes=f"Consult with your provider to determine the most appropriate medication for your specific case."
            )
            self.recommendations.append(rec)
        else:
            # Generic treatment recommendation
            rec = RecommendationItem(
                recommendation=f"Consult with your healthcare provider to develop an appropriate treatment plan for {disease}.",
                recommendation_type=RecommendationType.TREATMENT,
                priority=priority,
                additional_notes="A healthcare provider can recommend specific medications and treatments tailored to your needs."
            )
            self.recommendations.append(rec)
    
    def _generate_preventive_recommendations(self, disease: str, priority: Priority) -> None:
        """Generate preventive care recommendations."""
        disease_lower = disease.lower()
        
        # Find preventive measures for this disease
        for db_disease, measures in self.PREVENTIVE_MEASURES.items():
            if db_disease in disease_lower or disease_lower in db_disease:
                for measure in measures:
                    rec = RecommendationItem(
                        recommendation=f"Schedule: {measure}",
                        recommendation_type=RecommendationType.PREVENTIVE,
                        priority=Priority.HIGH,
                        additional_notes="Preventive care helps avoid complications and progression of the condition."
                    )
                    self.recommendations.append(rec)
                return
        
        # Generic preventive recommendation
        rec = RecommendationItem(
            recommendation="Schedule regular health screenings and preventive care visits with your provider.",
            recommendation_type=RecommendationType.PREVENTIVE,
            priority=Priority.MEDIUM,
            additional_notes="Regular check-ups help monitor your health and catch potential issues early."
        )
        self.recommendations.append(rec)
    
    def _generate_lifestyle_recommendations(
        self,
        disease: str,
        patient_profile: Optional[Dict[str, Any]] = None,
        medical_history: Optional[str] = None
    ) -> None:
        """Generate lifestyle recommendations."""
        disease_lower = disease.lower()
        
        # Find lifestyle recommendations for this disease
        lifestyle_found = False
        for db_disease, lifestyle in self.LIFESTYLE_RECOMMENDATIONS.items():
            if db_disease in disease_lower or disease_lower in db_disease:
                lifestyle_found = True
                # Create separate recommendations for diet, exercise, sleep, stress
                rec_diet = RecommendationItem(
                    recommendation=f"Diet: {lifestyle['diet']}",
                    recommendation_type=RecommendationType.LIFESTYLE,
                    priority=Priority.HIGH,
                    additional_notes="Proper nutrition supports treatment and recovery."
                )
                self.recommendations.append(rec_diet)
                
                rec_exercise = RecommendationItem(
                    recommendation=f"Exercise: {lifestyle['exercise']}",
                    recommendation_type=RecommendationType.LIFESTYLE,
                    priority=Priority.MEDIUM,
                    additional_notes="Regular physical activity improves health outcomes."
                )
                self.recommendations.append(rec_exercise)
                
                rec_sleep = RecommendationItem(
                    recommendation=f"Sleep: {lifestyle['sleep']}",
                    recommendation_type=RecommendationType.LIFESTYLE,
                    priority=Priority.HIGH,
                    additional_notes="Adequate sleep is critical for recovery and immune function."
                )
                self.recommendations.append(rec_sleep)
                
                rec_stress = RecommendationItem(
                    recommendation=f"Stress Management: {lifestyle['stress']}",
                    recommendation_type=RecommendationType.LIFESTYLE,
                    priority=Priority.MEDIUM,
                    additional_notes="Stress management improves overall health outcomes."
                )
                self.recommendations.append(rec_stress)
                break
        
        if not lifestyle_found:
            # Generic lifestyle recommendations
            rec = RecommendationItem(
                recommendation="Maintain a healthy lifestyle with regular exercise, balanced diet, adequate sleep (7-9 hours), and stress management.",
                recommendation_type=RecommendationType.LIFESTYLE,
                priority=Priority.MEDIUM,
                additional_notes="These foundational health practices support recovery and prevention."
            )
            self.recommendations.append(rec)
    
    def _generate_followup_recommendations(self, priority: Priority) -> None:
        """Generate follow-up guidance recommendations."""
        priority_str = priority.value
        if priority_str not in self.FOLLOWUP_GUIDANCE:
            priority_str = 'medium'
        
        followup = self.FOLLOWUP_GUIDANCE[priority_str]
        
        rec = RecommendationItem(
            recommendation=f"Follow-up Schedule: {followup['schedule']}",
            recommendation_type=RecommendationType.FOLLOW_UP,
            priority=priority,
            additional_notes=f"{followup['reason']}. Contact your provider immediately if {followup['contact_if']}"
        )
        self.recommendations.append(rec)


def generate_recommendations_for_prediction(
    session,
    patient_id: int,
    prediction_id: int,
    predicted_disease: str,
    confidence: float,
    patient_profile,
    risk_assessment,
    symptoms: Optional[List[str]] = None,
    medical_history_text: Optional[str] = None,
) -> List[int]:
    """
    Generate and store recommendations for a prediction.
    
    Args:
        session: Database session
        patient_id: Patient ID
        prediction_id: Prediction ID to link recommendations to
        predicted_disease: Predicted disease name
        confidence: Prediction confidence score
        patient_profile: Patient profile object
        risk_assessment: Risk assessment object
        symptoms: List of symptoms
        medical_history_text: Medical history text
        
    Returns:
        List of recommendation IDs created
    """
    from app.models import Recommendation
    from datetime import datetime
    
    engine = RecommendationEngine()
    
    # Build patient profile dict
    patient_dict = {}
    if patient_profile:
        patient_dict = {
            'age': getattr(patient_profile, 'age', None),
            'gender': getattr(patient_profile, 'gender', None),
            'weight': getattr(patient_profile, 'weight', None),
            'height': getattr(patient_profile, 'height', None),
            'existing_conditions': getattr(patient_profile, 'existing_conditions', None),
            'allergies': getattr(patient_profile, 'allergies', None),
        }
    
    # Determine risk level
    risk_level = None
    if risk_assessment:
        risk_level = getattr(risk_assessment, 'risk_level', None)
    
    # Generate recommendations
    rec_items = engine.generate_recommendations(
        predicted_disease=predicted_disease,
        confidence=confidence,
        patient_profile=patient_dict,
        risk_level=risk_level,
        medical_history=medical_history_text,
        symptom_severity=None,
    )
    
    # Store in database
    recommendation_ids = []
    for rec_item in rec_items:
        recommendation = Recommendation(
            patient_id=patient_id,
            prediction_id=prediction_id,
            recommendation=rec_item.recommendation,
            medicine=rec_item.medicine,
            priority=rec_item.priority.value,
            recommendation_type=rec_item.recommendation_type.value,
            status='approved',  # Auto-approved when provider approves prediction
            ai_generated='yes',
            provider_comments=rec_item.additional_notes,
            reviewed_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        session.add(recommendation)
        session.flush()
        recommendation_ids.append(recommendation.id)
    
    session.commit()
    return recommendation_ids
