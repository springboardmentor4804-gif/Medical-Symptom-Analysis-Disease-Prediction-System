$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Users\Hemanth\Documents\Projects_2026\MedAssist-AI\MedAssist_AI_Final_Project_Report.docx')
    $pages = $doc.ComputeStatistics(2)
    Write-Host "PRIMARY_DOCX_PAGES: $pages"
    $doc.Close($false)
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
