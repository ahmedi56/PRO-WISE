#!/bin/bash
# Quick EAS Build Script for PRO-WISE Mobile

echo "🚀 PRO-WISE Mobile App - EAS Build"
echo "===================================="
echo ""
echo "Select platform to build:"
echo "1) iOS only"
echo "2) Android only"
echo "3) Both (iOS + Android)"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "📱 Building for iOS..."
    cd mobile && eas build --platform ios --auto-submit=false
    ;;
  2)
    echo "🤖 Building for Android..."
    cd mobile && eas build --platform android --auto-submit=false
    ;;
  3)
    echo "📱 🤖 Building for both platforms..."
    cd mobile && eas build --platform all --auto-submit=false
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✅ Build submitted to EAS"
echo "📊 Track progress: eas build:list"
