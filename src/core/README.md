# Core 層

Application 與 Domain 承載資料查詢流程、模型與統計規則，讓這些邏輯不綁定頁面框架或 CSV 實作。

- [application](application/README.md)：UseCase 協調 Repository 與 Domain Service，輸出 DTO。
- [domain](domain/README.md)：Pokemon、BaseStats、平均計算、Repository 介面及查詢條件。
- [shared](shared/README.md)：目前僅有 `utils.ts` 的 `cn` 樣式工具；它依賴 clsx 與 tailwind-merge，實際屬於 UI 工具，是現有分層例外。

Application / Domain 不直接引用 App、Infra、Next.js、React 或 I/O；外部存取由 Repository 介面隔開，再由 Server 組裝實作。不要因 `shared` 目前的擺放位置，把新的 UI 工具繼續放入 Domain。

相剋計算目前尚在 App ViewModel，不能將 Core 描述為已承載所有商業規則。後續整理順序見 [ROADMAP](../../ROADMAP.md)。
