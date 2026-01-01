const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { query, buildWhereClause, paginate } = require('../config/database');
const { authenticateToken, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户的所有宠物
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        let whereClause = 'WHERE user_id = ?';
        const params = [userId];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        // 获取宠物列表
        const pets = await query(`
            SELECT
                id, name, type, breed, gender, birth_date,
                weight, avatar_url, bio, status, death_date,
                created_at, updated_at
            FROM pets
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        // 获取总数
        const totalResult = await query(`
            SELECT COUNT(*) as total FROM pets ${whereClause}
        `, params);
        const total = totalResult[0].total;

        res.json({
            pets,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('获取宠物列表错误:', error);
        res.status(500).json({
            error: '获取宠物列表失败'
        });
    }
});

// 获取单个宠物详情
router.get('/:id', async (req, res) => {
    try {
        const petId = req.params.id;
        const userId = req.user.id;

        const pets = await query(`
            SELECT
                p.*,
                u.username as owner_username,
                u.nickname as owner_nickname
            FROM pets p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.user_id = ?
        `, [petId, userId]);

        if (pets.length === 0) {
            return res.status(404).json({
                error: '宠物不存在'
            });
        }

        const pet = pets[0];

        // 获取宠物的媒体数量
        const mediaCount = await query(
            'SELECT COUNT(*) as count FROM media WHERE pet_id = ?',
            [petId]
        );

        // 获取宠物的纪念事件数量
        const eventCount = await query(
            'SELECT COUNT(*) as count FROM memorial_events WHERE pet_id = ?',
            [petId]
        );

        pet.media_count = mediaCount[0].count;
        pet.event_count = eventCount[0].count;

        res.json({
            pet
        });
    } catch (error) {
        console.error('获取宠物详情错误:', error);
        res.status(500).json({
            error: '获取宠物详情失败'
        });
    }
});

// 创建新宠物
router.post('/', [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('宠物名字长度必须在1-50个字符之间'),
    body('type')
        .isIn(['dog', 'cat', 'other'])
        .withMessage('宠物类型必须是dog、cat或other'),
    body('breed')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('品种长度不能超过50个字符'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'unknown'])
        .withMessage('性别必须是male、female或unknown'),
    body('birth_date')
        .optional()
        .isISO8601()
        .withMessage('请输入有效的日期'),
    body('weight')
        .optional()
        .isFloat({ min: 0, max: 999.99 })
        .withMessage('体重必须是0-999.99之间的数字'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('简介长度不能超过500个字符')
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
        const {
            name,
            type,
            breed,
            gender,
            birth_date,
            weight,
            bio,
            avatar_url
        } = req.body;

        // 检查用户是否已有同名宠物
        const existingPets = await query(
            'SELECT id FROM pets WHERE user_id = ? AND name = ?',
            [userId, name]
        );

        if (existingPets.length > 0) {
            return res.status(409).json({
                error: '您已经有同名的宠物了'
            });
        }

        // 创建宠物
        const result = await query(`
            INSERT INTO pets (
                user_id, name, type, breed, gender,
                birth_date, weight, bio, avatar_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, name, type, breed || null, gender || null,
            birth_date || null, weight || null, bio || null, avatar_url || null
        ]);

        // 获取创建的宠物信息
        const newPets = await query(
            'SELECT * FROM pets WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: '宠物创建成功',
            pet: newPets[0]
        });
    } catch (error) {
        console.error('创建宠物错误:', error);
        res.status(500).json({
            error: '创建宠物失败'
        });
    }
});

// 更新宠物信息
router.put('/:id', [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('宠物名字长度必须在1-50个字符之间'),
    body('breed')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('品种长度不能超过50个字符'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('简介长度不能超过500个字符')
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

        const petId = req.params.id;
        const userId = req.user.id;

        // 检查宠物是否存在且属于当前用户
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({
                error: '宠物不存在'
            });
        }

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
            'name', 'type', 'breed', 'gender',
            'birth_date', 'weight', 'bio', 'avatar_url', 'status', 'death_date'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: '没有要更新的字段'
            });
        }

        // 执行更新
        await query(`
            UPDATE pets
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `, [...updateValues, petId, userId]);

        // 获取更新后的宠物信息
        const updatedPets = await query(
            'SELECT * FROM pets WHERE id = ?',
            [petId]
        );

        res.json({
            message: '宠物信息更新成功',
            pet: updatedPets[0]
        });
    } catch (error) {
        console.error('更新宠物错误:', error);
        res.status(500).json({
            error: '更新宠物信息失败'
        });
    }
});

// 删除宠物
router.delete('/:id', async (req, res) => {
    try {
        const petId = req.params.id;
        const userId = req.user.id;

        // 检查宠物是否存在且属于当前用户
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({
                error: '宠物不存在'
            });
        }

        // 删除宠物（由于设置了外键级联删除，相关数据会自动删除）
        await query(
            'DELETE FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );

        res.json({
            message: '宠物删除成功'
        });
    } catch (error) {
        console.error('删除宠物错误:', error);
        res.status(500).json({
            error: '删除宠物失败'
        });
    }
});

// 获取宠物的媒体文件
router.get('/:id/media', async (req, res) => {
    try {
        const petId = req.params.id;
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        // 验证宠物权限
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({
                error: '宠物不存在'
            });
        }

        // 构建查询条件
        let whereClause = 'WHERE pet_id = ?';
        const params = [petId];

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        // 获取媒体列表
        const media = await query(`
            SELECT
                id, type, file_url, thumbnail_url, caption,
                stage, likes_count, comments_count, created_at
            FROM media
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        // 获取总数
        const totalResult = await query(`
            SELECT COUNT(*) as total FROM media ${whereClause}
        `, params);
        const total = totalResult[0].total;

        res.json({
            media,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('获取宠物媒体错误:', error);
        res.status(500).json({
            error: '获取宠物媒体失败'
        });
    }
});

// 获取宠物的纪念事件
router.get('/:id/events', async (req, res) => {
    try {
        const petId = req.params.id;
        const userId = req.user.id;

        // 验证宠物权限
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [petId, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({
                error: '宠物不存在'
            });
        }

        // 获取纪念事件
        const events = await query(`
            SELECT
                id, type, title, description, event_date,
                repeat_type, reminder_sent, created_at
            FROM memorial_events
            WHERE pet_id = ?
            ORDER BY event_date DESC
        `, [petId]);

        res.json({
            events
        });
    } catch (error) {
        console.error('获取纪念事件错误:', error);
        res.status(500).json({
            error: '获取纪念事件失败'
        });
    }
});

module.exports = router;