const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: '需要访问令牌'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 从数据库获取用户信息
        const users = await query(
            'SELECT id, username, email, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: '用户不存在'
            });
        }

        if (!users[0].is_active) {
            return res.status(401).json({
                error: '账户已被禁用'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('JWT验证错误:', error);
        return res.status(403).json({
            error: '无效的访问令牌'
        });
    }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const users = await query(
            'SELECT id, username, email, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length > 0 && users[0].is_active) {
            req.user = users[0];
        } else {
            req.user = null;
        }
    } catch (error) {
        req.user = null;
    }

    next();
};

// 检查资源所有权中间件
const checkOwnership = (resourceType) => {
    return async (req, res, next) => {
        const resourceId = req.params.id;
        const userId = req.user.id;

        let queryStr = '';
        let params = [userId, resourceId];

        switch (resourceType) {
            case 'pet':
                queryStr = 'SELECT id FROM pets WHERE user_id = ? AND id = ?';
                break;
            case 'media':
                queryStr = 'SELECT id FROM media WHERE user_id = ? AND id = ?';
                break;
            case 'post':
                queryStr = 'SELECT id FROM posts WHERE user_id = ? AND id = ?';
                break;
            default:
                return res.status(400).json({
                    error: '无效的资源类型'
                });
        }

        try {
            const results = await query(queryStr, params);

            if (results.length === 0) {
                return res.status(403).json({
                    error: '无权访问此资源'
                });
            }

            next();
        } catch (error) {
            console.error('权限检查错误:', error);
            return res.status(500).json({
                error: '权限检查失败'
            });
        }
    };
};

// 生成JWT令牌
const generateToken = (userId, username) => {
    return jwt.sign(
        { userId, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// 验证JWT令牌（用于其他服务）
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    checkOwnership,
    generateToken,
    verifyToken
};