# 平均圖表明暗主題修正驗收

日期：2026-09-26。

## 問題與修正

平均直條圖與雷達圖原先讀取 CSS 自訂色值後交給 `d3.color`。目前主題使用 OKLCH，D3 無法解析而回傳 `null`，因此兩圖使用固定 fallback；直條圖的數值在暗色卡片上幾乎不可見，雷達標籤也未達一般文字的 4.5:1 對比。顏色在 effect 執行時轉成固定 RGB，主題切換亦不會自動重新套色。

兩個元件改讓 SVG 的 `fill`／`stroke` 直接使用 `var(--foreground)`、`var(--muted-foreground)`、`var(--primary)`、`var(--border)`。透明度獨立設定為 `fill-opacity`／`stroke-opacity`，保留原本的層次設定；瀏覽器負責解析 OKLCH 及更新主題，不新增 React 主題狀態或重建圖形。

## 回歸測試

新增 `tests/e2e/chart-theme.spec.ts`，以完整 CSV 及實際 `/chart` 頁面驗證：

- 兩圖初次進入暗色模式時，每個 SVG 文字對實際卡片背景至少有 4.5:1 對比。
- 同頁由系統明色切至暗色、再回明色時，文字色確實改變並保持足夠對比，顯示文字與數值不變。
- 透過瀏覽器 canvas 將實際 computed fill 與背景色轉成 sRGB，再計算相對亮度與對比；不以 DOM 存在或原始 CSS 字串代替可讀性驗收。
- 每例將實測顏色及對比保存為 Playwright 報告附件。

修正前執行 `yarn test:e2e --suite=catalog chart-theme.spec.ts --project=chromium`，4 項全數因暗色對比不足失敗。直條圖最低為 **1.001:1**，雷達圖為 **3.688:1**。紀錄位於 `test-results/regression-kSvcAX/catalog.log`。

修正後執行 `yarn test:e2e --suite=catalog chart-theme.spec.ts`，Chromium、Firefox、WebKit 共 **12 項全數通過**。紀錄位於 `test-results/regression-Fs44dI/catalog.log`，附件在同目錄的 `catalog/report/index.html`。

| 文字 | 明色實測對比 | 暗色實測對比 |
| --- | ---: | ---: |
| 直條圖數值 | 20.157:1 | 17.042:1 |
| 直條圖座標刻度 | 4.764:1 | 6.779:1 |
| 雷達圖能力標籤 | 4.764:1 | 6.779:1 |

三種瀏覽器的量測結果一致。暗色數值解析為 `rgb(248, 250, 252)`；暗色次要文字為 `rgb(144, 161, 185)`。

相關兩個元件及新增測試的 ESLint、`git diff --check` 通過。測試皆透過既有隔離 runner 建立暫存正式版，未使用根 `.next` 或既有開發服務。首次受限網路執行因既有 Google Fonts 無法下載而停在建置；取得工具沙箱核准後重新執行，完成上述 red／green 驗證。
