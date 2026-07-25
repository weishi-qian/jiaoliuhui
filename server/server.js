const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resume-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function(req, file, cb) {
        const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            // 使用 Error 而非 false，这样 MulterError 中间件能捕获
            const err = new Error('仅支持 PDF、DOC、DOCX、PPT、PPTX 格式，当前文件类型: ' + ext);
            err.code = 'FILE_TYPE_NOT_ALLOWED';
            cb(err);
        }
    }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 前端页面和管理页面
app.use(express.static(path.join(__dirname, '..')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(uploadsDir));

// 数据库配置 - 本地用默认值，Railway 自动读取环境变量
const dbConfig = process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL }
    : {
        host: process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || '3306', 10),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || 'root',
        database: process.env.MYSQLDATABASE || 'conference_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功！');
        connection.release();
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        // 打印诊断信息（脱敏）
        const diag = process.env.MYSQL_URL
            ? { mode: 'MYSQL_URL', url: process.env.MYSQL_URL.replace(/:([^@]+)@/, ':***@') }
            : {
                mode: '分开变量',
                host: process.env.MYSQLHOST || '(默认localhost)',
                port: process.env.MYSQLPORT || '(默认3306)',
                user: process.env.MYSQLUSER || '(默认root)',
                database: process.env.MYSQLDATABASE || '(默认conference_db)'
            };
        console.log('当前数据库配置:', JSON.stringify(diag));
    }
}

// ========== API 路由 ==========

// 提交个人简历
app.post('/api/profile', async (req, res) => {
    try {
        const { name, title, hospital, department, phone, email, resume, photo } = req.body;

        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: '姓名、电话和邮箱为必填项'
            });
        }

        // 检查是否已存在（按手机号去重）
        const [existing] = await pool.execute(
            'SELECT id FROM registrations WHERE phone = ?',
            [phone]
        );

        if (existing.length > 0) {
            // 更新已有记录
            await pool.execute(
                `UPDATE registrations SET name=?, title=?, hospital=?, department=?, email=?, remarks=?, photo=? WHERE phone=?`,
                [name, title || '', hospital || '', department || '', email, resume || '', photo || '', phone]
            );
            res.json({ success: true, message: '个人简历更新成功', data: { id: existing[0].id } });
        } else {
            // 新增记录
            const [result] = await pool.execute(
                `INSERT INTO registrations (name, title, hospital, department, phone, email, remarks, photo, attend_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1')`,
                [name, title || '', hospital || '', department || '', phone, email, resume || '', photo || '']
            );
            res.json({ success: true, message: '个人简历提交成功', data: { id: result.insertId } });
        }
    } catch (error) {
        console.error('简历提交失败:', error);
        res.status(500).json({ success: false, message: '简历提交失败: ' + error.message });
    }
});

// 上传简历附件
app.post('/api/attachment', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请选择文件' });
        }

        const { name, phone } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: '缺少姓名或电话信息' });
        }

        const filePath = '/uploads/' + req.file.filename;

        // 查找并更新对应记录
        const [existing] = await pool.execute(
            'SELECT id FROM registrations WHERE phone = ?',
            [phone]
        );

        if (existing.length > 0) {
            await pool.execute(
                'UPDATE registrations SET resume_file = ?, name = ? WHERE phone = ?',
                [filePath, name, phone]
            );
        } else {
            await pool.execute(
                `INSERT INTO registrations (name, phone, email, resume_file, attend_status)
                 VALUES (?, ?, ?, ?, '1')`,
                [name, phone, phone + '@temp.com', filePath]
            );
        }

        res.json({
            success: true,
            message: '简历附件上传成功',
            data: { file: req.file.originalname, path: filePath }
        });
    } catch (error) {
        console.error('附件上传失败:', error);
        res.status(500).json({ success: false, message: '附件上传失败: ' + error.message });
    }
});

// 提交报名
app.post('/api/register', async (req, res) => {
    try {
        const {
            attend_status,
            name,
            title,
            hospital,
            department,
            phone,
            email,
            id_card,
            need_hotel,
            hotel_dates,
            arrival_info,
            remarks,
            photo
        } = req.body;

        // 参数验证
        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: '姓名、电话和邮箱为必填项'
            });
        }

        const sql = `
            INSERT INTO registrations 
            (attend_status, name, title, hospital, department, phone, email, id_card, need_hotel, hotel_dates, arrival_info, remarks, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            attend_status || '1',
            name,
            title || '',
            hospital || '',
            department || '',
            phone,
            email,
            id_card || '',
            need_hotel || '0',
            hotel_dates || '',
            arrival_info || '',
            remarks || '',
            photo || ''
        ]);

        res.json({
            success: true,
            message: '报名成功',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('报名失败:', error);
        res.status(500).json({
            success: false,
            message: '报名失败: ' + error.message
        });
    }
});

// 获取所有报名信息
app.get('/api/registrations', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('查询失败:', error);
        res.status(500).json({
            success: false,
            message: '查询失败: ' + error.message
        });
    }
});

// 获取单个报名信息
app.get('/api/registrations/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到该报名信息'
            });
        }
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('查询失败:', error);
        res.status(500).json({
            success: false,
            message: '查询失败: ' + error.message
        });
    }
});

// 删除报名信息
app.delete('/api/registrations/:id', async (req, res) => {
    try {
        await pool.execute(
            'DELETE FROM registrations WHERE id = ?',
            [req.params.id]
        );
        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除失败:', error);
        res.status(500).json({
            success: false,
            message: '删除失败: ' + error.message
        });
    }
});

// 获取统计信息
app.get('/api/statistics', async (req, res) => {
    try {
        const [totalRows] = await pool.execute(
            'SELECT COUNT(*) as total FROM registrations'
        );
        const [attendRows] = await pool.execute(
            'SELECT COUNT(*) as attend FROM registrations WHERE attend_status = 1'
        );
        const [notAttendRows] = await pool.execute(
            'SELECT COUNT(*) as not_attend FROM registrations WHERE attend_status = 0'
        );
        const [hotelRows] = await pool.execute(
            'SELECT COUNT(*) as need_hotel FROM registrations WHERE need_hotel = 1'
        );

        res.json({
            success: true,
            data: {
                total: totalRows[0].total,
                attend: attendRows[0].attend,
                notAttend: notAttendRows[0].not_attend,
                needHotel: hotelRows[0].need_hotel
            }
        });
    } catch (error) {
        console.error('统计失败:', error);
        res.status(500).json({
            success: false,
            message: '统计失败: ' + error.message
        });
    }
});

// ========== 全局错误处理（捕获 multer 等中间件的错误） ==========
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.message);

    // 请求体过大
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({
            success: false,
            message: '提交数据过大，请尝试缩小照片尺寸后再试'
        });
    }

    // Multer 错误处理
    if (err.name === 'MulterError') {
        const messages = {
            'LIMIT_FILE_SIZE': '文件大小超过限制（最大 10MB）',
            'LIMIT_FILE_COUNT': '文件数量超过限制',
            'LIMIT_UNEXPECTED_FILE': '上传字段名不匹配',
            'LIMIT_FIELD_KEY': '字段名过长',
            'LIMIT_FIELD_VALUE': '字段值过长',
            'LIMIT_FIELD_COUNT': '字段数量超过限制',
            'LIMIT_PART_COUNT': '请求部分数量超过限制'
        };
        return res.status(400).json({
            success: false,
            message: messages[err.code] || ('文件上传错误: ' + err.message)
        });
    }

    // 自定义文件类型错误
    if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // 其他错误
    res.status(500).json({
        success: false,
        message: '服务器内部错误: ' + err.message
    });
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`服务器运行在端口:${port}`);
  console.log(`管理后台: /admin`);
  testConnection();
});
