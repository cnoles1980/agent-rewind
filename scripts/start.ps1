$ErrorActionPreference = 'Stop'
$rewindRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $rewindRoot
if (!(Test-Path -LiteralPath '.venv\Scripts\python.exe')) { throw 'Run uv sync --frozen first.' }
if (!(Test-Path -LiteralPath 'web\node_modules\vite\bin\vite.js')) { throw 'Run npm --prefix web ci first.' }
foreach ($rewindPort in @(8765, 5173)) {
    if (Get-NetTCPConnection -LocalPort $rewindPort -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $rewindPort is in use. Reuse the running preview or stop its process first."
    }
}
New-Item -ItemType Directory -Path '.local' -Force | Out-Null
$api = Start-Process -FilePath "$rewindRoot\.venv\Scripts\python.exe" -ArgumentList @('-m','uvicorn','agent_rewind.api:app','--host','127.0.0.1','--port','8765') -WorkingDirectory $rewindRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput "$rewindRoot\.local\api.log" -RedirectStandardError "$rewindRoot\.local\api-error.log"
$web = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory "$rewindRoot\web" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$rewindRoot\.local\web.log" -RedirectStandardError "$rewindRoot\.local\web-error.log"
# Windows virtual-environment launchers can spawn another Python process.
# Save the actual listeners so the documented stop command targets the servers.
for ($rewindAttempt = 0; $rewindAttempt -lt 50; $rewindAttempt++) {
    $apiListener = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    $webListener = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($apiListener -and $webListener) { break }
    Start-Sleep -Milliseconds 100
}
if (!$apiListener -or !$webListener) { throw 'Startup did not finish. Inspect .local/api-error.log and .local/web-error.log.' }
@{api=$apiListener.OwningProcess;web=$webListener.OwningProcess} | ConvertTo-Json | Set-Content -LiteralPath '.local\processes.json'
Write-Output "Agent Rewind: http://127.0.0.1:5173 (API PID $($apiListener.OwningProcess), UI PID $($webListener.OwningProcess)). Logs are in .local."
