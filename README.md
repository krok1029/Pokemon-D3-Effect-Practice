# Pokemon D3 Effect

寶可夢圖鑑與互動資料視覺化網站。透過本機 CSV 查詢個別寶可夢，並用 D3 比較六項基礎能力、各屬性平均值與能力分布。

本文件於 2026-09-26 隨 #21～#25 的導覽、圖表操作及自動回歸補強更新。各項驗收入口與後續工作見 [ROADMAP](ROADMAP.md)。

## 目前功能

| 路徑                     | 功能                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `/chart`                 | 全體能力平均、雷達圖、依屬性比較的直條圖、可選擇兩項能力的散佈圖；可排除傳說寶可夢，框選結果可開啟正確型態的詳細頁 |
| `/pokemon`               | 搜尋與屬性／傳說篩選；每批 24 筆無限捲動，網址可分享條件與目前批次，返回時定位原卡片                               |
| `/pokemon/[id]?form=...` | 指定型態的個別資料、能力條、攻擊／被攻擊雙欄對照與完整屬性倍率                                                     |
| `/`                      | 網站用途、資料範圍與圖鑑／圖表入口，提供桌面及手機導覽                                                             |

散佈圖支援主屬性圖例篩選、拖曳框選、選取結果清單、縮放按鈕與滑鼠中鍵平移。也可用名稱或編號搜尋，再以鍵盤或觸控選取並開啟指定型態；搜尋沿用目前傳說與主屬性條件。同頁切換傳說條件會保留能力軸與主屬性偏好。縮放範圍由元件的 `scaleExtent` 定義，目前是 0.5～4 倍；資料點保持在繪圖區內，滑鼠滾輪縮放刻意停用。

圖鑑與圖表共用搜尋規則：`#025`、`025`、`#25` 精確查詢編號 25，`25` 保留編號部分比對。名稱搜尋不分大小寫，忽略空白、句點與直／彎單引號，因此 `Mr Mime`、`Farfetch’d` 也可找到對應型態；中文名稱仍未提供。

## 快速開始

專案透過 `.nvmrc` 指定 Node.js 24，使用 nvm 時可先執行 `nvm use`。套件管理器指定 Yarn 4.9.4，並透過 `.yarnrc.yml` 使用 `node_modules` 模式。

在專案根目錄執行：

```bash
# 已有 Yarn 4 時可直接安裝；若使用 Corepack 管理 Yarn，可先執行 corepack enable。
yarn install
yarn dev
```

啟動後開啟 [首頁](http://localhost:3000)，或直接前往 [圖表頁](http://localhost:3000/chart)、[圖鑑頁](http://localhost:3000/pokemon)。

| 指令                        | 用途                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `yarn dev`                  | 啟動 Next.js 開發伺服器                                                                         |
| `yarn build` / `yarn start` | 建置／啟動正式環境                                                                              |
| `yarn lint`                 | ESLint 檢查                                                                                     |
| `yarn typecheck`            | TypeScript 型別檢查                                                                             |
| `yarn test`                 | Vitest，一般本機執行時進入監看模式                                                              |
| `yarn test:unit`            | 一次執行目前由 Vitest 探索到的測試                                                              |
| `yarn coverage`             | 執行 Vitest 並產出覆蓋率                                                                        |
| `yarn test:e2e`             | 隔離正式建置後，執行三瀏覽器完整資料與平均圖 fixture 驗收；首次執行需 `yarn playwright install` |

E2E 使用暫存目錄與自動分配的連接埠，不沿用開發服務或根目錄 `.next`，預設單一 worker。結果、失敗截圖與 trace 保留在 `test-results/regression-*`。可用 `yarn test:e2e --suite=catalog` 或 `--suite=averages` 選擇資料集，再追加 Playwright 檔名或 `--project=chromium`。自行設定 `PLAYWRIGHT_BASE_URL` 時，必須指定相符的 suite。GitHub Actions 在 push／PR 執行 lint、型別、單元測試及相同 E2E 流程，失敗時保存 artifacts；細節見 [回歸環境驗收](docs/verification/regression-ci.md)。

## 資料與統計口徑

預設資料為 [data/pokemonCsv.csv](data/pokemonCsv.csv)。目前包含 **1,032 筆資料、898 個圖鑑編號（1～898）**；相同編號可能有 Mega 或地區型態。CSV 標記為傳說的資料有 125 筆，排除後為 907 筆。

- 平均值以每筆 CSV 資料為一個樣本，沒有依圖鑑編號去重。
- 依屬性平均時，雙屬性資料同時參與兩個屬性分組；各組樣本數不可直接加總成物種數。
- 圖鑑的屬性篩選會比對主、副屬性；散佈圖的顏色與圖例篩選只使用主屬性。
- 核心模型目前只載入編號、英文名稱、主副屬性、傳說標記及六項能力。CSV 的世代、特性、身高、體重等欄位尚未提供給頁面。
- 相剋資料來自 ViewModel 內的固定矩陣，沒有使用 CSV 的 `Against ...` 欄位，也沒有納入特性、招式、道具等戰鬥條件。
- 圖片使用 `public/img` 本機資源；圖片檔的涵蓋範圍與 CSV 不完全相同，不代表所有圖檔都有對應資料。
- 圖片依圖鑑編號與 `formId` 的明確對照選取，完整辨識三位及四位編號；沒有專用圖或尚未確認型態的資料顯示缺圖佔位。補入 129 張官方圖片後，目前 1,025 列有對應圖，7 列保留缺圖佔位：Ash-Greninja，以及 Pumpkaboo／Gourgeist 各自的 Small、Large、Super 尺寸。來源與缺圖原因見 [圖片來源清單](data/pokemon-image-sources.json)，補圖驗收見 [官方補圖紀錄](docs/verification/official-image-download.md)。

資料來源由 `ConfigProvider` 決定，優先順序是 `POKEMON_DATA_PATH` → 測試環境的 `data/pokemon_fixture_30.csv` → 預設 CSV。相對路徑以專案執行目錄為基準：

```bash
POKEMON_DATA_PATH=/absolute/path/to/pokemon.csv yarn dev
```

資料首次查詢時讀入 Repository 記憶體快取；目前沒有自動重新載入機制。更新 CSV 或環境變數後，重新啟動服務。

CSV 編號與六項能力必須是安全範圍內的完整十進位整數；非法內容會回報資料筆次與欄位，不會把小數或 `35oops` 截斷成整數。

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

已完成 #16：列表與詳細頁依同一份型態圖片對照選圖；三位與四位編號不衝突，缺圖與請求失敗都有明確提示。新增圖片時需確認型態並更新 `src/app/pokemon/lib/pokemonFormImages.json`。

已完成 #20：散佈圖框選結果可開啟、刷新及分享正確型態的詳細頁，圖例明示依主屬性篩選。跨頁後不保留散佈圖框選及縮放狀態。

後續盤點的 #21～#25 已補上：圖鑑主要導覽重設批次、傳說切換保留分析條件、散佈圖裁切、鍵盤／觸控搜尋選取及隔離 E2E／CI。原始問題與歷史結果見 [現有功能盤點](docs/verification/feature-audit-2026-09-26.md)，修正驗收入口見 [ROADMAP](ROADMAP.md)。下一個候選是定義「2～4 隻寶可夢比較」的最小規格；比較功能目前尚未實作。

第二次盤點後補上散佈圖選取後連續平移、明暗圖表可讀性、跨入口搜尋格式、圖鑑請求逾時與 CSV 整數驗證。圖鑑請求超過 15 秒會保留已載入卡片並提供同批重試；詳見 [平行修正驗收](docs/verification/parallel-fixes-2026-09-26.md)。

- [ROADMAP.md](ROADMAP.md)：待辦優先順序、原因與完成條件。
- [guide.md](guide.md)：資料流程、互動狀態、分層及維護方式。
- [agent.md](agent.md)：供後續維護者與代理快速接手的摘要。

新增比較功能沿用現有 CSV 與穩定型態識別；世代篩選、中文搜尋及資料來源擴充仍保留為後續候選。
