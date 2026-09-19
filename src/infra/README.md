# Infrastructure 層

實作 Domain 的外部存取介面，將 CSV 欄位與領域模型隔開。目前只有檔案資料來源，尚未接 API 或資料庫。

- `config/ConfigProvider.ts`：依序選擇 `POKEMON_DATA_PATH`、測試環境的 30 筆 fixture、預設 CSV。
- `csv/readCsv.ts`：使用 Node.js 非同步讀檔及 `csv-parse/sync`，第一列作為欄位名，忽略空行並去除欄位前後空白。
- `csv/CsvPokemonMapper.ts`：將原始編號、名稱、屬性、傳說標記與六項能力映射成 Pokemon / BaseStats；沒有讀取 CSV 全部欄位。
- `csv/CsvPokemonRepository.ts`：實作 `findBy`，載入資料後依傳說條件篩選。

## 快取與路徑

相對檔案路徑以 `process.cwd()` 為基準。資料第一次查詢時讀取，完成後保存在 Repository 實例；沒有檔案監聽、快取失效入口或跨程序共用快取。首次並行查詢尚未共用載入中的 Promise，可能各自讀檔。

更換 CSV 或環境變數後應重新啟動服務。檔案讀取、解析與必要欄位映射錯誤會向上傳遞，目前沒有統一的頁面錯誤模型。

日後增加 API / DB 來源時，先實作現有 Repository 介面與必要映射，再修改 `src/server/container.ts` 的註冊；只有查詢需求改變時才擴充介面。
