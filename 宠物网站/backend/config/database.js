const mysql = require('mysql2/promise');

// 数据库连接池配置
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'peteternal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
};

// 创建连接池
const pool = mysql.createPool(poolConfig);

// 测试数据库连接
pool.getConnection()
    .then(connection => {
        console.log('✅ 数据库连接成功');
        connection.release();
    })
    .catch(err => {
        console.error('❌ 数据库连接失败:', err.message);
        process.exit(1);
    });

// 封装查询方法
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
};

// 封装事务方法
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// 分页查询辅助函数
const paginate = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { limit: parseInt(limit), offset };
};

// 构建WHERE条件辅助函数
const buildWhereClause = (filters) => {
    const where = [];
    const params = [];

    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
            if (Array.isArray(filters[key])) {
                const placeholders = filters[key].map(() => '?').join(',');
                where.push(`${key} IN (${placeholders})`);
                params.push(...filters[key]);
            } else {
                where.push(`${key} = ?`);
                params.push(filters[key]);
            }
        }
    });

    return {
        clause: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
        params
    };
};

module.exports = {
    pool,
    query,
    transaction,
    paginate,
    buildWhereClause
};