# 後續工作建議

更新日期：2026-09-26。前三階段的 #14～#20 已實作並有驗收紀錄；以下區分已交付功能、現有限制與尚未實作的候選。母規格見 [#13](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/13)。

## 已交付：資料正確性與完整探索流程

| Ticket | 已交付行為 | 驗收紀錄 |
| --- | --- | --- |
| [#14 攻擊相剋倍率](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/14) | 保留免疫與抗性，說明計算範圍；攻擊／被攻擊雙欄呈現全部屬性倍率 | [第一批](docs/verification/roadmap-batch-1.md)；後續依 #14 更新為雙欄呈現 |
| [#15 型態網址與查詢](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/15) | 穩定的 `formId` 與型態網址；詳細頁、metadata 與來源資料一致 | [第一批](docs/verification/roadmap-batch-1.md) |
| [#16 圖片對應](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/16) | 明確型態對照、三位及四位編號辨識、缺圖與載入失敗提示 | [圖片對應](docs/verification/image-form-mapping.md) |
| [#17 首頁與手機導覽](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/17) | 首頁入口、手機導覽、metadata 與型態樣本／圖鑑編號數說明 | [第一批](docs/verification/roadmap-batch-1.md) |
| [#18 可分享篩選與返回](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/18) | 搜尋、屬性、傳說條件寫入網址，刷新／分享及返回能還原 | [第一批](docs/verification/roadmap-batch-1.md) |
| [#19 卡片分段載入](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/19) | 每批 24 筆無限捲動、超過 48 筆虛擬化、按需載圖與來源位置還原 | [無限捲動](docs/verification/infinite-scroll.md) |
| [#20 圖表連到型態詳細頁](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/20) | 框選結果連到正確型態，名稱／屬性一致，圖例明示依主屬性篩選 | [圖表連結](docs/verification/chart-detail-links.md) |

第一階段修正倍率、型態身份及圖片；第二階段完成入口、篩選與大量卡片瀏覽；第三階段串起散佈圖到詳細頁。以上維持每列型態為一個統計樣本，雙屬性同時計入兩個平均分組；沒有依編號去重或擴充 CSV。

驗收文件保存各批次當時的執行環境、通過／失敗及修正結果；其中舊的「剩餘限制」是歷史狀態。目前進度以本文件及實作為準。本次文件同步沒有重新執行程式測試。

## 現有限制與維護邊界

- **圖片資源**：補入 129 張官方圖後，1,025 列有明確對照，剩 7 列採佔位：Ash-Greninja，以及 Pumpkaboo／Gourgeist 各 Small、Large、Super 尺寸。這些型態仍需取得可確認的專用素材；補圖時維護 `src/app/pokemon/lib/pokemonFormImages.json` 與 [圖片來源清單](data/pokemon-image-sources.json)。補圖範圍與檢查結果見 [官方補圖驗收](docs/verification/official-image-download.md)。
- **資料範圍**：CSV 維持 1,032 列、898 個圖鑑編號（#1～898）。支援四位數圖檔不代表新增四位數寶可夢資料；圖片檔名也不是正式中文翻譯來源。
- **型態名稱變更**：`formId` 保證資料重排穩定；來源名稱改名時，仍需另定舊網址轉址策略。舊編號網址的預設型態規則不等同基本型態分類。
- **大量瀏覽**：深層返回先還原來源批次，較早資料由「載入前 24 筆」取得；未掛載的虛擬卡片不參與瀏覽器頁內尋找，可使用圖鑑搜尋。
- **散佈圖互動**：不持久化跨頁框選／縮放，也未提供手機觸控框選。
- **資料與架構**：CSV Repository 及圖片索引維持程序內快取；相剋是固定屬性矩陣，不包含特性、招式、道具或完整傷害計算。相剋算法仍位於 App ViewModel，沒有為本輪功能擴大重構。

## 近期優先：修正現有功能與驗收缺口

2026-09-26 完整三瀏覽器 E2E 237 項通過；額外操作檢查發現原測試未覆蓋的問題。詳細重現、截圖與驗證範圍見 [現有功能盤點](docs/verification/feature-audit-2026-09-26.md)。

1. [#21](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/21)：深層圖鑑點主要導覽後，網址回首頁但仍顯示舊批次。
2. [#22](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/22)：同頁切換排除傳說時，保留散佈圖的能力軸與主屬性條件。
3. [#23](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/23)：裁切放大／平移後超出繪圖區的資料點，避免遮住座標軸。
4. [#24](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/24)：補圖表手機／鍵盤的選取入口與下拉選單標籤。
5. [#25](https://github.com/krok1029/Pokemon-D3-Effect-Practice/issues/25)：建立隔離的 E2E 命令與 CI 自動回歸，補平均圖表 UI 驗收。

前三項為已重現的功能問題；後兩項為操作與交付保障補強。本次已開票，尚未修正。

## 後續候選：定義 2～4 隻寶可夢比較

建議優先延續現有探索流程，讓使用者從圖鑑或散佈圖挑選特定型態，並排比較六項能力及雷達圖。此項尚未實作，開發前先確定最小規格：

- 以圖鑑編號與 `formId` 選取／移除，最多四隻；同物種不同型態可以同時比較，同一型態不重複加入。
- 定義跨頁選取如何保留，以及不足兩隻或超過上限時的提示。
- 比較頁呈現一致的名稱、屬性、六項能力與雷達圖，缺圖沿用既有佔位。
- 網址可重建比較名單，支援直接開啟、刷新及分享；明確處理不存在的型態。
- 以一般噴火龍及 Mega X／Y 等型態驗收選取、移除、上限、刷新／分享與手機排版。

實際網址格式、跨頁狀態與圖表刻度在新規格中定案。沿用現有 CSV 與型態契約，不在本次文件同步啟動開發。

## 其他候選

| 候選 | 使用價值 | 前置工作 |
| --- | --- | --- |
| 世代與基本型態篩選 | 看不同群體的能力分布 | 將 CSV 現有欄位納入模型，定義型態分類 |
| 中文名稱搜尋 | 降低目前只能以資料中的英文名稱搜尋的門檻 | 可維護的名稱對照與來源；不能只把圖片檔名當成完整翻譯資料 |

依使用回饋選擇後續項目，不同時展開。API／資料庫、更完整戰鬥模擬、帳號收藏及全面升級依賴，目前沒有足夠需求支持優先投入。

## 開工與驗收方式

需求確定後可調整對應測試、fixture 與必要設定。驗收優先使用頁面與公開網址，資料重排及身份碰撞以真實 CSV 的頁面入口補足。不要為通過測試而刪除有效斷言、跳過失敗案例，或更改未受需求影響的行為。

功能、必要測試與驗收文件依工作目的分別提交；提交前逐檔確認差異，保留其他任務的修改。既有驗收文件可供重現，但不能當成新變更已通過檢查的證明。
