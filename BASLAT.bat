@echo off
title Tuzluca Social Phone

if not exist "node_modules\" (
    echo Paketler yukleniyor, lutfen bekleyin...
    node -e "require('child_process').execSync('npm install',{stdio:'inherit',cwd:process.cwd()})"
)

echo Sunucu baslatiliyor...

:: Vite'i arka planda basalt
start "Vite Server" /min node node_modules\vite\bin\vite.js --port 5173

:: 3 saniye bekle (Vite hazir olsun)
timeout /t 3 /nobreak >nul

:: Electron uygulamasini ac
echo Uygulama aciliyor...
node_modules\electron\dist\electron.exe .

:: Electron kapaninca Vite'i da kapat
taskkill /FI "WINDOWTITLE eq Vite Server" /F >nul 2>&1
