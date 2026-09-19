# App 層

負責頁面、資料呈現與互動。一般流程為 Server Component → Presenter → UseCase → DTO → ViewModel → UI，讓頁面不直接處理 CSV 或 DI 容器。

## 目前目錄

- `(routes)/chart/`：`page.tsx` 解析排除傳說的網址參數，`ChartPage.tsx` 組合三組統計資料；`presenter.ts` 與 `view-models/` 轉換資料；`components/` 放雷達圖、直條圖、散佈圖及切換控制項。
- `pokemon/`：圖鑑列表頁、Presenter、列表元件、詳細頁 ViewModel 與圖片查找；`[id]/page.tsx` 顯示個別資料、攻擊／被攻擊雙欄對照。
- `components/`：共用 Card、Tooltip 與 ThemeProvider。沒有 `dashboard` 或 `charts` 子目錄。
- `layout.tsx`、`globals.css`：桌面／手機導覽、頁尾、主題與全域樣式；`page.tsx` 顯示網站用途、實際資料範圍與圖鑑／圖表入口。

路由群組 `(routes)` 不會出現在網址，也不是所有頁面都必須放入該群組；目前 `pokemon` 就直接位於 `app` 下。

`api/pokemon/route.ts` 與列表頁共用 `loadPokemonListPage`。列表不產生詳細相剋；`PokemonFeed` 管理分批請求、失敗重試及位置，`PokemonVirtualGrid` 管理虛擬列，`PokemonCardImage` 管理圖片載入。

## 維護邊界

需要瀏覽器狀態與 D3 DOM 操作的元件使用 `'use client'`；Presenter、CSV 依賴及圖片檔案掃描留在伺服器端。共用 UI 保持通用，功能專屬元件與對應頁面放在一起。

目前相剋規則仍寫在 `pokemon/view-models/pokemonDetailViewModel.ts`，圖鑑也引用 chart ViewModel 的標籤、翻譯與顏色。這是現況，尚未完成共用模組或 Domain 邏輯的抽離。改動前先確認兩個頁面的影響。

完整流程見 [開發指南](../../guide.md)，待辦見 [ROADMAP](../../ROADMAP.md)。
