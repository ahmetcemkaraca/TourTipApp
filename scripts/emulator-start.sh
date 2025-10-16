#!/bin/bash

# Firebase Emulator başlatma scripti
echo "🚀 Firebase Emulator Suite başlatılıyor..."

# Emulator portlarının boş olduğunu kontrol et
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $1 zaten kullanımda. Lütfen portu boşaltın veya farklı port kullanın."
    return 1
  fi
  return 0
}

# Kritik portları kontrol et
echo "📡 Portlar kontrol ediliyor..."
check_port 4000 || exit 1  # Emulator UI
check_port 5000 || exit 1  # Hosting
check_port 5001 || exit 1  # Functions
check_port 8080 || exit 1  # Firestore
check_port 9099 || exit 1  # Auth
check_port 9199 || exit 1  # Storage

echo "✅ Tüm portlar müsait"

# Firebase tools yüklü mü kontrol et
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI yüklü değil. Lütfen önce 'npm install -g firebase-tools' çalıştırın."
    exit 1
fi

# Functions bağımlılıklarını kontrol et
if [ ! -d "functions/node_modules" ]; then
    echo "📦 Functions bağımlılıkları yükleniyor..."
    cd functions && npm install && cd ..
fi

# Emulator'ı başlat
echo "🔥 Firebase Emulator Suite başlatılıyor..."
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

echo "🎉 Emulator Suite başlatıldı!"
echo "📱 Emulator UI: http://localhost:4000"
echo "🌐 Hosting: http://localhost:5000"
echo "⚡ Functions: http://localhost:5001"
echo "🗄️  Firestore: http://localhost:8080"
echo "🔐 Auth: http://localhost:9099"
echo "📁 Storage: http://localhost:9199"
