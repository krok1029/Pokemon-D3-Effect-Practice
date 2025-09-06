# 架構總覽（Architecture Overview）

專案採用 DDD 分層，使用 Effect 描述計算、Next.js 負責 UI。所有依賴只能「向內」：UI → Application → Domain；Infrastructure 實作 Domain 的 Port，並在邊界組裝。

## 分層與依賴

UI / Presentation（Next.js）
- 頁面（App Router）、API 路由（Route Handlers）
- 解析輸入、組出 UseCase 的 Effect、在邊界以 `Effect.runPromise` 執行

Application（Use Cases）
- 流程協調與輸入驗證
- 僅依賴 Domain 的 Port（介面）
- 將 infra/domain 的錯誤映射成應用層錯誤
- 回傳 `Effect.either(...)`，讓 UI 易於成功/失敗分支

Domain（Entities / Value Objects / Domain Services）
- 純商業規則，無 I/O
- 暴露 Repository 介面（Ports）

Infrastructure（Adapters）
- 實作 Domain Ports（例如 CSV/DB/HTTP）
- 組裝（DI wiring）位於此層

依賴方向：UI → Application → Domain；Infrastructure 實作 Domain Ports 並在邊界被組裝。

## 目錄說明（Folders）

src/
- app/：UI 層（頁面與 API 路由）。執行 effects 並渲染。
- application/：用例與應用層錯誤。
  - pokemon/：`list.ts`、`detail.ts`（驗證、協調、錯誤映射）。用例內部以 `Effect.tryPromise` 直接包裝 Repository（Promise）呼叫。
  - errors.ts：應用層錯誤型別
- domain/：純網域模型與 Port
  - pokemon.ts, types.ts
  - repositories/：Repository 介面（Ports）
- infrastructure/：Adapters 與 DI
  - repositories/：具體實作（例如 CSV）
  - config/index.ts：Composition Root（tsyringe 綁定）
- shared/：純、無 I/O 的共用工具（例如 `bool.ts`）

## Effect 與執行

- Application 回傳 Effect；UI 在邊界（頁面或路由）建構並執行（`Effect.runPromise`）。
- 用例內部使用 `Effect.tryPromise(() => repo.method(...))` 將 Repository 的 Promise 納入 Effect 流程。
- 保持型別明確：用例回傳 `Effect.either(effect)`，錯誤使用應用層錯誤型別。

## DI（tsyringe）

- Composition Root：`src/infrastructure/config/index.ts`
- UI 入口需引入一次以初始化：`import '@/infrastructure/config'`
- UI 邊界解析：`const repo = container.resolve(TOKENS.PokemonRepository)`
- 反射 polyfill：測試環境於 `tests/setup.ts` 匯入 `reflect-metadata`，避免各處重複匯入。

## 錯誤映射

- Domain/infra 可能拋出 repo 特定錯誤（如 `NotFound`）。
- Application 以 `application/errors.ts` 的 `InvalidInput` / `NotFound` 做映射。
- UI 透過 Either 判斷並渲染。

## 測試建議

- Domain 與 shared：以純函式單元測試。
- UseCase：以 stub repo 驗證輸入處理與錯誤映射。
- 整合測試：串接實際 infra（CSV/DB）驗證端到端行為。
- 全域測試設定：`tests/setup.ts` 匯入 `reflect-metadata`。
