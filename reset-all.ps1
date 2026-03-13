# Reset ALL data for SkillGro (auth-service + elearn-db)
# .\reset-all.ps1 -MongoUri "mongodb://127.18.0.2:27017/elearn-test"
# Usage (defaults):
#   .\reset-all.ps1
#
# Custom:
#   .\reset-all.ps1 -MongoUri "mongodb://127.18.0.2:27017/elearn-test" -Courses 20 -Teachers 4 -Students 15
#
# Notes:
# - Auth-service Postgres (docker-compose) is exposed on localhost:5435 by default.
# - This script runs Node-based scripts in:
#   backend/auth-service/src/scripts/*
#   backend/elearn-db/src/scripts/*

param(
  [string]$MongoUri = "mongodb://127.18.0.2:27017/elearn-test",
  [int]$Courses = 50,
  [int]$Teachers = 8,
  [int]$Students = 20,
  [int]$SessionsPerCourse = 5,
  [int]$LessonsPerSession = 4,
  [int]$MaxEnrollPerStudent = 12,

  # Programming problems seed (elearn-db)
  [int]$Problems = 50,
  [int]$ProblemSeed = 1337,
  [string]$ProblemAuthor = "",
  [switch]$SkipProblemSeed,

  # Auth-service Postgres connection (host-run against docker-compose)
  [string]$AuthDbHost = "localhost",
  [int]$AuthDbPort = 5435,
  [string]$AuthDbUser = "auth_user",
  [string]$AuthDbPassword = "auth_password",
  [string]$AuthDbName = "auth_db",

  # Output files (written to repo root by the auth seed script)
  [string]$CredentialsOut = "credentials.txt",
  [string]$UsersJsonOut = "seed-users.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Run-Step([string]$Title, [scriptblock]$Block) {
  Write-Host ""
  Write-Host "== $Title ==" -ForegroundColor Cyan
  & $Block
}

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Join-Path $RepoRoot "backend"
$AuthRoot = Join-Path $BackendRoot "auth-service"
$ElearnDbRoot = Join-Path $BackendRoot "elearn-db"

if (!(Test-Path $AuthRoot)) { throw "Missing folder: $AuthRoot" }
if (!(Test-Path $ElearnDbRoot)) { throw "Missing folder: $ElearnDbRoot" }

Write-Host "Reset parameters:" -ForegroundColor Yellow
Write-Host "  MongoUri:         $MongoUri"
Write-Host "  Courses:          $Courses"
Write-Host "  Teachers:         $Teachers"
Write-Host "  Students:         $Students"
Write-Host "  SessionsPerCourse:$SessionsPerCourse"
Write-Host "  LessonsPerSession:$LessonsPerSession"
Write-Host "  MaxEnrollPerStudent:$MaxEnrollPerStudent"
Write-Host "  Problems:         $Problems"
Write-Host "  ProblemSeed:      $ProblemSeed"
Write-Host "  ProblemAuthor:    $ProblemAuthor"
Write-Host "  SkipProblemSeed:  $SkipProblemSeed"
Write-Host "  Auth DB:          $AuthDbHost`:$AuthDbPort / $AuthDbName ($AuthDbUser)"
Write-Host "  CredentialsOut:   $CredentialsOut"
Write-Host "  UsersJsonOut:     $UsersJsonOut"

Run-Step "1) Wipe ALL users on auth-service (Postgres)" {
  Push-Location $AuthRoot
  try {
    node "src/scripts/wipe-all-users.js" `
      --confirm `
      --host $AuthDbHost `
      --port $AuthDbPort `
      --user $AuthDbUser `
      --password $AuthDbPassword `
      --db $AuthDbName
  }
  finally {
    Pop-Location
  }
}

Run-Step "2) Wipe ALL data on elearn-db (Mongo elearn-test)" {
  Push-Location $ElearnDbRoot
  try {
    node "src/scripts/wipe-elearn-test.js" `
      --confirm `
      --mongo $MongoUri
  }
  finally {
    Pop-Location
  }
}

Run-Step "3) Seed auth-service users + write credentials files" {
  Push-Location $AuthRoot
  try {
    node "src/scripts/seed-users.js" `
      --host $AuthDbHost `
      --port $AuthDbPort `
      --user $AuthDbUser `
      --password $AuthDbPassword `
      --db $AuthDbName `
      --teachers $Teachers `
      --students $Students `
      --out $CredentialsOut `
      --outJson $UsersJsonOut
  }
  finally {
    Pop-Location
  }
}

Run-Step "4) Seed elearn-db full data (courses/sessions/lessons/assignments/attempts/feedback/enrolls)" {
  $UsersJsonPath = Join-Path $RepoRoot $UsersJsonOut
  if (!(Test-Path $UsersJsonPath)) { throw "Missing users json file: $UsersJsonPath (step 3 must succeed)" }

  Push-Location $ElearnDbRoot
  try {
    node "src/scripts/seed-elearn-test.js" `
      --mongo $MongoUri `
      --users $UsersJsonPath `
      --courses $Courses `
      --sessionsPerCourse $SessionsPerCourse `
      --lessonsPerSession $LessonsPerSession `
      --maxEnrollPerStudent $MaxEnrollPerStudent
  }
  finally {
    Pop-Location
  }
}

Run-Step "5) Seed elearn-db programming problems (problemset)" {
  if ($SkipProblemSeed) {
    Write-Host "Skipped (SkipProblemSeed=true)" -ForegroundColor Yellow
    return
  }

  $UsersJsonPath = Join-Path $RepoRoot $UsersJsonOut
  if (!(Test-Path $UsersJsonPath)) { throw "Missing users json file: $UsersJsonPath (step 3 must succeed)" }

  # Resolve author username:
  # - Prefer explicit -ProblemAuthor
  # - Else pick first 'teacher' from seed-users.json
  $ResolvedAuthor = $ProblemAuthor
  if ([string]::IsNullOrWhiteSpace($ResolvedAuthor)) {
    try {
      $seedObj = Get-Content -Raw $UsersJsonPath | ConvertFrom-Json
      $teacherUser = $seedObj.users | Where-Object { $_.role -eq "teacher" } | Select-Object -First 1
      if ($null -ne $teacherUser -and $teacherUser.username) {
        $ResolvedAuthor = [string]$teacherUser.username
      }
    }
    catch {
      # ignore and let the seeder fall back to first user in elearn-db
      $ResolvedAuthor = ""
    }
  }

  Push-Location $ElearnDbRoot
  try {
    if ([string]::IsNullOrWhiteSpace($ResolvedAuthor)) {
      node "src/seeders/seed-programming-problems.js" `
        --mongo $MongoUri `
        --count $Problems `
        --seed $ProblemSeed `
        --wipe
    }
    else {
      node "src/seeders/seed-programming-problems.js" `
        --mongo $MongoUri `
        --count $Problems `
        --seed $ProblemSeed `
        --author $ResolvedAuthor `
        --wipe
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Outputs (repo root):" -ForegroundColor Green
Write-Host "  - $(Join-Path $RepoRoot $CredentialsOut)"
Write-Host "  - $(Join-Path $RepoRoot $UsersJsonOut)"


