# Server 組態層

負責將 Domain 介面與具體實作組合起來，讓 App 不需知道 CSV Repository 與 UseCase 如何建立。

- `container.ts`：載入 reflect-metadata，取得資料設定，註冊 tsyringe 依賴。
- `factories.ts`：以建構函式注入 Repository / StatsAverager，建立三個 UseCase。
- `useCases.ts`：App 使用的 UseCase 存取入口，內部封裝 `container.resolve`。
- `pokemonRepository.ts`：Repository 存取函式；目前頁面流程使用 UseCase，不直接查詢 Repository。

## 生命週期

| 依賴 | 註冊方式 |
| --- | --- |
| PokemonDataConfig | 容器模組初始化時取得設定，註冊為值 |
| PokemonRepository | 建立一個 CsvPokemonRepository，註冊為共用值 |
| StatsAverager | singleton |
| 三個 UseCase | factory，在解析時建立並注入共用依賴 |

不要把全部服務描述成 singleton。CSV 快取屬於共用 Repository 實例；環境設定在模組初始化時決定。

新增服務時依需求更新 `src/di/tokens.ts`、factory 與容器註冊，再提供存取函式。容器操作留在此層，核心模組只接收建構函式參數。
