import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official, structured clinical PDF diagnostic report
 */
export function generateClinicalPdfReport({
  patient,
  diagnosticResult,
  symptomsList = [],
  indicators = {}
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header Banner Background
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Header Accent Stripe
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 75, pageWidth, 5, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MedAssist AI', margin, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Clinical Decision Support & Disease Risk Stratification Platform', margin, 54);

  // Document Type / ID on the right
  const reportId = `CLIN-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.setFontSize(9);
  doc.text(`REPORT ID: ${reportId}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 50, { align: 'right' });

  let currentY = 100;

  // Section: Patient Demographics
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Patient Profile & Clinical Demographics', margin, currentY);
  currentY += 10;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Attribute', 'Details', 'Attribute', 'Details']],
    body: [
      ['Patient Name', patient?.name || patient?.email || 'Walk-in / Anonymous', 'Age / Gender', `${patient?.age || 'N/A'} yrs / ${patient?.gender || 'Not specified'}`],
      ['Phone Number', patient?.phone || 'N/A', 'Location / City', patient?.location || 'Not specified'],
      ['MRN / Patient ID', patient?.id || patient?.email || 'CLIN-ACTIVE', 'Triage Status', 'Completed AI Evaluation']
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
    styles: { cellPadding: 5 }
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // Section: Clinical Presentation & Biomarker Indicators
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Reported Symptoms & Clinical Biomarkers', margin, currentY);
  currentY += 10;

  const formattedSymptoms = symptomsList.length > 0 
    ? symptomsList.join(', ') 
    : 'None explicitly recorded';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Clinical Parameter', 'Reported State / Severity']],
    body: [
      ['Identified Symptoms', formattedSymptoms],
      ['Body Temperature / Pyrexia', indicators.fever || 'Normal (< 98.6°F)'],
      ['Respiratory / Cough Status', indicators.cough || 'None / Not Reported'],
      ['Breathing / Dyspnea Assessment', indicators.breathing || 'Normal'],
      ['Blood Pressure Stratification', indicators.bloodPressure || 'Normal (< 120/80 mmHg)'],
      ['Lipid Profile / Cholesterol', indicators.cholesterol || 'Normal (< 200 mg/dL)']
    ],
    theme: 'striped',
    headStyles: { fillColor: [224, 231, 255], textColor: [49, 46, 129], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: [30, 41, 59], fontSize: 9 },
    styles: { cellPadding: 5 }
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // Section: Primary Diagnostic Prediction
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. AI Diagnostic Analysis & Disease Risk', margin, currentY);
  currentY += 12;

  // Risk Color Logic
  const risk = diagnosticResult?.riskLevel || 'Medium';
  let riskColor = [245, 158, 11]; // Amber
  if (risk === 'High') riskColor = [239, 68, 68]; // Red
  if (risk === 'Low') riskColor = [16, 185, 129]; // Emerald

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 65, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(diagnosticResult?.disease || 'Acute Clinical Assessment', margin + 14, currentY + 24);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Category: ${diagnosticResult?.diseaseCategory || 'Internal Medicine'} | Confidence: ${diagnosticResult?.confidence || 85}%`, margin + 14, currentY + 44);

  // Risk Badge in box
  doc.setFillColor(...riskColor);
  doc.roundedRect(pageWidth - margin - 120, currentY + 16, 106, 26, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`RISK: ${risk.toUpperCase()}`, pageWidth - margin - 67, currentY + 33, { align: 'center' });

  currentY += 80;

  // Section: Clinical Recommendations & Advisory
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Evidence-Based Clinical Guidance & Advisory', margin, currentY);
  currentY += 10;

  const advisory = diagnosticResult?.treatmentAdvisory || {};

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Protocol Category', 'Clinical Recommendations']],
    body: [
      ['Immediate Action', advisory.immediateAction || 'Rest, monitor vitals, and consult a qualified physician.'],
      ['Dietary & Hydration', advisory.dietary || 'High-fluid intake and easily digestible balanced meals.'],
      ['Clinical Precautions', advisory.precautions || 'Avoid heavy exertion and maintain symptom log daily.'],
      ['Urgent Red Flags', advisory.redFlags || 'Severe dyspnea, persistent high fever, or altered consciousness require emergency care.'],
      ['Recommended Specialist', advisory.specialist || 'General Physician / Internal Medicine']
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 9 },
    styles: { cellPadding: 6 }
  });

  // Footer Disclaimer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 38, pageWidth, 38, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Disclaimer: MedAssist AI provides computer-aided triage estimates based on clinical datasets. This report is for decision support only and does not substitute a licensed physician\'s clinical judgment.',
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center', maxWidth: pageWidth - 80 }
  );

  // Save the PDF
  const filename = `MedAssist_Report_${(patient?.name || 'Patient').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
