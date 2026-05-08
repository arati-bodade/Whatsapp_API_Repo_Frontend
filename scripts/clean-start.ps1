<#
.SYNOPSIS
    Production-ready Next.js dev server clean-start for Windows.

.DESCRIPTION
    Fast, reliable cleanup: kills node processes, removes lock file,
    and restarts the dev server. Completes in seconds, not minutes.

.PARAMETER Clean
    Wipe entire .next folder for a cold start.

.PARAMETER DryRun
    Show what would happen without making changes.

.PARAMETER Port
    Port to free (default: 3000).

.EXAMPLE
    .\scripts\clean-start.ps1
    .\scripts\clean-start.ps1 -Clean
    .\scripts\clean-start.ps1 -DryRun
#>

param(
    [switch]$Clean,
    [switch]$DryRun,
    [int]$Port = 3000
)

$ErrorActionPreference = "SilentlyContinue"

# -- Helpers ---------------------------------------------------------------
function Write-Stage([string]$Num, [string]$Msg) {
    Write-Host "  [$Num] " -NoNewline -ForegroundColor Cyan
    Write-Host $Msg -ForegroundColor White
}
function Write-Ok([string]$Msg)   { Write-Host "      $Msg" -ForegroundColor Green  }
function Write-Warn([string]$Msg) { Write-Host "      $Msg" -ForegroundColor Yellow }

# -- Resolve project root --------------------------------------------------
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    $ProjectRoot = (Get-Location).Path
}
$ProjectName = Split-Path $ProjectRoot -Leaf

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Magenta
Write-Host "    Next.js Clean Start -- $ProjectName"         -ForegroundColor Magenta
Write-Host "  =============================================" -ForegroundColor Magenta
if ($DryRun) { Write-Host "  [DRY RUN]" -ForegroundColor Yellow }
Write-Host ""

# -- Stage 1: Kill node processes (fast, best-effort) ----------------------
Write-Stage "1" "Killing node processes..."

$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $count = @($nodeProcs).Count
    if (-not $DryRun) {
        foreach ($np in $nodeProcs) {
            try {
                Stop-Process -Id $np.Id -Force -ErrorAction Stop
            } catch {
                # Access Denied on zombie processes - not critical
            }
        }
    }
    Write-Ok "Processed $count node process(es)."
} else {
    Write-Ok "No node processes running."
}

# -- Stage 2: Free port (via netstat + Stop-Process) -----------------------
Write-Stage "2" "Freeing port $Port..."

$netstat = Join-Path $env:SystemRoot "System32\netstat.exe"
$portFreed = $true
if (Test-Path $netstat) {
    $lines = & $netstat -ano 2>$null | Select-String ":$Port\s"
    $pids = @()
    foreach ($line in $lines) {
        $text = $line.ToString().Trim()
        if ($text -match 'LISTENING') {
            $parts = $text -split '\s+'
            $p = $parts[-1]
            if ($p -match '^\d+$' -and $p -ne '0') { $pids += [int]$p }
        }
    }
    $pids = $pids | Sort-Object -Unique

    if ($pids.Count -gt 0) {
        foreach ($p in $pids) {
            $name = (Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName
            Write-Host "      Port $Port held by $name (PID $p)" -ForegroundColor DarkGray
            if (-not $DryRun) {
                try {
                    Stop-Process -Id $p -Force -ErrorAction Stop
                } catch {
                    # Access Denied on zombie
                }
            }
        }
        # Quick re-check
        Start-Sleep -Milliseconds 500
        $still = & $netstat -ano 2>$null | Select-String ":$Port\s" | Select-String "LISTENING"
        if ($still -and -not $DryRun) {
            Write-Warn "Port $Port still occupied (process may need admin kill)."
            Write-Warn "Next.js will auto-select next available port."
            $portFreed = $false
        } else {
            Write-Ok "Port $Port freed."
        }
    } else {
        Write-Ok "Port $Port is available."
    }
} else {
    Write-Warn "netstat not found, skipping port check."
}

# -- Stage 3: Remove lock file --------------------------------------------
Write-Stage "3" "Removing lock file..."

$lockFile = Join-Path $ProjectRoot ".next\dev\lock"
if (Test-Path $lockFile) {
    if (-not $DryRun) {
        Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    }
    Write-Ok "Lock file removed."
} else {
    Write-Ok "No lock file found."
}

# -- Stage 4 (optional): Clean .next cache --------------------------------
if ($Clean) {
    Write-Stage "4" "Wiping .next cache..."
    $nextDir = Join-Path $ProjectRoot ".next"
    if (Test-Path $nextDir) {
        if (-not $DryRun) {
            Remove-Item -Path $nextDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        Write-Ok ".next directory removed."
    } else {
        Write-Ok ".next directory does not exist."
    }
}

# -- Stage 5: Start dev server --------------------------------------------
Write-Host ""
Write-Stage "5" "Starting Next.js dev server..."
Write-Host ""

if ($DryRun) {
    Write-Host "  [DRY RUN] Would run: npm run dev" -ForegroundColor Yellow
    exit 0
}

Start-Sleep -Milliseconds 500
Set-Location $ProjectRoot
& npm run dev
