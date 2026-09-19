# DI Token

`tokens.ts` 集中定義 tsyringe 註冊與解析用的 Symbol，讓應用以穩定 token 取得依賴，不把容器細節放進核心邏輯。

目前包含 PokemonRepository、PokemonDataConfig、StatsAverager，以及全體平均、依屬性平均、個別能力三個 UseCase 的 token。

Token 只負責識別，實作及生命週期在 `src/server/container.ts` 決定，UseCase 建構在 `src/server/factories.ts`。App 經 `src/server/useCases.ts` 取得用例。

新增需要獨立解析的服務時再新增 token；如果沿用既有服務，不需要額外建立 token。不要在 App 或 Domain 直接註冊／解析容器。
