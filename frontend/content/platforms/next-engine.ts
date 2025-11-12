/**
 * Next Engine 平台文案與配置
 * 
 * Story 5.3: 集中管理 Next Engine 平台相關的文案與配置
 */

export const nextEnginePlatform = {
  name: 'Next Engine',
  displayName: 'Next Engine',
  shortName: 'NE',
  color: {
    primary: '#4F46E5', // Indigo
    badge: 'bg-indigo-100 text-indigo-800',
  },
  messages: {
    authorize: {
      title: '新增 Next Engine Connection',
      description: '連接到您的 Next Engine 帳戶以同步店舖與訂單資料',
      button: '前往 Next Engine 授權',
      steps: [
        '點擊「前往授權」後將跳轉至 Next Engine 登入頁面',
        '在 Next Engine 頁面完成登入與授權',
        '授權完成後將自動返回並建立 Connection',
      ],
    },
    reauthorize: {
      title: '重新授權 Next Engine Connection',
      description: '需要重新授權以更新此 Connection 的授權狀態',
      button: '前往 Next Engine 重新授權',
      steps: [
        '點擊「前往授權」後將跳轉至 Next Engine 登入頁面',
        '在 Next Engine 頁面確認授權',
        '授權完成後將自動返回並更新 Connection 狀態',
      ],
    },
    errors: {
      TOKEN_EXPIRED: 'Token 已過期，需要重新授權以繼續使用此 Connection。',
      TOKEN_REFRESH_FAILED: 'Token 刷新失敗，請重新授權此 Connection。',
      TOKEN_REVOKED: 'Token 已被撤銷，需要重新授權以恢復此 Connection。',
      PLATFORM_ERROR: 'Next Engine API 發生錯誤，請稍後再試或聯絡客服。',
      PLATFORM_UNKNOWN: '發生未知錯誤，請檢查 Next Engine 後台狀態或聯絡客服。',
    },
  },
}

