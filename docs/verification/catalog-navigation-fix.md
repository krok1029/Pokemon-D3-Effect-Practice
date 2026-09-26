# #21 圖鑑同路由導覽與批次同步

日期：2026-09-26。

## 修正行為

從 `/pokemon?page=3` 點主要導覽「寶可夢」後，網址與列表一起回到 `/pokemon`、第 1–24 筆及 Bulbasaur，不需要刷新。

`PokemonList` 記錄路由交付的 `initialPage` 物件；收到新的路由資料時增加導覽版本，重建 `PokemonFeed`。捲動使用原有 `replaceState` 更新 `page` 與卡片錨點，不會交付新的路由資料，因此已載入批次與虛擬列表保留。瀏覽器 `popstate` 繼續更新導覽版本，詳細頁返回網址與位置還原沿用既有機制。

新增 Strict Mode 單元案例驗證同條件路由資料由第三批換到第一批時，舊卡片與「載入前 24 筆」會移除，且不產生重複更新。

## 頁面回歸

`tests/e2e/catalog-navigation.spec.ts` 使用真實 CSV 與主要導覽連結，涵蓋：

- 桌面、手機從第三批導覽至第一批，檢查精確範圍、第一張卡片及前批按鈕。
- 從第一批連續載入三批啟用虛擬化，捲到第三批時仍保留第 1–72 筆；點主要導覽後才回第 1–24 筆。
- 第三批導覽至第一批後，瀏覽器上一頁與下一頁分別還原正確批次。

歷史導覽斷言先等待路由過渡後只剩一份列表，再檢查內容，避免 Suspense 切換短暫保留新舊 DOM 時觸發 Playwright 單一元素限制。累積案例使用真實滾輪輸入結束虛擬化轉換的自動位置還原，等目標卡片穩定後捲到第三批；三個瀏覽器均使用同一套操作與精確網址斷言。

## 本機執行結果

使用獨立 `/private/tmp/pokemon-issue21-check` 正式建置與 `127.0.0.1:4121` 服務，不使用或改寫共用工作目錄的 `.next`。建置成功，包含 TypeScript 與建置時 ESLint 檢查。此次隔離快照只用於圖鑑驗收，不代表本批其他票券均已驗收。

| 檢查                                                                            | 結果                                                            |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `PokemonList.test.tsx`、`PokemonPages.test.tsx`、`pokemonListViewModel.test.ts` | 3 檔、12 項通過                                                 |
| 新增 `catalog-navigation.spec.ts`，Chromium、Firefox、WebKit                    | 各 4 項，共 12 項通過                                           |
| 歷史上一頁／下一頁案例單獨重複 3 次，Chromium                                   | 3 次通過                                                        |
| 累積列表導覽案例單獨重複 3 次，WebKit                                           | 3 次通過                                                        |
| 既有 `infinite-scroll.spec.ts`，Chromium                                        | 8 項通過，包括詳細頁連結返回、瀏覽器返回與慢速請求              |
| 既有 `list-virtualization.spec.ts`，Chromium                                    | 4 項通過，包括六批 DOM 上限、手機放大字體、焦點保留與詳細頁定位 |
| 修改的元件與測試 ESLint、Prettier                                               | 通過                                                            |

新增導覽案例已通過三瀏覽器；既有無限捲動與虛擬化案例本次只單獨重跑 Chromium，其餘瀏覽器由本批整合驗收涵蓋。

可重跑命令：

```bash
yarn test:unit tests/app/pokemon/PokemonList.test.tsx tests/app/pokemon/PokemonPages.test.tsx tests/app/pokemon/pokemonListViewModel.test.ts
yarn test:e2e --suite=catalog tests/e2e/catalog-navigation.spec.ts tests/e2e/infinite-scroll.spec.ts tests/e2e/list-virtualization.spec.ts --project=chromium --workers=1
```
