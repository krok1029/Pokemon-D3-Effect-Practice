# Infrastructure 層說明

實作 Domain 定義的 Port，並對接外部系統；此層可以存取 I/O、檔案系統或第三方 SDK。

- `config/`：讀取環境變數或執行期設定（如 `ConfigProvider` 取得 CSV 路徑）。
- `csv/`：CSV 資料來源的轉接器，包含 Repository 實作與將原始資料轉為 Domain 實體的 Mapper。

新增轉接器步驟：
1. 依需求建立對應子資料夾（例如 `api/`、`db/`），實作 Domain 的 Repository 介面。
2. 使用 Mapper / ACL 將外部資料 DTO 轉換成 Domain Entity / Value Object。
3. 在 `src/server/container.ts` 註冊該實作，並透過 `config/` 提供的設定解析所需參數。
