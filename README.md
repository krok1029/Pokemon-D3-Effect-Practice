## 專案架構（精簡版 DDD）

專案維持 DDD 的核心精神，但僅保留三個主要層級：`core`（domain + application）、`adapters`（基礎建設 / 外部系統）與 `app`（介面層）。這樣的整理讓目錄更單純，同時保留分層邏輯、易測性與可替換性。

### 目錄總覽

```
src
├─ app/                         # Next.js App Router：所有 UI / Routes
│  ├─ api/pokemon/              # Controllers，呼叫 UseCase 後回傳 JSON
│  ├─ components/               # 介面層組件（dashboard / charts / ui）
│  │  ├─ dashboard/              # 頁面區塊：sections（資料載入）與 cards（純展示）
│  │  ├─ charts/                 # D3 圖表與工具
│  │  └─ ui/                     # 共用 UI 元件（card、tooltip 等）
│  ├─ layout.tsx                # 佈局 + ThemeProvider
│  └─ page.tsx, chart/, pokemon/ 等頁面
│
├─ core/                        # Domain + Application + Shared
│  ├─ domain/                   # 實體、值物件、Repository 介面與常數
│  ├─ application/              # UseCase，回傳自訂 Result，僅依賴 domain 介面
│  └─ shared/                   # 共用工具（bool、result、utils）
│
├─ adapters/                    # 對外部世界的實作（基礎建設）
│  ├─ config/                   # DI / Repository 組態
│  ├─ csv/                      # CSV 讀寫與資料轉換
│  └─ repo/                     # PokemonRepository 具體實作
│
├─ di/tokens.ts                 # 依賴注入 Token 定義
└─ tests/                       # 對應各層的測試（domain / adapters / integration）
```

### 層級責任

- **app**：界面層，Next.js 頁面、Server Components 與 API Routes；僅透過 UseCase 與外界互動。
- **core**：系統核心。`domain` 提供商業模型與不變式，`application` 負責流程協調與輸入檢驗，`shared` 放共同工具。
- **adapters**：對應外部資源（CSV 檔案），實作 `PokemonRepository` 介面並提供組態。

### 資料流向

UI/Routes（app）→ UseCase（core/application）→ Repository 介面（core/domain）→ CSV 實作（adapters）→ 回傳 DTO → UI render。

### 測試佈局

- `tests/domain`：針對純領域邏輯。
- `tests/adapters`：針對 CSV/Repository 的具體實作。
- `tests/integration`：從 UseCase 到實體 CSV 的整合驗證。

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
