# 回归验证记录 · 2026-10-16

- 修改前：638项，629通过，9失败。
- 修改后：650项，641通过，9失败。
- 9项失败名称完全一致，无新增失败。
- 专项/关联测试：32 + 10 = 42项通过。
- npm run build：通过。
- git diff --check（本轮涉及文件）：通过。
- 构建产物9个共用脚本与资源均与源码SHA-256一致。

## 既有失败

- generated AI chain bundle preserves the complete reconciled dataset
- generated AI chain bundle retains all source node families and province evidence
- job portrait level filter narrows the list results
- job portrait search matches visible job content instead of hidden associations
- portrait company cards use a coordinated summary layout
- static job analysis deep links render the selected uninitialized tab without runtime errors
- static job analysis tabs keep rich sections and clickable portrait cards
- static portrait dialog consumes the shared calculated data instead of legacy major tags
- talent goal text cells keep balanced inner spacing
