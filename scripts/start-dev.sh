#!/bin/bash

# 啟動開發環境腳本

echo "🚀 啟動 Shopline API 整合開發環境..."

# 檢查 ngrok 是否安裝
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安裝，請先安裝 ngrok"
    echo "   安裝方式: brew install ngrok/ngrok/ngrok"
    exit 1
fi

echo "☁️  使用 Neon 雲端資料庫"

# 檢查 Redis 設定
if [ -f backend/.env ]; then
  if grep -q "REDIS_URL=rediss://" backend/.env; then
    echo "✅ Redis External URL 已設定（地端開發環境）"
  elif grep -q "REDIS_URL=redis://" backend/.env; then
    echo "⚠️  Redis Internal URL 已設定（僅 Render 服務可用）"
    echo "   地端開發建議使用 External URL（見 docs/reference/guides/REDIS_LOCAL_SETUP.md）"
  else
    echo "ℹ️  Redis 未設定，將使用資料庫查詢（降級模式）"
  fi
fi

# 執行資料庫遷移
echo "🗄️ 執行資料庫遷移..."
cd backend && npm run db:push && cd ..

# 啟動後端服務
echo "🔧 啟動後端服務..."
cd backend && npm run dev &
BACKEND_PID=$!

# 等待後端啟動
sleep 3

# 啟動 ngrok 隧道
echo "🌐 啟動 ngrok 隧道..."
ngrok http 3001 --log=stdout &
NGROK_PID=$!

# 等待 ngrok 啟動
sleep 3

# 取得 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])")

# 自動更新所有配置檔案中的 ngrok URL
echo "🔄 自動更新所有配置檔案中的 ngrok URL..."
cd "$(dirname "$0")/.." && node scripts/update-ngrok-config.js > /dev/null 2>&1

echo ""
echo "✅ 開發環境啟動完成！"
echo ""
echo "📍 後端服務: http://localhost:3001"
echo "🌐 ngrok 隧道: $NGROK_URL"
echo "🔗 授權 URL: $NGROK_URL/api/auth/shopline/install"
echo ""
echo "⚠️  請將以下 URL 更新到 Shopline 應用設定中："
echo "   📍 App URL: $NGROK_URL/api/auth/shopline/install"
echo "   📞 Callback URL: $NGROK_URL/api/auth/shopline/callback"
echo "   📡 Webhook URL: $NGROK_URL/webhook/shopline"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
wait

# 清理進程
kill $BACKEND_PID $NGROK_PID 2>/dev/null
