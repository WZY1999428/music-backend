# Music Backend

> ⚠️ **未完成项目** - 此项目仍在开发中，功能可能不完整或存在已知问题。

基于 Koa.js 的音乐服务后端项目，提供音乐管理、用户管理、内容管理等后台功能。  

## 技术栈

- **Node.js**: >= 18.0.0
- **框架**: Koa.js 3.x
- **数据库**: MySQL (使用 mysql-dsl ORM)
- **缓存**: Valkey (Redis)
- **编译工具**: SWC
- **进程管理**: PM2

## 主要功能

### 管理员 API (Admin API)
- **用户管理**: 用户账户管理
- **音乐管理**: 音乐资源的上传、管理和元数据解析
- **内容管理**: 内容的增删改查
- **系统管理**: 系统配置和维护
- **文件上传**: 支持文件上传和管理
- **验证码**: SVG 图形验证码生成

## 项目结构

```
music-backend/
├── src/
│   ├── bootstrap/        # 启动引导
│   ├── database/         # 数据库配置和连接
│   ├── middleware/       # 中间件
│   ├── router/           # 路由
│   │   └── admin-api/    # 管理员 API 路由
│   │       ├── contentMgmt/
│   │       ├── music/
│   │       ├── system/
│   │       ├── upload/
│   │       └── user/
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   ├── app.js            # 应用入口
│   └── index.js          # 服务启动
├── compiler/             # 编译配置
├── env/                  # 环境配置
├── swc-plugins/          # SWC 插件
├── ecosystem.config.cjs  # PM2 配置
├── nginx.conf            # Nginx 配置
└── package.json
```

## 安装依赖

```bash
npm install
```

## 环境配置

项目使用 TOML 格式的环境配置文件，配置文件位于 `env/` 目录。

## 开发

### 启动开发服务器（支持热重载）

```bash
npm run dev
```

### 构建

```bash
npm run build
```

构建产物输出到 `.output/` 目录。

## 生产部署

### 使用 PM2 启动

```bash
npm run pm2:start
```

### 直接启动

```bash
npm start
```

## 依赖说明

### 核心依赖
- `koa`: Web 框架
- `@koa/router`: 路由中间件
- `@koa/bodyparser`: 请求体解析
- `@koa/multer`: 文件上传
- `mysql-dsl`: MySQL ORM
- `iovalkey`: Valkey (Redis) 客户端
- `music-metadata`: 音乐元数据解析
- `svg-captcha`: 图形验证码
- `dayjs`: 日期处理
- `fs-extra`: 文件系统操作增强

### 开发依赖
- `@swc/core`: SWC 编译器
- `cross-env`: 跨平台环境变量设置

## 系统要求

- Node.js >= 18.0.0
- MySQL Server
- Valkey (Redis)

## 许可证

ISC
