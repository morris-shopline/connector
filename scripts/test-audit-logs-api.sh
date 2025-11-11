#!/bin/bash

# Activity Dock API 測試腳本
# 使用方法：./scripts/test-audit-logs-api.sh [TOKEN]

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
API_ENDPOINT="${BACKEND_URL}/api/audit-logs?limit=50"

# 取得 Token
if [ -z "$1" ]; then
    echo -e "${YELLOW}請提供認證 Token：${NC}"
    echo "使用方法: $0 <TOKEN>"
    echo "或從瀏覽器 localStorage 複製 auth_token"
    exit 1
fi

TOKEN="$1"

echo -e "${GREEN}測試 Activity Dock API...${NC}"
echo "端點: ${API_ENDPOINT}"
echo ""

# 發送請求
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_ENDPOINT}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

# 分離回應和狀態碼
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${GREEN}HTTP 狀態碼: ${HTTP_CODE}${NC}"
echo ""

# 檢查狀態碼
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ API 請求成功${NC}"
    echo ""
    
    # 解析 JSON 回應
    SUCCESS=$(echo "$HTTP_BODY" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' ')
    DATA_COUNT=$(echo "$HTTP_BODY" | grep -o '"data":\[' | wc -l)
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ 回應格式正確 (success: true)${NC}"
        
        # 計算記錄數量（簡單方法）
        RECORD_COUNT=$(echo "$HTTP_BODY" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ 找到 ${RECORD_COUNT} 筆審計記錄${NC}"
        echo ""
        
        # 顯示前 3 筆記錄摘要
        echo -e "${YELLOW}前 3 筆記錄摘要：${NC}"
        echo "$HTTP_BODY" | grep -o '"operation":"[^"]*"' | head -3 | sed 's/"operation":"/  - /' | sed 's/"$//'
        echo ""
        
        if [ "$RECORD_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}⚠️  目前沒有審計記錄${NC}"
            echo "建議執行以下操作來產生測試資料："
            echo "  1. 新增 Connection"
            echo "  2. 重新授權 Connection"
            echo "  3. 停用/啟用 Connection Item"
        fi
    else
        echo -e "${RED}❌ 回應格式錯誤 (success: false)${NC}"
        echo "$HTTP_BODY" | head -20
    fi
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ 認證失敗 (401 Unauthorized)${NC}"
    echo "請確認 Token 是否正確"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}❌ API 端點不存在 (404 Not Found)${NC}"
    echo "請確認後端服務是否正常運行"
else
    echo -e "${RED}❌ API 請求失敗 (HTTP ${HTTP_CODE})${NC}"
    echo "$HTTP_BODY" | head -20
fi

echo ""
echo -e "${YELLOW}完整回應：${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

