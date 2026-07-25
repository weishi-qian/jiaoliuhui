// API_BASE 来自父级 config.js（本地 localhost，生产 Railway 地址）

// 页面切换
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        const page = this.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById(page + 'Page').style.display = 'block';
        
        if (page === 'dashboard') {
            loadStatistics();
        } else if (page === 'registrations') {
            loadRegistrations();
        }
    });
});

// 加载统计数据
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/statistics`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('statTotal').textContent = result.data.total;
            document.getElementById('statAttend').textContent = result.data.attend;
            document.getElementById('statNotAttend').textContent = result.data.notAttend;
            document.getElementById('statHotel').textContent = result.data.needHotel;
        }
    } catch (error) {
        console.error('加载统计失败:', error);
    }
}

// 加载报名列表
async function loadRegistrations() {
    try {
        const response = await fetch(`${API_BASE}/registrations`);
        const result = await response.json();
        
        if (result.success) {
            renderRegistrations(result.data);
        }
    } catch (error) {
        console.error('加载报名列表失败:', error);
        alert('加载数据失败，请检查服务器连接');
    }
}

// 渲染报名列表
function renderRegistrations(data) {
    const filterStatus = document.getElementById('filterStatus').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    // 筛选
    let filtered = data;
    if (filterStatus !== '') {
        filtered = filtered.filter(item => item.attend_status == filterStatus);
    }
    if (searchText) {
        filtered = filtered.filter(item => 
            (item.name && item.name.toLowerCase().includes(searchText)) ||
            (item.hospital && item.hospital.toLowerCase().includes(searchText)) ||
            (item.phone && item.phone.includes(searchText))
        );
    }
    
    const tbody = document.getElementById('registrationsTableBody');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:30px;">暂无数据</td></tr>';
        return;
    }
    
    filtered.forEach(item => {
        const tr = document.createElement('tr');
        const statusClass = item.attend_status === 1 ? 'status-attend' : 'status-not-attend';
        const statusText = item.attend_status === 1 ? '确认参加' : '无法参加';
        const hotelText = item.need_hotel === 1 ? '需要' : '不需要';
        const createdAt = new Date(item.created_at).toLocaleString('zh-CN');
        
        const photoCell = item.photo
            ? `<img src="${item.photo}" class="table-photo" onclick="viewPhoto('${item.photo.replace(/'/g, "\\'")}', '${(item.name || '').replace(/'/g, "\\'")}')" title="点击查看大图">`
            : '<span style="color:#ccc;">-</span>';

        const resumeFileCell = item.resume_file 
            ? `<a href="${item.resume_file}" target="_blank" class="btn btn-attach" title="查看简历附件">📎 查看</a>`
            : '<span style="color:#ccc;">-</span>';
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${photoCell}</td>
            <td>${item.name || '-'}</td>
            <td>${item.title || '-'}</td>
            <td>${item.hospital || '-'}</td>
            <td>${item.department || '-'}</td>
            <td>${item.phone || '-'}</td>
            <td>${item.email || '-'}</td>
            <td>${resumeFileCell}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${hotelText}</td>
            <td>${createdAt}</td>
            <td>
                <button class="btn btn-view" onclick="viewDetail(${item.id})">查看</button>
                <button class="btn btn-delete" onclick="deleteRegistration(${item.id})">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 查看详情
async function viewDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/registrations/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const item = result.data;
            const statusText = item.attend_status === 1 ? '确认参加' : '无法参加';
            const hotelText = item.need_hotel === 1 ? '需要' : '不需要';
            const createdAt = new Date(item.created_at).toLocaleString('zh-CN');
            const photoHtml = item.photo
                ? `<img src="${item.photo}" class="detail-photo" onclick="viewPhoto('${item.photo.replace(/'/g, "\\'")}', '${(item.name || '').replace(/'/g, "\\'")}')" title="点击查看大图">`
                : '<span style="color:#999;">未上传照片</span>';

            const resumeFileHtml = item.resume_file
                ? `<a href="${item.resume_file}" target="_blank" class="btn btn-attach">📎 查看简历附件</a>
                   <a href="${item.resume_file}" download class="btn btn-primary" style="margin-left:8px;">下载附件</a>`
                : '<span style="color:#999;">未提交简历附件</span>';
            
            document.getElementById('detailContent').innerHTML = `
                <div class="detail-item full-width">
                    <label>头像照片</label>
                    <span>${photoHtml}</span>
                </div>
                <div class="detail-item">
                    <label>姓名</label>
                    <span>${item.name || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>职称</label>
                    <span>${item.title || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>医院/单位</label>
                    <span>${item.hospital || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>科室</label>
                    <span>${item.department || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>联系电话</label>
                    <span>${item.phone || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>电子邮箱</label>
                    <span>${item.email || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>身份证号</label>
                    <span>${item.id_card || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>参会状态</label>
                    <span>${statusText}</span>
                </div>
                <div class="detail-item">
                    <label>住宿需求</label>
                    <span>${hotelText}</span>
                </div>
                <div class="detail-item">
                    <label>入住日期</label>
                    <span>${item.hotel_dates || '-'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>抵达信息</label>
                    <span>${item.arrival_info || '-'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>备注/简历</label>
                    <span>${item.remarks || '-'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>简历附件</label>
                    <span>${resumeFileHtml}</span>
                </div>
                <div class="detail-item full-width">
                    <label>提交时间</label>
                    <span>${createdAt}</span>
                </div>
            `;
            document.getElementById('detailModal').style.display = 'block';
        }
    } catch (error) {
        console.error('加载详情失败:', error);
    }
}

// 关闭详情弹窗
function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// 删除报名
async function deleteRegistration(id) {
    if (!confirm('确定要删除这条报名信息吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/registrations/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('删除成功');
            loadRegistrations();
            loadStatistics();
        } else {
            alert('删除失败: ' + result.message);
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

// 导出数据为CSV
function exportData() {
    const rows = document.querySelectorAll('#registrationsTableBody tr');
    if (rows.length === 0 || rows[0].cells.length < 11) {
        alert('没有数据可导出');
        return;
    }
    
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += 'ID,照片,姓名,职称,医院/单位,科室,电话,邮箱,简历附件,参会状态,住宿,提交时间\n';
    
    rows.forEach(row => {
        if (row.cells.length >= 13) {
            const cells = Array.from(row.cells).slice(0, 12);
            csv += cells.map(cell => {
                let text = cell.textContent.trim().replace(/"/g, '""');
                return `"${text}"`;
            }).join(',') + '\n';
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '会议报名数据_' + new Date().toLocaleDateString('zh-CN') + '.csv';
    link.click();
}

// 监听筛选变化
document.getElementById('filterStatus').addEventListener('change', () => loadRegistrations());
document.getElementById('searchInput').addEventListener('input', () => loadRegistrations());

// 点击弹窗外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        closeDetailModal();
    }
};

// 查看大图
function viewPhoto(src, name) {
    document.getElementById('photoViewSrc').src = src;
    document.getElementById('photoViewName').textContent = name || '';
    document.getElementById('photoViewModal').style.display = 'block';
}

function closePhotoView() {
    document.getElementById('photoViewModal').style.display = 'none';
}

// 初始化
loadStatistics();
