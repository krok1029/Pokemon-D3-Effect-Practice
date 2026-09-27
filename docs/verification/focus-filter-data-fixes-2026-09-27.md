# 焦點、篩選與資料邊界修正

日期：2026-09-27。基準 `593d6d3`，分支 `codex/focus-filter-data-fixes`。

三組平行處理前次盤點確認的五項缺漏，程式、必要測試及各自驗收文件依修正目的分別提交；共用維護文件由主流程整合。

| 修正 | 結果 | 個別驗收 |
| --- | --- | --- |
| 虛擬列表鍵盤焦點 | 卡片父節點切換後還原同一詳細連結，已移出卡片的焦點不被搶回 | [焦點保留](virtualization-focus-fix.md) |
| 圖鑑屬性篩選 | 選取背景保留屬性色，文字與圖示選擇黑／白前景 | [圖鑑篩選](catalog-filter-contrast-fix.md) |
| 散佈圖主屬性圖例 | 主題文字色搭配可辨識的屬性色圖示，取消態保留文字對比 | [圖表圖例](chart-legend-contrast-fix.md) |
| CSV BOM | UTF-8 BOM 不再污染 Number 標頭 | [BOM 相容](csv-bom-fix.md) |
| 重複主副屬性 | 大小寫正規化後相同屬性在 Infra 入口拒絕，附 Row／Type 2 欄位 | [重複屬性](csv-duplicate-type-fix.md) |

## 驗證方法

修正前正式版已核對 75 個 source/config 檔與基準相同；新增瀏覽器測試先對該服務重現原問題。CSV 新增案例亦先執行失敗，再補產品修正。

修正後使用獨立工作目錄正式建置，測試服務與原有開發服務分開，不使用根 `.next`。公開頁面案例透過 `PLAYWRIGHT_BASE_URL` 指向該獨立正式服務，完整 CSV 與平均圖 fixture 使用不同程序／連接埠。

## 驗證結果

- 最終 `yarn lint`、`yarn typecheck` 通過。
- 最終 `yarn test:unit`：25 檔、163 項通過；CSV 新增 6 案先確認失敗，修正後 CSV 共 77 項通過。
- 最終正式建置的焦點定向測試：Chromium、Firefox、WebKit **9／9 通過**，證據 `test-results/regression-iS3UET/catalog.log`。
- 同一最終建置的平均圖 fixture：三瀏覽器 **18／18 通過**，證據 `test-results/regression-mAjrhG/averages.log`。
- 完整圖鑑三瀏覽器回歸初次為 **356 通過／4 失敗**；4 項皆為下述圖例圖片載入同步問題，證據 `test-results/regression-jsc4q7/catalog.log`。
- 修正圖例測試後，在同一最終正式建置重跑三瀏覽器 **6／6 通過**，證據 `test-results/regression-miGVlD/catalog.log`；其中 4 項覆蓋初次失敗，另外 2 項是 Chromium 再確認。
- 合併最終結果，**378 個不同 E2E 案例均已通過**（356＋4＋18）。初次完整指令含上述失敗，不宣稱首次零失敗。最終 72 個產品原碼檔已核對與測試建置完全相同。
- 原盤點 BOM 重現檔在修正版 `/api/pokemon`、`/pokemon`、`/chart`、`/pokemon/25` 均回應 200；[HTTP 證據](assets/bom-http-fixed-2026-09-27.json)。
- 另以原盤點自然鍵盤步驟補驗，不攔截或延遲 API；index 24 至 52 連續前進，48→72 筆期間沒有掉回 body 或往前跳。[鍵盤事件證據](assets/natural-keyboard-fixed-2026-09-27.json)。
- 人工檢查修正後圖鑑選取按鈕與散佈圖圖例截圖；文字與圖示可辨識。對比自動測量等待 CSS transition 完成後執行，避免量到中間色。

第一次焦點實作在首次啟用 virtualizer 時過早清掉還原紀錄；定向 green 抓到仍失焦後，確認首個更新尚無列，改為等同一連結出現才清除。最終測試保留聚焦與 Tab 順序斷言；macOS WebKit 沿用既有測試的 Option-Tab 連結導覽規則。沒有使用固定延遲掩蓋問題。

圖例新測試原先在圖片尚未進入視窗時直接檢查 naturalWidth。Firefox 與 WebKit 的 lazy 圖示尚未請求，因此首次各有 2 案失敗；實際滾入視窗後正常載入。測試改為捲入視窗並等待圖片載入，保留圖片與對比斷言，產品不改為強制預載。

## 範圍

沿用既有 1,032 列資料、型態身份、虛擬化及篩選語意，沒有修改 CSV 原始檔或擴充比較／中文搜尋功能。BOM 接受合法資料；重複主副屬性視為非法輸入，不靜默修正。既有未追蹤盤點文件與證據保留原狀，不混入功能提交。
