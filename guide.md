# Pokemon D3 Effect 開發指南

本指南補充 `README.md`，針對日常開發流程、程式碼分層與測試策略提供更深入的說明，協助新成員快速理解專案運作方式。

## 1. 專案目標與技術棧
- **目標**：以 Next.js App Router 建構互動式 Pokémon 資料儀表板，利用 D3.js 呈現 CSV 資料並維持良好可測性。
- **前端**：Next.js 15、React 19、Tailwind 4、shadcn/ui、D3 7。
- **後端/應用層**：精簡版 DDD（app / core / infra），以 tsyringe 注入依賴。
- **測試**：Vitest（單元、整合）、Playwright（E2E）。
- **工具**：TypeScript、ESLint、Prettier、Yarn 4（Plug'n'Play）。

## 2. 分層架構與職責
專案採用三層設計以維持關注點分離：

### 2.1 App 層（Presenter + UI）
- 位置：`src/app`
- `app/(routes)/chart/` 等資料夾包含 Next.js Route（`page.tsx`）、Server Component（`ChartPage.tsx`）、Presenter（`presenter.ts`）與 View Model（`view-models/`）。
- Presenter 專責呼叫 UseCase 並組裝 View Model；Server Component 僅消費 Presenter 輸出，不直接碰觸 Repository。
- 共用 UI 元件與圖表仍集中於 `components/`，遵循「資料載入與呈現分離」原則。

### 2.2 Core 層（Application + Domain）
- 位置：`src/core`
- **application**：`application/useCases/` 收納 UseCase（如 `GetAveragePokemonStatsUseCase`），回傳定義於 `application/dto/` 的 DTO，僅依賴 Domain Port。
- **domain**：由 `entities/`、`valueObjects/`、`repositories/`（Port）、`services/`（Domain Service，例如 `StatsAverager`）、`specifications/` 組成，不得依賴 Infra/App。
- Core 層是純 TypeScript 模組，可單獨被測試，亦能在未來替換資料來源或框架時重複使用。

### 2.3 Infra 層（基礎建設）
- 位置：`src/infra`
- `csv/` 內提供 `CsvPokemonRepository` 與 `CsvPokemonMapper`，作為 Domain Port 的具體實作與 Anti-Corruption Layer。
- `config/ConfigProvider.ts` 統一輸出環境設定（如 `POKEMON_DATA_PATH`），避免各層直接讀取 `process.env`。
- 所有外部整合（API、DB、CSV）皆應在此層實作並於 `server/container.ts` 註冊。

## 3. 資料流與配置
1. Next.js Route 的 Server Component 透過 Presenter 呼叫 UseCase。
2. UseCase 透過 Domain Port (`PokemonRepository`) 取得資料，並使用 Domain Service (`StatsAverager`) 計算平均，最終回傳 DTO。
3. Infra 層的 Repository 讀取 CSV（`readCsv`），經 `CsvPokemonMapper` 轉成 Domain 實體後回傳。
4. Presenter 將 DTO 組裝成 View Model，再交由 Server Component / UI 元件渲染。

### 3.1 CSV 路徑
- 預設使用 `data/pokemonCsv.csv`。
- 測試環境會使用 `data/pokemon_fixture_30.csv`（由 `ConfigProvider` 提供）。
- 若需改用其他 CSV，可設定環境變數 `POKEMON_DATA_PATH=/absolute/path/to/file.csv`。

## 4. 依賴注入與設定
- DI token 定義於 `src/di/tokens.ts`，包含 Repository、UseCase、Domain Service、設定值等。
- `src/server/container.ts` 撰寫組成根（Composition Root），註冊 `ConfigProvider`、`CsvPokemonRepository`、`StatsAverager` 與各 UseCase。
- `src/server/useCases.ts`、`src/server/pokemonRepository.ts` 封裝 `container.resolve`，提供 App 層安全取得實例。
- 新增 Repository / UseCase 時，請同步更新 `TOKENS` 與 container 註冊邏輯。

## 5. UI 與 D3 元件指南
- 所有 UI 元件位於 `src/app/components`，依功能拆分：
  - `dashboard`：儀表板 sections/cards。
  - `charts`：D3 專用元件與輔助工具。
  - `ui`：基於 shadcn/ui 的共用元件。
- 將資料抓取放在 section（Server Component）中，將純展示邏輯放在 card（Client Component 或純函式）內，可有效分離資料責任。
- 建議 chart 元件輸入為明確的資料結構（例如統計值或陣列），避免在元件內直接處理 repository。

## 6. 測試策略
- **單元測試**：`tests/domain`、`tests/application`、`tests/infra`。透過 Vitest 驗證純函式與 UseCase 行為。
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
1. 在 `src/core/application/useCases/` 新增 UseCase，依需求調用 Domain Port 並回傳 DTO。
2. 若需對 CSV 讀取做調整，擴充 `src/infra/csv/CsvPokemonRepository.ts` 或新增新的 Adapter。
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
