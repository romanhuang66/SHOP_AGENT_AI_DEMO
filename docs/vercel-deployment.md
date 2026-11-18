# ShopAgent Vercel 部署

正式网站：https://shopagent-ai-demo.vercel.app

企业后台：https://shopagent-ai-demo.vercel.app/admin

2026-11-18 已通过 CLI 发布；Production 的全部7个环境变量已同步。

## 当前架构

Next.js 页面与服务端接口部署到 Vercel；会话、知识、Prompt、反馈、工单和评测使用 Supabase 的私有 `shopagent_state` 表持久化。表保存带版本的 JSON 文档，更新带版本条件，避免多实例同时写入时相互覆盖。这是单企业演示应用的状态存储适配器，后续可拆分为规范化业务表。

没有 Supabase 配置时，本机继续使用 `.data/`；Vercel 环境不会尝试写本机文件或假装保存成功。

## 1. Supabase

1. 在 Supabase 登录并创建免费项目，例如 `shopagent`，选择合适地区（可优先考虑 Singapore）。数据库密码由你自行设置并保管，本应用不需要把数据库密码写入聊天。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 在本机私有 `.env.local` 填写：

```dotenv
SUPABASE_URL=https://你的项目标识.supabase.co
SUPABASE_SERVICE_ROLE_KEY=服务端Secret密钥（sb_secret_开头）或legacy service_role密钥
```

4. 执行 `npm run check:cloud` 检查连接和表权限。
5. 如需保留本地企业知识、Prompt 和评测配置，执行 `npm run migrate:cloud`；已有云端工作空间不会被覆盖。本工具不上传本地访客会话和工单。

表启用 RLS，并撤销匿名/普通认证角色的权限；浏览器只访问本项目的服务端 API。服务端密钥不得使用 `NEXT_PUBLIC_` 前缀。

## 2. Vercel 环境变量

本地 `.env.local` 不会自动成为 Vercel 线上配置。无需重新申请 DeepSeek 密钥，可沿用同一把，在 Vercel 项目 → Settings → Environment Variables 添加：

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| DEEPSEEK_API_KEY | Secret | 对话与云端语音服务 |
| DEEPSEEK_MODEL | Config | deepseek-flash |
| VOICE_PROVIDER | Config | deepseek |
| ADMIN_PASSWORD | Secret | 后台登录密码 |
| ADMIN_SESSION_SECRET | Secret | 后台会话签名 |
| SUPABASE_URL | Config | 数据库项目 URL |
| SUPABASE_SERVICE_ROLE_KEY | Secret | 数据库服务端访问（支持Secret/legacy service_role） |

正式站点选择 Production。需要预览环境时，另外配置 Preview，建议使用独立数据库避免与正式数据混用。修改环境变量后，需要重新部署才能应用到新版本。

已提供 `npm run configure:vercel`：读取本地私有配置，通过 CLI 标准输入同步到 Production。密钥不出现在命令行参数或脚本日志中。执行前须 `vercel link` 并配置齐全。

## 3. 发布

```sh
npm run typecheck
npm run test:agent
npm run test:persistence
npm run check:secrets
npm run build
vercel --prod --yes
```

CLI 部署可直接上传项目；GitHub 自动部署是否可用，取决于 Vercel 账号是否已连接相应 GitHub 账号。

`.vercelignore` 排除 `.env*`、`.data`、`.git`、本机依赖和测试截图。`.gitignore` 也排除私有配置及业务数据。不要强制添加私有配置到公开仓库。

## 4. 线上验收

- 正式别名首页和消费者接口可访问；后台未登录会跳转，管理接口返回401。
- 登录后能保存知识和Prompt；刷新后保持，另一消费者访客能检索已发布知识。
- 真实推荐、订单工具、带引用售后回答、语音合成/识别链路通过。
- 提交工单、切换实例或重新部署后仍能读取；消费者不能读取他人数据。
- 费用和 Token 记录来自实际请求，不把评测流量计入用户指标。
- 公开前端产物及消费者接口不包含模型或数据库服务端密钥。

真实麦克风和扬声器仍需在你的设备上操作授权和听音；服务音频往返测试不等于物理设备验收。
