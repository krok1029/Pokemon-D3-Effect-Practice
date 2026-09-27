# CSV 傳說標記與屬性驗證

日期：2026-09-27。修正 2026-09-26 剩餘功能盤點中的 CSV 非整數欄位缺口。

## 根因與修正

`CsvPokemonMapper` 原本把無法辨認的 Legendary 值當成 false，並以 `parseFloat` 接受 `1garbage` 等部分數字；屬性只驗證非空字串。錯字因此可進入 DTO、屬性分組與詳細頁，未知屬性在顯示相剋時回退為 ×1。

驗證集中在 Infra 的 `CsvPokemonMapper`，不變更 Core、App 或任何來源 CSV。

| 欄位 | 接受格式 | 拒絕格式 |
| --- | --- | --- |
| Legendary | boolean；數字 0／1；前後空白與大小寫不敏感的字串 true／false／0／1／0.0／1.0 | 缺欄、null、空白、tru、1garbage、-1、0.5、NaN、Infinity 等其餘內容 |
| Type 1 | 18 種有效英文屬性，忽略前後空白與大小寫 | 缺欄、null、空白、none、錯字、未知名稱與非字串 |
| Type 2 | 同 Type 1；另外保留空白、none、缺欄、null 作為無副屬性 | 非空的錯字、未知名稱與其他非字串 |

有效屬性統一輸出英文首字大寫（例如 ` Electric `、`ELECTRIC`、`electric` 皆為 `Electric`），維持正式 CSV 目前的輸出格式，避免在大小寫敏感的統計分組與列表屬性選項中出現重複分組。

所有拒絕案例都回報 `Row N: column "欄位名" ...`；Row 沿用 Mapper 的資料筆次，從 1 開始，不含 CSV 標題列。錯誤在 DTO 建立前向上傳遞，不產生帶有未知屬性的可顯示資料。

## 本次驗證

1. 先新增 Mapper 回歸案例並執行，修正前為 **28 失敗／37 通過**，確認測試能捕捉寬鬆布林解析、未知屬性與大小寫未正規化。
2. 修正後 `yarn test:unit tests/infra/csv/CsvPokemonMapper.test.ts`：**65 項通過**。
3. `yarn test:unit tests/infra/csv`：**4 檔／71 項通過**。
4. 定向 ESLint 與 Git 差異空白檢查通過。

Mapper 測試覆蓋正式 **1,032 列、898 個編號、125 列傳說標記**，並逐列確認正式資料的主屬性、布林結果與整數能力保持原值。另讀取 `data/pokemon_fixture_30.csv` 及 `tests/e2e/fixtures/navigation.csv`，兩份 fixture 每列皆可映射。

新增 `tests/infra/csv/CsvFieldPipeline.test.ts` 使用真實暫存 CSV 及 Repository，驗證：

- 混合大小寫進入 DTO 後統一為 `Electric`／`Fairy`，排除傳說仍正確。
- 兩筆不同大小寫的 Electric 只形成一個平均分組，樣本數為 2，HP 平均為 50；雙屬性也計入 Fairy 分組。
- 圖鑑電屬性篩選取得兩筆資料，屬性選項沒有大小寫重複。
- 電屬性攻擊水／地面及被地面攻擊，維持 **×2／×0／×2**。
- `Electrc` 及 `tru` 的污染 CSV 在 DTO 建立前明確拒絕。

本子任務未執行瀏覽器 E2E 或全專案測試；整合驗證由主任務另行記錄。沒有修改或提交既有未追蹤的盤點證據。
