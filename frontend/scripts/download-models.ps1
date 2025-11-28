# PowerShell script to download face-api.js models
# Run with: .\scripts\download-models.ps1

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
$modelsDir = Join-Path $PSScriptRoot "..\public\models"

# Create models directory if it doesn't exist
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "✅ Created directory: $modelsDir" -ForegroundColor Green
}

$files = @(
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

Write-Host "📥 Starting model download...`n" -ForegroundColor Cyan

$count = 0
foreach ($file in $files) {
    $count++
    $url = $baseUrl + $file
    $filepath = Join-Path $modelsDir $file
    
    try {
        Write-Host "[$count/$($files.Count)] Downloading $file... " -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $filepath -UseBasicParsing
        Write-Host "✅" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Try downloading manually from: $url" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Download complete!" -ForegroundColor Green
Write-Host "📁 Models saved to: $modelsDir" -ForegroundColor Cyan
Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your Vite dev server (npm run dev)" -ForegroundColor White
Write-Host "   2. Reload the onboarding page" -ForegroundColor White
Write-Host "   3. Check DevTools Network tab to verify models load correctly" -ForegroundColor White

