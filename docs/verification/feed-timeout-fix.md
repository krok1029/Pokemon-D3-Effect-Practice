# 分批載入逾時與恢復修正

日期：2026-09-26。

## 問題與修正

`PokemonFeed` 原本只有切換篩選／卸載時的取消機制。後續 API 無回應時會一直顯示載入中，已載卡片雖然保留，但沒有就地重試入口。

每次載入改為從送出請求開始共用 **15 秒期限**，包含 `fetch` 與 JSON 本文讀取。到期時取消請求並離開等待狀態，顯示「載入逾時，請再試一次。」及「重新載入」，重試同一批而不清除已載卡片。既有 HTTP／解碼錯誤維持原失敗提示。

取消事件會立即清除計時器；成功與錯誤也清除計時器和事件監聽。切換篩選／卸載取消不會被當成逾時。完成前及 finally 都檢查目前 controller 身份，舊請求不能更新目前結果或清除新請求。等待涵蓋取消 Promise，即使異常的 fetch 實作忽略 abort，逾時仍會退出等待且遲到結果不會再次附加。

## 驗證

先建立 `tests/app/pokemon/PokemonFeedTimeout.test.tsx`，使用 Vitest fake timers 驅動真實 Feed、模擬無回應網路及卡住的 JSON 本文。修正前 4 項中 2 項失敗，15 秒後沒有逾時提示及重試按鈕。

修正後執行：

```bash
yarn test:unit tests/app/pokemon/PokemonFeedTimeout.test.tsx tests/app/pokemon/PokemonList.test.tsx
```

結果：2 個檔案、7 項全部通過。涵蓋 14,999 ms 尚未逾時／15,000 ms 到期、原卡片保留、同批重試、遲到結果不重複、本文期限、篩選切換取消及成功清除計時器。

另新增 `tests/e2e/feed-timeout.spec.ts`，用 Playwright 路由攔截無回應 API、瀏覽器 clock 推進期限，檢查完整頁面的保留／重試及切換篩選不誤報。完整三瀏覽器執行結果見 [平行修正整合驗收](parallel-fixes-2026-09-26.md)。
