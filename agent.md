# Agent Briefing

## 任務概述
- 目標：打造互動式 Pokémon 資料儀表板，透過 D3 呈現 CSV 資料，並維持良好可測性與擴充性。
- 原則：UI 層僅負責呈現與簡單轉接；商業邏輯收斂在 core；所有外部資源透過 adapters 實作並由 DI 管理。

## 技術棧
- 前端：Next.js 15（App Router）、React 19、Tailwind CSS 4、shadcn/ui、D3 v7、Radix Tooltip。
- 語言與工具：TypeScript 5、Yarn 4 Plug’n’Play、ESLint 9、Prettier 3。
- 測試：Vitest（單元/整合，jsdom 環境）、Playwright（E2E，多瀏覽器）。
- 依賴注入：tsyringe + reflect-metadata，token 定義於 `src/di/tokens.ts`。

## 分層架構
- `src/app`（App 層）：Next.js Route Handlers、Server/Client Components。禁止直接操作資料來源，所有資料透過 UseCase 取得。
- `src/core`（Core 層）：
  - `domain`：實體、值物件、`PokemonRepository` 介面、領域錯誤。
  - `application`：UseCase（如 `ListPokemons`），負責解析輸入、調用 Repository、回傳 `Result<ServiceError, Payload>`。
  - `shared`：通用工具（`result.ts`, `bool.ts` 等）。
- `src/adapters`（Adapters 層）：具體連接外部資源，目前以 CSV 檔案為資料來源。`repo/` 提供 `PokemonRepositoryCsv`，`csv/` 內含解析與轉換工具，`config/index.ts` 組裝 DI。

## 資料流與設定
1. UI 或 API Route 解析參數並呼叫核心 UseCase（例如 `ListPokemons`）。
2. UseCase 依賴 `PokemonRepository` 介面向 adapters 取得資料。
3. Repository 透過 `CsvService.readCsv` 讀取檔案，經 `parsePokemonCsv` → `toPokemon` 轉成 domain 資料。
4. UseCase 回傳 Result；App 層據此渲染成功或錯誤回應。
- CSV 路徑：預設 `data/pokemonCsv.csv`，測試環境自動切至 `data/pokemon_fixture_30.csv`。可透過環境變數 `POKEMON_DATA_PATH` 指向自訂檔案（會以 `process.cwd()` 為基準解析絕對路徑）。

## 依賴注入
- `createPokemonRepository()` 建立新的 CSV 實作；`getPokemonRepository()` 取得目前單例。
- `setPokemonRepository()` 可於測試或特殊情境替換實作並同步更新容器。
- 匯入 `@/adapters/config` 會在模組初始化時完成預設註冊，確保 app 層可直接透過 tsyringe 取得 Repository。

## UI 與 D3 注意事項
- Server Components（例如 dashboard sections）負責資料抓取；純展示邏輯放在 Client Components 或 `components/charts`。
- D3 元件需保持輸入資料結構明確，例如 `RadarChart` 接收 `labels`、`values` 等已整理好的資料。
- 樣式透過 Tailwind 4 + 自訂 theme token。暗色模式由 `ThemeProvider` 管理。

## 測試策略
- 單元/整合測試：`yarn test`（Vitest）。重點覆蓋 UseCase、CSV 解析與 Repository 的過濾/排序行為。
- E2E：`yarn test:e2e`（Playwright）。首次需 `npx playwright install` 安裝瀏覽器。
- 覆蓋率：`yarn coverage`。
- 測試共用設定位於 `tests/setup.ts`，Vitest 使用 jsdom 環境。

## 開發流程建議
1. 第一次使用時執行 `corepack enable`。
2. 安裝依賴 `yarn install`（P'n'P 模式）。
3. 啟動開發伺服器 `yarn dev`（http://localhost:3000）。
4. 日常維護請搭配 `yarn lint`、`yarn typecheck`；提交前至少跑一次 `yarn test`。
5. 若調整 CSV 結構或新增 UseCase，務必補齊對應測試與文件。

## 風險與待辦
- 擴充 E2E 測試以涵蓋篩選、詳細頁等關鍵互動。
- 更新文件與行銷素材（範例截圖、GIF）以提升專案可見度。
- 若日後導入其他資料源（API/DB），需在 adapters 層新增實作並調整 DI 組態。

