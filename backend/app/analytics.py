from fastapi import APIRouter, Depends

from app.database import get_database_connection
from app.auth import get_current_user


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# =========================
# ANALYTICS SUMMARY
# =========================

@router.get("/summary")
def get_analytics_summary(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    # Total registered users
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    # Total disease predictions
    cursor.execute("SELECT COUNT(*) FROM disease_predictions")
    total_predictions = cursor.fetchone()[0]

    # Total risk assessments
    cursor.execute("SELECT COUNT(*) FROM patient_risk_assessments")
    total_risk_assessments = cursor.fetchone()[0]

    # Total symptoms logged
    cursor.execute("SELECT COUNT(*) FROM patient_symptoms")
    total_symptoms = cursor.fetchone()[0]

    # Total patients
    cursor.execute(
        "SELECT COUNT(*) FROM users WHERE role = 'patient'"
    )
    total_patients = cursor.fetchone()[0]

    # Total caretakers
    cursor.execute(
        "SELECT COUNT(*) FROM users WHERE role = 'caretaker'"
    )
    total_caretakers = cursor.fetchone()[0]

    cursor.close()
    connection.close()

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_caretakers": total_caretakers,
        "total_predictions": total_predictions,
        "total_risk_assessments": total_risk_assessments,
        "total_symptoms": total_symptoms,
    }


# =========================
# DISEASE DISTRIBUTION
# =========================

@router.get("/disease-distribution")
def get_disease_distribution(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            predicted_disease,
            COUNT(*) as count
        FROM disease_predictions
        GROUP BY predicted_disease
        ORDER BY count DESC
        LIMIT 10
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "diseases": [
            {
                "disease": row[0],
                "count": row[1]
            }
            for row in rows
        ]
    }


# =========================
# SYMPTOM FREQUENCY
# =========================

@router.get("/symptom-frequency")
def get_symptom_frequency(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            symptom_name,
            COUNT(*) as count
        FROM patient_symptoms
        GROUP BY symptom_name
        ORDER BY count DESC
        LIMIT 15
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "symptoms": [
            {
                "symptom": row[0],
                "count": row[1]
            }
            for row in rows
        ]
    }


# =========================
# RISK DISTRIBUTION
# =========================

@router.get("/risk-distribution")
def get_risk_distribution(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            predicted_outcome,
            COUNT(*) as count
        FROM patient_risk_assessments
        GROUP BY predicted_outcome
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    total = sum(row[1] for row in rows)

    return {
        "outcomes": [
            {
                "outcome": row[0],
                "count": row[1],
                "percentage": round(
                    (row[1] / total * 100), 1
                ) if total > 0 else 0
            }
            for row in rows
        ],
        "total": total
    }


# =========================
# MONTHLY TRENDS
# =========================

@router.get("/monthly-trends")
def get_monthly_trends(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    # Monthly disease predictions
    cursor.execute(
        """
        SELECT
            TO_CHAR(
                DATE_TRUNC('month', created_at),
                'YYYY-MM'
            ) as month,
            COUNT(*) as count
        FROM disease_predictions
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
        """
    )

    prediction_rows = cursor.fetchall()

    # Monthly risk assessments
    cursor.execute(
        """
        SELECT
            TO_CHAR(
                DATE_TRUNC('month', created_at),
                'YYYY-MM'
            ) as month,
            COUNT(*) as count
        FROM patient_risk_assessments
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
        """
    )

    risk_rows = cursor.fetchall()

    # Monthly symptoms logged
    cursor.execute(
        """
        SELECT
            TO_CHAR(
                DATE_TRUNC('month', recorded_at),
                'YYYY-MM'
            ) as month,
            COUNT(*) as count
        FROM patient_symptoms
        WHERE recorded_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', recorded_at)
        ORDER BY month
        """
    )

    symptom_rows = cursor.fetchall()

    cursor.close()
    connection.close()

    # Merge all months into a unified timeline
    all_months = set()
    for row in prediction_rows:
        all_months.add(row[0])
    for row in risk_rows:
        all_months.add(row[0])
    for row in symptom_rows:
        all_months.add(row[0])

    prediction_map = {row[0]: row[1] for row in prediction_rows}
    risk_map = {row[0]: row[1] for row in risk_rows}
    symptom_map = {row[0]: row[1] for row in symptom_rows}

    sorted_months = sorted(all_months)

    trends = [
        {
            "month": month,
            "predictions": prediction_map.get(month, 0),
            "risk_assessments": risk_map.get(month, 0),
            "symptoms": symptom_map.get(month, 0),
        }
        for month in sorted_months
    ]

    return {
        "trends": trends
    }


# =========================
# RECENT PREDICTIONS
# =========================

@router.get("/recent-predictions")
def get_recent_predictions(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            dp.id,
            u.full_name,
            dp.predicted_disease,
            dp.created_at
        FROM disease_predictions dp
        JOIN users u ON dp.user_id = u.id
        ORDER BY dp.created_at DESC
        LIMIT 10
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "predictions": [
            {
                "id": row[0],
                "patient_name": row[1],
                "predicted_disease": row[2],
                "created_at": row[3]
            }
            for row in rows
        ]
    }
