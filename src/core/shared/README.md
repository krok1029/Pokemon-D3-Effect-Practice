# Shared 層（共用工具）

- 放置純函式、零 I/O、可被多層共用的工具（例如布林解析、結果型別、樣式工具）。
- 不依賴任何基礎設施或應用層細節，以維持可重用性與可測試性。

檔案導覽：
- `bool.ts`：`toBoolLike` 將字串/數字/布林/null 轉為 boolean | undefined。
- `result.ts`：Left/Right 型別與相關 helper，提供 UseCase 一致的回傳模型。
- `utils.ts`：UI / 共用工具（例如 `cn`：結合 clsx + tailwind-merge）。
