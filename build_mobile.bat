@echo off
REM Quick EAS Build Script for PRO-WISE Mobile (Windows)

echo 🚀 PRO-WISE Mobile App - EAS Build
echo ====================================
echo.
echo Select platform to build:
echo 1) iOS only
echo 2) Android only
echo 3) Both (iOS + Android)
echo.

set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo 📱 Building for iOS...
    cd mobile
    call eas build --platform ios --auto-submit=false
) else if "%choice%"=="2" (
    echo 🤖 Building for Android...
    cd mobile
    call eas build --platform android --auto-submit=false
) else if "%choice%"=="3" (
    echo 📱 🤖 Building for both platforms...
    cd mobile
    call eas build --platform all --auto-submit=false
) else (
    echo ❌ Invalid choice
    exit /b 1
)

echo.
echo ✅ Build submitted to EAS
echo 📊 Track progress: eas build:list
