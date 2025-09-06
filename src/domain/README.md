# Domain 層（網域層）

- 負責純商業規則與核心模型（Entities、Value Objects、Domain Services）。
- 僅使用純函式與無 I/O 工具，不直接碰觸資料庫或網路。
- 定義「Ports」（例如 `repositories/*.ts` 的介面），由外層 Infrastructure 來實作。

檔案導覽：
- `pokemon.ts`：Pokemon 的實體與相關純函式（如能力解析、倍率計算）。
- `types.ts`：網域型別（如 TypeName、Multiplier 與合法集合）。
- `repositories/`：網域層的 Repository 介面（Port），不包含任何 I/O 細節。

