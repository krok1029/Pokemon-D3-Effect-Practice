# CSV UTF-8 BOM 相容性修正

日期：2026-09-27。

## 問題與修正

帶 UTF-8 BOM 的合法 CSV 原本會把第一欄讀成 `\uFEFFNumber`，Repository 經 Mapper 轉換時找不到 `Number`，因此資料頁無法載入。

`readCsvFile` 現在啟用 csv-parse 的 `bom: true`，由解析器處理檔案開頭的標記。既有欄名、字串數值、引號內空白及欄位內容保持原值，不以全域字串取代移除資料內的字元。

## 驗證

```bash
yarn test:unit tests/infra/csv
```

- 新增 reader 案例，確認第一欄為 `Number`、`025` 保留前導零、引號內前後空白及內嵌 `\uFEFF` 字元不變。
- 新增 `CsvBomPipeline.test.ts`，實際寫入帶 BOM／不帶 BOM 的 UTF-8 暫存檔，走 reader → Repository → UseCase。兩者原始列及完整 DTO 相等，另外明確核對兩筆編號、名稱、主副屬性、傳說值與六項能力。
- 修改產品前，BOM 的 2 項新案例均失敗：reader 第一欄鍵不符，整合案例在 `Number` 驗證失敗。
- 修正後 CSV 測試 5 檔、77 項通過，包含正式資料 1,032 筆／898 個編號／125 筆傳說與現有 fixture。

與重複屬性修正共用本輪 CSV 驗證。這裡記錄 reader 與實際檔案資料流程；全站瀏覽器回歸由整合驗收另行記錄。

## 正式頁面補驗

整合正式建置以原盤點的單列 BOM 檔啟動，`/api/pokemon`、`/pokemon`、`/chart`、`/pokemon/25` 均回傳 **200**，不再是 Number 標頭驗證失敗。詳見 [HTTP 證據](assets/bom-http-fixed-2026-09-27.json)。
