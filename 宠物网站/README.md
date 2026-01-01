# PetEternal (宠恒) - 宠物纪念社交平台

让爱跨越时空，让陪伴成为永恒

## 项目简介

PetEternal是一个结合了"数字永生/纪念"概念与"Instagram式社交"的宠物专属多媒体空间。平台为宠物主人提供记录宠物成长、纪念逝去宠物、以及与其他宠物主人交流的温馨社区。

## 核心功能

### 🐾 宠物多媒体空间
- 类似Instagram的个人档案，完全以宠物为主角
- 支持照片、视频上传
- 按宠物生命阶段自动聚类（奶狗/奶猫期、成年期、纪念期等）
- AI自动生成年度/月度精彩集锦

### 🎨 空间装饰系统
- 动态主题背景（落樱、草地、星空、实时天气等）
- 数字挂件（节日装饰、勋章、表情动图）
- 情感BGM播放列表

### 🤖 AI宠物卡通化
- 多种风格转换（皮克斯3D、手绘水彩、赛博朋克、美式卡通）
- 生成动态表情包
- 为逝去宠物重构活跃卡通形象

### 📅 定时纪念与生命日志
- 生日提醒和纪念日程管理
- 时空信箱（写给未来或彩虹桥的信）
- 成长轨迹时间线记录

### 👥 宠友连接
- 基于LBS发现附近宠友
- 品种垂直社区互助
- 彩虹桥情感支持社区

## 技术栈

### 前端
- HTML5 / CSS3 / JavaScript (ES6+)
- 响应式设计，支持移动端和桌面端
- 模块化架构，易于维护和扩展

### 后端
- Node.js + Express.js
- MySQL 8.0 数据库
- JWT身份认证
- Cloudinary云存储
- Redis缓存

### 部署
- Docker容器化部署
- Nginx反向代理
- 支持水平扩展

## 快速开始

### 环境要求
- Node.js 16.0+
- MySQL 8.0+
- Redis (可选)
- Docker & Docker Compose (推荐)

### 使用Docker Compose（推荐）

1. 克隆项目
```bash
git clone https://github.com/yourusername/peteternal.git
cd peteternal
```

2. 配置环境变量
```bash
cp backend/.env.example backend/.env
# 编辑 .env 文件，填入你的配置信息
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端：http://localhost
- 后端API：http://localhost:3000

### 本地开发

1. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端（如果需要开发服务器）
npm install -g http-server
```

2. 配置数据库
```bash
# 创建数据库
mysql -u root -p < backend/database/schema.sql
```

3. 配置环境变量
```bash
cp backend/.env.example backend/.env
# 编辑配置文件
```

4. 启动服务
```bash
# 启动后端
cd backend
npm run dev

# 启动前端（在另一个终端）
cd ..
npx http-server . -p 8000
```

## API文档

### 认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/auth/verify - 验证token

### 宠物管理
- GET /api/pets - 获取宠物列表
- POST /api/pets - 创建宠物
- PUT /api/pets/:id - 更新宠物信息
- DELETE /api/pets/:id - 删除宠物

### 媒体管理
- POST /api/media/upload - 上传单个文件
- POST /api/media/upload-multiple - 批量上传
- GET /api/media - 获取媒体列表
- DELETE /api/media/:id - 删除媒体

### 社交功能
- GET /api/social/posts - 获取动态列表
- POST /api/social/posts - 发布动态
- POST /api/social/like - 点赞/取消点赞
- POST /api/social/comment - 添加评论

### 纪念功能
- GET /api/memorial/events - 获取纪念事件
- POST /api/memorial/time-letters - 发送时空信

更多详细API文档请参考：[API文档](./docs/api.md)

## 项目结构

```
peteternal/
├── backend/                # 后端服务
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── utils/            # 工具函数
│   └── uploads/          # 上传文件目录
├── css/                  # 样式文件
├── js/                   # JavaScript文件
├── images/               # 图片资源
├── pages/                # 页面文件
├── nginx/                # Nginx配置
└── docker-compose.yml    # Docker编排文件
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系我们

- 项目主页：https://github.com/yourusername/peteternal
- 问题反馈：https://github.com/yourusername/peteternal/issues
- 邮箱：support@peteternal.com

## 致谢

感谢所有为这个项目做出贡献的开发者和设计师！

特别感谢我们的毛茸茸朋友们，它们是这个项目灵感的源泉。🐾

---

让每一只宠物在数字世界中获得永生，让爱跨越时空！