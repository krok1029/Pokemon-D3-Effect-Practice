# Application 層

UseCase 負責組織查詢與統計，依賴 Domain 的 Repository 介面及服務，不直接讀檔或引用頁面框架。輸出 DTO 供 App 組裝顯示資料。

| UseCase | 責任 |
| --- | --- |
| `GetAveragePokemonStatsUseCase` | 回傳樣本數與六項平均，四捨五入至小數一位 |
| `GetAveragePokemonStatsByTypeUseCase` | 依主、副屬性分組，回傳每組樣本數與平均 |
| `GetPokemonBaseStatsUseCase` | 回傳每筆的編號、型態識別、名稱、屬性、傳說狀態與能力值；`executeForForm` 查詢指定或預設型態 |

三個 UseCase 都接受可選的 `excludeLegendaries`。沒有傳入時包含傳說；傳入 `true` 時使用非傳說查詢條件。

資料以 CSV 每列型態為單位，不依圖鑑編號去重。雙屬性資料同時進入兩個屬性分組，各組樣本數不可直接加總成不同寶可夢數量。尚無分頁用例。

DI 由 `src/server/container.ts` 註冊，App 透過 `src/server/useCases.ts` 取得服務。新增用例時保持 DTO 為純資料，把翻譯、顏色與畫面格式留在 App。
