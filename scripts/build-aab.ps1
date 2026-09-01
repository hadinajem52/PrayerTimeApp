<#
.SYNOPSIS
    Build the release AAB and verify the things that fail silently.

.DESCRIPTION
    Wraps `gradlew bundleRelease` with the three bits of care this project needs:

    1. A working JDK. The machine JAVA_HOME may point at a directory that no
       longer exists, and Gradle's error for that ("set to an invalid
       directory") is easy to misread as a Gradle problem. Falls back through
       the usual install locations.

    2. A clean Metro output directory. The React Native plugin writes bundled
       assets into build/generated/res/createBundleReleaseJsAndAssets and never
       prunes it, so a renamed asset leaves its predecessor behind and the old
       copy is merged into the AAB alongside the new one. That silently added
       3 MB of superseded icon fonts once already.

    3. A check that resource shrinking did not eat the adhan sounds. They are
       referenced only by name from JS, so nothing in the build graph points at
       them - they survive purely on the tools:keep rules in
       res/raw/keep_adhan_sounds.xml. If that file is ever renamed to keep.xml
       it collides with the one Metro generates, loses, and all sixteen sounds
       disappear from a build that otherwise succeeds.

.PARAMETER SkipVerify
    Build only, skip the post-build inspection.
#>
[CmdletBinding()]
param(
    [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repo 'android'
$aabPath = Join-Path $androidDir 'app\build\outputs\bundle\release\app-release.aab'
$expectedSounds = 16

# --- 1. JDK ------------------------------------------------------------------
$candidates = @(
    $env:JAVA_HOME
    'C:\Program Files\Java\jdk-21'
    'C:\Program Files\Android\Android Studio\jbr'
    "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
    'C:\Program Files\Eclipse Adoptium\jdk-21'
)
$jdk = $candidates |
    Where-Object { $_ -and (Test-Path (Join-Path $_ 'bin\java.exe')) } |
    Select-Object -First 1

if (-not $jdk) {
    throw "No usable JDK found. Tried:`n  $($candidates -join "`n  ")"
}
$env:JAVA_HOME = $jdk
Write-Host "JDK        : $jdk" -ForegroundColor DarkGray

# --- 2. Stale Metro output ---------------------------------------------------
$generated = Join-Path $androidDir 'app\build\generated\res\createBundleReleaseJsAndAssets'
if (Test-Path $generated) {
    Remove-Item -Recurse -Force $generated
    Write-Host "Cleared    : build/generated/res/createBundleReleaseJsAndAssets" -ForegroundColor DarkGray
}

# --- 3. Build ----------------------------------------------------------------
Push-Location $androidDir
try {
    & .\gradlew.bat bundleRelease --console=plain
    if ($LASTEXITCODE -ne 0) { throw "gradlew bundleRelease failed (exit $LASTEXITCODE)" }
}
finally {
    Pop-Location
}

if (-not (Test-Path $aabPath)) { throw "Build reported success but $aabPath is missing." }

Write-Host ''
Write-Host "AAB        : $aabPath"
Write-Host ("Size       : {0:N2} MB" -f ((Get-Item $aabPath).Length / 1MB))

if ($SkipVerify) { return }

# --- 4. Verify ---------------------------------------------------------------
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($aabPath)
try {
    $entries = $zip.Entries

    $oggs = @($entries | Where-Object { $_.FullName -like 'base/res/raw/adhan_*.ogg' })
    $fonts = @($entries | Where-Object { $_.FullName -like 'base/res/raw/*.ttf' })
    $stale = @($fonts | Where-Object { $_.Name -like 'node_modules_expo_*' })

    $audioMB = (($oggs | Measure-Object -Property Length -Sum).Sum) / 1MB
    $fontKB = (($fonts | Measure-Object -Property Length -Sum).Sum) / 1KB

    # Approximate what one device downloads: Play splits by ABI, density and
    # language, so count a single ABI and a single density rather than the lot.
    $densities = 'ldpi', 'mdpi', 'hdpi', 'xhdpi', 'xxxhdpi', 'tvdpi'
    $deviceBytes = 0
    foreach ($e in $entries) {
        $n = $e.FullName
        if (-not $n.StartsWith('base/')) { continue }        # metadata, not delivered
        $rest = $n.Substring(5)
        if ($rest.StartsWith('lib/')) {
            if ($rest.Split('/')[1] -ne 'arm64-v8a') { continue }
        }
        elseif ($rest.StartsWith('res/')) {
            $qualifier = $rest.Split('/')[1]
            if (($densities | Where-Object { $qualifier -like "*$_*" }) -and $qualifier -notlike '*xxhdpi*') {
                continue
            }
        }
        $deviceBytes += $e.Length
    }

    Write-Host ''
    Write-Host 'Verification' -ForegroundColor Cyan
    Write-Host ("  adhan sounds    : {0} / {1}" -f $oggs.Count, $expectedSounds)
    Write-Host ("  audio total     : {0:N2} MB" -f $audioMB)
    Write-Host ("  icon fonts      : {0} files, {1:N1} KB" -f $fonts.Count, $fontKB)
    Write-Host ("  stale fonts     : {0}" -f $stale.Count)
    Write-Host ("  est. download   : {0:N2} MB  (arm64-v8a + xxhdpi split)" -f ($deviceBytes / 1MB))

    $problems = @()
    if ($oggs.Count -ne $expectedSounds) {
        $problems += "Expected $expectedSounds adhan sounds, found $($oggs.Count). Resource shrinking probably discarded them - check res/raw/keep_adhan_sounds.xml still exists and is not named keep.xml."
    }
    if ($stale.Count -gt 0) {
        $problems += "$($stale.Count) unsubsetted font(s) present. Run: python scripts/subset-icon-fonts.py"
    }
    if ($fontKB -gt 512) {
        $problems += ("Icon fonts total {0:N0} KB, expected well under 512. The metro.config.js redirect to assets/fonts/ may not be applying." -f $fontKB)
    }

    Write-Host ''
    if ($problems.Count -gt 0) {
        foreach ($p in $problems) { Write-Host "FAIL: $p" -ForegroundColor Red }
        exit 1
    }
    Write-Host 'All checks passed.' -ForegroundColor Green
}
finally {
    $zip.Dispose()
}
