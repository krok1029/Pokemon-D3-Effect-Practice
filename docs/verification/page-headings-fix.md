# 詳細頁與圖表標題語意修正

日期：2026-09-27。

## 問題與調整

原版詳細頁以 `CardTitle` 的 `div` 呈現型態名稱與能力區標題，缺少 `h1`；圖表頁三張主要圖表的標題也不在 heading tree。

- 詳細頁型態名稱改為唯一 `h1`，能力值細節改為 `h2`，沿用原本字級、字重與行高。
- 圖表頁雷達、屬性平均、散佈圖標題改為 `h2`，原有頁面 `h1` 與搜尋／選取 `h3` 保留。
- 既有相剋區塊 `h2`／`h3`／`h4` 及共用 Card 元件不變。

## 回歸案例

`tests/e2e/page-headings.spec.ts` 使用瀏覽器可存取的 heading role 驗證 375px 與 1280px：

1. 直接開啟 Mega Charizard X 詳細頁，唯一 `h1` 為型態名稱，兩個 `h2` 為能力值細節、屬性相剋對照。
2. 圖表頁有唯一頁面 `h1`，三個主要圖表皆可由 `h2` 導覽，搜尋入口保留 `h3`。

原版正式服務（基準 `29c7380`）的四個 Chromium 案例均在缺少 `h1`／`h2` 斷言失敗，證據：`test-results/regression-cN6fZ0/catalog.log`。定向與全專案 ESLint 通過。修正版 Chromium、Firefox、WebKit 共 **12／12 案例通過**，證據為 `test-results/regression-BoZobr/catalog.log`。

重現修正版：

```sh
yarn test:e2e --suite=catalog page-headings.spec.ts
```

測試使用隔離正式建置，不使用根 `.next` 或開發服務；本次未實際操作讀屏軟體。
