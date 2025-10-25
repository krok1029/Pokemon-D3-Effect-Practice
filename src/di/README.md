# 依賴注入層說明

負責集中管理 tsyringe 使用的 Token。

- `tokens.ts`：匯出所有註冊與解析服務所需的 Symbol（Repository、UseCase、Domain Service、設定值等）。

使用方式：
1. 新增需要透過 DI 解析的服務時，先在 `tokens.ts` 定義對應的 Token。
2. 在 `src/server/container.ts` 中以該 Token 註冊實際實作。
3. App 層透過 `src/server/useCases.ts` 等封裝函式取得服務，避免直接接觸容器。
