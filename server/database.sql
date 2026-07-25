-- ========================================================
-- 第二届生物免疫治疗中心建设现场观摩交流会
-- 暨重度哮喘专题讨论会 - 数据库脚本
-- ========================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS conference_db 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE conference_db;

-- 创建报名表
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    attend_status TINYINT NOT NULL DEFAULT 1 COMMENT '参会状态：1-确认参加，0-无法参加',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    title VARCHAR(50) DEFAULT '' COMMENT '职称',
    hospital VARCHAR(100) DEFAULT '' COMMENT '所属医院/单位',
    department VARCHAR(50) DEFAULT '' COMMENT '科室',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    email VARCHAR(100) NOT NULL COMMENT '电子邮箱',
    id_card VARCHAR(18) DEFAULT '' COMMENT '身份证号',
    need_hotel TINYINT DEFAULT 0 COMMENT '是否需要住宿：1-需要，0-不需要',
    hotel_dates VARCHAR(50) DEFAULT '' COMMENT '入住日期，多个日期用逗号分隔',
    arrival_info TEXT COMMENT '抵达信息（航班/车次号、抵达时间）',
    remarks TEXT COMMENT '备注/简历',
    resume_file VARCHAR(500) DEFAULT '' COMMENT '简历附件路径',
    photo LONGTEXT COMMENT '头像照片(base64)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_attend_status (attend_status),
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会议报名信息表';

-- 插入测试数据（可选）
-- INSERT INTO registrations (attend_status, name, title, hospital, department, phone, email, id_card, need_hotel, hotel_dates, arrival_info, remarks) 
-- VALUES 
-- (1, '张三', '主任医师', '北京协和医院', '呼吸内科', '13800138001', 'zhangsan@example.com', '110101199001011234', 1, '2026-07-24', 'CA1234, 7月24日10:00抵达', '无'),
-- (1, '李四', '副主任医师', '上海瑞金医院', '变态反应科', '13900139001', 'lisi@example.com', '310101199002021234', 1, '2026-07-23,2026-07-24', 'G1234, 7月23日14:00抵达', '需要单间'),
-- (0, '王五', '教授', '广州医科大学', '呼吸疾病研究所', '13700137001', 'wangwu@example.com', '440101199003031234', 0, '', '', '时间冲突，无法参加');
