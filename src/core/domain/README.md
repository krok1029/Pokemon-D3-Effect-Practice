# Domain 層（網域層）

- 承載純商業規則與核心模型（Entities、Value Objects）。
- 僅包含純邏輯，不直接觸碰 I/O、框架或外部服務。
- 對外暴露介面（如 `PokemonRepository.ts`）作為應用層與基礎建設層的協定。

檔案導覽：
- `pokemon/Pokemon.ts`：Pokemon 實體與能力解析等純函式。
- `pokemon/types.ts`：TypeName、Multiplier 等網域型別與常數。
- `pokemon/PokemonRepository.ts`：Repository 介面（Port）。
- `constants.ts`：共用 Domain 常數（例如 `MAX_STAT`）。
