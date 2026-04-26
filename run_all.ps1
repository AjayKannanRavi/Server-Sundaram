# serversundaram Run All Script
# This script starts the backend and frontend servers in separate windows.

Write-Host "ðŸš€ Starting serversundaram Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\mvnw spring-boot:run"

Write-Host "ðŸš€ Starting serversundaram Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "âœ… Both servers are starting up!" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8085"
Write-Host "Frontend: http://localhost:5173"
