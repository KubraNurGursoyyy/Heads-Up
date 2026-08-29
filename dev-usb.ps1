$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
    Write-Host "ADB bulunamadi: $adb"
    exit 1
}

Write-Host "ADB cihaz kontrolu..."

$devices = & $adb devices
$devices

$connectedDevice = $devices | Select-String '^\S+\s+device$'

if (-not $connectedDevice) {
    Write-Host ""
    Write-Host "Telefon ADB ile bagli degil veya yetkilendirilmemis."
    exit 1
}

Write-Host ""
Write-Host "Telefon bulundu."

Write-Host "USB reverse ayarlaniyor..."

& $adb reverse tcp:8081 tcp:8081
& $adb reverse tcp:3000 tcp:3000

$mobilePath = Join-Path $PSScriptRoot "apps\mobile"
Set-Location $mobilePath

Write-Host ""
Write-Host "Metro baslatiliyor..."

$metro = Start-Process `
    -FilePath "npx.cmd" `
    -ArgumentList "expo", "start", "--dev-client", "--localhost" `
    -NoNewWindow `
    -PassThru

Write-Host "Metro bekleniyor..."
Start-Sleep -Seconds 5

Write-Host "HeadsUp telefonda aciliyor..."

$devUrl = "exp+headsup://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"

& $adb shell am start `
    -a android.intent.action.VIEW `
    -d $devUrl `
    com.headsup.app

Write-Host ""
Write-Host "HeadsUp USB dev modu hazir."
Write-Host "Kodlari kaydettikce telefon otomatik guncellenecek."
Write-Host "Metro'yu kapatmak icin Ctrl+C kullan."
Write-Host ""

Wait-Process -Id $metro.Id