# Core 層說明

承載所有商業邏輯，與框架無關，只能使用純 TypeScript 並互相引用 `core` 內的模組。

- `application/`：放置 UseCase 與 DTO。UseCase 負責協調 Domain 物件並回傳給外層的資料結構。
- `domain/`：定義實體、值物件、Domain Service、Repository 介面（Port）與 Specification。
- `shared/`：純工具函式或型別，禁止出現 UI 或 infra 的依賴。

開發指引：
1. 新功能優先抽象 Domain（實體、值物件、服務）。
2. 透過 `domain/repositories` 定義需要的 Port。
3. 在 `application/useCases` 中實作流程，回傳 `application/dto` 中定義的 DTO。
4. 禁止引入 Next.js、React、Infra 或任意 I/O 套件。
