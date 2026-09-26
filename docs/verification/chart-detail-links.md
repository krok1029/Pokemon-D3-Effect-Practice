# #20 散佈圖型態詳細頁連結驗收

日期：2026-09-26。

## 規格與範圍

已讀取 [#20](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/20) 本文、comments 與 GitHub native `dependencies/blocked_by`；唯一前置 #15 已關閉。驗收使用真實 `data/pokemonCsv.csv`。

- 既有 UseCase 已輸出 `formId`，本次補上 Chart ViewModel 的 `formId` 與 `detailHref`，不修改 DTO、UseCase 或型態網址契約。
- 框選身份與結果 React key 使用圖鑑編號加 formId；舊 DTO 未帶 formId 時沿用既有 `createPokemonFormId(name)` 相容規則。
- 每筆框選結果的名稱為原生連結，網址為 `/pokemon/[id]?form=...`，可鍵盤聚焦、Enter 開啟、複製與分享。連結停用預取，避免大量框選觸發所有詳細頁載入。
- 主副屬性的文字與圖示沿用圖鑑已共用的 chart helpers。名稱與六項能力直接來自同筆 DTO。
- 圖例標示「主屬性篩選」，並說明圖鑑會比對主副屬性。
- 本次沒有要求保留跨頁的框選／縮放狀態；沒有修改 pokemon 頁面或圖片模組、共用設定、根目錄說明或既有 `.nvmrc`。

## 自動驗收

- `yarn test:unit`：最終 21 個檔案、62 個案例通過（包含本票 2 個及 #16 的圖片測試）。
- `yarn tsc -p tsconfig.json --noEmit --incremental false`：通過。
- 本票 4 個 TypeScript 檔案的 ESLint：通過。
- `tests/app/chart/pokemonStatsMatrixViewModel.test.ts`：明示 formId 優先、query encoding、舊 DTO 相容及資料重排下的不同型態目的地。
- `tests/e2e/chart-detail-links.spec.ts`：測試以可存取名稱找到散佈圖，再用實際滑鼠框選可見區域，不查詢 D3 私有節點或綁定資料。

## 三種噴火龍的核對資料

| 型態 | 網址 | 屬性 | HP / 物攻 / 物防 / 特攻 / 特防 / 速度 |
| --- | --- | --- | --- |
| Charizard | `/pokemon/6?form=charizard` | 火、飛行 | 78 / 84 / 78 / 109 / 85 / 100 |
| Mega Charizard X | `/pokemon/6?form=mega-charizard-x` | 火、龍 | 78 / 130 / 111 / 130 / 85 / 100 |
| Mega Charizard Y | `/pokemon/6?form=mega-charizard-y` | 火、飛行 | 78 / 104 / 78 / 159 / 115 / 100 |

## 建置與瀏覽器驗收

- #16 明確釋放 `.next` 後，本票執行 `yarn build` 通過，包含 Next.js lint 與型別檢查。
- 使用 `yarn start --hostname 127.0.0.1 --port 3020` 的正式伺服器及真實 CSV。
- 執行環境 Node 24.21.0、Yarn 4.9.4；瀏覽器命令為 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 yarn test:e2e tests/e2e/chart-detail-links.spec.ts --workers=1`。
- Chromium／Firefox／WebKit 各 8 個流程通過，最終 **24／24 通過**（約 1.6 分鐘）。
- 每種噴火龍均驗證框選結果的名稱、屬性、六項能力、明確 form href、鍵盤 focus／Enter、詳細頁 metadata title、重新整理與另一分頁分享網址。
- 互動回歸涵蓋主屬性篩選、重設、X／Y 換軸、空選取提示、縮放、中鍵平移與排除傳說。
- 跨瀏覽器測試揭露既有 Firefox 中鍵平移問題：未阻止 `mousedown` 預設行為時，頁面由 scrollY 1880 跳到 0，D3 將頁面捲動算入平移後導致重框選 0 筆。最小腳本在手勢開始時 `preventDefault()` 後頁面位置不變，能重新框選 1,008 筆；圖表採用此最小修正，原回歸斷言保留。修正後重新 build 通過，Firefox 原案例連續 3 次通過。
- 傳說勾選框是等待 server navigation 才更新的受控元件。初次案例的 `.check()` 在伺服器回應前檢查同步勾選狀態而失敗；改為真實 `.click()` 並等待網址、`toBeChecked()` 與重新啟用後驗證資料，單一案例連續 3 次通過。未變更元件行為或弱化預期。
- 首次本機服務／瀏覽器啟動受 sandbox 限制，取得工具執行權限後正常驗收。
- 實際檢視 1440 px 桌面及 390 px 手機截圖，名稱連結、焦點輪廓、主副屬性圖示與能力值排列正常。

## 限制與交付狀態

本票不持久化跨頁的框選或縮放，也不新增手機觸控框選。圖片與專用型態圖資由 #16 處理；即使 Mega 型態沒有專用圖片，連結仍顯示正確名稱、屬性與能力。驗收後已停止本任務啟動的伺服器並釋放 `.next`。沒有提交、推送或修改 GitHub issue 狀態。
