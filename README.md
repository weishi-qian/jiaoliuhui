# 第二届生物免疫治疗中心建设现场观摩交流会 报名系统

## 环境要求

- **Node.js** 16+
- **MySQL** 5.7+（需提前安装并启动服务）

## 快速启动

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置数据库

确保 MySQL 服务已启动，然后用以下方式创建数据库和表：

**方式一：命令行**

```bash
cd server
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root'
  });
  await conn.query('CREATE DATABASE IF NOT EXISTS conference_db DEFAULT CHARSET utf8mb4');
  console.log('数据库 conference_db 已创建');
  await conn.end();
})()
"
```

**方式二：Navicat**

新建数据库，名称 `conference_db`，字符集 `utf8mb4`。

### 3. 修改数据库连接配置

如需修改数据库用户名/密码，编辑 `server/server.js` 第 15-19 行：

```js
const dbConfig = {
    host: 'localhost',
    user: 'root',        // 改为你的用户名
    password: 'root',    // 改为你的密码
    database: 'conference_db',
    ...
};
```

### 4. 初始化数据库表结构

启动服务器时会自动建表，也可手动执行 `server/database.sql` 中的 SQL 语句。

### 5. 启动后端服务

```bash
cd server
node server.js
```

服务启动后显示：`服务器运行在 https://jiaoliuhui-production.up.railway.app`

### 6. 访问页面

| 页面 | 地址 |
|------|------|
| 报名表单 | https://jiaoliuhui-production.up.railway.app |
| 管理后台 | https://jiaoliuhui-production.up.railway.app/admin |

## 项目结构

```
jiaoliuhui/
├── index.html          # 前端报名表单页面
├── index.css           # 前端样式
├── index.js            # 前端逻辑
├── server/
│   ├── server.js       # Express 后端服务
│   ├── database.sql    # 数据库建表脚本
│   ├── uploads/        # 简历附件存储目录
│   ├── admin/          # 管理后台页面
│   └── package.json    # 依赖配置
└── imgs/               # 图片资源
```

## 常见问题

### 端口被占用

```bash
# 查看占用 3000 端口的进程
netstat -ano | findstr ":3000"

# 结束该进程（将 PID 替换为实际值）
taskkill /F /PID <PID>
```

### 数据库连接失败

1. 确认 MySQL 服务已启动
2. 确认 `server/server.js` 中的用户名和密码正确
3. 确认已创建 `conference_db` 数据库

---

## 线上部署（让别人也能填写）

本地运行只能自己访问，需要将前后端都部署到公网。**Netlify（前端）+ Railway（后端+数据库）** 是最简单的免费方案。

### 架构说明

```
填写者 ──→ Netlify（前端页面）──→ Railway（后端API）──→ Railway MySQL（数据库）
                                              ↑
                              管理员 ←─── 管理后台查看数据
```

### 第一步：部署后端 + 数据库到 Railway

1. 注册 [Railway.app](https://railway.app)（用 GitHub 登录）
2. 点击 **New Project → Deploy from GitHub**
3. 选择你的仓库，Railway 会自动检测 Node.js 项目
4. 点击 **+ New → Database → MySQL** 添加数据库
5. Railway 会自动注入 `MYSQL_URL` 等环境变量
6. 部署后 Railway 会给你一个域名，如 `https://xxx.railway.app`

### 第二步：让后端使用 Railway 的 MySQL

在 Railway 项目中，`server/server.js` 的数据库配置需要改为读取环境变量。在项目根目录创建 `server/.env`（仅用于 Railway，不上传）：

```
MYSQL_HOST=你的Railway MySQL地址
MYSQL_USER=root
MYSQL_PASSWORD=你的Railway MySQL密码
MYSQL_DATABASE=railway
```

> Railway 的项目设置里可以直接添加这些环境变量，不需要 `.env` 文件。

### 第三步：修改 config.js 中的后端地址

编辑项目根目录的 `config.js`，把 `PROD_API_BASE` 改为 Railway 给你的地址：

```js
const PROD_API_BASE = 'https://你的项目名.railway.app/api';
```

### 第四步：部署前端到 Netlify

1. 注册 [Netlify.com](https://netlify.com)（用 GitHub 登录）
2. 点击 **Add new site → Import an existing project → Deploy with GitHub**
3. 选择你的仓库
4. Build settings 留空（已经是纯静态文件）
5. 点击 **Deploy site**
6. Netlify 会生成一个链接如 `https://xxx.netlify.app`

### 第五步：分享链接

- 报名链接：`https://xxx.netlify.app`
- 管理后台：`https://xxx.netlify.app/admin`

> 也可以在 Netlify 设置中绑定你自己的域名。
