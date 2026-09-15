export interface RecommendationRequest {
  disease: string;
  symptoms: string[];
  risk_level: string;
  severity_level: string;
}

export async function createRecommendation(
  data: RecommendationRequest
) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please login again.");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/recommendation`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(
      () => null
    );

    throw new Error(
      errorData?.detail ||
      "Unable to generate recommendation"
    );
  }

  return response.json();
}