# 虛擬列表切換的鍵盤焦點

日期：2026-09-27。

## 問題與修正

圖鑑累積 48 筆後，第三批啟用虛擬化，卡片從一般 grid 改放進虛擬列；視窗跨欄數斷點也會重新分組。這兩種情況會卸載原卡片 DOM，即使同一型態立即重新掛載，瀏覽器仍會失去詳細連結的焦點，下一次 Tab 可能往前跳。

卡片容器現在使用穩定的 callback ref，在卸載前記錄其中實際聚焦的詳細連結。新 DOM 掛載後的 layout effect 只在焦點已掉回 body 時還原同一 href，並使用 `preventScroll`，讓既有位置還原繼續管理捲動。虛擬化首次啟用時，第一個 commit 還沒有列，因此會保留待還原身份，直到後續量測完成並掛載連結；不使用固定延遲。使用者若已把焦點移到搜尋欄等其他控制項，不會記錄或搶回焦點。既有虛擬列範圍、焦點附近三列、overscan 與圖片延後請求維持原設計。

## 回歸驗收

`tests/e2e/virtualization-focus.spec.ts` 使用完整 CSV，延遲真實第三批回應以固定切換邊界：

1. 48→72 筆時保留第 48 張卡片焦點，下一個 Tab 到第 49 張。
2. 第三批抵達前先移到搜尋欄，抵達後仍留在搜尋欄。
3. 虛擬列表由桌面三欄變成單欄後，維持同一卡片焦點及下一張 Tab 順序。

修正前正式版 `593d6d3`，使用獨立服務 `http://127.0.0.1:4190` 執行 Chromium：前後兩項在原連結仍存在但已失焦的斷言失敗，移至搜尋欄案例通過；結果為 2 failed、1 passed。證據位於 `test-results/regression-RmNtbJ/catalog`。第一次未提升權限的執行受 macOS Chromium MachPort 限制，未進入頁面驗收，不計為產品失敗。

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4190 yarn test:e2e --suite=catalog virtualization-focus.spec.ts --project=chromium
```

第一次整合 green 發現初次啟用虛擬化時會先有空列的 commit：原連結身份已正確保存，但還原當下 DOM 尚無任何虛擬列。隔離開發環境的暫時生命週期紀錄確認此原因後，改成連結真正出現才清除待還原身份；instrument 未留在產品。

macOS WebKit 的下一個連結操作沿用既有測試的 Option-Tab，其他瀏覽器使用 Tab。實測 WebKit 的一般 Tab 會略過連結，Option-Tab 才會從 Vulpix 前進至 Alolan Vulpix；兩種平台都保留相同的聚焦身份與下一張順序斷言。

隔離開發服務的 Chromium／Firefox 6 項通過（`test-results/regression-7qvZrr`），WebKit 改用平台連結導覽按鍵後 3 項通過（`test-results/regression-JNObpi`）。修正後型別與限定檔案 ESLint 檢查已通過。正式建置三瀏覽器 green 由本批整合回歸記錄補充。

最終獨立正式建置已執行 Chromium、Firefox、WebKit **9／9 通過**，涵蓋上述三個案例，證據 `test-results/regression-iS3UET/catalog.log`。完整回歸由 [整合驗收](focus-filter-data-fixes-2026-09-27.md) 記錄。
