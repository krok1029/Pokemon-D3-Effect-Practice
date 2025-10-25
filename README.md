# Pokemon D3 Effect

互動式 Pokémon 資料視覺化儀表板，結合 Next.js App Router 與 D3.js 呈現 CSV 資料。專案採用精簡版 DDD 分層與 DI 管理，方便擴充與測試。

## 快速開始

### 先決條件
- Node.js 18.18+（Next.js 15 相容版本）
- Yarn 4（專案使用 Plug'n'Play；建議 `corepack enable` 讓 Node 管理 Yarn）

### 安裝與啟動
```bash
corepack enable          # 第一次使用 Yarn 4 時需要
yarn install              # 安裝依賴
yarn dev                  # 啟動開發伺服器，預設 http://localhost:3000
```

## 常用指令
- `yarn dev`：啟動開發模式（熱重載）
- `yarn build` / `yarn start`：建置並啟動正式環境
- `yarn lint`：執行 ESLint 檢查
- `yarn typecheck`：跑 TypeScript 型別檢查
- `yarn test`：執行 Vitest 單元與整合測試
- `yarn test:e2e`：執行 Playwright E2E 測試（首次前需 `npx playwright install`）
- `yarn coverage`：產出測試覆蓋率報告

## 資料夾導覽

```
src
├─ app/                         # Next.js App Router / Presenter 層
│  ├─ (routes)/chart/           # Chart route 的 Server Component + Presenter + ViewModel
│  │  ├─ ChartPage.tsx
│  │  ├─ page.tsx
│  │  ├─ presenter.ts
│  │  └─ view-models/
│  │     └─ averageStatsViewModel.ts
│  ├─ components/               # UI 元件（dashboard / charts / ui）
│  ├─ layout.tsx                # 全域佈局與 ThemeProvider
│  └─ page.tsx, pokemon/ 等頁面
│
├─ core/                        # Application + Domain（DDD 核心）
│  ├─ application/
│  │  ├─ dto/                   # UseCase 輸出 DTO
│  │  └─ useCases/              # Application Service（e.g. GetAveragePokemonStatsUseCase）
│  └─ domain/
│     ├─ entities/              # 聚合根與實體
│     ├─ repositories/          # Domain Port（介面）
│     ├─ services/              # Domain Service（純邏輯）
│     ├─ specifications/        # 查詢條件 / 規範
│     └─ valueObjects/          # 值物件（具不變式）
│
├─ infra/                       # 基礎建設層，連結外部資源
│  ├─ config/                   # 環境設定提供者
│  └─ csv/                      # CSV Repository 與 Mapper
│
├─ di/tokens.ts                 # tsyringe 依賴注入 Token 定義
├─ server/container.ts          # 依賴註冊（Repository、UseCase）
├─ server/factories.ts          # 建立 UseCase 等服務的工廠
├─ server/useCases.ts           # 提供取得 UseCase 的封裝函式
└─ tests/                       # Vitest 測試（domain / infra / integration）
```

## 架構與資料流
- **App layer**：Next.js Server Component/Presenter 層，僅透過 UseCase 取得 DTO，再轉為 View Model 呈現。
- **Application layer**：UseCase 僅依賴 Domain Port，協調流程並回傳 DTO。
- **Domain layer**：實體、值物件、Domain Service 與 Repository Port，不引用任何外部技術。
- **Infra layer**：實作 Domain Port（例如 CSV Repository），負責 Anti-Corruption 映射與環境設定。
- **資料流**：UI / Routes → Presenter → UseCase（core/application）→ Repository Port（core/domain）→ CSV Adapter（infra）→ Domain 實體 → DTO → View Model → UI render。

## CSV 資料來源
- 預設資料：`data/pokemonCsv.csv`
- 測試情境使用：`data/pokemon_fixture_30.csv`
- 自訂資料：設定環境變數 `POKEMON_DATA_PATH=/abs/path/to/your.csv`，系統會在啟動時載入指定檔案。

## 測試與品質保證
- Vitest 用於單元與整合測試，可於 `tests/` 找到對應案例。
- Playwright 覆蓋端到端流程，建議在本機執行前安裝瀏覽器相依（`npx playwright install`）。
- CI 建議串連 `yarn lint`、`yarn typecheck`、`yarn test` 以確保品質。

## 開發筆記
- 專案使用 tsyringe 管理 DI，若新增 repository 或 UseCase，記得在 `src/server/container.ts` 註冊並同步更新 `TOKENS`。
- D3 視覺化元件位於 `src/app/components/charts`；視覺元素與資料載入分離（`sections` vs `cards`）。
- 新增 domain 邏輯時，務必針對 `tests/domain` 或 `tests/integration` 補齊測試以維持覆蓋率。
