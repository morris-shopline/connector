#!/bin/bash

# 啟動 ngrok 隧道腳本

echo "🌐 啟動 ngrok 隧道..."

# 檢查 ngrok 是否安裝
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安裝，請先安裝 ngrok"
    echo "   安裝方式: brew install ngrok/ngrok/ngrok"
    exit 1
fi

# 啟動 ngrok
ngrok http 3001 --log=stdout &

# 等待 ngrok 啟動
sleep 3

# 取得 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])")

# 自動更新所有配置檔案中的 ngrok URL
echo "🔄 自動更新所有配置檔案中的 ngrok URL..."
cd "$(dirname "$0")/.." && node scripts/update-ngrok-config.js

echo ""
echo "✅ ngrok 隧道啟動成功！"
echo "🌐 隧道 URL: $NGROK_URL"
echo "🔗 授權 URL: $NGROK_URL/api/auth/shopline/install"
echo "📡 Webhook URL: $NGROK_URL/webhook/shopline"
echo ""
echo "⚠️  請將以下 URL 更新到 Shopline 應用設定中："
echo "   📍 App URL: $NGROK_URL/api/auth/shopline/install"
echo "   📞 Callback URL: $NGROK_URL/api/auth/shopline/callback"
echo "   📡 Webhook URL: $NGROK_URL/webhook/shopline"
echo ""
echo "按 Ctrl+C 停止 ngrok"

# 等待用戶中斷
wait
