# Application 層（應用層）

此層負責「用例（Use Case）」的流程協調與輸入驗證，不直接存取資料庫或外部服務。

- 用例：`pokemon/*.ts` 進行輸入驗證、呼叫 Repository，將錯誤映射為應用層錯誤，最後回傳 `Effect.either(...)` 讓 UI 好做分支處理。
- Promise → Effect：用例內部以 `Effect.tryPromise(() => repo.method(...))` 將 Repository（Promise）呼叫納入 Effect 流程，已不再使用獨立 Adapter 類別。
- 錯誤模型：`errors.ts` 定義應用層可見的錯誤型別，統一錯誤處理界線。

DI 組裝（Composition Root）位於 `src/infrastructure/config/index.ts`，在 UI 入口檔引入一次完成初始化。測試環境於 `tests/setup.ts` 匯入 `reflect-metadata`。
