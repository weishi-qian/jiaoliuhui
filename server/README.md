# 会议报名系统 - 使用说明

## 项目简介

第二届生物免疫治疗中心建设现场观摩交流会暨重度哮喘专题讨论会 - 在线报名系统。

## 项目结构

```
project/
├── index.html          # 前端主页面（会议邀请函 + 报名表单）
├── index.css           # 前端样式
├── index.js            # 前端交互脚本
├── imgs/               # 图片资源
└── server/             # 后端服务
    ├── server.js       # Express 服务器
    ├── package.json    # 项目依赖
    ├── database.sql    # 数据库脚本
    └── admin/          # 管理后台
        ├── index.html
        ├── admin.css
        └── admin.js
```

## 环境要求

- Node.js 14+
- MySQL 5.7+（通过 Navicat 管理）

## 安装步骤

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置数据库

1. 打开 Navicat，连接到你的 MySQL 数据库
2. 新建数据库 `conference_db`（字符集选 utf8mb4）
3. 运行 `database.sql` 脚本创建数据表
4. 修改 `server/server.js` 中的数据库配置：

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',          // 你的 MySQL 用户名
    password: '123456',    // 你的 MySQL 密码
    database: 'conference_db'
};
```

### 3. 启动服务器

```bash
npm start
# 或开发模式
npm run dev
```

服务器启动后：
- API 地址：`http://localhost:3000/api`
- 管理后台：`http://localhost:3000/admin`

### 4. 访问前端页面

直接打开 `index.html` 文件，或使用 Live Server 等工具运行。

## 功能说明

### 前端页面
- 会议邀请函展示（基于图片内容）
- 参会确认（确认参加 / 无法参加）
- 在线报名表单（姓名、职称、医院、科室、电话、邮箱、身份证、住宿需求等）
- 会议详情弹窗查看
- 表单验证和提交

### 后端 API
- `POST /api/register` - 提交报名
- `GET /api/registrations` - 获取所有报名
- `GET /api/registrations/:id` - 获取单个报名详情
- `DELETE /api/registrations/:id` - 删除报名
- `GET /api/statistics` - 获取统计数据

### 管理后台
- 数据概览（总报名数、确认参加、无法参加、需要住宿）
- 报名列表（支持筛选、搜索）
- 查看报名详情
- 删除报名信息
- 导出 CSV 数据

## 注意事项

1. 确保 MySQL 服务已启动
2. 确保数据库配置正确
3. 前端页面和后端服务器需要在同一域名下运行，或配置 CORS
4. 生产环境建议添加用户认证功能
