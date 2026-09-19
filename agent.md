# 維護交接

專案是使用本機 CSV 的寶可夢圖鑑與 D3 統計網站。此摘要於 2026-09-19 對照實作整理；產品入口見 [README](README.md)，流程細節見 [guide](guide.md)，未實作項目見 [ROADMAP](ROADMAP.md)。不要把待辦描述當成已完成功能。

## 接手順序

1. 查看工作目錄與版本差異，保留既有修改。
2. 閱讀 README 的資料口徑及 ROADMAP 的已知缺口。
3. 依需求查看相應層的 README 與程式碼；程式碼、`package.json`、`yarn.lock` 和 `.yarnrc.yml` 是目前行為的依據。

## 功能與技術

- Next.js 15.4.6 App Router、React 19.1.0、TypeScript 5、D3 7、Tailwind CSS 4、shadcn/ui、Radix Tooltip、next-themes。
- Yarn 4.9.4，實際使用 `node_modules`，不是 Plug'n'Play。
- `/chart` 提供雷達、依屬性平均直條圖、單一可切換軸的互動散佈圖。
- `/pokemon` 提供網址同步的搜尋與篩選；`/pokemon/[id]?form=...` 提供指定型態的能力及攻擊／被攻擊對照；`/` 提供網站介紹及兩個主要入口。
- 沒有 API Route、外部即時資料服務或資料庫。

## 重要邊界

- App 透過 Presenter 呼叫 `server/useCases.ts`，由 UseCase 取得 DTO，再組裝 ViewModel。
- Application / Domain 不應依賴 Next.js、React 或 I/O；CSV 讀取及欄位映射由 Infra 處理。
- DI 註冊集中在 `server/container.ts`，token 在 `di/tokens.ts`，建構函式在 `server/factories.ts`。
- 現有例外：相剋算法仍在 App ViewModel；`core/shared/utils.ts` 是依賴 Tailwind 的 UI 樣式工具。不要為了符合抽象描述，在無關任務中擴大重構。
- 圖表元件實際位於 `app/(routes)/chart/components`；`app/components` 是共用 UI 與主題。

## 資料注意事項

- CSV 有 1,032 筆、898 個圖鑑編號；同編號可能有不同型態，編號不可視為每列唯一鍵。
- 統計以每列為樣本，雙屬性同時計入兩個平均分組。散佈圖圖例只按主屬性篩選。
- `POKEMON_DATA_PATH` 優先於測試 fixture 及預設 CSV；資料首次查詢時讀取並快取。
- 相剋不是取自 CSV，也不是完整傷害計算；攻擊取自身屬性招式對單一目標屬性的最佳倍率，保留免疫與抗性。
- 型態身份由圖鑑編號與穩定的 `formId` 組成，網址不可使用 CSV 列索引；碰撞會明確報錯。
- 圖片查找尚未支援可靠的型態識別及四位數編號。細節與後續工作見 ROADMAP。

## 驗證與本次範圍

`yarn test:unit` 一次執行 Vitest；`yarn test` 通常進入監看模式。Playwright 案例位於 `tests/e2e`，由 `yarn test:e2e` 執行，並從 Vitest 探索範圍排除。

使用者已授權需求確定後隨功能調整測試、fixture 與必要設定，取代先前文件整理階段的「測試先不要改」。第一批實作範圍為 #14、#15、#17、#18；驗收以頁面與公開網址為主，結果見 [驗收紀錄](docs/verification/roadmap-batch-1.md)。票券位於 [GitHub Issues](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues)。
