# Firebase Emulator başlatma scripti (PowerShell)
Write-Host "🚀 Firebase Emulator Suite başlatılıyor..." -ForegroundColor Green

# Port kontrol fonksiyonu
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Kritik portları kontrol et
Write-Host "📡 Portlar kontrol ediliyor..." -ForegroundColor Yellow

$ports = @(4000, 5000, 5001, 8080, 9099, 9199)
foreach ($port in $ports) {
    if (Test-Port -Port $port) {
        Write-Host "⚠️  Port $port zaten kullanımda. Lütfen portu boşaltın veya farklı port kullanın." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Tüm portlar müsait" -ForegroundColor Green

# Firebase CLI kontrol
if (!(Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI yüklü değil. Lütfen önce 'npm install -g firebase-tools' çalıştırın." -ForegroundColor Red
    exit 1
}

# Functions bağımlılıklarını kontrol et
if (!(Test-Path "functions/node_modules")) {
    Write-Host "📦 Functions bağımlılıkları yükleniyor..." -ForegroundColor Yellow
    Set-Location functions
    npm install
    Set-Location ..
}

# Seed data dizinini oluştur
if (!(Test-Path "emulator-data")) {
    New-Item -ItemType Directory -Path "emulator-data"
    Write-Host "📁 Emulator data dizini oluşturuldu" -ForegroundColor Green
}

# Emulator'ı başlat
Write-Host "🔥 Firebase Emulator Suite başlatılıyor..." -ForegroundColor Green
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

Write-Host "🎉 Emulator Suite başlatıldı!" -ForegroundColor Green
Write-Host "📱 Emulator UI: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🌐 Hosting: http://localhost:5000" -ForegroundColor Cyan
Write-Host "⚡ Functions: http://localhost:5001" -ForegroundColor Cyan
Write-Host "🗄️  Firestore: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔐 Auth: http://localhost:9099" -ForegroundColor Cyan
Write-Host "📁 Storage: http://localhost:9199" -ForegroundColor Cyan
