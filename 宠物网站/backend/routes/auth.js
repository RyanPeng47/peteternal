const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字'),
    body('nickname')
        .optional()
        .isLength({ max: 50 })
        .withMessage('昵称长度不能超过50个字符')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '数据验证失败',
                details: errors.array()
            });
        }

        const { username, email, password, nickname } = req.body;

        // 检查用户名是否已存在
        const existingUsers = await query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: '用户名或邮箱已存在'
            });
        }

        // 加密密码
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 创建用户
        const result = await query(
            'INSERT INTO users (username, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, nickname || username]
        );

        // 生成JWT令牌
        const token = generateToken(result.insertId, username);

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                nickname: nickname || username
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            error: '注册失败，请稍后再试'
        });
    }
});

// 用户登录
router.post('/login', [
    body('username')
        .notEmpty()
        .withMessage('请输入用户名或邮箱'),
    body('password')
        .notEmpty()
        .withMessage('请输入密码')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '数据验证失败',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const users = await query(
            'SELECT id, username, email, password_hash, nickname, is_active FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: '用户名或密码错误'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                error: '账户已被禁用，请联系管理员'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: '用户名或密码错误'
            });
        }

        // 生成JWT令牌
        const token = generateToken(user.id, user.username);

        // 更新最后登录时间
        await query(
            'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nickname: user.nickname,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            error: '登录失败，请稍后再试'
        });
    }
});

// 刷新令牌
router.post('/refresh', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: '需要访问令牌'
            });
        }

        // 这里可以添加令牌刷新逻辑
        // 目前简单返回原令牌
        res.json({
            message: '令牌仍然有效',
            token
        });
    } catch (error) {
        console.error('刷新令牌错误:', error);
        res.status(500).json({
            error: '令牌刷新失败'
        });
    }
});

// 验证令牌
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: '需要访问令牌'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 从数据库获取用户信息
        const users = await query(
            'SELECT id, username, email, nickname, avatar_url, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                error: '无效的用户'
            });
        }

        res.json({
            valid: true,
            user: {
                id: users[0].id,
                username: users[0].username,
                email: users[0].email,
                nickname: users[0].nickname,
                avatar_url: users[0].avatar_url
            }
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: '令牌无效'
        });
    }
});

// 修改密码
router.post('/change-password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('请输入当前密码'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('新密码必须包含大小写字母和数字')
], async (req, res) => {
    try {
        // 这个路由需要认证中间件
        // 这里简化处理，实际使用时应该添加认证中间件
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '数据验证失败',
                details: errors.array()
            });
        }

        // TODO: 实现修改密码逻辑
        res.json({
            message: '密码修改功能待实现'
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            error: '修改密码失败'
        });
    }
});

// 忘记密码
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '数据验证失败',
                details: errors.array()
            });
        }

        const { email } = req.body;

        // TODO: 实现忘记密码逻辑（发送重置邮件）
        res.json({
            message: '密码重置邮件发送功能待实现'
        });
    } catch (error) {
        console.error('忘记密码错误:', error);
        res.status(500).json({
            error: '发送重置邮件失败'
        });
    }
});

module.exports = router;