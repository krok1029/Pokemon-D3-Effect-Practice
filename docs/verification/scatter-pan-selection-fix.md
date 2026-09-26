# 散佈圖選取後連續平移修正

日期：2026-09-26。範圍為第二次功能盤點發現的「已選取後平移，畫面與框選座標不同步」，原始碼基準為 `dc79279`。

## 原因與修正

原本整個 D3 繪圖 effect 依賴 `selectedPokemonKeys`。中鍵平移第一個事件清空選取後，React 重建 SVG 子節點；尚未結束的手勢仍透過閉包更新舊資料點，畫面停止移動，實際框選座標卻持續改變。

現在將透明度、描邊等選取樣式拆成獨立 effect，只更新既有資料點。資料、能力軸改變時仍重建圖表；搜尋選取、框選與平移清空選取不會重建手勢正在操作的節點。使用者框選結束後明確清除矩形，保留原本只留下高亮與結果清單的行為；程式清除矩形不再清空已選結果。

## 回歸案例

`tests/e2e/scatter-pan-selection.spec.ts` 使用正式完整 CSV，分別從搜尋與滑鼠框選選取 Bulbasaur：

1. 確認選取清單連到 `/pokemon/1?form=bulbasaur`，資料點高亮且沒有殘留框選矩形。
2. 中鍵移動 20px，等待選取被清空，再於同一手勢內繼續到 40px、80px、120px。
3. 每段都驗證畫面上資料點的實際位置跟隨滑鼠，沒有只停在第一段。
4. 在畫面可見的點重新框選，確認仍選到 Bulbasaur、正確型態連結與高亮樣式。

原始碼先執行：

```bash
yarn test:e2e --suite=catalog scatter-pan-selection.spec.ts --project=chromium --grep='search'
```

結果為預期失敗：拖到 120px 時資料點僅移動 `20.000030517578125px`，重新框選後缺少 Bulbasaur。紀錄位於 `test-results/regression-PcT5m2/catalog.log`，並保存失敗截圖與 trace。

## 修正後驗證

```bash
yarn test:e2e --suite=catalog scatter-pan-selection.spec.ts chart-clipping.spec.ts chart-accessibility.spec.ts --repeat-each=3
yarn eslint 'src/app/(routes)/chart/components/StatScatterMatrix.tsx' tests/e2e/scatter-pan-selection.spec.ts
yarn tsc --noEmit --incremental false
```

- Chromium、Firefox、WebKit 各重複三次，**63 項通過**，包含 18 次新增的連續平移案例與既有裁切、縮放、鍵盤／觸控選取及型態連結驗證。
- ESLint、TypeScript 及指定檔案的 `git diff --check` 通過。
- 定稿 E2E 結果位於 `test-results/regression-dhKutG/catalog.log`；截圖與報告位於該目錄的 `catalog/`。

所有 E2E 均由既有隔離 runner 建置暫存專案，不使用根目錄 `.next` 或既有開發服務。首次 sandbox 建置因 `fonts.googleapis.com` DNS 解析失敗，經允許網路的相同指令重跑後成功建置。本文件記錄此修正的定向驗證，未宣稱全套 E2E 已重跑。
