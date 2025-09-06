# Application 層（應用層）

此層負責「用例（Use Case）」的流程協調與輸入驗證，不直接存取資料庫或外部服務。

- 用例：`pokemon/*.ts` 進行輸入驗證、呼叫 Repository（透過 Effect 轉接器）、將錯誤映射為應用層錯誤，最後回傳 `Effect.either(...)` 讓 UI 好做分支處理。
- Repository 轉接器：`repositories/*EffectAdapter.ts` 將網域層的 Promise-based Repository 包裝為 Effect，方便在用例中組合。
- 錯誤模型：`errors.ts` 定義應用層可見的錯誤型別，統一錯誤處理界線。

DI 組裝（Composition Root）位於 `src/infrastructure/config/index.ts`，在 UI 入口檔引入一次完成初始化。
