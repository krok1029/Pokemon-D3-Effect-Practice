# Infrastructure 層（基礎設施層）

- 實作 Domain 層定義的 Ports（如 Repository 介面），連到真實世界（DB、檔案、HTTP、Cache）。
- 組裝（Composition Root / DI）也放在此層：`config/index.ts`，提供具體綁定。

檔案導覽：
- `repositories/`：各種資料來源的 Repository 實作（例如 CSV、DB）。
- `csv/`：CSV 讀取與資料映射的工具與 Schema。
- `config/index.ts`：初始化實作、註冊到 DI 容器，供 UI 入口引入。

