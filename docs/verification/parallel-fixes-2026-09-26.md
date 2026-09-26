# 第二次盤點後的平行修正

日期：2026-09-26。修正基準：`dc79279`。

本輪處理已確認的三項使用問題，以及載入恢復、CSV 資料入口兩項缺口。不同模組分工，Git 暫存與提交由整合者依序操作；原有未追蹤的盤點文件與截圖保持原狀。

| 修正 | 交付行為 | 定向驗收 |
| --- | --- | --- |
| 散佈圖平移 | 選取後連續平移，點持續更新，框選可見點得到同一型態 | [平移驗收](scatter-pan-selection-fix.md) |
| 明暗圖表 | 平均直條與雷達圖文字跟隨主題，即時切換保持可讀 | [主題驗收](chart-theme-fix.md) |
| 搜尋格式 | 圖鑑與圖表接受 `#025`、`025`、彎單引號與省略句點 | [搜尋驗收](search-format-fix.md) |
| 請求逾時 | 15 秒後保留已載入卡片，提示重試同一批，舊請求不污染新條件 | [逾時驗收](feed-timeout-fix.md) |
| CSV 整數 | 非法數字不再靜默截斷，回報資料筆次與欄位 | [CSV 驗收](csv-integer-validation.md) |

## 整合驗證

在五項產品與測試修正全部定稿後，執行：

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:e2e
```

- ESLint 與 TypeScript：通過。
- Vitest：23 個檔案、**116 項通過**，包含正式 1,032 筆 CSV 的整數解析相容性。
- Playwright：Chromium、Firefox、WebKit 共 **324 項通過**；完整 CSV suite 為 306 項，平均圖 fixture suite 為 18 項。
- 散佈圖另有三瀏覽器各重複三次的 63 項定向回歸；主題另有 12 項初始暗色／同頁切換檢查，細節見各自驗收文件。
- `git diff --check` 通過，10 份新增／更新文件的本機連結均可解析。

整體 E2E 輸出位於 `test-results/regression-nCbvuU/`，包含 `build.log`、`catalog.log`、`averages.log` 及兩份 HTML 報告。使用 Node.js 24.21.0，既有隔離 runner 建立暫存正式版、獨立連接埠，不沿用根 `.next` 或開發服務。建置與本機瀏覽器服務使用工具核准的網路環境，以取得既有 Google Fonts 依賴；沒有更改建置設定或測試隔離方式。

五項修正各自附程式、必要測試與驗收文件提交；共用說明與本份整合結果另作文件提交。沒有推送遠端。

## 保留範圍

本輪沒有新增比較、中文名稱、世代篩選或圖片資料。詳細頁 `h1`、預設英文 404 與 Geist 字型 class 為後續小項目。比較功能仍需先定最小規格。
