# #25 正式環境回歸與 CI

## 執行方式

使用 `.nvmrc` 的 Node.js 24 及 `packageManager` 指定的 Yarn 4.9.4：

```sh
yarn install --immutable
yarn playwright install chromium firefox webkit
yarn test:e2e
```

`yarn test:e2e` 是完整入口：複製目前工作檔、正式建置，再依序跑三瀏覽器的正式資料案例及平均圖 fixture 案例。預設一個 worker，不會使用既有 3000 服務，也不會讀寫根目錄的 `.next`。Git 已追蹤及未忽略的新檔都會納入暫存副本，因此尚未 commit 的功能也會受測；忽略檔（包含本機 `.env`）不會複製。副本透過 symlink 使用已安裝的 `node_modules`，不會在副本重新安裝依賴。

每次執行建立唯一的系統暫存目錄及 `test-results/regression-*`。正式建置只在副本進行，並固定使用副本內的 `data/pokemonCsv.csv`。各階段使用作業系統分配的空閒 localhost port，啟動後會查詢 `/api/pokemon`，核對正式資料的 1,032 筆或 fixture 的 4 筆，才開始測試。每套案例結束就停止它所建立的服務；成功、失敗或一般中斷時清理副本，保留建置與服務 log、測試報告、失敗 screenshot／trace。不要在 runner 複製工作檔的同時修改程式；並行任務應先協調穩定驗收點。

第一套 `catalog` 跑原有正式資料測試，排除 `average-charts.spec.ts`。第二套 `averages` 以獨立程序載入 `tests/e2e/fixtures/navigation.csv`，僅執行平均圖案例；Repository 快取不跨程序，fixture 不會污染正式資料測試。兩套服務共用同一次建置的程式，但各自使用明確 CSV 路徑，不沿用終端的 `POKEMON_DATA_PATH`。

## 局部驗證與外部站點

```sh
# 正式建置後只跑指定 suite／瀏覽器／案例
yarn test:e2e --suite=averages --project=chromium
yarn test:e2e --suite=catalog --project=firefox --grep '返回'

# 可調整並行量；穩定基準與 CI 維持 1
E2E_WORKERS=2 yarn test:e2e

# 明確指定既有站點時，不建置、不啟停它；suite 必須指明其資料集
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3040 yarn test:e2e --suite=catalog
```

直接 `yarn playwright test` 必須提供 `PLAYWRIGHT_BASE_URL`；沒有 URL 時會引導使用隔離 runner，不會偷偷重用開發服務。若直接執行 fixture 案例，另設 `E2E_SUITE=averages`，並確認外部站點使用四筆 fixture。此低階方式不負責建置或服務生命週期。

## 平均圖斷言

四筆 fixture 是 Bulbasaur、Venusaur、Mega Venusaur、Mew；前三筆同時屬於 Grass 和 Poison，Mew 是唯一 Legendary／Psychic。每列型態各算一個樣本。

| 能力 | 四筆總和 / 4   | 排除 Mew 後總和 / 3 |
| ---- | -------------- | ------------------- |
| HP   | 305 / 4 = 76.3 | 205 / 3 = 68.3      |
| 物攻 | 331 / 4 = 82.8 | 231 / 3 = 77.0      |
| 物防 | 355 / 4 = 88.8 | 255 / 3 = 85.0      |
| 特攻 | 387 / 4 = 96.8 | 287 / 3 = 95.7      |
| 特防 | 385 / 4 = 96.3 | 285 / 3 = 95.0      |
| 速度 | 305 / 4 = 76.3 | 205 / 3 = 68.3      |

表中是介面的一位小數顯示值。測試使用以上手算常數，不呼叫正式程式的平均算法取得期待值。桌面 1440×900 與手機 390×844 各驗證六項卡片與雷達點、HP 改特攻後的分組數值／由左至右降序、切換排除傳說後的數值及 Psychic 組消失。直條圖以公開 SVG 的 title、數值標籤和幾何尺寸核對，雷達圖核對六點及有效路徑。

## GitHub Actions

`.github/workflows/regression.yml` 在 push／pull request 執行 Node.js 24、Yarn 4.9.4、`yarn install --immutable`、lint、typecheck、Vitest，安裝三種 Playwright 瀏覽器，再執行完整 `yarn test:e2e`（包含正式 build）。失敗時保留 `test-results/`，含 runner 的 build／server／test log 與 Playwright trace、screenshot、HTML report，保存 14 天。CI 的實際成功／失敗以該 commit 在 GitHub Actions 的執行結果為準。

## 驗證紀錄

2026-09-26，Node.js v24.21.0，本次完成以下局部驗證；所有現有正式資料案例由協調任務執行完整命令後另行記錄。

- `yarn test:e2e --suite=averages`：正式 snapshot build 成功，桌面／手機 × 三瀏覽器的 **18/18** 案例通過。
- 傳說切換的桌面／手機案例在 Chromium 各連續執行三次，**6/6** 通過。此操作等待 server navigation 更新，使用 click 後輪詢 checked 與數值，不要求受控 checkbox 在 click 返回瞬間同步完成。
- 三瀏覽器驗證期間，另啟動一個 HTTP listener 占用 3000；runner 使用自己的 51672 port。3000 listener 前後回傳相同標記，且只收到前後驗證的兩筆請求，沒有 runner／Playwright 流量。
- 根 `.next` 目錄 mtime 及 `tsconfig.json` SHA-256 在 runner 前後一致；本次啟動的 fixture 服務及暫存副本已清理。成功結果保存在 `test-results/regression-BrrhMF/`。
- 初次 targeted 失敗保留了 screenshot、trace.zip、HTML report 及 build／server／test log，確認沒有 retry 時也能取得 trace。
- runner 語法檢查及變更檔案的 ESLint 通過。ESLint 額外排除 `test-results/**` 與 `playwright-report/**`，避免把生成報告的 bundle 當成專案程式掃描。

GitHub Actions 的實際執行狀態需要推送這份 workflow 後確認，本地通過不代替遠端結果。

建置仍需要目前 `next/font/google` 使用的 Google Fonts 網路連線；這是既有正式建置需求。受限執行環境若阻擋字型或瀏覽器程序，應保留其錯誤並在允許的環境重跑，不能視為已通過。新 CSV 若改變資料筆數，需一起更新 runner 的資料來源確認值與正式資料案例。
