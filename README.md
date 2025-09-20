## 專案架構（DDD + Clean Architecture）

本專案依照「UI/Pages → Controller/Routes → Application → Domain → Infrastructure」分層，強調關注點分離、可測試性與擴充性。

### 目錄總覽

```
src
├─ app/                     # UI / Pages（Next.js App Router）
│  ├─ api/pokemon/          # Controller / Routes（HTTP 邊界）
│  ├─ chart/page.tsx
│  ├─ pokemon/page.tsx
│  ├─ layout.tsx
│  └─ globals.css
│
├─ features/                # UI-邏輯容器：組裝畫面與呼叫 UseCase
│  └─ dashboard/
│     ├─ containers/
│     │  ├─ AverageStatsContainer.tsx
│     │  └─ TotalCountContainer.tsx
│     └─ components/
│        ├─ AverageStatsCard.tsx
│        └─ TotalCountCard.tsx
│
├─ ui/                      # 純展示組件（shadcn / D3）
│  ├─ charts/
│  │  ├─ RadarChart.tsx
│  │  └─ utils/radar.ts
│  ├─ uikit/
│  │  ├─ card.tsx
│  │  └─ tooltip.tsx
│  └─ theme-provider.tsx
│
├─ application/             # UseCases / DTO / Policies（Effect）
│  ├─ errors.ts
│  └─ pokemon/
│     ├─ ListPokemons.ts
│     ├─ GetPokemonDetail.ts
│     └─ AverageStats.ts
│
├─ domain/                  # Entity / ValueObject / Repository 介面
│  ├─ pokemon/
│  │  ├─ Pokemon.ts
│  │  ├─ PokemonRepository.ts
│  │  └─ types.ts
│  └─ constants.ts
│
├─ infrastructure/          # I/O、實作 Repository、DI
│  ├─ config/index.ts       # getPokemonRepository()（DI 單例）
│  ├─ csv/
│  │  ├─ CsvService.ts
│  │  └─ pokemonCsv.ts
│  └─ repo/
│     └─ PokemonRepositoryCsv.ts
│
├─ di/tokens.ts
├─ shared/utils.ts
├─ shared/bool.ts
└─ tests/
   ├─ domain/*.test.ts
   ├─ infrastructure/*.test.ts
   └─ integration/*.test.ts
```

### 各層責任

- UI/Pages：只負責畫面與組裝，不碰資料來源細節。
- Controller/Routes：唯一處理 HTTP 的地方；parse/驗證 → 呼叫 UseCase → 回傳 JSON。
- Application：用 Effect 實作流程控制；只依賴 Domain 的 Repository 介面，不依賴 Infra。
- Domain：核心商業規則與不變式；定義 Entity/ValueObject/Repository 介面與常數。
- Infrastructure：連接外界（CSV/DB/HTTP），實作 Repository 與 DI；轉換為 Domain/DTO。

### 資料流程

UI → Container（features）→ UseCase（application）→ Repository 介面（domain）→ Repository 實作（infrastructure）→ 回傳 DTO → UI 組件渲染。

### DI 與組態

- `infrastructure/config/index.ts` 提供 `getPokemonRepository()` 單例存取。
- API Routes 與 Server Components 透過該函式取用 Repository，避免 UI 直接依賴 Infra 細節。

### 開發規範

- UI/Pages 不 import Infra；只呼叫 features 或 application。
- Application 不 import Infra；僅依賴 Domain 介面。
- Infra 不 import UI/Application；只實作 Domain 介面與 I/O 轉換。
- 共用常數（如 `MAX_STAT`）放在 `domain/constants.ts`。
- shadcn 組件位於 `src/ui/uikit`，對應 alias 已更新（`components.json`）。

### 測試佈局

- `tests/domain`：不依賴任何 I/O。
- `tests/infrastructure`：測 Repository/Csv 實作。
- `tests/integration`：打 API Route 進行整合測試。
- 可加上 `tests/application` 以 mock Repository 測 UseCase。

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
