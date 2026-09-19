# Domain 層

放置與 Next.js、CSV 等外部技術無關的模型、規則與查詢介面。

| 檔案 | 現有契約 |
| --- | --- |
| `entities/Pokemon.ts` | 保存編號、名稱、BaseStats、傳說狀態與主副屬性；驗證正整數編號、非空名稱與主屬性 |
| `valueObjects/BaseStats.ts` | `create` 驗證原始能力為 1～255 的整數；`zero`、`add`、`div` 支援計算中間結果，允許零、加總值與小數平均 |
| `services/StatsAverager.ts` | 六項能力的算術平均；可排除傳說，空集合回傳零 |
| `repositories/PokemonRepository.ts` | `findBy(query)` 回傳唯讀 Pokemon 陣列 |
| `specifications/PokemonQuery.ts` | 以 `includeLegendaries` 表達是否包含傳說，並提供兩種查詢建構方法 |

`Pokemon.id` 目前代表圖鑑編號，同一編號可以對應多個型態，並非 CSV 每列的唯一識別。模型尚無獨立型態欄位。

目前相剋矩陣與算法不在此層，而在 App 的圖鑑 ViewModel。移入此層是 [後續建議](../../../ROADMAP.md)，不是已完成的架構。
