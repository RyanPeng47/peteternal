const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, checkOwnership } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 配置Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 配置multer用于内存存储
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // 最多5个文件
    },
    fileFilter: (req, file, cb) => {
        // 检查文件类型
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片和视频文件'));
        }
    }
});

// 上传单个文件
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: '请选择要上传的文件'
            });
        }

        const { pet_id, caption, stage, tags } = req.body;
        const userId = req.user.id;

        // 验证宠物所有权
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [pet_id, userId]
        );

        if (pets.length === 0) {
            return res.status(403).json({
                error: '无权访问此宠物'
            });
        }

        let fileUrl;
        let thumbnailUrl;

        if (req.file.mimetype.startsWith('image/')) {
            // 处理图片上传
            const imageBuffer = req.file.buffer;

            // 生成缩略图
            const thumbnailBuffer = await sharp(imageBuffer)
                .resize(200, 200, {
                    fit: 'cover'
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            // 上传到Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'peteternal',
                        public_id: `${userId}_${pet_id}_${Date.now()}`,
                        transformation: [
                            { quality: 'auto' },
                            { fetch_format: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(imageBuffer);
            });

            // 上传缩略图
            const thumbnailResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'peteternal/thumbnails',
                        public_id: `${userId}_${pet_id}_${Date.now()}_thumb`,
                        transformation: [
                            { width: 200, height: 200, crop: 'fill' },
                            { quality: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(thumbnailBuffer);
            });

            fileUrl = result.secure_url;
            thumbnailUrl = thumbnailResult.secure_url;
        } else {
            // 处理视频上传
            const videoBuffer = req.file.buffer;

            // 上传到Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: 'peteternal/videos',
                        public_id: `${userId}_${pet_id}_${Date.now()}`,
                        transformation: [
                            { quality: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(videoBuffer);
            });

            fileUrl = result.secure_url;
            thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
        }

        // 保存到数据库
        const mediaResult = await query(`
            INSERT INTO media (
                pet_id, user_id, type, file_url, thumbnail_url,
                caption, stage, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pet_id,
            userId,
            req.file.mimetype.startsWith('image/') ? 'photo' : 'video',
            fileUrl,
            thumbnailUrl,
            caption || null,
            stage || null,
            tags ? JSON.stringify(tags.split(',')) : null
        ]);

        res.status(201).json({
            message: '上传成功',
            media: {
                id: mediaResult.insertId,
                type: req.file.mimetype.startsWith('image/') ? 'photo' : 'video',
                file_url: fileUrl,
                thumbnail_url: thumbnailUrl,
                caption,
                stage,
                tags: tags ? tags.split(',') : []
            }
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({
            error: '文件上传失败',
            details: error.message
        });
    }
});

// 上传多个文件
router.post('/upload-multiple', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: '请选择要上传的文件'
            });
        }

        const { pet_id, stage } = req.body;
        const userId = req.user.id;

        // 验证宠物所有权
        const pets = await query(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [pet_id, userId]
        );

        if (pets.length === 0) {
            return res.status(403).json({
                error: '无权访问此宠物'
            });
        }

        // 使用事务处理多个文件上传
        const mediaItems = await transaction(async (connection) => {
            const results = [];

            for (const file of req.files) {
                let fileUrl;
                let thumbnailUrl;

                if (file.mimetype.startsWith('image/')) {
                    // 处理图片
                    const imageBuffer = file.buffer;

                    // 生成缩略图
                    const thumbnailBuffer = await sharp(imageBuffer)
                        .resize(200, 200, {
                            fit: 'cover'
                        })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    // 上传图片
                    const imageResult = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'image',
                                folder: 'peteternal',
                                public_id: `${userId}_${pet_id}_${Date.now()}_${file.originalname}`,
                                transformation: [
                                    { quality: 'auto' },
                                    { fetch_format: 'auto' }
                                ]
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        ).end(imageBuffer);
                    });

                    // 上传缩略图
                    const thumbnailResult = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'image',
                                folder: 'peteternal/thumbnails',
                                public_id: `${userId}_${pet_id}_${Date.now()}_${file.originalname}_thumb`,
                                transformation: [
                                    { width: 200, height: 200, crop: 'fill' },
                                    { quality: 'auto' }
                                ]
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        ).end(thumbnailBuffer);
                    });

                    fileUrl = imageResult.secure_url;
                    thumbnailUrl = thumbnailResult.secure_url;
                } else {
                    // 处理视频
                    const videoBuffer = file.buffer;

                    const videoResult = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'video',
                                folder: 'peteternal/videos',
                                public_id: `${userId}_${pet_id}_${Date.now()}_${file.originalname}`
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        ).end(videoBuffer);
                    });

                    fileUrl = videoResult.secure_url;
                    thumbnailUrl = videoResult.secure_url.replace(/\.[^/.]+$/, '.jpg');
                }

                // 保存到数据库
                const [result] = await connection.execute(`
                    INSERT INTO media (
                        pet_id, user_id, type, file_url, thumbnail_url, stage
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    pet_id,
                    userId,
                    file.mimetype.startsWith('image/') ? 'photo' : 'video',
                    fileUrl,
                    thumbnailUrl,
                    stage || null
                ]);

                results.push({
                    id: result.insertId,
                    type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
                    file_url: fileUrl,
                    thumbnail_url: thumbnailUrl
                });
            }

            return results;
        });

        res.status(201).json({
            message: '批量上传成功',
            count: mediaItems.length,
            media: mediaItems
        });
    } catch (error) {
        console.error('批量上传错误:', error);
        res.status(500).json({
            error: '批量上传失败',
            details: error.message
        });
    }
});

// 获取媒体列表
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { pet_id, type, stage, page = 1, limit = 20 } = req.query;
        const { limit: limitNum, offset } = paginate(page, limit);

        // 构建查询条件
        let whereClause = 'WHERE m.user_id = ?';
        const params = [userId];

        if (pet_id) {
            whereClause += ' AND m.pet_id = ?';
            params.push(pet_id);
        }
        if (type) {
            whereClause += ' AND m.type = ?';
            params.push(type);
        }
        if (stage) {
            whereClause += ' AND m.stage = ?';
            params.push(stage);
        }

        // 获取媒体列表
        const media = await query(`
            SELECT
                m.*,
                p.name as pet_name,
                p.avatar_url as pet_avatar
            FROM media m
            JOIN pets p ON m.pet_id = p.id
            ${whereClause}
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        // 获取总数
        const totalResult = await query(`
            SELECT COUNT(*) as total FROM media m
            JOIN pets p ON m.pet_id = p.id
            ${whereClause}
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
        console.error('获取媒体列表错误:', error);
        res.status(500).json({
            error: '获取媒体列表失败'
        });
    }
});

// 删除媒体
router.delete('/:id', async (req, res) => {
    try {
        const mediaId = req.params.id;
        const userId = req.user.id;

        // 获取媒体信息
        const media = await query(
            'SELECT * FROM media WHERE id = ? AND user_id = ?',
            [mediaId, userId]
        );

        if (media.length === 0) {
            return res.status(404).json({
                error: '媒体文件不存在'
            });
        }

        const mediaItem = media[0];

        // 从Cloudinary删除文件
        try {
            const publicId = mediaItem.file_url.split('/').pop().split('.')[0];
            const folder = mediaItem.type === 'photo' ? 'peteternal' : 'peteternal/videos';

            await cloudinary.uploader.destroy(`${folder}/${publicId}`, {
                resource_type: mediaItem.type
            });

            // 删除缩略图
            if (mediaItem.thumbnail_url) {
                const thumbPublicId = mediaItem.thumbnail_url.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`peteternal/thumbnails/${thumbPublicId}`);
            }
        } catch (cloudinaryError) {
            console.error('Cloudinary删除错误:', cloudinaryError);
            // 继续执行数据库删除
        }

        // 从数据库删除记录
        await query(
            'DELETE FROM media WHERE id = ? AND user_id = ?',
            [mediaId, userId]
        );

        res.json({
            message: '媒体删除成功'
        });
    } catch (error) {
        console.error('删除媒体错误:', error);
        res.status(500).json({
            error: '删除媒体失败'
        });
    }
});

module.exports = router;