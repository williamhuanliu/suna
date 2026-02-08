# Kortix Suna 项目系统学习路径（详细版）

按顺序完成每一步；每步都包含「目标 + 要看的文件 + 要做的操作 + 完成标志」。

---

## 第一步：整体架构与仓库结构（约 30 分钟）

### 目标
- 用一句话说出项目是做什么的
- 知道四大组件分别对应哪些目录
- 能在 10 秒内找到前端入口、后端入口、环境配置

### 1.1 项目是做什么的（先记住这两句）
- **一句话**：可自托管的 **AI Agent 平台**——用户通过对话让 Agent 在隔离环境里执行任务（分析数据、操作文件、上网、写代码等）。
- **核心**：Agent = LLM（做决策）+ 工具（读文件、执行命令、浏览器等）+ 沙箱（Docker 容器，隔离执行）。

### 1.2 四大组件与目录对应（必记）

| 组件 | 技术 | 在仓库里的位置 | 作用 |
|------|------|----------------|------|
| **Backend API** | Python / FastAPI | `backend/`，入口 `backend/api.py` | 提供 REST API、会话与 Run 管理、调 LLM、执行工具、管理沙箱 |
| **Frontend** | Next.js / React | `apps/frontend/` | 聊天界面、Agent 配置、项目/会话管理 |
| **Agent Runtime** | Docker 沙箱 | 逻辑在 `backend/core/sandbox/`，工具在 `backend/core/tools/` | 每个 Run 在独立容器里执行工具（文件、命令、浏览器等） |
| **数据层** | Supabase | 配置在 `backend/.env`，迁移在 `backend/supabase/migrations/` | 用户、项目、会话(thread)、消息、Agent 配置等 |

### 1.3 必看的目录结构（先扫名字，不必看代码）

在 IDE 里依次点开这些目录，只看**文件夹和文件名**，建立「东西在哪」的印象：

```
suna/
├── apps/frontend/          ← 前端（页面、组件、API 调用）
├── backend/
│   ├── api.py              ← 后端入口，所有路由挂在这里
│   ├── core/               ← 核心逻辑（下面列出子目录含义）
│   │   ├── agents/         ← Agent 执行、Run、流式返回
│   │   ├── services/      ← LLM 调用(llm.py)、DB、Redis 等
│   │   ├── tools/         ← 工具实现(create_file、read_file、浏览器等)
│   │   ├── sandbox/       ← 沙箱管理（创建/销毁容器、执行命令）
│   │   ├── threads/       ← 会话(thread)、消息
│   │   └── ...
│   └── supabase/migrations/  ← 数据库表结构（SQL）
├── setup/                  ← 安装向导 python setup.py
├── start.py                ← 启动/停止服务
└── backend/.env            ← 后端环境变量（模型、API Key、数据库等）
```

### 1.4 第一步：具体操作清单（请按顺序做）

1. **打开 README**  
   打开项目根目录的 `README.md`，找到 **「Platform Architecture」** 小节，读一遍四大组件的英文描述，和上表对应。

2. **打开后端入口**  
   打开 `backend/api.py`：
   - 看**最上面**：`load_dotenv()`、`from core.agents.api import router as agent_runs_router` 等，知道「路由从 core 里来」。
   - 看**约 354–365 行**：`api_router.include_router(agent_runs_router)`、`threads_router`、`sandbox_api.router` 等，知道「对话、Agent Run、沙箱」都是独立 router。
   - 看**约 572 行**：`app.include_router(api_router, prefix="/v1")`，所以所有 API 都是 `/v1/...`。

3. **打开前端入口**  
   在 `apps/frontend/` 里找到 `src/app/`，点开几个文件夹（如 `(home)`、`(dashboard)`），知道「页面是按路由组织的」；先不用看具体组件。

4. **打开环境配置**  
   打开 `backend/.env`，看前 10 行左右：`MAIN_LLM`、`MAIN_LLM_MODEL`、`SUPABASE_URL`、`OPENROUTER_API_KEY` 等，知道「模型和数据库都在这里配」。

5. **确认服务能跑**  
   - 终端 1：`cd backend && uv run api.py`，看到类似 `Application startup complete`。
   - 终端 2：在项目根目录 `pnpm dev:frontend`（或 `pnpm --filter Kortix dev`），浏览器打开 http://localhost:3000，能打开登录/聊天页即可。

**第一步完成标志**：能不看书说出「前端在 apps/frontend，后端入口是 backend/api.py，配置在 backend/.env，API 前缀是 /v1」。

---

## 第二步：一次对话的完整路径（约 45 分钟）

### 目标
- 能说出「用户发一条消息后，请求从哪进、经过哪些模块、最后怎么回到页面」
- 在代码里能找到：流式接口、LLM 调用、工具执行、沙箱写文件

### 2.1 请求从哪里进来

- **前端**：用户发送消息 → 调用「开始 Agent Run」的 API → 拿到 `agent_run_id` 后，用 **GET `/v1/agent-run/{agent_run_id}/stream`** 拉取流式数据（SSE）。
- **后端**：`backend/api.py` 里 `api_router.include_router(agent_runs_router)`，前缀 `/v1`，所以流式接口完整路径是 **`GET /v1/agent-run/{agent_run_id}/stream`**，实现在 `backend/core/agents/api.py`。

### 2.2 第二步详细操作清单（按顺序做）

#### 操作 1：找到「开始 Run」和「流式」两个接口（约 8 分钟）

1. 打开 **`backend/core/agents/api.py`**。
2. **开始 Run**：在文件里搜 **`start_agent_run`**（函数名）或 **`/agent-run`**（路径）。你会看到有 **POST** 创建/开始 run 的路由（例如 `start_agent_run` 被某个路由调用），返回里有 `agent_run_id`。
3. **流式**：继续在同一文件里搜 **`/stream`** 或 **`stream_agent_run`**。找到类似：
   ```python
   @router.get("/agent-run/{agent_run_id}/stream", ...)
   async def stream_agent_run(agent_run_id: str, ...):
   ```
   记下：**URL = GET /v1/agent-run/{agent_run_id}/stream**，处理函数 = **`stream_agent_run`**。这个接口用 Redis Stream（`agent_run:{id}:stream`）把后端产生的事件推给前端。

#### 操作 2：找到「真正执行 Run」的入口（约 8 分钟）

1. 仍在 **`backend/core/agents/api.py`**，搜 **`execute_agent_run`**。
2. 你会看到在 **`_background_setup_and_execute`** 里（约 663–676 行）调用了：
   ```python
   await execute_agent_run(
       agent_run_id=agent_run_id,
       thread_id=thread_id,
       ...
       user_message=final_message_content
   )
   ```
   也就是说：**API 先返回 run_id 给前端，后台再异步执行 `execute_agent_run`**。
3. 打开 **`backend/core/agents/runner/executor.py`**，看 **`async def execute_agent_run(...)`**（约 28 行）。这里会设置 `stream_key`、调「stateless pipeline」等，是 Run 执行的入口。不必细读逻辑，只要知道「Run 的真正执行从这里开始」即可。

#### 操作 3：看 LLM 在哪里被调用（约 6 分钟）

1. 打开 **`backend/core/services/llm.py`**。
2. 搜 **`make_llm_api_call`**（约 155 行），看函数签名：`messages`、`model_name`、`stream`、`tools` 等。
3. 再搜 **`acompletion`**（约 235、250 行）：这里才是真正调 **LiteLLM**（发请求给 OpenRouter/OpenAI）。建立印象：**所有对话/工具决策的 LLM 请求都经过这个函数**。

#### 操作 4：看工具如何写文件、连沙箱（约 8 分钟）

1. 打开 **`backend/core/tools/sb_files_tool.py`**。
2. 搜 **`create_file`**（约 182 行），看方法体：
   - `await self._ensure_sandbox()`：确保有沙箱；
   - `await self.sandbox.fs.upload_file(file_contents.encode(), full_path)`：**在沙箱里写文件**。
3. 建立印象：**工具通过 `self.sandbox` 访问当前 Run 的沙箱**，写文件、执行命令都在沙箱里完成。

#### 操作 5：看沙箱模块（约 5 分钟）

1. 打开目录 **`backend/core/sandbox/`**，看有哪些文件：**`api.py`**（对外 HTTP）、**`sandbox.py`**（沙箱逻辑）、**`resolver.py`**（解析/创建沙箱）等。
2. 打开 **`backend/core/sandbox/api.py`**，扫一眼前几十行：有哪些路由（例如创建沙箱、执行命令、读文件）。不必记细节，只要知道「沙箱的 HTTP API 在这里，tools 通过 SDK/客户端调这些能力」即可。

#### 操作 6：看前端如何连流（约 5 分钟）

1. 打开 **`apps/frontend/src/lib/streaming/constants.ts`**，找到 **`API_ENDPOINTS.STREAM`**（约 45 行）：`(runId) => \`/agent-run/${runId}/stream\``，和 backend 的路径一致。
2. 打开 **`apps/frontend/src/lib/api/agents.ts`**，搜 **`agent-run`** 或 **`stream`**，看前端如何拼 URL（例如 `API_URL + '/agent-run/' + agentRunId + '/stream'`），建立「前端拉流 = GET 这个 URL」的印象。

### 2.3 整条链路小结（可画成简图）

```
用户输入
  → 前端 POST 开始 Run → 后端 start_agent_run → 返回 agent_run_id
  → 前端 GET /v1/agent-run/{id}/stream 建立 SSE 连接
  → 后端 _background_setup_and_execute → execute_agent_run（executor.py）
       → 取会话历史 → make_llm_api_call（llm.py）→ LiteLLM/OpenRouter
       → LLM 返回 tool_calls → 执行工具（如 sb_files_tool.create_file）
       → create_file 里 sandbox.fs.upload_file → 沙箱（Docker）写文件
       → 工具结果写回 Redis stream → stream_agent_run 把事件推给前端
  → 前端收到 SSE 事件，更新 UI（打字效果、工具状态等）
```

**第二步完成标志**：能画出上述简图（或口头复述「用户消息 → 前端 → 开始 Run → 拉 stream → 后端 execute_agent_run → LLM → 工具 → 沙箱 → Redis stream → 前端」），并在 2 分钟内打开对应文件找到 stream 路由、`make_llm_api_call`、`create_file`、`sandbox.fs.upload_file`。

---

## 第三步：配置与环境（约 20 分钟）

### 目标
- 改模型、改 API Key、改数据库连接时，知道改哪个文件、哪个变量
- 知道本地/生产的大致区分（ENV_MODE 等）
- 知道后端如何从 .env 加载配置、前端如何指向后端

### 3.1 第三步详细操作清单（按顺序做）

#### 操作 1：认全后端 .env 里的关键变量（约 5 分钟）

1. 打开 **`backend/.env`**（不要提交到 git，已在 .gitignore）。
2. 对照下表扫一遍（敏感值可打码），知道「要改什么就改哪一行」：

| 变量名 | 作用 | 示例值 |
|--------|------|--------|
| `ENV_MODE` | 环境：local / staging / production | `local` |
| `MAIN_LLM` | 主 LLM 提供商 | `openrouter` |
| `MAIN_LLM_MODEL` | 具体模型 ID（覆盖默认） | `openrouter/anthropic/claude-3.5-sonnet` |
| `OPENROUTER_API_KEY` | OpenRouter API Key | `sk-or-v1-...` |
| `OPENAI_API_KEY` | OpenAI API Key（可选，后台任务等） | `sk-...` |
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名 Key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色 Key | `eyJ...` |
| `SUPABASE_JWT_SECRET` | Supabase JWT 密钥 | 长字符串 |
| `DATABASE_URL` | 数据库连接串 | `postgresql://...` |
| `REDIS_HOST` / `REDIS_PORT` | Redis 地址（队列/流） | `localhost` / `6379` |

3. 记住：**改主模型 = 改 `MAIN_LLM` 或 `MAIN_LLM_MODEL`，改完必须重启后端**。

#### 操作 2：看后端如何加载 .env（约 8 分钟）

1. 打开 **`backend/core/utils/config.py`**。
2. 看 **`Configuration` 类**（约 45 行起）：里面有很多**类属性**，如 `MAIN_LLM: str = "openrouter"`、`MAIN_LLM_MODEL: Optional[str] = None`、`OPENROUTER_API_KEY: Optional[str] = None`（约 302 行）等。这些**名字和 .env 里的变量名一一对应**。
3. 看 **`__init__`**（约 534 行）：
   - 第一句 **`load_dotenv()`**：从当前目录或项目根目录的 `.env` 文件读进环境变量。
   - 然后 **`self._load_from_env()`**：把环境变量填到 config 里。
4. 看 **`_load_from_env`**（约 559 行）：
   - 用 **`get_type_hints(self.__class__)`** 拿到所有属性名；
   - 对每个属性名 `key` 做 **`os.getenv(key)`**，若有值就 `setattr(self, key, env_val)`。
   - 所以：**.env 里写 `MAIN_LLM_MODEL=xxx`，代码里就会得到 `config.MAIN_LLM_MODEL == "xxx"`**。

建立印象：**后端启动时 load_dotenv() + _load_from_env()，之后各处用 `from core.utils.config import config` 读 config.XXX**。

#### 操作 3：看谁在用 config 里的模型和 Key（约 4 分钟）

1. 在 **`backend`** 目录下搜 **`config.MAIN_LLM`** 或 **`config.MAIN_LLM_MODEL`**（或 `getattr(config, "MAIN_LLM")`），会看到在 **`core/ai_models/registry.py`** 等地方被读，用来选模型。
2. 搜 **`config.OPENROUTER_API_KEY`** 或 **`OPENROUTER_API_KEY`**，会看到在 **`core/services/llm.py`** 的 **`setup_api_keys()`** 里被设进 **`os.environ["OPENROUTER_API_KEY"]`**，这样 LiteLLM 调 OpenRouter 时就能拿到 Key。

建立印象：**config 是单一来源，LLM 服务通过 config 或 os.environ 拿 Key**。

#### 操作 4：前端配置（约 5 分钟）

1. 打开 **`apps/frontend/.env.example`**（若没有则看项目 README 或其它文档）。
2. 重点变量：
   - **`NEXT_PUBLIC_BACKEND_URL`**：后端 API 根地址，例如 `http://localhost:8000/v1`。前端发请求时会拼成 `NEXT_PUBLIC_BACKEND_URL + "/agent-run/..."` 等。
   - **`NEXT_PUBLIC_SUPABASE_URL`**、**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**：前端直连 Supabase 做登录等。
3. 本地开发时，通常复制 `.env.example` 为 **`.env.local`**（或 `.env`），改 `NEXT_PUBLIC_BACKEND_URL` 指向本机后端。前后端分离部署时，改这里即可换后端地址。

**第三步完成标志**：能说出「改主模型要改 backend/.env 的 MAIN_LLM_MODEL，改完重启后端」；能说出「改前端连的后端地址要改 apps/frontend 的 .env 里 NEXT_PUBLIC_BACKEND_URL」；知道 config 用 load_dotenv + _load_from_env 从 .env 加载。

---

## 第四步：数据模型与数据库（约 45 分钟）

### 目标
- 知道「用户、项目、会话(thread)、消息、Agent、Run」在库里大致怎么存
- 会打开迁移文件看表结构，能在 Supabase 里对得上

### 4.1 核心概念与表关系

- **Account/User**：用户，对应 **basejump.accounts**（Basejump 多租户）。Supabase Auth 的用户会关联到某个 account。
- **Project**：项目，表 **projects**。属于某个 account，下有多个 Thread。
- **Thread**：一次对话会话，表 **threads**。属于某个 project（或仅属 account），下有多个 **Message**、多个 **Agent Run**。
- **Message**：单条消息，表 **messages**。属于一个 thread，`type` 区分 user/assistant/tool 等，`content` 存 JSONB。
- **Agent**：AI 助手配置，表 **agents**。属于 account，存 name、system_prompt、工具配置等；有 **agent_versions** 做版本。
- **Agent Run**：某次「用某个 Agent 跑一个 Thread」的执行实例，表 **agent_runs**。属于一个 thread，存 status、started_at、completed_at、error 等。

关系简图：**account** → projects, threads, agents；**thread** → messages, agent_runs；**agent_run** 与 **thread** 多对一。

### 4.2 第四步详细操作清单（按顺序做）

#### 操作 1：看核心四张表的建表语句（约 12 分钟）

1. 打开 **`backend/supabase/migrations/20250416133920_agentpress_schema.sql`**。这是「对话」相关的核心迁移。
2. 看 **projects**（约 3 行）：`project_id`、`name`、`account_id`、`sandbox` 等。
3. 看 **threads**（约 15 行）：`thread_id`、`account_id`、`project_id`、`is_public` 等。**一个 thread 属于一个 project（或仅 account）**。
4. 看 **messages**（约 25 行）：`message_id`、**`thread_id`**、`type`、`is_llm_message`、**`content`（JSONB）**、`metadata` 等。**一条用户消息就是 messages 表里 type 为 user 的一行，content 里存内容**。
5. 看 **agent_runs**（约 37 行）：`id`、**`thread_id`**、`status`、`started_at`、`completed_at`、`error` 等。**一次 Run 对应一行，通过 thread_id 挂在某个 thread 下**。

建立印象：**用户发的一条消息 → 存在 messages 表；这条消息属于某个 thread；跑这次对话的 Run 存在 agent_runs 表，同样通过 thread_id 挂在这个 thread 上**。

#### 操作 2：看 agents 表（约 5 分钟）

1. 打开 **`backend/supabase/migrations/20250524062639_agents_table.sql`**。
2. 看 **agents** 表：`agent_id`、**`account_id`**、`name`、`description`、**`system_prompt`**、`configured_mcps`、`agentpress_tools`、`is_default` 等。后续迁移可能加过列（如 `current_version_id`），但核心是「一个 Agent 属于一个 account，存配置」。

建立印象：**Agent 是「可复用的助手配置」，和 Thread 没有直接外键；一次 Run 会关联到某个 agent（通过 agent_runs 的 metadata 或扩展列）**。

#### 操作 3：在代码里找「查 thread、插 message、查 agent_run」（约 15 分钟）

1. 打开 **`backend/core/threads/repo.py`**：
   - 搜 **`INSERT INTO messages`**（约 274 行）：插入一条消息，参数有 `thread_id`、`type`、`content` 等，对应 messages 表。
   - 搜 **`FROM threads`** 或 **`FROM messages`**：看如何按 thread_id 查 thread、查消息列表。
2. 打开 **`backend/core/agents/repo.py`**：
   - 搜 **`FROM agent_runs`** 或 **`get_agent_run_by_id`**（约 59 行）：查单次 run 时 **JOIN threads** 拿 `account_id`，说明 run 通过 thread 归属到用户。
   - 搜 **`create_agent_run`**（若有）：看插入 agent_runs 时传了哪些字段（thread_id、status 等）。

建立印象：**存消息用 threads.repo 的 insert message；查 Run 用 agents.repo 的 get_agent_run_by_id / get_thread_agent_runs；Thread 和 Agent Run 的关系是「一个 thread 下可有多次 run」**。

#### 操作 4：对应到第二步的链路（约 5 分钟）

- 第二步里：**start_agent_run** 会创建或复用 thread，并 **create_agent_run** 插入 agent_runs 一行，返回 **agent_run_id**（即 agent_runs.id）。
- 用户发的消息会先被 **INSERT INTO messages** 写到当前 thread；**execute_agent_run** 里会从 DB 取该 thread 的 messages，拼成 LLM 的 messages 数组。
- 所以：**一条用户消息 = messages 表一行（thread_id + type='user' + content）；Thread 和 Agent Run 的关系 = 一个 thread 对应多次 run（每次对话回合可能一个新 run）**。

### 4.3 可选：在 Supabase 里看表

- 用 **Supabase Dashboard → Table Editor** 或 **SQL Editor**，连你项目对应的库（DATABASE_URL），打开 **threads**、**messages**、**agent_runs**、**agents** 表，看几行数据，和上面概念对应。

**第四步完成标志**：能说出「一条用户消息存在 **messages** 表，通过 **thread_id** 属于某个 **thread**；**agent_runs** 表存每次执行的 Run，也通过 **thread_id** 属于同一个 thread；Thread 和 Agent Run 的关系是一对多（一个 thread 下可有多次 run）」。

---

## 第五步：做一个小改动练手（约 1 小时）

### 目标
- 走通「改代码 → 重启/重构建 → 验证」的流程，建立信心

### 5.1 练手 A：改前端文案
- 在 `apps/frontend` 里搜一句你见过的界面文案（如 "Creating File" 或 "Send"），改成中文或任意文字，保存后刷新页面看效果。

### 5.2 练手 B：改后端模型
- 改 `backend/.env` 里 `MAIN_LLM_MODEL` 为另一个模型（如 `openrouter/google/gemini-2.0-flash`），重启后端，发一条消息看是否用新模型。

### 5.3 练手 C：对应一次请求和日志
- 发一条消息，在后端终端里找到对应的一条请求日志（如某 run 的 start/stream/complete），把「一次点击」和「一行日志」对应起来。

**第五步完成标志**：至少完成一个练手，并成功看到自己的修改生效。

---

## 第六步：选一个方向深入（按兴趣）

- **Agent 执行与提示**：`backend/core/agents/`、`agentpress/`、prompt 组装、tool 注册与调用。
- **工具开发**：`backend/core/tools/`，仿写一个最小工具并注册。
- **前端对话与流式 UI**：`apps/frontend` 里 thread、message、stream 相关组件与 hook（如 `useAgentStream`）。
- **沙箱与安全**：`backend/core/sandbox/` 的启动、隔离、超时与资源限制。
- **计费与配额**：`backend/core/billing/`、credits、subscription。

---

## 学习顺序小结

1. **第一步**：架构 + 仓库结构（有什么、在哪）。  
2. **第二步**：一次对话的完整路径（请求入口 → LLM → 工具 → 沙箱）。  
3. **第三步**：配置与环境（改模型、改 Key）。  
4. **第四步**：数据模型与数据库（表与概念）。  
5. **第五步**：小改动练手（改文案/模型/看日志）。  
6. **第六步**：选一个子方向深入。

完成一步再做下一步；卡住时用「错误信息 + 你的操作」在 Issues 或 Discord 问。祝学习顺利。
