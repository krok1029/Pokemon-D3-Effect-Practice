# #16 圖片與型態對應驗收

驗收日期：2026-09-26。基準 HEAD：`37fe979`。本次沒有新增 CSV 資料或下載圖片。

## 規格與依賴

已讀取 [#16](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/16) 完整內容及 comments（無留言）；GitHub native `dependencies/blocked_by` 回傳 #15，狀態為 closed / completed。一般網路 sandbox 最初無法連線，經授權的 `gh` 讀取成功，沒有遠端規格缺漏。

## 資源盤點

| 項目             | 結果                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------- |
| CSV              | 1,032 列型態，898 個編號，範圍 #1–898                                                       |
| `public/img`     | 1,008 張 PNG，1,007 個編號，#1–1008 中缺 #7；另有忽略的 `.DS_Store`                         |
| 同編號多圖片     | 僅 #19，一般與阿羅拉小拉達各一張                                                            |
| 四位數圖片       | #1000–1008；不能截成 #100 霹靂電球                                                          |
| 只有圖片而無 CSV | #899–1008，共 110 個編號；仍不會出現在圖鑑資料中                                            |
| 明確型態對照     | 896 筆 `id:formId → basename`，其中包含阿羅拉小拉達                                         |
| 未對照型態       | 136 列，顯示「無圖片／尚無此型態對應圖檔」                                                  |
| Mega             | 48 列均沒有專用圖片，包括 Mega Charizard X / Y                                              |
| 地區型態         | 18 列 Alolan 僅 Rattata 有專圖；20 列 Galarian 均無專圖                                     |
| 尺寸無法確認     | #710 Pumpkaboo、#711 Gourgeist 各四種尺寸，既有單張圖缺乏比例與來源依據，八列均保留缺圖提示 |

`pokemonFormImages.json` 是完整的已確認型態資源清單；檔名中文僅作為本機資源位置，不作正式名稱翻譯。主要特殊型態經目視審核如下，其他一般物種保留原有單張圖：

| 編號            | 對應型態 / 圖像依據                                                 |
| --------------- | ------------------------------------------------------------------- |
| 19              | `rattata` 紫色一般鼠；`alolan-rattata` 黑色阿羅拉鼠                 |
| 386             | `deoxys-normal-form`，一般型態                                      |
| 413             | `wormadam-plant-cloak`，綠色草木蓑衣                                |
| 479             | `rotom`，一般洛托姆                                                 |
| 487 / 492       | `giratina` 別種形態；`shaymin` 陸上形態                             |
| 555             | `darmanitan`，一般火屬性形態                                        |
| 641 / 642 / 645 | `tornadus` / `thundurus` / `landorus`，化身形態                     |
| 646 / 648 / 658 | `kyurem` 一般；`meloetta` 歌聲；`greninja` 一般                     |
| 681             | `aegislash-shield-form`，盾擋正面                                   |
| 718 / 719 / 720 | `zygarde` 50%；`diancie` 一般非 Mega；`hoopa` 懲戒                  |
| 741 / 745 / 746 | `oricorio-baile-style` 紅色熱辣；`lycanroc` 白晝；`wishiwashi` 單獨 |
| 774 / 800 / 875 | `minior-meteor-form` 岩石外殼；`necrozma` 一般；`eiscue` 冰面       |
| 888 / 889       | `zacian` 未持劍；`zamazenta` 未持盾                                 |
| 892             | `urshifu-single-strike-style`，一擊流單拳架式                       |
| 898             | `calyrex`，一般非騎乘                                               |

CSV #719 第一列是 Mega Diancie、#892 第一列是 Rapid Strike；都沒有用列順序推論圖片身份。

## 實作契約與維護

- `pokemonImages.ts` 完整解析三位或四位編號，要求 `_` 或 `-` 分隔符及支援的圖片副檔名（png / jpg / jpeg / webp / avif），忽略資料夾及不符合規格的檔名。
- 資料夾索引以編號保存所有檔名，不依賴 `readdir` 列舉順序；指定型態時只接受 manifest 中同編號的精確檔名，實際缺檔即回傳 null。
- 列表及詳細頁共同使用 `buildPokemonCardViewModel`，以既有 `formId` 查找。未知或未確認型態顯示佔位，不借用一般圖片。保留舊版未傳 formId 的函式呼叫：該編號恰好一張圖才回傳，多張則 null；頁面不使用此相容分支。
- 缺圖時保留名稱、型態連結、能力及屬性；列表與詳細頁均明示缺圖。圖片 HTTP 請求失敗時顯示「圖片暫無法載入」，詳細相剋區也採相同降級。
- 圖片 manifest 只由伺服器端 ViewModel 讀取，沒有傳到卡片 client bundle。列表的 96px 固定空間、IntersectionObserver、priority、defer 與虛擬化未更動。
- 新增或更換圖片時，先確認實際圖像型態，將 CSV 穩定的 `編號:formId` 及完整 basename 加入 `src/app/pokemon/lib/pokemonFormImages.json`；不能只放檔案就推定已完成型態對應。刪除或改名時同步維護清單。圖片索引以程序為範圍快取，變動後需重新啟動服務。
- 完整映射驗證會檢查每個已維護 key 仍對應實際 CSV 身份與存在的同編號圖檔。資料重排不改變 key。

## 實際驗收

環境：Node 24.21.0、Next.js 15.4.6、既有 node_modules。使用專案共用 `.next`，以正式 `next build` / `next start --hostname 127.0.0.1 --port 3016` 驗收。伺服器由本次 #16 啟動，結束時自行停止並通知 #20 釋放資源。

| 檢查                                                                                                  | 結果                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `next build`（含型別與 lint）                                                                         | 通過                                                                                                  |
| `eslint src/app/pokemon tests/app/pokemon/pokemonImages.test.ts tests/e2e/image-form-mapping.spec.ts` | 通過                                                                                                  |
| `vitest run tests/app/pokemon`                                                                        | 7 個檔案、當時 27 tests 通過；補充完整 manifest / 資料夾案例後圖片檔單獨重跑 12 tests 通過（原為 10） |
| Chromium：圖片型態 + list-images + infinite-scroll + list-virtualization                              | 21 tests 通過                                                                                         |
| Firefox / WebKit：圖片型態 + list-images                                                              | 18 tests 通過（每個瀏覽器 9 項）                                                                      |
| 桌面及 375px 手機畫面                                                                                 | 目視確認噴火龍缺圖提示、Mega 詳細頁、一般與阿羅拉小拉達卡片                                           |

新增 `tests/e2e/image-form-mapping.spec.ts` 覆蓋一般噴火龍、一般／阿羅拉小拉達的卡片到詳細頁圖像一致性、真實圖片成功解碼、Mega X／Y 缺圖、Squirtle 實際缺檔、詳細頁 HTTP 圖片失敗。既有圖片慢速載入、固定佔位、首屏請求數、捲動載入、144 筆虛擬列表、手機文字放大、焦點保留及返回定位案例未刪改。

`pokemonImages.test.ts` 覆蓋 #100 / #1000 / #1001、分隔符、反向檔案順序、一般與地區型態、未知型態、缺圖、缺少對照檔、非圖片項目、資料夾、讀取 EACCES，以及全部 manifest 的 CSV 身份與實體圖檔完整性。

## 限制

目前 136 列缺圖／未確認型態採佔位，本次未製作 Mega 或地區型態新素材。#710 / #711 需取得能辨識尺寸的來源後再補映射。無限捲動／虛擬化全套本次在 Chromium 驗收；Firefox / WebKit 驗收圖片專屬及延遲載入案例。沒有自動提交、推送、更新根目錄文件或修改 CSV。
