import unittest
from unittest.mock import MagicMock, patch

from app.main import build_healthcare_advisory, build_report_download_url, build_report_payload, build_report_pdf, build_report_text, evaluate_patient_risk, get_patient_dashboard, review_recommendation
from app.models import Recommendation


class ReportWorkflowTests(unittest.TestCase):
    def test_healthcare_advisory_uses_prediction_risk_and_symptoms(self):
        advisory = build_healthcare_advisory(
            predicted_disease='Malaria',
            risk_assessment='High risk: severe symptom burden.',
            symptoms=['fever', 'vomiting'],
        )

        self.assertTrue(any('mosquito' in item.lower() for item in advisory['preventive_care']))
        self.assertIn('promptly', advisory['follow_up_guidance'].lower())
        self.assertIn('urgent', advisory['when_to_seek_care'].lower())
        self.assertIn('does not replace', advisory['disclaimer'])

    def test_download_report_has_readable_line_breaks_and_confidence(self):
        payload = build_report_payload(
            patient_id=5,
            symptoms=['headache', 'vomiting'],
            predicted_disease='Malaria',
            confidence_score=0.8098811507225037,
            risk_assessment='Existing conditions may increase health risk.',
            provider_status='approved',
        )

        report_text = build_report_text(payload)
        report_url = build_report_download_url(payload)

        self.assertIn('\n\nSYMPTOMS\n', report_text)
        self.assertIn('Confidence score: 80.99%', report_text)
        self.assertTrue(report_url.startswith('data:application/pdf;base64,'))

    def test_pdf_report_has_pdf_signature(self):
        pdf = build_report_pdf({
            'date': '2026-08-13',
            'patient_id': 5,
            'symptoms': ['headache'],
            'predicted_disease': 'Malaria',
            'confidence_score': 0.8098811507225037,
            'risk_assessment': 'Existing conditions may increase health risk.',
            'provider_status': 'approved',
            'provider_comments': 'Awaiting provider review.',
            'recommendations': 'No recommendations available.',
        })

        self.assertTrue(pdf.startswith(b'%PDF-'))

    def test_build_report_payload_includes_approval_details(self):
        payload = build_report_payload(
            patient_id=42,
            symptoms=["fever", "cough", "fatigue"],
            predicted_disease="Influenza",
            confidence_score=0.91,
            risk_assessment="Moderate (68) - monitor symptoms closely",
            provider_status="approved",
            provider_comments="This aligns with the admitted symptoms and current risk level.",
            recommendations="Rest, fluids, and a follow-up visit if symptoms worsen.",
        )

        self.assertEqual(payload["patient_id"], 42)
        self.assertEqual(payload["provider_status"], "approved")
        self.assertEqual(payload["predicted_disease"], "Influenza")
        self.assertEqual(payload["confidence_score"], 0.91)
        self.assertIn("fever", payload["symptoms"])
        self.assertIn("Moderate", payload["risk_assessment"])
        self.assertIn("risk level", payload["provider_comments"].lower())
        self.assertIn("Rest", payload["recommendations"])

    @patch('app.main.get_authenticated_user')
    def test_review_recommendation_uses_recommendation_id_and_approval_status(self, get_authenticated_user):
        recommendation = Recommendation(
            id=7,
            patient_id=3,
            recommendation='Initial AI suggestion',
            medicine='Vitamin C',
            status='pending',
            provider_comments='Awaiting review',
        )
        session = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = recommendation
        get_authenticated_user.return_value = MagicMock(role='doctor')

        payload = type('Payload', (), {'recommendation_id': 7, 'status': 'approved', 'provider_comments': 'Reviewed and approved'})()

        response = review_recommendation(payload, authorization='Bearer token', session=session)

        self.assertEqual(response['status'], 'approved')
        self.assertEqual(recommendation.status, 'approved')
        self.assertEqual(recommendation.provider_comments, 'Reviewed and approved')
        self.assertEqual(recommendation.reviewed_at is not None, True)

    def test_evaluate_patient_risk_classifies_high_risk_factors(self):
        profile = MagicMock(
            age=68,
            gender='female',
            existing_conditions='diabetes, hypertension',
            allergies='none',
            bmi=32,
            weight=78,
            height=156,
            blood_group='O+',
            dob=None,
        )
        symptoms = ['shortness of breath', 'fever', 'persistent cough', 'fatigue']
        result = evaluate_patient_risk(
            profile=profile,
            symptoms=symptoms,
            predicted_disease='Asthma',
            medical_history='Diabetes and hypertension history',
            lifestyle={'smoking': 'yes', 'alcohol': 'heavy', 'exercise': 'low'},
        )

        self.assertGreater(result['score'], 70)
        self.assertEqual(result['risk_level'], 'High')
        self.assertIn('age', ' '.join(result['factors']).lower())
        self.assertIn('smoking', ' '.join(result['factors']).lower())
        self.assertIn('consult a healthcare provider', result['warning'].lower())

    @patch('app.main.get_authenticated_user')
    def test_patient_dashboard_only_shows_approved_recommendations(self, get_authenticated_user):
        user = MagicMock(id=5, role='patient', full_name='Jane Doe', email='jane@example.com', phone='123')
        profile = MagicMock(id=9, user_id=5, age=34, gender='female', blood_group='O+', height=170, weight=68, bmi=23.5, emergency_contact='Mom', existing_conditions='None', allergies='None', dob=None, profile_picture_url=None)
        approved = MagicMock(
            id=11,
            recommendation='Hydrate and rest',
            medicine='Oral fluids',
            priority='high',
            recommendation_type='AI-generated',
            status='approved',
            provider_comments='Looks appropriate',
            created_at=MagicMock(isoformat=MagicMock(return_value='2026-01-02T00:00:00')),
        )
        pending = MagicMock(
            id=12,
            recommendation='Ignore this for now',
            medicine='Not used',
            priority='low',
            recommendation_type='AI-generated',
            status='pending',
            provider_comments='Awaiting review',
            created_at=MagicMock(isoformat=MagicMock(return_value='2026-01-03T00:00:00')),
        )

        session = MagicMock()
        session.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=profile)),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
            MagicMock(scalar_one_or_none=MagicMock(return_value=None)),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[approved])))),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
        ]
        get_authenticated_user.return_value = user

        dashboard = get_patient_dashboard(authorization='Bearer token', session=session)

        self.assertEqual(len(dashboard['recommendations']), 1)
        self.assertEqual(dashboard['recommendations'][0]['recommendation'], 'Hydrate and rest')
        self.assertEqual(dashboard['recommendations'][0]['status'], 'approved')


if __name__ == "__main__":
    unittest.main()
