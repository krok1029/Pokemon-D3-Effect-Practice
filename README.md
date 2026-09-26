# Pokemon D3 Effect

寶可夢圖鑑與互動資料視覺化網站。透過本機 CSV 查詢個別寶可夢，並用 D3 比較六項基礎能力、各屬性平均值與能力分布。

本文件於 2026-09-19 隨 #19 無限捲動更新。驗收範圍與執行結果見 [第一批紀錄](docs/verification/roadmap-batch-1.md) 與 [#19 紀錄](docs/verification/infinite-scroll.md)。

## 目前功能

| 路徑 | 功能 |
| --- | --- |
| `/chart` | 全體能力平均、雷達圖、依屬性比較的直條圖、可選擇兩項能力的散佈圖；可排除傳說寶可夢 |
| `/pokemon` | 搜尋與屬性／傳說篩選；每批 24 筆無限捲動，網址可分享條件與目前批次，返回時定位原卡片 |
| `/pokemon/[id]?form=...` | 指定型態的個別資料、能力條、攻擊／被攻擊雙欄對照與完整屬性倍率 |
| `/` | 網站用途、資料範圍與圖鑑／圖表入口，提供桌面及手機導覽 |

散佈圖支援主屬性圖例篩選、拖曳框選、選取結果清單、縮放按鈕與滑鼠中鍵平移。縮放範圍由元件的 `scaleExtent` 定義，目前是 0.5～4 倍；滑鼠滾輪縮放刻意停用。

## 快速開始

專案透過 `.nvmrc` 指定 Node.js 24，使用 nvm 時可先執行 `nvm use`。套件管理器指定 Yarn 4.9.4，並透過 `.yarnrc.yml` 使用 `node_modules` 模式。

在專案根目錄執行：

```bash
# 已有 Yarn 4 時可直接安裝；若使用 Corepack 管理 Yarn，可先執行 corepack enable。
yarn install
yarn dev
```

啟動後開啟 [首頁](http://localhost:3000)，或直接前往 [圖表頁](http://localhost:3000/chart)、[圖鑑頁](http://localhost:3000/pokemon)。

| 指令 | 用途 |
| --- | --- |
| `yarn dev` | 啟動 Next.js 開發伺服器 |
| `yarn build` / `yarn start` | 建置／啟動正式環境 |
| `yarn lint` | ESLint 檢查 |
| `yarn typecheck` | TypeScript 型別檢查 |
| `yarn test` | Vitest，一般本機執行時進入監看模式 |
| `yarn test:unit` | 一次執行目前由 Vitest 探索到的測試 |
| `yarn coverage` | 執行 Vitest 並產出覆蓋率 |
| `yarn test:e2e` | Playwright 頁面與網址驗收；首次執行需安裝對應瀏覽器：`yarn playwright install` |

## 資料與統計口徑

預設資料為 [data/pokemonCsv.csv](data/pokemonCsv.csv)。目前包含 **1,032 筆資料、898 個圖鑑編號（1～898）**；相同編號可能有 Mega 或地區型態。CSV 標記為傳說的資料有 125 筆，排除後為 907 筆。

- 平均值以每筆 CSV 資料為一個樣本，沒有依圖鑑編號去重。
- 依屬性平均時，雙屬性資料同時參與兩個屬性分組；各組樣本數不可直接加總成物種數。
- 圖鑑的屬性篩選會比對主、副屬性；散佈圖的顏色與圖例篩選只使用主屬性。
- 核心模型目前只載入編號、英文名稱、主副屬性、傳說標記及六項能力。CSV 的世代、特性、身高、體重等欄位尚未提供給頁面。
- 相剋資料來自 ViewModel 內的固定矩陣，沒有使用 CSV 的 `Against ...` 欄位，也沒有納入特性、招式、道具等戰鬥條件。
- 圖片使用 `public/img` 本機資源；圖片檔的涵蓋範圍與 CSV 不完全相同，不代表所有圖檔都有對應資料。

資料來源由 `ConfigProvider` 決定，優先順序是 `POKEMON_DATA_PATH` → 測試環境的 `data/pokemon_fixture_30.csv` → 預設 CSV。相對路徑以專案執行目錄為基準：

```bash
POKEMON_DATA_PATH=/absolute/path/to/pokemon.csv yarn dev
```

資料首次查詢時讀入 Repository 記憶體快取；目前沒有自動重新載入機制。更新 CSV 或環境變數後，重新啟動服務。

## 技術與架構

目前宣告的主要版本為 Next.js 15.4.6、React 19.1.0、TypeScript 5、D3 7、Tailwind CSS 4、Yarn 4.9.4。介面使用 shadcn/ui、Radix Tooltip 與 next-themes；CSV 使用 csv-parse；依賴注入使用 tsyringe 與 reflect-metadata。精確套件宣告與鎖定結果以 `package.json`、`yarn.lock` 為準。

```text
src/
├── app/                       頁面、Presenter、ViewModel、React / D3 元件
│   ├── (routes)/chart/         統計頁與圖表元件
│   ├── pokemon/               圖鑑列表、詳細頁、圖片查找及相剋 ViewModel
│   └── components/            共用 UI 與 ThemeProvider
├── core/
│   ├── application/           UseCase 與 DTO
│   ├── domain/                實體、值物件、平均計算、Repository 介面
│   └── shared/                目前為 cn 樣式工具，屬待整理的 UI 依賴
├── infra/                     CSV 解析、映射與資料來源設定
├── server/                    DI 組裝與 UseCase 存取入口
└── di/                        DI token
data/                          正式 CSV 與 30 筆測試 fixture
public/                        寶可夢圖片、18 種屬性圖示與其他靜態資源
tests/                         Vitest 案例與共用測試工具
```

頁面透過 Presenter 呼叫 UseCase；UseCase 依賴 Repository 介面，由 CSV 實作供應 Domain 物件，再輸出 DTO。ViewModel 整理中文能力標籤、顏色與顯示格式，最後交由 React / D3 呈現。詳細流程及目前的分層例外見 [開發指南](guide.md)。

## 現況與下一步

Vitest 涵蓋 Domain、UseCase、CSV、DI 及圖鑑頁面；Playwright 以實際頁面驗收倍率、型態網址、首頁／手機導覽與搜尋返回。已修正攻擊免疫／抗性倍率，並完成穩定型態網址及可分享的篩選條件。

已完成 #19：列表只組裝當批卡片，靠近底部自動載入，並保留手動載入與失敗重試；累積超過 48 筆後使用 TanStack Virtual 渲染視窗附近的列。圖片使用固定佔位、按需請求及失敗提示，虛擬列表捲動時延後新圖片請求。

接續工作是圖片對應（#16）與散佈圖詳細頁連結（#20）。目前圖片仍沿用舊有編號索引，Mega 圖片可能與型態不一致。

- [ROADMAP.md](ROADMAP.md)：待辦優先順序、原因與完成條件。
- [guide.md](guide.md)：資料流程、互動狀態、分層及維護方式。
- [agent.md](agent.md)：供後續維護者與代理快速接手的摘要。

接下來先處理資料正確性與瀏覽流程，再考慮增加圖表或資料來源。
