# App 層說明

負責 Next.js 的呈現邏輯與路由組裝，只處理視圖與 Presenter，不直接呼叫 Repository。

- `(routes)/`：每個路由的 Server Component、Presenter、View Model 都放在同一資料夾，從頁面僅匯入 Presenter。
- `components/`：共用 UI 元件與圖表，保持無商業邏輯。
- 其他檔案（`layout.tsx`、`globals.css` 等）處理全域佈局與樣式。

新增頁面流程：
1. 在 `(routes)` 下建立新資料夾，並提供 `page.tsx` 作為路由出口。
2. 將 Server Component（例如 `UserPage.tsx`）與 `presenter.ts` 放在同一層。
3. Presenter 取得 UseCase DTO 後轉成 View Model，再交給 UI 元件渲染。
