# Geist 字型套用驗收

日期：2026-09-27。

## 修正

`src/app/layout.tsx` 改用 `geistSans.variable` 與 `geistMono.variable` 產生 body class，並加上 `font-sans`。這讓既有 Tailwind `--font-sans`／`--font-mono` 設定取得正確的 CSS 字型變數，body 實際使用 Geist；不再將 `next/font` 物件轉成 `[object Object]`。

維持既有 Next.js 15.4.6、字型載入方式與 Latin 子集。Geist 未涵蓋的中文字仍使用瀏覽器後備字型；未另行新增字型資源或依賴。

## 定向回歸

`tests/e2e/font-loading.spec.ts` 等待真實頁面的 `document.fonts.ready`，驗證：

- body class 沒有 `[object Object]`。
- Sans 與 Mono CSS 變數分別包含 Geist 與 Geist Mono。
- body 的 computed font-family 與 Sans 變數一致。
- 首選字族出現在 `document.fonts` 中，且狀態為 `loaded`。

重現命令：

```bash
yarn test:e2e --suite=catalog font-loading.spec.ts --project=chromium
```

本次修改檔案的 ESLint 檢查已通過。修正前的獨立正式版服務（HEAD `29c7380`）以此新測試驗證，因 body class 含 `[object Object]` 而失敗（`test-results/regression-Vj8K8n/catalog.log`）。

修正後的隔離正式服務中，Sans 變數為 `"Geist","Geist Fallback"`，computed family 為 `Geist, "Geist Fallback"`，已載入的字族包含 `Geist`。第一次完整回歸的字串斷言未正規化逗號後空白，因此失敗；trace 證實字型已正確生效。測試改為分割字族、去除引號與首尾空白後比對完整陣列，並保留首選字族已載入的斷言。

修正版測試對相同隔離正式服務重跑 Chromium、Firefox、WebKit，**3／3 通過**（`test-results/regression-Tx5HBD/catalog.log`）。此修正僅調整測試的 CSS 序列化比較，未再變更產品程式。

初次沙箱內正式建置因無法解析 `fonts.googleapis.com` 而未進入測試；此為環境限制，不能當成字型修正通過或失敗的證據。
