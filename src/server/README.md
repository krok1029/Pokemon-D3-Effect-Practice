# Server 組態層說明

負責 DI 組裝與提供 App 層存取服務的入口。

- `container.ts`：設定 tsyringe 容器，註冊設定、Repository、Domain Service 與 UseCase。
- `factories.ts`：集中管理建立 UseCase 等服務的工廠函式，保持建構邏輯一致。
- `useCases.ts`／`pokemonRepository.ts`：對外提供簡單的解析函式，App 層不需直接操作容器。

開發流程：
1. 於 `container.ts` 使用 `src/di/tokens.ts` 中的 Token 註冊新的服務或實作。
2. 若 App 層需要存取該服務，於此新增封裝函式（類似 `getAveragePokemonStatsUseCase`）。
3. 請將所有容器操作限制在 `server` 層，避免洩漏 DI 細節至其他層級。
