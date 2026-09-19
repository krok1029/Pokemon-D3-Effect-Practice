# Shared 目錄

目前只有 `utils.ts`，提供 `cn(...inputs)`：先以 clsx 組合條件式 class，再以 tailwind-merge 合併衝突的 Tailwind class，供 UI 元件使用。

此目錄沒有 `bool.ts`、`result.ts`，也沒有統一的 Left / Right 回傳模型。

`cn` 雖然不做 I/O，仍依賴 UI 樣式套件，因此不能把它視為純 Domain 工具。若後續整理目錄，可移到共用 UI 工具位置並更新使用端；本次只更正文件，沒有搬動程式。
