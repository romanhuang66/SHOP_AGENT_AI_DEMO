# 第7步：联调与部署前验收记录

日期：2026-11-18。本文仅记录已执行结果，不把未执行检查记为通过。

## 已通过的检查

| 检查 | 执行方式 | 结果 |
| --- | --- | --- |
| TypeScript | npm run typecheck | 通过 |
| 生产构建 | npm run build | 通过；包含受保护后台与 Agent/语音接口 |
| Agent隔离测试 | npm run test:agent | 工具参数、引用校验、多轮历史、有限重试及循环上限通过；上游模拟 |
| 消费者业务回归 | npm run test:business | 商品规则、订单、退货分支、反馈、工单去重、隔离及后台权限边界通过 |
| 真实Agent回归 | npm run test:agent:live | 商品卡片、缓存重试、多轮预算与品类、订单与政策引用、未命中通过 |
| 真实企业后台回归 | npm run test:admin:live | 登录/退出、知识CRUD、跨访客知识和工单、Prompt生效/回滚、真实评测、人工标注、流量分离通过 |
| 真实语音服务 | npm run test:voice:live | TTS生成WAV后提交ASR，识别预期中文；未使用用户麦克风 |
| 进程重启持久化 | npm run test:restart | 独立生产进程停止并重启后，同访客仍读到工单 |
| 云存储并发适配器 | npm run test:persistence | 6个并发写入、插入冲突、版本控制、重读、失败回滚通过；传输模拟 |
| 异常与权限 | npm run test:errors | 非法请求、非法Origin、伪造/过期会话拒绝；消费者接口不返回私有配置 |
| Git与密钥保护 | npm run check:secrets | 通过；.env.local/.data/.vercel忽略，检查不输出密钥 |

上述功能性检查不等同于统计意义上的回答准确率；未以模型自评或规则通过率冒充人工准确率。

## 本轮修复

- 新增Supabase持久化适配器，使用版本条件更新防止Vercel多个实例相互覆盖；缺少配置时明确失败，不写临时文件假装持久化。
- 新增服务端私有表SQL、配置检测与企业工作空间迁移工具；迁移不覆盖已有云工作空间，不自动上传本地访客记录。
- 新增持久化的生产环境登录、模型及语音限流。
- 修复非法JSON/null请求的状态码与提示，非法Origin和异常Cookie签名不再触发未处理异常。
- TTS响应改为音频流转发，避免先在函数内缓存整段音频。
- 增加Vercel上传排除规则与环境变量同步工具；Secret通过标准输入传递，避免出现在命令参数和日志。

## 手机与云端实测

- 已完成手机窄屏实测（DOM宽375px）：首页、导航、商品对比、聊天和后台；页面scrollWidth等于clientWidth，无页面级横向溢出，对比表允许内部横向滚动。截图已保存。
- Supabase 项目 kmwtalwgjetnwvemrnky 已创建，私有表和企业工作空间已迁移。实际SQL确认RLS开启，匿名与普通角色无SELECT权限。
- Vercel实际读到10个模拟订单；消费者提交 TK-DF15F804-523，刷新后保留，企业后台可读取并处理。后台显示 Supabase云端持久化。
- 正式域名 https://shopagent-ai-demo.vercel.app 已发布并在浏览器打开；未登录后台跳转登录页，1009登录成功。
- 本机直连Supabase/Vercel业务域名发生TLS连接重置，因此线上验证通过浏览器真实页面执行；云适配器6路并发为模拟传输测试，不冒充云端压力测试。

## 设备待验收

- 你的设备上的实际麦克风和扬声器听音验收。

## 部署准备状态

Vercel项目：shopagent-ai-demo，已创建并关联本地工作区。

Production已配置：DEEPSEEK_API_KEY、DEEPSEEK_MODEL、VOICE_PROVIDER、ADMIN_PASSWORD、ADMIN_SESSION_SECRET；敏感项为Secret。

已配置：SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY。Supabase项目已创建，私有表及企业工作空间已迁移；RLS实际查询为true，匿名和普通角色SELECT权限均为false。

GitHub自动部署尚未关联：Vercel账号需要连接对应GitHub登录；这不影响通过CLI上传部署。正式版本已通过CLI部署并绑定 https://shopagent-ai-demo.vercel.app 。

本机到Supabase项目数据接口出现TLS连接重置，控制台连接正常，因此云端读写实测已通过Vercel部署后的浏览器业务流程执行；本机开发设置STORAGE_BACKEND=local，该覆盖不上传Vercel。

## 线上发现并修复

导购检索曾把“通勤”等用途词填入商品名称query导致漏检；明确工具参数含义，并在名称未命中时要求保留预算与降噪条件、移除非品牌型号query重试。补充回归断言，构建通过后重新部署。

## 正式域名验收记录

- Case 1：真实模型返回 Air Buds 3（299元）、Quiet Pro（399元）、Studio Lite（479元），均在500元以内且支持主动降噪，显示3张卡片；修复后本轮工具记录3次，完整回答约4.4秒。
- Case 2：订单 SA20261117001，返回模拟预计2026-11-18送达，并引用 POL-RETURN-v1#1；本轮工具记录4次，约6.1秒。发现回答结尾曾泛化拆封限制，系统约束补充要求按实际商品品类解释政策，避免将入耳式限制扩展至头戴式。
- 线上TTS：点击“朗读回答”，服务返回音频，界面进入播放态（图标为Square而非加载动画），可点击停止，浏览器无错误日志；未代替用户进行物理听音判断。
- 企业后台：正式域名未登录跳转登录页，1009登录成功，显示Supabase云端持久化；能读取旧部署提交的工单及处理备注。
- 重新部署后：TK-DF15F804-523 保留，状态已解决，处理备注保留。
- 这些是少量功能验收样例，不代表整体回答准确率。ASR服务往返已在本机真实调用验证；线上实际麦克风仍需用户设备验收。

- 密钥产物复核：扫描33个.next/static文件，未出现本机已配置的长服务端凭据；Git秘密检查通过。
- 最终部署ID：dpl_8XrFCa1SgSn1K3FGZnw4aFXpCvFY，READY，正式别名保持不变。

- 线上长上下文售后追问两次出现结构化格式异常；页面明确报错并保留重试入口。新增服务端一次格式纠正，仍受总轮次和超时上限约束；新增模拟首次格式失败、第二次恢复成功的断言，通过后重新构建发布。

- 修复后同一售后追问已成功：明确头戴式拆封不应套用入耳式限制，引用KB-p1#1与POL-RETURN-v1#1，约5.2秒。最终部署页面重新读取原有聊天记录成功。
- 线上截图：screenshots/stage7-online-home.jpg、stage7-online-chat.jpg、stage7-online-admin.jpg。
