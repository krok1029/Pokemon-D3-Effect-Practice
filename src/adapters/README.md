# Adapters 層（基礎設施層）

- 實作 Domain 層定義的 Ports（如 Repository 介面），與外部世界互動（CSV、DB、HTTP、Cache 等）。
- 組裝（Composition Root / DI）位於 `config/index.ts`，提供具體綁定與單例取得。

檔案導覽：
- `repo/`：資料來源的 Repository 實作（例如 `PokemonRepositoryCsv`）。
- `csv/`：CSV 讀取與資料列驗證 / 轉換工具。
- `config/index.ts`：初始化實作並透過 `getPokemonRepository()` 對外提供單例，`setPokemonRepository()` 可供測試替換。
