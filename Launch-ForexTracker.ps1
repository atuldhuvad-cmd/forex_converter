$ErrorActionPreference = 'Stop'

$projectPath = 'D:\Forex Card PWA'
$healthUrl = 'http://127.0.0.1:3000/api/health'
$appUrl = 'http://localhost:3000/'
$nodePath = (Get-Command node -ErrorAction Stop).Source
$serverPath = Join-Path $projectPath 'dist\server.cjs'
$logPath = Join-Path $projectPath 'forex-tracker-server.log'

if (-not (Test-Path -LiteralPath $serverPath)) {
    throw 'The production build is missing. Run npm run build once in D:\Forex Card PWA.'
}

$serverReady = $false
try {
    $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing
    $serverReady = $response.StatusCode -eq 200
} catch {
    $serverReady = $false
}

if (-not $serverReady) {
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $nodePath
    $startInfo.Arguments = '"' + $serverPath + '"'
    $startInfo.WorkingDirectory = $projectPath
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.EnvironmentVariables['NODE_ENV'] = 'production'
    $startInfo.EnvironmentVariables['PORT'] = '3000'
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()

    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $serverReady = $true
                break
            }
        } catch {
            if ($process.HasExited) { break }
        }
    }

    if (-not $serverReady) {
        $stdout = if ($stdoutTask.IsCompleted) { $stdoutTask.Result } else { '' }
        $stderr = if ($stderrTask.IsCompleted) { $stderrTask.Result } else { '' }
        Set-Content -LiteralPath $logPath -Value ($stdout + [Environment]::NewLine + $stderr)
        throw "Forex Tracker could not start. Details were saved to $logPath"
    }
}

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if ($chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList "--app=$appUrl"
} else {
    Start-Process $appUrl
}
