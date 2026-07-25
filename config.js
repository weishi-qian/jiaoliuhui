// ========== API 地址配置 ==========
// 本地开发用 localhost，线上部署用相对路径（前后端同域名）
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : '/api';
