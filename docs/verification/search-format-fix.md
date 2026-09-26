# 圖鑑與散佈圖搜尋格式修正

日期：2026-09-26。

## 問題與根因

圖鑑卡片顯示 `#025`，但圖鑑 ViewModel 直接以原始字串比對 `String(id)`，因此 `#025`、`025` 均找不到 Pikachu。散佈圖的獨立搜尋元件只處理數字前置零，兩處規則不同；名稱僅轉小寫，彎引號或省略句點也無法符合來源名稱。

## 調整後規則

- 兩處共同使用 `src/app/pokemon/lib/pokemonSearch.ts` 的純函式；查詢網址與控制項保留使用者輸入，不改寫顯示名稱或型態識別。
- `#` 前綴或前置零的完整數字視為精確圖鑑編號，例如 `#25`、`#025`、`025`、`00025` 只匹配 #25 的全部型態，不匹配 #125、#250。字串必須完整符合編號格式，不接受 `#025oops`。
- 一般數字沿用部分比對，例如 `25` 仍可匹配 #25、#125、#250；不因本次修正改變原有探索方式。
- 名稱維持不分大小寫與部分比對，忽略空白、句點、直引號及左右彎單引號；`Farfetch’d`／`Farfetchd` 與 `Mr Mime`／`mr.mime` 可以找到來源的正確型態。
- 其他標點仍保留。只有可忽略標點的非空查詢不會誤認為清空搜尋；空白查詢維持圖鑑全部結果、散佈圖待輸入提示。
- 屬性／傳說條件、結果上限與中文名稱不支援的現況保持原有規則。

## 驗證

先建立 `tests/app/pokemon/pokemonSearchFormats.test.tsx`，透過真實圖鑑 ViewModel 與 React 散佈圖搜尋元件重現。修正前 19 項中 11 項失敗，症狀為預期的 Pikachu、Farfetch'd 或 Mr. Mime 結果不存在；不是模擬 helper 的輸出。

修正後執行：

```bash
yarn test:unit tests/app/pokemon/pokemonSearchFormats.test.tsx tests/app/pokemon/pokemonListViewModel.test.ts
```

結果：2 個檔案、23 項全部通過，包含編號精確／部分比對、標點差異、空白、無效編號、中文查無結果、原始搜尋文字保留，以及正常屬性／傳說複合篩選。

另新增 `tests/e2e/search-formats.spec.ts`，以正式 CSV 的可分享網址、刷新、散佈圖搜尋與詳細頁連結驗收四種輸入。完整三瀏覽器執行結果見 [平行修正整合驗收](parallel-fixes-2026-09-26.md)。
