# Build LogicAI Docker Image
# ===============================

Write-Host "🔨 Building LogicAI Docker Image" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if docker-instance directory exists
if (-not (Test-Path "docker-instance")) {
    Write-Host "❌ Error: docker-instance directory not found" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Change to docker-instance directory
Set-Location docker-instance

Write-Host "Building Docker image from docker-instance/Dockerfile..." -ForegroundColor Yellow
docker build -t logicai:latest .

Write-Host ""
Write-Host "✅ LogicAI image built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Image name: logicai:latest" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   View image:   docker images | Select-String logicai" -ForegroundColor White
Write-Host "   Image size:   docker images logicai:latest --format '{{.Size}}'" -ForegroundColor White
Write-Host "   Remove image: docker rmi logicai:latest" -ForegroundColor White
Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
