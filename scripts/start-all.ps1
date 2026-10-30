# Starts the six services in order, then the Angular app.
#   powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1 [-Build] [-NoFrontend]
param([switch]$Build, [switch]$NoFrontend)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$run = Join-Path $root '.run'
New-Item -ItemType Directory -Force $run | Out-Null

$services = @(
    @{ Name = 'discovery-service'; Port = 8761 },
    @{ Name = 'customer-service';  Port = 8085 },
    @{ Name = 'ebank-service';     Port = 8057 },
    @{ Name = 'auth-service';      Port = 8059 },
    @{ Name = 'gateway-service';   Port = 9999 },
    @{ Name = 'ebank-bot';         Port = 8058 }
)

$ports = @($services | ForEach-Object { $_.Port })
if (-not $NoFrontend) { $ports += 4200 }
$busy = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
    Where-Object { $ports -contains $_.Port } | ForEach-Object { $_.Port } | Sort-Object -Unique)
if ($busy.Count) {
    throw "Ports already in use: $($busy -join ', '). Run scripts\stop-all.ps1 or free them first."
}

$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) {
    throw 'Create .env from .env.example and set GEMINI_API_KEY first.'
}

# The key that signs the login tokens is generated once and stays in .env
$lines = @([IO.File]::ReadAllLines($envFile))
if (-not ($lines -match '^JWT_SECRET=.{32,}')) {
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [BitConverter]::ToString($bytes).Replace('-', '').ToLower()
    $lines = @($lines | Where-Object { $_ -notmatch '^JWT_SECRET=' }) + "JWT_SECRET=$secret"
    [IO.File]::WriteAllLines($envFile, $lines)
    Write-Host 'Generated JWT_SECRET in .env'
}

function Wait-Url([string]$Url, [string]$Name, $Process) {
    for ($i = 0; $i -lt 180; $i++) {
        if ($Process.HasExited) { throw "$Name stopped. Read .run\$Name.log" }
        try {
            Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
            return
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    throw "$Name is not ready after 3 minutes. Read .run\$Name.log"
}

foreach ($service in $services) {
    $name = $service.Name
    $folder = Join-Path $root $name
    $jar = "target\$name-0.0.1-SNAPSHOT.jar"
    if ($Build -or -not (Test-Path (Join-Path $folder $jar))) {
        Write-Host "Building $name..."
        Push-Location $folder
        try {
            & .\mvnw.cmd -B -q -DskipTests package
            if ($LASTEXITCODE -ne 0) { throw "The build of $name failed" }
        } finally {
            Pop-Location
        }
    }
    Write-Host "Starting $name on $($service.Port)..."
    $process = Start-Process java -ArgumentList '-Xmx320m', '-jar', $jar -WorkingDirectory $folder -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run "$name.log") -RedirectStandardError (Join-Path $run "$name.err.log")
    Set-Content (Join-Path $run "$name.pid") $process.Id
    Wait-Url "http://127.0.0.1:$($service.Port)/actuator/health" $name $process
}

if (-not $NoFrontend) {
    $front = Join-Path $root 'angular-front'
    if (-not (Test-Path (Join-Path $front 'node_modules'))) {
        Push-Location $front
        try { & npm.cmd ci } finally { Pop-Location }
    }
    Write-Host 'Starting angular-front on 4200...'
    $process = Start-Process npm.cmd -ArgumentList 'start', '--', '--host', 'localhost' -WorkingDirectory $front -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run 'angular-front.log') -RedirectStandardError (Join-Path $run 'angular-front.err.log')
    Set-Content (Join-Path $run 'angular-front.pid') $process.Id
    Wait-Url 'http://localhost:4200' 'angular-front' $process
}

Write-Host 'Ready: gateway 9999, Eureka 8761, application http://localhost:4200. Give the gateway 15 seconds to discover every service.'
