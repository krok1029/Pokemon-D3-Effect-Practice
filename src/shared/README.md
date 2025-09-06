# Shared 層（共用工具）

- 放置純函式、零 I/O、可被多層共用的工具（例如布林解析、字串處理）。
- 不應依賴任何基礎設施或框架庫，以維持可重用性與可測試性。

檔案導覽：
- `bool.ts`：`toBoolLike` 將字串/數字/布林/null 轉為 boolean | undefined。

