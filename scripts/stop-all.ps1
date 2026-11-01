# Stops only the processes that start-all.ps1 started.
$run = Join-Path (Split-Path $PSScriptRoot -Parent) '.run'
if (-not (Test-Path $run)) { return }

foreach ($file in Get-ChildItem $run -Filter *.pid) {
    $id = [int](Get-Content $file.FullName)
    $process = Get-Process -Id $id -ErrorAction SilentlyContinue
    # A recorded pid can be reused by another program: check the name and the start time.
    # File times are coarser than process times, so the file can look a few milliseconds older than its process.
    if ($process -and @('java', 'cmd') -contains $process.ProcessName -and $process.StartTime -le $file.LastWriteTime.AddSeconds(2)) {
        taskkill /PID $id /T /F | Out-Null
        Write-Host "Stopped $($file.BaseName)"
    }
    Remove-Item $file.FullName
}
