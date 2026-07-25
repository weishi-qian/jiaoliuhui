// ========== API 地址配置 ==========
// 本地开发时自动使用 localhost，部署后请修改下方 PROD_API_BASE 为你的后端地址
const PROD_API_BASE = 'https://你的后端地址.railway.app/api';
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : PROD_API_BASE;
