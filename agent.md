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
- `/pokemon` 提供搜尋與篩選；`/pokemon/[id]` 提供能力及相剋雙環圖；`/` 主要內容尚空白。
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
- 相剋不是取自 CSV，也不是完整傷害計算；攻擊倍率的下限問題尚未修正。
- 詳細頁目前只選同編號第一筆；圖片查找也尚未支援可靠的型態識別及四位數編號。細節與處理順序見 ROADMAP。

## 驗證與本次範圍

Vitest 現有 18 個測試檔；Playwright 只有設定，尚無 E2E 案例。`yarn test:unit` 一次執行 Vitest；`yarn test` 通常進入監看模式。沒有獨立 `tests/integration` 目錄。

本輪使用者要求先整理文件及提出下一步，測試先不要改；因此只調整 Markdown 文件，不更動程式、測試、fixture、設定或依賴，也不執行實作待辦。本次未重新執行網站或測試，不得宣稱目前檢查全部通過。後續任務依使用者最新授權決定範圍。
