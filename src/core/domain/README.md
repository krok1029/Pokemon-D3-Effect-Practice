# Domain 層（網域層）

- 承載純商業規則與核心模型（Entities、Value Objects、Domain Service）。
- 僅包含純邏輯，不直接觸碰 I/O、框架或外部服務。
- 對外暴露介面（例如 `repositories/PokemonRepository.ts`）作為應用層與基礎建設層的協定。

檔案導覽（主要節點）：
- `entities/Pokemon.ts`：寶可夢聚合根。
- `valueObjects/BaseStats.ts`：能力值 Value Object，提供不變式驗證與加總/平均等運算。
- `services/StatsAverager.ts`：Domain Service，用於計算平均能力值（可視需求替換策略）。
- `repositories/PokemonRepository.ts`：Repository Port（Application 層僅依賴此介面）。
- `specifications/PokemonQuery.ts`：查詢條件/規範，用於表達 UseCase 想要的資料範圍。
