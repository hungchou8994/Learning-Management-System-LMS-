# Cleanup and seed script for both auth-service and elearn-db (PowerShell)
# Usage: .\cleanup-and-seed.ps1 [courses] [students] [instructors]

param(
    [int]$courses = 20,
    [int]$students = 15,
    [int]$instructors = 4
)

Write-Host "Starting cleanup and seed process..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Seed parameters:" -ForegroundColor Blue
Write-Host "   Courses: $courses"
Write-Host "   Students: $students"
Write-Host "   Instructors: $instructors"
Write-Host ""

# Cleanup auth-service
Write-Host "1. Cleaning up auth-service..." -ForegroundColor Yellow
Set-Location auth-service
npm run cleanup:force
Set-Location ..
Write-Host "Auth-service cleaned" -ForegroundColor Green
Write-Host ""

# Cleanup elearn-db
Write-Host "2. Cleaning up elearn-db..." -ForegroundColor Yellow
Set-Location elearn-db
npm run cleanup:force
Set-Location ..
Write-Host "Elearn-db cleaned" -ForegroundColor Green
Write-Host ""

# Seed elearn-db (which also seeds auth-service via API)
Write-Host "3. Seeding elearn-db (this will also seed auth-service)..." -ForegroundColor Yellow
Set-Location elearn-db
npm run seed -- $courses $students $instructors
Set-Location ..
Write-Host "Seeding complete!" -ForegroundColor Green
Write-Host ""

Write-Host "All done!" -ForegroundColor Green
