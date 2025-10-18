# Pokemon D3 Effect 開發指南

本指南補充 `README.md`，針對日常開發流程、程式碼分層與測試策略提供更深入的說明，協助新成員快速理解專案運作方式。

## 1. 專案目標與技術棧
- **目標**：以 Next.js App Router 建構互動式 Pokémon 資料儀表板，利用 D3.js 呈現 CSV 資料並維持良好可測性。
- **前端**：Next.js 15、React 19、Tailwind 4、shadcn/ui、D3 7。
- **後端/應用層**：精簡版 DDD（app / core / adapters），以 tsyringe 注入依賴。
- **測試**：Vitest（單元、整合）、Playwright（E2E）。
- **工具**：TypeScript、ESLint、Prettier、Yarn 4（Plug'n'Play）。

## 2. 分層架構與職責
專案採用三層設計以維持關注點分離：

### 2.1 app 層（使用者介面）
- 位置：`src/app`
- 負責 Next.js Route Handlers、Server Components 與 UI 元件。
- Server 功能僅調用 core/application 層 UseCase，不直接操作資料來源。
- UI 元件依用途分為 `dashboard/sections`（資料載入）與 `dashboard/cards`（純呈現），D3 專用於 `components/charts`。

### 2.2 core 層（商業邏輯）
- 位置：`src/core`
- **domain**：定義實體、值物件、介面（例如 `PokemonRepository`）與不變式。
- **application**：實作 UseCase（如 `ListPokemons`、`AverageStats`），僅依賴 domain 介面並回傳 `Result` 型別，以便標準化錯誤處理。
- **shared**：提供共用 util（`result.ts`, `bool.ts` 等）。

### 2.3 adapters 層（基礎建設）
- 位置：`src/adapters`
- 負責外部來源（目前是 CSV 檔案）的實作。例如 `PokemonRepositoryCsv` 將 CSV 解析成 domain 可用的資料模型。
- `adapters/config` 內的 `getPokemonRepository()` 會根據環境返回單例 repository，並透過 tsyringe 的 token 完成依賴注入。

## 3. 資料流與配置
1. UI 或 API Route 呼叫 core/application 的 UseCase。
2. UseCase 透過注入的 `PokemonRepository` 取得資料。
3. Repository 讀取 CSV 並轉換為 domain 定義的資料結構（parse 於 `adapters/csv`）。
4. UseCase 回傳 `Result`，app 層依結果渲染 UI 或錯誤訊息。

### 3.1 CSV 路徑
- 預設使用 `data/pokemonCsv.csv`。
- 測試環境會使用 `data/pokemon_fixture_30.csv`（於 `adapters/config` 內設定）。
- 若需改用其他 CSV，可設定環境變數 `POKEMON_DATA_PATH=/absolute/path/to/file.csv`。

## 4. 依賴注入與設定
- DI token 定義於 `src/di/tokens.ts`。
- `src/adapters/config/index.ts` 建立 repository 實例並註冊至 tsyringe 容器。
- 單元測試或特殊情境可呼叫 `setPokemonRepository()` 以替換實作。
- 若新增新的 repository/adapter，記得更新此設定檔以維持注入一致性。

## 5. UI 與 D3 元件指南
- 所有 UI 元件位於 `src/app/components`，依功能拆分：
  - `dashboard`：儀表板 sections/cards。
  - `charts`：D3 專用元件與輔助工具。
  - `ui`：基於 shadcn/ui 的共用元件。
- 將資料抓取放在 section（Server Component）中，將純展示邏輯放在 card（Client Component 或純函式）內，可有效分離資料責任。
- 建議 chart 元件輸入為明確的資料結構（例如統計值或陣列），避免在元件內直接處理 repository。

## 6. 測試策略
- **單元測試**：`tests/domain`、`tests/application`、`tests/adapters`。透過 Vitest 驗證純函式與 UseCase 行為。
- **整合測試**：`tests/integration`。從 UseCase 到 CSV 實作驗證實際資料讀取流程。
- **E2E 測試**：`tests/e2e`。使用 Playwright 驗證主要使用者流程（例如首頁是否正確渲染卡片）。
- 常用指令：
  - `yarn test`：執行所有 Vitest 測試。
  - `yarn coverage`：輸出覆蓋率。
  - `yarn test:e2e`：執行 Playwright 測試（首次需 `npx playwright install` 安裝瀏覽器）。

## 7. 開發流程建議
1. 啟用 Yarn（一次性）：`corepack enable`。
2. 安裝依賴：`yarn install`。
3. 啟動開發伺服器：`yarn dev`（預設 http://localhost:3000）。
4. 開發時善用 `yarn lint`、`yarn typecheck` 確保品質。
5. 若修改資料或 UseCase，記得更新對應測試。

## 8. 擴充範例
### 8.1 新增 UseCase
1. 在 `src/core/application/...` 新增 UseCase，依需求調用 domain 介面並回傳 `Result`。
2. 若需對 CSV 讀取做調整，擴充 `src/adapters/repo/PokemonRepositoryCsv.ts` 或新增新的 repository。
3. 建立對應單元測試（application、domain），必要時補充整合測試。
4. 在 app 層的 Server Component 中注入新的 UseCase 以呈現資料。

### 8.2 新增圖表或卡片
1. 新增資料讀取 section，於其中呼叫 UseCase。
2. 將資料透過 props 傳入新的 card/chart 元件。
3. chart 元件放在 `src/app/components/charts`，善用 TypeScript 型別描述資料輸入。
4. 補充 Playwright 測試以驗證 UI 行為。

## 9. 文件與待辦事項
- 長期建議：
  - 收集截圖或動態 GIF 至 `README.md`/`guide.md`，便於快速展示成果。
  - 擴充 `tests/e2e/`，涵蓋過濾、詳細頁等核心互動。
  - 若有部署需求，可新增 CI/CD 腳本與容器化設定。

此指南將隨著專案演進更新，若發現內容過時請於 PR 中同步調整。
