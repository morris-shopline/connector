# NextEngine API 參考文檔

## 概述
本文檔整理 NextEngine API 的詳細資訊，基於官方文檔和實際測試結果。

> 🔧 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含 OAuth、API、在庫連携的端到端流程，可直接複製到其他專案使用）

## 重要文檔來源
- [NextEngine 汎用在庫連携指南](https://manual.next-engine.net/main/category/mall-cart/mc_hanyo/)
- [在庫更新程序準備](https://manual.next-engine.net/main/stock/stk_settei-unyou/zaiko_hanyo/5174/)
- [NextEngine API 開發者文檔](https://developer.next-engine.com/api/start)

## OAuth 認證流程

### 1. 重定向到登入頁面
```
GET https://base.next-engine.org/users/sign_in/?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}
```

### 2. 取得 Access Token
```
POST https://api.next-engine.org/api_neauth
Content-Type: application/x-www-form-urlencoded

client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
uid={UID}
state={STATE}
```

### 3. 刷新 Token
```
POST https://api.next-engine.org/api_neauth
Content-Type: application/x-www-form-urlencoded

client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
uid={UID}
state={STATE}
refresh_token={REFRESH_TOKEN}
```

## 店舖管理 API

### 建立店舖
```
POST https://api.next-engine.org/api_v1_master_shop/create
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
wait_flag=1
data={XML_DATA}
```

**XML 格式範例：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <shop>
    <shop_mall_id>90</shop_mall_id>
    <shop_note>店舖備註</shop_note>
    <shop_name>店舖名稱</shop_name>
    <shop_abbreviated_name>SL</shop_abbreviated_name>
    <shop_tax_id>0</shop_tax_id>
    <shop_tax_calculation_sequence_id>0</shop_tax_calculation_sequence_id>
    <shop_currency_unit_id>1</shop_currency_unit_id>
  </shop>
</root>
```

### 查詢店舖
```
POST https://api.next-engine.org/api_v1_master_shop/search
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
fields=shop_id,shop_name,shop_abbreviated_name,shop_note
```

## 商品管理 API

### 建立商品
```
POST https://api.next-engine.org/api_v1_master_goods/upload
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
data_type=csv
data={CSV_DATA}
wait_flag=1
```

**CSV 格式範例（按照官方完整格式）：**
```csv
syohin_code,sire_code,jan_code,maker_name,maker_kana,maker_jyusyo,maker_yubin_bangou,kataban,iro,syohin_name,gaikoku_syohin_name,syohin_kbn,toriatukai_kbn,genka_tnk,hyoji_tnk,baika_tnk,gaikoku_baika_tnk,kake_ritu,omosa,haba,okuyuki,takasa,yusou_kbn,syohin_status_kbn,hatubai_bi,zaiko_teisu,hachu_ten,lot,keisai_tantou,keisai_bi,bikou,daihyo_syohin_code,visible_flg,mail_tag,tag,location,mail_send_flg,mail_send_num,gift_ok_flg,size,org_select1,org_select2,org_select3,org_select4,org_select5,org_select6,org_select7,org_select8,org_select9,org_select10,org1,org2,org3,org4,org5,org6,org7,org8,org9,org10,org11,org12,org13,org14,org15,org16,org17,org18,org19,org20,maker_kataban,zaiko_threshold,orosi_threshold,hasou_houhou_kbn,hasoumoto_code,zaiko_su,yoyaku_zaiko_su,nyusyukko_riyu,hit_syohin_alert_quantity,nouki_kbn,nouki_sitei_bi,syohin_setumei_html,syohin_setumei_text,spec_html,spec_text,chui_jiko_html,chui_jiko_text,syohin_jyotai_kbn,syohin_jyotai_setumei,category_code_yauc,category_text,image_url_http,image_alt
TestP001,9999,,,,,,,,登録時必須,,0,0,120000,,150000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
```

**重要注意事項（基於官方手冊）：**

### 必須項目（新規登録時）
| 項目名 | 新規登録時 | 更新時 |
|--------|------------|--------|
| 商品コード(syohin_code) | 〇 | 〇 |
| 仕入先コード(sire_code) | 〇 | - |
| 商品名(syohin_name) | 〇 | - |
| 原価(genka_tnk) | 〇 | - |
| 売価(baika_tnk) | 〇 | - |
| 代表商品コード(daihyo_syohin_code) | △※ | - |

※選択肢付き商品かつ在庫連携をご利用いただく場合必須

### 技術限制
1. **文件大小限制** - 5MB 以内
2. **商品上限** - 50万件
3. **編碼要求** - 推奨使用 Shift_JIS 或 UTF-8
4. **異步處理** - 上傳後需要檢查アップロードキュー狀態
5. **欄位對應** - 查詢時使用 `goods_id`，上傳時使用 `syohin_code`

### 錯誤處理
- エラー商品は「エラー内容CSV」でダウンロード可能
- 問題ない商品のみが取り込まれる
- エラー内容を修正して再アップロード可能

### 查詢商品
```
POST https://api.next-engine.org/api_v1_master_goods/search
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
fields=goods_id,goods_name,stock_quantity,supplier_name
goods_id-eq={PRODUCT_ID}
```

**官方範例：**
```bash
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
-d 'access_token=xxxxxxxxxxxxxx&refresh_token=xxxxxxxxxxxxxx&wait_flag=1&fields=goods_id,goods_name,stock_quantity,supplier_name&goods_id-eq=TestP001&offset=0&limit=100' \
https://api.next-engine.org/api_v1_master_goods/search
```

**回應範例：**
```json
{
  "result": "success",
  "count": "1",
  "data": [
    {
      "goods_id": "TestP001",
      "goods_name": "登録時必須",
      "stock_quantity": "27",
      "supplier_name": "設定なし"
    }
  ]
}
```

## 在庫管理 API

### 在庫マスタ検索（主倉庫）
- **端點**: `/api_v1_master_stock/search`
- **方法**: POST
- **用途**: 查詢主倉庫在庫資訊
- **參數**:
  - `fields`: 要查詢的欄位
  - `stock_goods_id-eq`: 商品代碼（等於）
  - `offset`: 偏移量
  - `limit`: 限制數量

### 拠点在庫マスタ検索（分倉庫）
- **端點**: `/api_v1_warehouse_stock/search`
- **方法**: POST
- **用途**: 查詢分倉庫在庫資訊
- **參數**:
  - `fields`: 要查詢的欄位
  - `warehouse_stock_goods_id-eq`: 商品代碼（等於）
  - `warehouse_stock_warehouse_id-eq`: 倉庫ID（等於）
  - `offset`: 偏移量
  - `limit`: 限制數量

#### 主倉庫在庫マスタ欄位說明
| 項目名 | フィールド名 | データ型 | 備考 |
|--------|-------------|----------|------|
| 商品コード | stock_goods_id | 文字列型 | |
| 在庫数 | stock_quantity | 数値型 | |
| 引当数 | stock_allocation_quantity | 数値型 | |
| 不良在庫数 | stock_defective_quantity | 数値型 | |
| 発注残数 | stock_remaining_order_quantity | 数値型 | |
| 欠品数 | stock_out_quantity | 数値型 | |
| フリー在庫数 | stock_free_quantity | 数値型 | |
| 予約在庫数 | stock_advance_order_quantity | 数値型 | |
| 予約引当数 | stock_advance_order_allocation_quantity | 数値型 | |
| 予約フリー在庫数 | stock_advance_order_free_quantity | 数値型 | |
| 削除フラグ | stock_deleted_flag | 文字列型 | |
| 作成日 | stock_creation_date | 日時型 | |
| 最終更新日 | stock_last_modified_date | 日時型 | |
| 最終更新日 | stock_last_modified_null_safe_date | 日時型 | NULLの場合作成日 |
| 作成担当者ID | stock_creator_id | 数値型 | |
| 作成担当者名 | stock_creator_name | 文字列型 | |
| 最終更新者ID | stock_last_modified_by_id | 数値型 | |
| 最終更新者ID | stock_last_modified_by_null_safe_id | 数値型 | NULLの場合作成者ID |
| 最終更新者名 | stock_last_modified_by_name | 文字列型 | |
| 最終更新者名 | stock_last_modified_by_null_safe_name | 文字列型 | NULLの場合作成者名 |

#### 分倉庫在庫マスタ欄位說明
| 項目名 | フィールド名 | データ型 | 備考 |
|--------|-------------|----------|------|
| 倉庫ID | warehouse_stock_warehouse_id | 文字列型 | |
| 商品コード | warehouse_stock_goods_id | 文字列型 | |
| 在庫数 | warehouse_stock_quantity | 数値型 | |
| 引当数 | warehouse_stock_allocation_quantity | 数値型 | |
| フリー在庫数 | warehouse_stock_free_quantity | 数値型 | |

#### サンプルリクエスト
```bash
curl -X POST https://api.next-engine.org/api_v1_master_stock/search \
  -H 'cache-control: no-cache' \
  -F access_token=xxxxxx \
  -F refresh_token=xxxxxx \
  -F wait_flag=1 \
  -F 'fields=stock_goods_id,stock_quantity,stock_allocation_quantity,stock_defective_quantity,stock_remaining_order_quantity,stock_out_quantity,stock_free_quantity,stock_advance_order_quantity,stock_advance_order_allocation_quantity,stock_advance_order_free_quantity,stock_deleted_flag,stock_creation_date,stock_last_modified_date,stock_last_modified_null_safe_date,stock_creator_id,stock_creator_name,stock_last_modified_by_id,stock_last_modified_by_null_safe_id,stock_last_modified_by_name,stock_last_modified_by_null_safe_name' \
  -F stock_goods_id-eq="abcd" \
  -F offset=0 \
  -F limit=1
```

#### サンプルレスポンス
```json
{
  "result": "success",
  "count": "1",
  "data": [
    {
      "stock_goods_id": "abcd",
      "stock_quantity": "170",
      "stock_allocation_quantity": "0",
      "stock_defective_quantity": "0",
      "stock_remaining_order_quantity": "0",
      "stock_out_quantity": "0",
      "stock_free_quantity": "170",
      "stock_advance_order_quantity": "102",
      "stock_advance_order_allocation_quantity": "0",
      "stock_advance_order_free_quantity": "102",
      "stock_deleted_flag": "0",
      "stock_creation_date": "2017-02-09 17:04:44",
      "stock_last_modified_date": "2017-02-23 15:06:55",
      "stock_last_modified_null_safe_date": "2017-02-23 15:06:55",
      "stock_creator_id": "10003",
      "stock_creator_name": "xxxxxxxx",
      "stock_last_modified_by_id": "10003",
      "stock_last_modified_by_null_safe_id": "10003",
      "stock_last_modified_by_name": "xxxxxxxx",
      "stock_last_modified_by_null_safe_name": "xxxxxxxxx"
    }
  ],
  "access_token": "xxxxxxxxxxx",
  "access_token_end_date": "2017-04-13 18:24:53",
  "refresh_token": "xxxxxxxxxxx",
  "refresh_token_end_date": "2017-04-15 18:24:53"
}
```

### 更新在庫（使用拠点在庫マスタアップロード方式）
```
POST https://api.next-engine.org/api_v1_warehouse_stock/upload
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
data_type=csv
data={CSV_DATA}
wait_flag=1
```

**重要說明：**
- NextEngine 的在庫更新使用**拠点在庫マスタアップロード**方式
- **必須使用倉庫名稱**（`kyoten_mei`），不是倉庫ID
- 使用加算/減算方式，不是直接設定數值
- 需要先查詢分倉庫當前在庫數，計算與目標值的差異

**CSV 格式範例：**
```csv
拠点名,商品コード,加算数量,減算数量,理由
基本拠点,TEST001,50,,在庫数調整のため
基本拠点,TEST002,,30,在庫数調整のため
```

**重要規則：**
- **加算数量**（`kasan_su`）：1以上的整數，用於增加庫存
- **減算数量**（`gensan_su`）：1以上的整數，用於減少庫存
- **不能使用負數的加算数量**，必須使用減算数量欄位
- 加算和減算不能同時使用，只能選擇其中一種
- 減算数量不能超過當前フリー在庫数

**更新流程：**
1. 查詢分倉庫當前在庫數：`/api_v1_warehouse_stock/search`
2. 判斷操作類型：增加或減少
3. 使用對應的欄位：`加算数量` 或 `減算数量`
4. 上傳 CSV：`/api_v1_warehouse_stock/upload`
5. 檢查處理狀態：`/api_v1_system_que/search`

**關鍵概念：**
- **主倉庫**：`/api_v1_master_stock/search` - 查詢總庫存
- **分倉庫**：`/api_v1_warehouse_stock/search` - 查詢特定倉庫庫存
- **庫存更新**：必須使用分倉庫概念，使用倉庫名稱而非ID

### 拠点マスタ検索
```
POST https://api.next-engine.org/api_v1_warehouse_base/search
Content-Type: application/x-www-form-urlencoded

access_token={ACCESS_TOKEN}
fields=warehouse_id,warehouse_name
```

**用途：** 查詢可用的拠点（倉庫）資訊，用於在庫更新時指定正確的拠点名。

## 在庫連携架構

### NextEngine → 外部系統的流程

1. **NextEngine 發送請求**
```
GET http://外部系統域名/UpdateStock.php?StoreAccount={ACCOUNT}&Code={PRODUCT_CODE}&Stock={STOCK}&ts={TIMESTAMP}&.sig={SIGNATURE}
```

2. **外部系統回傳響應**
```xml
<?xml version="1.0" encoding="EUC-JP"?>
<ShoppingUpdateStock version="1.0">
<ResultSet TotalResult="1">
<Request>
<Argument Name="StoreAccount" Value="{ACCOUNT}" />
<Argument Name="Code" Value="{PRODUCT_CODE}" />
<Argument Name="Stock" Value="{STOCK}" />
<Argument Name="ts" Value="{TIMESTAMP}" />
<Argument Name=".sig" Value="{SIGNATURE}" />
</Request>
<Result No="1">
<Processed>0</Processed>
</Result>
</ResultSet>
</ShoppingUpdateStock>
```

### 簽名驗證

1. **參數排序**：按字母順序排列 StoreAccount, Code, Stock, ts
2. **字串組合**：用 & 連接參數，最後加上認證金鑰
3. **MD5 雜湊**：對組合字串進行 MD5 雜湊

**範例：**
```
原始參數：StoreAccount=test&Code=TEST001&Stock=100&ts=20251022040000
加上金鑰：StoreAccount=test&Code=TEST001&Stock=100&ts=20251022040000your-auth-key
MD5 結果：a25a72aa452eca21d3b74031e4a3ea26
```

## 錯誤代碼

| 代碼 | 說明 |
|------|------|
| 002001 | POSTパラメータにaccess_tokenが指定されていません |
| 002002 | Token 過期 |
| 001001 | POSTパラメータにuidが指定されていません |

## 重要注意事項

1. **所有 API 請求都需要 access_token**
2. **在庫連携使用 GET 請求，其他 API 使用 POST**
3. **XML 響應必須使用 EUC-JP 編碼**
4. **簽名驗證確保請求安全性**
5. **wait_flag=1 表示同步處理**

## 測試環境設定

### 環境變數
```bash
NEXTENGINE_CLIENT_ID=your_client_id
NEXTENGINE_CLIENT_SECRET=your_client_secret
NEXTENGINE_REDIRECT_URI=https://your-ngrok-url.ngrok.io/auth/callback
NEXTENGINE_AUTH_KEY=your_auth_key
```

### 測試端點
- 主測試頁面：http://localhost:3000
- 在庫連携接收：http://localhost:3000/UpdateStock.php
- 監控 API：http://localhost:3000/api/inventory/updates
- 狀態查詢：http://localhost:3000/api/inventory/status

## 在庫連携測試流程

### 1. 設定 NextEngine 店舗
在 NextEngine 店舗設定中，將「在庫更新用URL」設為：
```
https://your-ngrok-url.ngrok.io/UpdateStock.php
```

### 2. 測試連携
點擊 NextEngine 的「接続を確認」按鈕，NextEngine 會發送測試請求到我們的端點。

### 3. 觸發更新
透過 API 更新庫存，NextEngine 會自動發送在庫更新通知：
- 使用「更新在庫」按鈕
- 或直接調用 `/api/stock` POST 端點

### 4. 監控結果
查看接收到的請求記錄：
- 網頁介面：即時顯示接收到的請求數量
- API 端點：`/api/inventory/updates` 查看詳細記錄
- 日誌端點：`/api/inventory/logs` 查看處理日誌

### 實作重點
- **接收端點**: `/UpdateStock.php` (GET 請求)
- **簽名驗證**: 使用 MD5 雜湊驗證請求的合法性
- **XML 響應**: 必須回傳符合 NextEngine 要求的 XML 格式
- **即時監控**: 提供 API 端點查詢接收到的在庫更新記錄

## 更新記錄

- 2025-10-22: 初始版本，基於官方文檔和實際測試
- 包含 OAuth 流程、店舖管理、商品管理、庫存管理、在庫連携等完整 API 參考
- 2025-10-22: 新增在庫連携測試流程和實作重點說明
