"use client";

import { useEffect, useState } from "react";

import {
  getHealthRiskReport,
  HealthRiskReport,
} from "@/services/prediction";

import PatientCard from "./PatientCard";
import SymptomsCard from "./SymptomsCard";
import PredictionsCard from "./PredictionsCard";

interface Props {
  predictionId: number;
  onClose?: () => void;
}

export default function HealthSummary({
  predictionId,
  onClose,
}: Props) {
  const [report, setReport] =
    useState<HealthRiskReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =====================================================
     Fetch Report
  ===================================================== */

  useEffect(() => {
    fetchReport();
  }, [predictionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getHealthRiskReport(
          predictionId
        );

      setReport(data);

    } catch (error) {
      console.error(
        "Failed to load health risk report:",
        error
      );

      setError(
        "Unable to load the health risk report."
      );

    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     Download / Print
  ===================================================== */

const handleDownload = () => {
  const report = document.querySelector(
    ".health-risk-report"
  ) as HTMLElement | null;

  if (!report) {
    return;
  }

  const printWindow = window.open(
    "",
    "_blank",
    "width=1000,height=900"
  );

  if (!printWindow) {
    alert(
      "Please allow pop-ups to download the report."
    );
    return;
  }

  const reportHTML = report.cloneNode(
    true
  ) as HTMLElement;

  // Remove buttons from printed report
  reportHTML
    .querySelectorAll(".report-actions")
    .forEach((element) => {
      element.remove();
    });

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MedAssist AI - Health Risk Report</title>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <style>

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #111827;
          }

          body {
            padding: 30px;
          }

          .health-risk-report {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: none;
            border-radius: 0;
          }

          /* Header */

          .report-header {
            page-break-inside: avoid;
          }

          /* Cards */

          .rounded-2xl,
          .rounded-xl {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Grid */

          .grid {
            display: grid;
          }

          .md\\\\:grid-cols-2 {
            grid-template-columns: 1fr 1fr;
          }

          /* Flex */

          .flex {
            display: flex;
          }

          /* Prevent content from being clipped */

          .overflow-hidden,
          .overflow-y-auto {
            overflow: visible !important;
          }

          /* Keep sections together */

          .space-y-6 > * {
            margin-bottom: 24px;
          }

          /* Text */

          h1,
          h2,
          h3,
          p {
            page-break-inside: avoid;
          }

          /* Risk and severity */

          .grid > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Recommendation */

          .bg-indigo-50 {
            background: #eef2ff !important;
          }

          /* Disclaimer */

          .bg-amber-50 {
            background: #fffbeb !important;
          }

          /* Print */

          @page {
            size: A4;
            margin: 15mm;
          }

          @media print {

            body {
              padding: 0;
            }

            .health-risk-report {
              max-width: none;
            }

          }

        </style>
      </head>

      <body>

        ${reportHTML.outerHTML}

      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();

    printWindow.close();
  }, 500);
};


  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white p-8 shadow-lg">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 font-medium text-gray-600">
            Generating health risk report...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     Error
  ===================================================== */

  if (error || !report) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg">

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">

          <div className="text-4xl">
            ⚠️
          </div>

          <h2 className="mt-3 text-xl font-bold text-red-700">
            Report Unavailable
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Unable to generate the health risk report."}
          </p>

          <button
            type="button"
            onClick={fetchReport}
            className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  /* =====================================================
     Risk / Severity
  ===================================================== */

  const riskLevel =
    report.risk_assessment.level;

  const severityLevel =
    report.severity_analysis.level;


  /* =====================================================
     Risk Style
  ===================================================== */

  const getRiskStyle = () => {

    switch (riskLevel) {

      case "Critical":
        return {
          container:
            "border-red-300 bg-red-50",
          badge:
            "bg-red-100 text-red-700",
          text:
            "text-red-700",
        };

      case "High":
        return {
          container:
            "border-orange-300 bg-orange-50",
          badge:
            "bg-orange-100 text-orange-700",
          text:
            "text-orange-700",
        };

      case "Moderate":
        return {
          container:
            "border-yellow-300 bg-yellow-50",
          badge:
            "bg-yellow-100 text-yellow-700",
          text:
            "text-yellow-700",
        };

      default:
        return {
          container:
            "border-green-300 bg-green-50",
          badge:
            "bg-green-100 text-green-700",
          text:
            "text-green-700",
        };
    }
  };


  /* =====================================================
     Severity Style
  ===================================================== */

  const getSeverityStyle = () => {

    switch (severityLevel) {

      case "Severe":
        return {
          container:
            "border-red-300 bg-red-50",
          badge:
            "bg-red-100 text-red-700",
          text:
            "text-red-700",
        };

      case "Moderate":
        return {
          container:
            "border-yellow-300 bg-yellow-50",
          badge:
            "bg-yellow-100 text-yellow-700",
          text:
            "text-yellow-700",
        };

      case "Mild":
        return {
          container:
            "border-blue-300 bg-blue-50",
          badge:
            "bg-blue-100 text-blue-700",
          text:
            "text-blue-700",
        };

      default:
        return {
          container:
            "border-green-300 bg-green-50",
          badge:
            "bg-green-100 text-green-700",
          text:
            "text-green-700",
        };
    }
  };


  const riskStyle =
    getRiskStyle();

  const severityStyle =
    getSeverityStyle();


  /* =====================================================
     Report
  ===================================================== */

  return (
    <>
      <div className="health-risk-report w-full rounded-2xl bg-white shadow-xl">

        {/* =================================================
            HEADER
        ================================================= */}

<div className="report-header border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <p className="text-sm font-medium text-blue-100">
            MedAssist AI
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            🏥 Health Risk Report
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            AI-generated health assessment
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-blue-100">

            <span>
              Report #{report.report_id}
            </span>

            <span>
              •
            </span>

            <span>
              Generated{" "}
              {new Date(
                report.generated_at
              ).toLocaleString()}
            </span>

          </div>

        </div>


        {/* =================================================
            REPORT CONTENT
        ================================================= */}

        <div className="space-y-6 p-6 sm:p-8">

          {/* Patient */}

          <PatientCard
            patientId={
              report.patient_id
            }
          />


          {/* Symptoms */}

          <SymptomsCard
            symptoms={
              report.symptoms
            }
          />


          {/* Prediction */}

          <PredictionsCard
            prediction={
              report.prediction
            }
            topPredictions={
              report.top_predictions
            }
          />


          {/* =================================================
              RISK + SEVERITY
          ================================================= */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Risk */}

            <div
              className={`rounded-2xl border p-5 ${riskStyle.container}`}
            >

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-gray-600">
                    ⚠️ Risk Assessment
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${riskStyle.text}`}
                  >
                    {
                      report.risk_assessment.score
                    }
                  </p>

                  <p className="text-xs text-gray-500">
                    Risk Score
                  </p>

                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${riskStyle.badge}`}
                >
                  {riskLevel}
                </span>

              </div>


              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  Risk Factors
                </p>

                {report.risk_assessment.factors.length >
                0 ? (

                  <div className="mt-2 flex flex-wrap gap-2">

                    {report.risk_assessment.factors.map(
                      (factor) => (

                        <span
                          key={factor}
                          className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {factor}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-gray-500">
                    No significant risk factors identified.
                  </p>

                )}

              </div>

            </div>


            {/* Severity */}

            <div
              className={`rounded-2xl border p-5 ${severityStyle.container}`}
            >

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-gray-600">
                    🩺 Severity Analysis
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${severityStyle.text}`}
                  >
                    {
                      report.severity_analysis.score
                    }
                  </p>

                  <p className="text-xs text-gray-500">
                    Severity Score
                  </p>

                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${severityStyle.badge}`}
                >
                  {severityLevel}
                </span>

              </div>


              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  Severity Factors
                </p>

                {report.severity_analysis.factors.length >
                0 ? (

                  <div className="mt-2 flex flex-wrap gap-2">

                    {report.severity_analysis.factors.map(
                      (factor) => (

                        <span
                          key={factor}
                          className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {factor}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-gray-500">
                    No significant severity factors identified.
                  </p>

                )}

              </div>

            </div>

          </div>


          {/* =================================================
              RECOMMENDATION
          ================================================= */}

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">

            <div className="flex gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                💡
              </div>

              <div>

                <h3 className="font-bold text-indigo-900">
                  Recommendation
                </h3>

                <p className="mt-2 leading-7 text-indigo-800">
                  {report.recommendation}
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <div className="flex gap-3">

              <div className="text-xl">
                ⚠️
              </div>

              <div>

                <h3 className="font-bold text-amber-900">
                  Medical Disclaimer
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  {report.disclaimer}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER ACTIONS
        ================================================= */}

        <div className="report-actions flex flex-wrap justify-end gap-3 border-t border-gray-200 p-5">

          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            ⬇️ Download PDF
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-800 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-900"
            >
              Close Report
            </button>
          )}

        </div>

      </div>


      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

      
    </>
  );
}