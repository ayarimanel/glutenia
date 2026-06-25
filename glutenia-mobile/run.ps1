[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipBackendCheck,
  [switch]$Start,
  [string]$ApiUrl
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location $Root

function Write-Header {
  param([string]$Text)
  Write-Host ""
  Write-Host "==== $Text ====" -ForegroundColor Cyan
}

function Write-Step {
  param([string]$Text)
  Write-Host ""
  Write-Host "==> $Text" -ForegroundColor Yellow
}

function Write-Ok {
  param([string]$Text)
  Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Note {
  param([string]$Text)
  Write-Host "[INFO] $Text" -ForegroundColor DarkCyan
}

function Invoke-Checked {
  param([string]$FilePath, [string[]]$Arguments = @())
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $($Arguments -join ' ')"
  }
}

function Test-DependencyInstallNeeded {
  if (-not (Test-Path "node_modules")) {
    return $true
  }

  $installMarker = Join-Path "node_modules" ".package-lock.json"
  if (-not (Test-Path $installMarker)) {
    return $true
  }

  $installTime = (Get-Item $installMarker).LastWriteTimeUtc
  foreach ($inputFile in @("package.json", "package-lock.json")) {
    if ((Test-Path $inputFile) -and ((Get-Item $inputFile).LastWriteTimeUtc -gt $installTime)) {
      return $true
    }
  }

  return $false
}

$appApiUrl = $ApiUrl
if ([string]::IsNullOrWhiteSpace($appApiUrl)) {
  $appApiUrl = $env:EXPO_PUBLIC_API_URL
}
$backendCheckApiUrl = if ([string]::IsNullOrWhiteSpace($appApiUrl)) {
  "http://127.0.0.1:5000/api"
} else {
  $appApiUrl
}

Write-Header "Glutenia Mobile Runner"
Write-Note "Project: $Root"

Write-Step "Checking Node.js and npm"
if ($null -eq (Get-Command "node" -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not available on PATH."
}
if ($null -eq (Get-Command "npm" -ErrorAction SilentlyContinue)) {
  throw "npm is not installed or not available on PATH."
}

$nodeVersion = (& node --version).Trim()
if ($nodeVersion -notmatch "^v?(\d+)\.") {
  throw "Could not parse Node.js version: $nodeVersion"
}
if ([int]$Matches[1] -lt 20) {
  throw "Node.js 20 or newer is required. Found $nodeVersion."
}
Write-Ok "Node $nodeVersion and npm $((& npm --version).Trim())"

if (-not $SkipInstall) {
  Write-Step "Checking mobile dependencies"
  if (Test-DependencyInstallNeeded) {
    Invoke-Checked "npm" @("install")
    Write-Ok "Dependencies installed"
  } else {
    Write-Ok "Dependencies are already installed and current"
  }
}

Write-Step "Checking Expo dependency alignment"
Invoke-Checked "npm" @("run", "check")
Write-Ok "Expo dependencies are aligned"

if (-not $SkipBackendCheck) {
  Write-Step "Checking backend API"
  $healthUrl = $backendCheckApiUrl.TrimEnd("/") -replace "/api$", ""
  $response = Invoke-RestMethod -Uri "$healthUrl/" -Method Get -TimeoutSec 5
  if ($response.success -ne $true) {
    throw "Backend did not return the Glutenia health response."
  }
  Write-Ok "Backend is reachable at $healthUrl"
}

if ($Start) {
  Write-Step "Starting Expo"
  if ([string]::IsNullOrWhiteSpace($appApiUrl)) {
    Remove-Item "Env:EXPO_PUBLIC_API_URL" -ErrorAction SilentlyContinue
    Write-Note "API URL for the app: auto-detected from the Expo host, port 5000"
  } else {
    $env:EXPO_PUBLIC_API_URL = $appApiUrl.TrimEnd("/")
    Write-Note "API URL for the app: $env:EXPO_PUBLIC_API_URL"
  }
  Write-Note "Scan the QR code with Expo Go, or press a for Android emulator / i for iOS simulator."
  Invoke-Checked "npm" @("run", "start")
} else {
  Write-Header "Done"
  Write-Ok "Mobile app checks completed successfully"
  Write-Note "Start it with: .\run.ps1 -Start"
}
