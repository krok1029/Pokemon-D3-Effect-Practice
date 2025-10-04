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
├─ app/                         # Next.js App Router 與所有 UI 元件
│  ├─ api/pokemon/              # Route Handlers，呼叫 UseCase 後回傳 JSON
│  ├─ components/               # UI 元件（dashboard / charts / ui）
│  ├─ layout.tsx                # 全域佈局與 ThemeProvider
│  └─ page.tsx, chart/, pokemon/ 等頁面
│
├─ core/                        # Domain + Application + Shared
│  ├─ domain/                   # 實體、值物件、Repository 介面、不變式
│  ├─ application/              # UseCase，回傳 Result，僅依賴 domain 介面
│  └─ shared/                   # 共用函式（結果型別、工具等）
│
├─ adapters/                    # 基礎建設層，連結外部資源
│  ├─ config/                   # DI 組態與 repository 工廠
│  ├─ csv/                      # CSV 解析與資料轉換
│  └─ repo/                     # PokemonRepository 具體實作
│
├─ di/tokens.ts                 # tsyringe 依賴注入 Token 定義
└─ tests/                       # Vitest 測試（domain / adapters / integration）
```

## 架構與資料流
- **app layer**：Next.js 介面層（Server Components、Route Handlers），僅透過 UseCase 存取商業邏輯。
- **core layer**：`domain` 定義模型與介面，`application` 封裝 UseCase，`shared` 放置通用工具與 Result 型別。
- **adapters layer**：處理 CSV 存取與外部整合，提供 `PokemonRepository` 實作並注入容器。
- **資料流**：UI / Routes → UseCase（core/application）→ Repository 介面（core/domain）→ CSV 實作（adapters）→ DTO → UI render。

## CSV 資料來源
- 預設資料：`data/pokemonCsv.csv`
- 測試情境使用：`data/pokemon_fixture_30.csv`
- 自訂資料：設定環境變數 `POKEMON_DATA_PATH=/abs/path/to/your.csv`，系統會在啟動時載入指定檔案。

## 測試與品質保證
- Vitest 用於單元與整合測試，可於 `tests/` 找到對應案例。
- Playwright 覆蓋端到端流程，建議在本機執行前安裝瀏覽器相依（`npx playwright install`）。
- CI 建議串連 `yarn lint`、`yarn typecheck`、`yarn test` 以確保品質。

## 開發筆記
- 專案使用 tsyringe 管理 DI，若新增 repository/adapter，記得在 `src/adapters/config` 中註冊。
- D3 視覺化元件位於 `src/app/components/charts`；視覺元素與資料載入分離（`sections` vs `cards`）。
- 新增 domain 邏輯時，務必針對 `tests/domain` 或 `tests/integration` 補齊測試以維持覆蓋率。
