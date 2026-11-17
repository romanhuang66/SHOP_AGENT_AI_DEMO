# ShopAgent

基于 Next.js + TypeScript 的购物与售后服务产品。当前交付阶段：第 6 步，受保护的企业管理后台与 C/B 数据联动。

## 本地启动

```sh
npm install
npm run dev
```

访问 http://127.0.0.1:3000 。消费者端 `/`，企业后台 `/admin`。

## 当前可测试

30 款商品分类、名称搜索、价格范围和排序、收藏及三款对比；规则驱动推荐与商品卡片；10 笔订单查询及展开物流；按演示政策检查退货条件；提交人工工单、反馈保存及同一访客后台模拟处理。详细测试步骤见 `docs/stage-4-testing.md`。

## 当前边界

真实 AI 模式接入 DeepSeek、工具调用及本地词项 RAG；仍可手动选择规则演示。语音支持 DeepSeek ASR/TTS 与浏览器方案。企业后台的知识库、Prompt版本、会话详情、反馈工单、真实评测及看板均接入本机数据，管理员登录后可操作。当前检索不是语义 Embedding/pgvector，回答不是逐 Token 流式输出。配置与测试见 `docs/stage-5-testing.md`。

业务状态按随机 HttpOnly 访客 Cookie 隔离，存储在忽略提交的 `.data/` 下，刷新和本地进程重启后可重新读取。同一浏览器、同一站点地址才能看到相同记录；清除 Cookie 或换浏览器会变成另一位访客。

这是单机开发存储适配器，不是云端数据库。检测到 Vercel 环境时接口会拒绝使用本地存储，防止在部署后丢数据；正式部署前必须换成 Supabase 等持久化服务。企业后台采用单管理员密码及签名会话保护，可管理全部访客；消费者只能读写自己的数据。初始凭据在私有 `.env.local` 的 `ADMIN_PASSWORD` 项。详见 `docs/stage-6-testing.md`。

商品、政策、订单及所有到货日期均为演示数据；售后天数按 2026-11-17 快照计算。不会真实购买、退款、发货或联系人工客服。商品价格与规格为虚构品牌示例。

## 私有配置

将 `.env.example` 的结构复制到本机 `.env.local` 并填写 `DEEPSEEK_API_KEY`。不要上传 `.env.local`，发布到 Vercel 时在平台环境变量中配置。推送公开 GitHub 前执行 `npm run check:secrets`。

## 检查

```sh
npm run typecheck
npm run build
# 需预先启动本地服务；创建隔离的测试访客数据
npm run test:business
```

产品规格见 `docs/mini-prd.md`，完整验收清单见 `docs/acceptance-checklist.md`。
