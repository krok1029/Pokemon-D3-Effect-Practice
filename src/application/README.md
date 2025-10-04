# Application 層（應用層）

此層負責「用例（Use Case）」的流程協調、輸入/輸出邊界與錯誤模型。僅依賴 Domain 的介面（如 Repository 介面），不依賴 Infrastructure 的實作或第三方 I/O。

- 用例：位於 `pokemon/*.ts`，負責輸入驗證、呼叫 `PokemonRepository` 介面、回傳自訂的 `Result`（`Left`/`Right`）方便 UI/Routes 分支處理。
- 錯誤模型：`errors.ts` 定義應用層錯誤類型，統一錯誤邊界（例如 InvalidInput、NotFound 等）。

依賴注入（Composition Root）在 `src/infrastructure/config/index.ts` 提供 `getPokemonRepository()`；UI/Routes 透過此函式取得實作，Application 層只接收介面參數。
