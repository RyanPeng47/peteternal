const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction, buildWhereClause, paginate } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取附近的宠友（基于地理位置）
router.get('/nearby', async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        // 简化处理：返回所有有宠物的用户
        // 实际应用中应该使用真实的地理位置计算
        const nearbyUsers = await query(`
            SELECT DISTINCT
                u.id,
                u.username,
                u.nickname,
                u.avatar_url,
                u.location,
                p.name as pet_name,
                p.type as pet_type,
                p.breed as pet_breed,
                p.avatar_url as pet_avatar
            FROM users u
            JOIN pets p ON u.id = p.user_id
            WHERE u.id != ? AND u.is_active = 1
            ORDER BY u.updated_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limitNum, offset]);

        // 获取总数
        const totalResult = await query(`
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            JOIN pets p ON u.id = p.user_id
            WHERE u.id != ? AND u.is_active = 1
        `, [userId]);

        res.json({
            users: nearbyUsers,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total: totalResult[0].total,
                pages: Math.ceil(totalResult[0].total / limitNum)
            }
        });
    } catch (error) {
        console.error('获取附近宠友错误:', error);
        res.status(500).json({
            error: '获取附近宠友失败'
        });
    }
});

// 获取动态列表
router.get('/posts', async (req, res) => {
    try {
        const userId = req.user.id;
        const { community, page = 1, limit = 10 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        // 构建查询条件
        let whereClause = 'WHERE p.is_public = 1';
        const params = [];

        if (community && community !== 'all') {
            whereClause += ' AND p.community = ?';
            params.push(community);
        }

        // 获取动态列表
        const posts = await query(`
            SELECT
                p.*,
                u.username,
                u.nickname,
                u.avatar_url,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id) as actual_likes_count,
                (SELECT COUNT(*) FROM comments WHERE target_type = 'post' AND target_id = p.id) as actual_comments_count,
                EXISTS(SELECT 1 FROM likes WHERE target_type = 'post' AND target_id = p.id AND user_id = ?) as is_liked,
                EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_following
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, ...params, limitNum, offset]);

        // 解析media_ids和tags
        posts.forEach(post => {
            post.media_ids = post.media_ids ? JSON.parse(post.media_ids) : [];
            post.tags = post.tags ? JSON.parse(post.tags) : [];
        });

        // 获取总数
        const totalResult = await query(`
            SELECT COUNT(*) as total FROM posts p
            ${whereClause}
        `, params);
        const total = totalResult[0].total;

        res.json({
            posts,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('获取动态列表错误:', error);
        res.status(500).json({
            error: '获取动态列表失败'
        });
    }
});

// 发布动态
router.post('/posts', [
    body('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('内容长度必须在1-1000个字符之间'),
    body('media_ids')
        .optional()
        .isArray()
        .withMessage('媒体ID必须是数组'),
    body('community')
        .optional()
        .isIn(['all', 'dogs', 'cats', 'rainbow', 'breeds'])
        .withMessage('无效的社区类型')
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

        const userId = req.user.id;
        const { content, media_ids, tags, community = 'all' } = req.body;

        // 验证媒体所有权
        if (media_ids && media_ids.length > 0) {
            const placeholders = media_ids.map(() => '?').join(',');
            const mediaCount = await query(
                `SELECT COUNT(*) as count FROM media WHERE id IN (${placeholders}) AND user_id = ?`,
                [...media_ids, userId]
            );

            if (mediaCount[0].count !== media_ids.length) {
                return res.status(403).json({
                    error: '无权使用部分媒体文件'
                });
            }
        }

        // 创建动态
        const result = await query(`
            INSERT INTO posts (
                user_id, content, media_ids, tags, community
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            userId,
            content,
            media_ids ? JSON.stringify(media_ids) : null,
            tags ? JSON.stringify(tags) : null,
            community
        ]);

        // 获取创建的动态
        const posts = await query(`
            SELECT
                p.*,
                u.username,
                u.nickname,
                u.avatar_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        const post = posts[0];
        post.media_ids = post.media_ids ? JSON.parse(post.media_ids) : [];
        post.tags = post.tags ? JSON.parse(post.tags) : [];
        post.is_liked = false;
        post.is_following = false;

        res.status(201).json({
            message: '动态发布成功',
            post
        });
    } catch (error) {
        console.error('发布动态错误:', error);
        res.status(500).json({
            error: '发布动态失败'
        });
    }
});

// 点赞/取消点赞
router.post('/like', [
    body('target_type')
        .isIn(['media', 'post'])
        .withMessage('目标类型必须是media或post'),
    body('target_id')
        .isInt()
        .withMessage('目标ID必须是整数')
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

        const userId = req.user.id;
        const { target_type, target_id } = req.body;

        // 检查是否已点赞
        const existingLike = await query(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
            [userId, target_type, target_id]
        );

        if (existingLike.length > 0) {
            // 取消点赞
            await query(
                'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
                [userId, target_type, target_id]
            );

            // 更新点赞计数
            await query(`
                UPDATE ${target_type}s
                SET likes_count = likes_count - 1
                WHERE id = ?
            `, [target_id]);

            res.json({
                message: '取消点赞成功',
                liked: false
            });
        } else {
            // 添加点赞
            await query(
                'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
                [userId, target_type, target_id]
            );

            // 更新点赞计数
            await query(`
                UPDATE ${target_type}s
                SET likes_count = likes_count + 1
                WHERE id = ?
            `, [target_id]);

            // 创建通知
            const target = await query(
                `SELECT user_id FROM ${target_type}s WHERE id = ?`,
                [target_id]
            );

            if (target.length > 0 && target[0].user_id !== userId) {
                await query(`
                    INSERT INTO notifications (user_id, type, content, related_id)
                    VALUES (?, 'like', ?, ?)
                `, [
                    target[0].user_id,
                    `有人${target_type === 'media' ? '赞了您的照片' : '赞了您的动态'}`,
                    target_id
                ]);
            }

            res.json({
                message: '点赞成功',
                liked: true
            });
        }
    } catch (error) {
        console.error('点赞操作错误:', error);
        res.status(500).json({
            error: '点赞操作失败'
        });
    }
});

// 添加评论
router.post('/comment', [
    body('target_type')
        .isIn(['media', 'post'])
        .withMessage('目标类型必须是media或post'),
    body('target_id')
        .isInt()
        .withMessage('目标ID必须是整数'),
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('评论内容长度必须在1-500个字符之间'),
    body('parent_id')
        .optional()
        .isInt()
        .withMessage('父评论ID必须是整数')
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

        const userId = req.user.id;
        const { target_type, target_id, content, parent_id } = req.body;

        // 验证目标是否存在
        const target = await query(
            `SELECT id, user_id FROM ${target_type}s WHERE id = ?`,
            [target_id]
        );

        if (target.length === 0) {
            return res.status(404).json({
                error: '目标不存在'
            });
        }

        // 如果是回复评论，验证父评论
        if (parent_id) {
            const parentComment = await query(
                'SELECT id FROM comments WHERE id = ?',
                [parent_id]
            );

            if (parentComment.length === 0) {
                return res.status(404).json({
                    error: '父评论不存在'
                });
            }
        }

        // 创建评论
        const result = await query(`
            INSERT INTO comments (
                user_id, target_type, target_id, content, parent_id
            ) VALUES (?, ?, ?, ?, ?)
        `, [userId, target_type, target_id, content, parent_id || null]);

        // 更新评论计数
        await query(`
            UPDATE ${target_type}s
            SET comments_count = comments_count + 1
            WHERE id = ?
        `, [target_id]);

        // 创建通知（如果不是给自己的内容评论）
        if (target[0].user_id !== userId) {
            await query(`
                INSERT INTO notifications (user_id, type, content, related_id)
                VALUES (?, 'comment', ?, ?)
            `, [
                target[0].user_id,
                `有人${target_type === 'media' ? '评论了您的照片' : '评论了您的动态'}`,
                target_id
            ]);
        }

        // 获取创建的评论
        const comments = await query(`
            SELECT
                c.*,
                u.username,
                u.nickname,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: '评论成功',
            comment: comments[0]
        });
    } catch (error) {
        console.error('添加评论错误:', error);
        res.status(500).json({
            error: '添加评论失败'
        });
    }
});

// 获取评论列表
router.get('/comments', async (req, res) => {
    try {
        const { target_type, target_id, page = 1, limit = 20 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        if (!target_type || !target_id) {
            return res.status(400).json({
                error: '缺少目标类型或ID'
            });
        }

        // 获取评论列表
        const comments = await query(`
            SELECT
                c.*,
                u.username,
                u.nickname,
                u.avatar_url,
                (SELECT COUNT(*) FROM likes WHERE target_type = 'comment' AND target_id = c.id) as likes_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.target_type = ? AND c.target_id = ? AND c.parent_id IS NULL
            ORDER BY c.created_at ASC
            LIMIT ? OFFSET ?
        `, [target_type, target_id, limitNum, offset]);

        // 获取回复
        for (const comment of comments) {
            const replies = await query(`
                SELECT
                    c.*,
                    u.username,
                    u.nickname,
                    u.avatar_url
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.parent_id = ?
                ORDER BY c.created_at ASC
            `, [comment.id]);
            comment.replies = replies;
        }

        res.json({
            comments,
            pagination: {
                page: parseInt(page),
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('获取评论错误:', error);
        res.status(500).json({
            error: '获取评论失败'
        });
    }
});

// 关注/取消关注
router.post('/follow', [
    body('following_id')
        .isInt()
        .withMessage('关注用户ID必须是整数')
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

        const followerId = req.user.id;
        const { following_id } = req.body;

        // 不能关注自己
        if (followerId === following_id) {
            return res.status(400).json({
                error: '不能关注自己'
            });
        }

        // 检查是否已关注
        const existingFollow = await query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, following_id]
        );

        if (existingFollow.length > 0) {
            // 取消关注
            await query(
                'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
                [followerId, following_id]
            );

            res.json({
                message: '取消关注成功',
                following: false
            });
        } else {
            // 添加关注
            await query(
                'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
                [followerId, following_id]
            );

            // 创建通知
            await query(`
                INSERT INTO notifications (user_id, type, content, related_id)
                VALUES (?, 'follow', '有人关注了您', ?)
            `, [following_id, followerId]);

            res.json({
                message: '关注成功',
                following: true
            });
        }
    } catch (error) {
        console.error('关注操作错误:', error);
        res.status(500).json({
            error: '关注操作失败'
        });
    }
});

// 获取关注列表
router.get('/following', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        const following = await query(`
            SELECT
                u.id,
                u.username,
                u.nickname,
                u.avatar_url,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limitNum, offset]);

        res.json({
            following,
            pagination: {
                page: parseInt(page),
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('获取关注列表错误:', error);
        res.status(500).json({
            error: '获取关注列表失败'
        });
    }
});

// 获取粉丝列表
router.get('/followers', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        const followers = await query(`
            SELECT
                u.id,
                u.username,
                u.nickname,
                u.avatar_url,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limitNum, offset]);

        res.json({
            followers,
            pagination: {
                page: parseInt(page),
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('获取粉丝列表错误:', error);
        res.status(500).json({
            error: '获取粉丝列表失败'
        });
    }
});

module.exports = router;