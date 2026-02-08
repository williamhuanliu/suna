# 本地 Supabase 安装与使用

当无法连接云端 Supabase（例如网络超时）时，可在本机用 Docker 运行 Supabase，后端直连本地数据库。

## 前置条件

1. **Docker Desktop**（或 Docker Engine + Docker Compose）  
   - [安装 Docker](https://docs.docker.com/get-docker/)
   - 确保 Docker 已启动

2. **Supabase CLI**  
   - macOS (Homebrew): `brew install supabase/tap/supabase`
   - 或: `npm i -g supabase`

## 一键启动（推荐）

在**项目根目录**执行：

```bash
pnpm supabase:start
```

首次会拉取镜像并执行所有 migration，可能需要几分钟。启动成功后，把终端里打印的 **“将以下变量写入 backend/.env”** 那一段复制到 `backend/.env` 中（覆盖原有的 `SUPABASE_*` 和 `DATABASE_URL`）。

然后重启后端（例如 `cd backend && uv run api.py`），前端仍用 `http://localhost:3000`，后端会连本地 Supabase。

停止本地 Supabase：

```bash
pnpm supabase:stop
```

## 手动步骤

### 1. 启动本地 Supabase

```bash
cd backend
supabase start
```

首次会拉取 Docker 镜像并应用 `backend/supabase/migrations/` 下所有迁移。成功后会输出一屏信息，包含：

- **API URL**: `http://127.0.0.1:54321`
- **DB URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio URL**: `http://127.0.0.1:54323`（本地管理界面）
- **anon key**、**service_role key**（每次 `supabase start` 固定，可直接用）

### 2. 配置 backend/.env

在 `backend/.env` 中改为使用本地 Supabase（保留其他如 `OPENROUTER_API_KEY` 等不变）：

```env
# 本地 Supabase（把下面几行改成 supabase start 输出里的值）
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<supabase start 输出中的 anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase start 输出中的 service_role key>
# 本地 JWT 与 CLI 默认一致即可
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# 必须：用本地数据库，这样就不会连云端 6543
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

若之前用的是 pooler URL（`:6543`），请直接改成上面的直连 URL（端口 `54322`）。

### 3. 前端环境变量（可选）

若前端通过 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 连 Supabase，也改成上面同一套本地 URL 和 anon key，否则登录/鉴权会走云端。

### 4. 重启后端

```bash
cd backend
uv run api.py
```

确认启动日志无数据库连接错误即可。

## 常用命令

| 命令 | 说明 |
|------|------|
| `cd backend && supabase start` | 启动本地 Supabase（Docker） |
| `cd backend && supabase stop` | 停止并移除容器 |
| `cd backend && supabase status` | 查看当前 API/DB URL 和 keys |
| `cd backend && supabase db reset` | 清空并重新应用所有 migration + seed |

## 注意事项

- 本地数据在 Docker 卷里，`supabase stop` 不会删数据；`supabase stop --no-backup` 会清理数据。
- 换回云端时，把 `backend/.env` 里的 `SUPABASE_*` 和 `DATABASE_URL` 改回云端项目的值即可。
- 本地 Studio: 浏览器打开 `http://127.0.0.1:54323` 可查看/编辑本地库表。

## 故障排除

- **`supabase stop` 报 Error 502**：已用脚本兜底。`pnpm supabase:stop` 会先执行 `supabase stop`，失败时自动用 Docker 停止相关容器（见 `scripts/supabase-stop.sh`）。若仍异常，可重启 Docker Desktop 后重试。
- **需要彻底清理**：`cd backend && supabase stop --no-backup`；若 CLI 仍报错，可运行 `pnpm supabase:stop`（脚本会尝试用 Docker 停止），或 `docker ps -a` 后对名称带 `supabase` 的容器执行 `docker rm -f <容器名>`。
