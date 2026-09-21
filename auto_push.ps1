# auto_push.ps1
# Checks the SVU site repo for local changes and pushes them if any exist.
# Intended to run on a schedule (every 5 min, Sat/Sun) via Windows Task Scheduler.
# Safe to run when there's nothing to push -- it just logs "nothing to push" and exits.

$repoPath = "C:\Users\ZachBandy\source\repos\svu-u16-team-site\svu-u16-team-site"
$logFile  = Join-Path $repoPath "auto_push.log"

function Log($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp  $msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

Set-Location $repoPath

git add -A

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    # nothing staged -- nothing changed since last run, don't spam a commit
    exit 0
}

$commitMsg = "Auto-sync: scoring update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMsg | Out-Null

if ($LASTEXITCODE -ne 0) {
    Log "COMMIT FAILED for: $commitMsg"
    exit 1
}

$pushOutput = git push 2>&1
$pushOutput | Out-File -FilePath $logFile -Append -Encoding utf8

if ($LASTEXITCODE -eq 0) {
    Log "Pushed OK: $commitMsg"
} else {
    Log "PUSH FAILED for: $commitMsg -- check your network/GitHub sign-in, then push manually."
}
