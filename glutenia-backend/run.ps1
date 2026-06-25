[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipAudit,
  [switch]$SkipTests,
  [switch]$SkipSmoke,
  [switch]$Seed,
  [switch]$Start,
  [string]$TestMongoUri
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

function Write-Warn {
  param([string]$Text)
  Write-Host "[WARN] $Text" -ForegroundColor DarkYellow
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $($Arguments -join ' ')"
  }
}

function Get-DotEnvValue {
  param([string]$Name)

  if (-not (Test-Path ".env")) {
    return $null
  }

  $escapedName = [regex]::Escape($Name)
  $line = Get-Content ".env" |
    Where-Object { $_ -match "^\s*$escapedName\s*=" } |
    Select-Object -Last 1

  if (-not $line) {
    return $null
  }

  $value = $line -replace "^\s*$escapedName\s*=", ""
  $value = $value.Trim()

  if (
    ($value.StartsWith('"') -and $value.EndsWith('"')) -or
    ($value.StartsWith("'") -and $value.EndsWith("'"))
  ) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  return $value
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

function Get-MongoEndpoint {
  param([string]$Uri)

  if ([string]::IsNullOrWhiteSpace($Uri)) {
    return $null
  }

  if ($Uri -match "^mongodb\+srv://") {
    return $null
  }

  if ($Uri -match "^mongodb://(?:[^@/\s]+@)?(?<host>[^:/,?\s]+)(?::(?<port>\d+))?") {
    $port = 27017
    if ($Matches.ContainsKey("port") -and $Matches["port"]) {
      $port = [int]$Matches["port"]
    }

    return [pscustomobject]@{
      Host = $Matches["host"]
      Port = $port
    }
  }

  return $null
}

function Test-TcpPort {
  param(
    [string]$HostName,
    [int]$Port,
    [int]$TimeoutMs = 1500
  )

  $client = [Net.Sockets.TcpClient]::new()

  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
      return $false
    }

    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Assert-MongoReachable {
  param(
    [string]$Uri,
    [string]$Label
  )

  $endpoint = Get-MongoEndpoint $Uri
  if ($null -eq $endpoint) {
    Write-Note "$Label uses a MongoDB URI that cannot be TCP preflighted here; skipping port check."
    return
  }

  if (-not (Test-TcpPort -HostName $endpoint.Host -Port $endpoint.Port)) {
    throw "$Label is not reachable at $($endpoint.Host):$($endpoint.Port). Start MongoDB or update the URI."
  }

  Write-Ok "$Label reachable at $($endpoint.Host):$($endpoint.Port)"
}

function Get-AppPort {
  $portValue = $env:PORT
  if ([string]::IsNullOrWhiteSpace($portValue)) {
    $portValue = Get-DotEnvValue "PORT"
  }
  if ([string]::IsNullOrWhiteSpace($portValue)) {
    $portValue = "5000"
  }

  return [int]$portValue
}

function Invoke-SmokeTest {
  $port = Get-AppPort
  $url = "http://127.0.0.1:$port/"

  try {
    $existing = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 2
    if ($existing.success -eq $true -and $existing.data.name -eq "Glutenia API") {
      Write-Ok "Existing server answered at $url"
      return
    }
  } catch {
    # No server is listening yet; the smoke test will start one below.
  }

  $logsDir = Join-Path $Root "logs"
  New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
  $outLog = Join-Path $logsDir "smoke-server.out.log"
  $errLog = Join-Path $logsDir "smoke-server.err.log"
  Remove-Item -LiteralPath $outLog, $errLog -ErrorAction SilentlyContinue

  $process = Start-Process `
    -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $Root `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog

  try {
    for ($attempt = 1; $attempt -le 25; $attempt++) {
      if ($process.HasExited) {
        if (Test-Path $outLog) {
          Get-Content $outLog
        }
        if (Test-Path $errLog) {
          Get-Content $errLog
        }
        throw "Server exited during smoke test with code $($process.ExitCode)."
      }

      try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 2
        if ($response.success -eq $true -and $response.data.name -eq "Glutenia API") {
          Write-Ok "Server smoke test passed at $url"
          return
        }
      } catch {
        Start-Sleep -Seconds 1
      }
    }

    throw "Server did not answer at $url within 25 seconds."
  } finally {
    if ($null -ne $process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -Force
    }
  }
}

function Set-EnvVarOrRemove {
  param(
    [string]$Name,
    [AllowNull()][string]$Value
  )

  if ($null -eq $Value) {
    Remove-Item "Env:$Name" -ErrorAction SilentlyContinue
  } else {
    Set-Item "Env:$Name" $Value
  }
}

Write-Header "Glutenia Backend Runner"
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

$npmVersion = (& npm --version).Trim()
Write-Ok "Node $nodeVersion and npm $npmVersion"

Write-Step "Checking environment file"
if (-not (Test-Path ".env")) {
  if (-not (Test-Path ".env.example")) {
    throw ".env is missing and .env.example was not found."
  }

  Copy-Item ".env.example" ".env"
  Write-Ok "Created .env from .env.example"
} else {
  Write-Ok ".env exists"
}

$mongoUri = $env:MONGO_URI
if ([string]::IsNullOrWhiteSpace($mongoUri)) {
  $mongoUri = Get-DotEnvValue "MONGO_URI"
}
if ([string]::IsNullOrWhiteSpace($mongoUri)) {
  $mongoUri = "mongodb://127.0.0.1:27017/glutenia"
}

if ([string]::IsNullOrWhiteSpace($TestMongoUri)) {
  $TestMongoUri = $env:TEST_MONGO_URI
}
if ([string]::IsNullOrWhiteSpace($TestMongoUri)) {
  $TestMongoUri = Get-DotEnvValue "TEST_MONGO_URI"
}
if ([string]::IsNullOrWhiteSpace($TestMongoUri)) {
  $TestMongoUri = "mongodb://127.0.0.1:27017/glutenia_test"
}

Write-Step "Checking MongoDB reachability"
Assert-MongoReachable -Uri $mongoUri -Label "App MongoDB"
if (-not $SkipTests) {
  Assert-MongoReachable -Uri $TestMongoUri -Label "Test MongoDB"
}

if (-not $SkipInstall) {
  Write-Step "Checking dependencies"
  if (Test-DependencyInstallNeeded) {
    Write-Note "Installing dependencies with npm install..."
    Invoke-Checked "npm" @("install")
    Write-Ok "Dependencies installed"
  } else {
    Write-Ok "Dependencies are already installed and current"
  }
} else {
  Write-Warn "Skipping dependency install check"
}

Write-Step "Checking JavaScript syntax"
Invoke-Checked "npm" @("run", "check")
Write-Ok "Syntax check passed"

if (-not $SkipAudit) {
  Write-Step "Running npm audit"
  Invoke-Checked "npm" @("audit", "--audit-level=high")
  Write-Ok "No high severity dependency vulnerabilities found"
} else {
  Write-Warn "Skipping npm audit"
}

if (-not $SkipTests) {
  Write-Step "Running integration tests"
  $previousNodeEnv = $env:NODE_ENV
  $previousJwtSecret = $env:JWT_SECRET
  $previousTestMongoUri = $env:TEST_MONGO_URI

  try {
    $env:NODE_ENV = "test"
    if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
      $env:JWT_SECRET = "glutenia-local-test-secret"
    }
    $env:TEST_MONGO_URI = $TestMongoUri
    Invoke-Checked "npm" @("test")
  } finally {
    Set-EnvVarOrRemove "NODE_ENV" $previousNodeEnv
    Set-EnvVarOrRemove "JWT_SECRET" $previousJwtSecret
    Set-EnvVarOrRemove "TEST_MONGO_URI" $previousTestMongoUri
  }

  Write-Ok "Integration tests passed"
} else {
  Write-Warn "Skipping tests"
}

if ($Seed) {
  Write-Step "Seeding app database"
  Write-Warn "Seed clears existing users and products for: $mongoUri"
  Invoke-Checked "npm" @("run", "seed")
  Write-Ok "Seed completed"
}

if (-not $SkipSmoke) {
  Write-Step "Running server smoke test"
  Invoke-SmokeTest
} else {
  Write-Warn "Skipping server smoke test"
}

if ($Start) {
  $port = Get-AppPort
  Write-Step "Starting development server"
  Write-Note "API URL: http://localhost:$port"
  Invoke-Checked "npm" @("run", "dev")
} else {
  Write-Header "Done"
  Write-Ok "Checks completed successfully"
  Write-Note "Start the API with: .\run.ps1 -Start"
  Write-Note "Seed sample data with: .\run.ps1 -Seed"
}
