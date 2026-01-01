const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const petRoutes = require('./routes/pets');
const mediaRoutes = require('./routes/media');
const postRoutes = require('./routes/posts');
const socialRoutes = require('./routes/social');
const memorialRoutes = require('./routes/memorial');
const decorationRoutes = require('./routes/decoration');
const aiRoutes = require('./routes/ai');

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 请求限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: {
        error: '请求过于频繁，请稍后再试'
    }
});
app.use('/api/', limiter);

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（用于存储上传的媒体文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/memorial', memorialRoutes);
app.use('/api/decoration', decorationRoutes);
app.use('/api/ai', aiRoutes);

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // JWT错误
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: '无效的访问令牌'
        });
    }

    // 验证错误
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: '数据验证失败',
            details: err.errors
        });
    }

    // 默认错误
    res.status(err.status || 500).json({
        error: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 PetEternal后端服务已启动`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});

module.exports = app;