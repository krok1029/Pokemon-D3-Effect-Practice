# Application 層（應用層）

此層負責「用例（Use Case）」的流程協調與輸入/輸出邊界。僅依賴 Domain 的介面（如 Repository 介面），不依賴 Infrastructure 的實作或第三方 I/O。

- 用例：位於 `useCases/`，例如 `GetAveragePokemonStatsUseCase`，負責呼叫 `PokemonRepository` 介面並回傳 DTO，供上層組裝成 View Model。
- 若有錯誤模型需求，可於此層統一定義與處理，避免洩漏 infra 細節至 UI。

依賴注入（Composition Root）由 `src/server/container.ts` 註冊 UseCase 與 Repository；UI/Routes 透過 `src/server/useCases.ts` 等封裝函式取得實作。
