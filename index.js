let currentTaskId = null;

// ========== 照片上传预览 ==========
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="头像预览">`;
        };
        reader.readAsDataURL(file);
    }
});

// 获取头像照片的base64数据
function getPhotoBase64() {
    const img = document.querySelector('#photoPreview img');
    return img ? img.src : '';
}

// ========== 简历附件文件名显示与预览 ==========
let currentAttachmentFile = null;
let currentAttachmentUrl = null;

document.getElementById('resumeFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileNameEl = document.getElementById('fileName');
    const btnView = document.getElementById('btnViewFile');
    const btnDelete = document.getElementById('btnDeleteFile');
    const previewArea = document.getElementById('filePreviewArea');
    const attachmentActions = document.getElementById('attachmentActions');
    
    if (file) {
        // 大小限制 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB');
            this.value = '';
            return;
        }
        fileNameEl.textContent = file.name;
        btnView.style.display = 'inline-block';
        btnDelete.style.display = 'inline-block';
        attachmentActions.style.display = 'flex';
        // 释放旧URL
        if (currentAttachmentUrl) URL.revokeObjectURL(currentAttachmentUrl);
        currentAttachmentUrl = URL.createObjectURL(file);
        currentAttachmentFile = file;
        
        // 内联预览区
        const sizeStr = formatFileSize(file.size);
        const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        if (isPDF) {
            previewArea.style.display = 'block';
            previewArea.innerHTML = `<iframe src="${currentAttachmentUrl}" class="file-preview-iframe"></iframe>`;
        } else {
            previewArea.style.display = 'block';
            const iconMap = { doc:'📄', docx:'📄', ppt:'📊', pptx:'📊' };
            const ext = file.name.split('.').pop().toLowerCase();
            const icon = iconMap[ext] || '📎';
            previewArea.innerHTML = `
                <div class="file-preview-card">
                    <span class="file-preview-icon">${icon}</span>
                    <div class="file-preview-info">
                        <p class="file-preview-name">${file.name}</p>
                        <p class="file-preview-size">${sizeStr}</p>
                    </div>
                </div>`;
        }
    } else {
        resetAttachment();
    }
});

function resetAttachment() {
    document.getElementById('fileName').textContent = '未选择文件';
    document.getElementById('btnViewFile').style.display = 'none';
    document.getElementById('btnDeleteFile').style.display = 'none';
    document.getElementById('filePreviewArea').style.display = 'none';
    document.getElementById('filePreviewArea').innerHTML = '';
    document.getElementById('attachmentActions').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    if (currentAttachmentUrl) URL.revokeObjectURL(currentAttachmentUrl);
    currentAttachmentFile = null;
    currentAttachmentUrl = null;
    document.getElementById('resumeFile').value = '';
}

function deleteAttachment() {
    resetAttachment();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function viewAttachment() {
    if (!currentAttachmentFile || !currentAttachmentUrl) return;
    
    const titleEl = document.getElementById('fileViewTitle');
    const bodyEl = document.getElementById('fileViewBody');
    titleEl.textContent = currentAttachmentFile.name;
    
    const isPDF = currentAttachmentFile.type === 'application/pdf' || currentAttachmentFile.name.endsWith('.pdf');
    if (isPDF) {
        bodyEl.innerHTML = `<iframe src="${currentAttachmentUrl}" class="modal-preview-iframe"></iframe>`;
    } else {
        const sizeStr = formatFileSize(currentAttachmentFile.size);
        bodyEl.innerHTML = `
            <div class="modal-file-info">
                <p><strong>文件名：</strong>${currentAttachmentFile.name}</p>
                <p><strong>大小：</strong>${sizeStr}</p>
                <p><strong>类型：</strong>${currentAttachmentFile.type || '未知'}</p>
                <div class="form-actions">
                    <a href="${currentAttachmentUrl}" download="${currentAttachmentFile.name}" class="btn btn-submit">下载文件</a>
                    <a href="${currentAttachmentUrl}" target="_blank" class="btn btn-view-open">在新窗口打开</a>
                </div>
            </div>`;
    }
    
    document.getElementById('fileViewModal').style.display = 'block';
}

function closeFileViewModal() {
    document.getElementById('fileViewModal').style.display = 'none';
}

// ========== 附件上传 ==========
async function submitAttachment() {
    if (!currentAttachmentFile) {
        alert('请先选择文件');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    if (!name || !phone) {
        alert('请先在上方填写姓名和联系电话');
        return;
    }

    const formData = new FormData();
    formData.append('file', currentAttachmentFile);
    formData.append('name', name);
    formData.append('phone', phone);

    const progressArea = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressArea.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '上传中...';

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/attachment`);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = pct + '%';
                progressText.textContent = `上传中 ${pct}%`;
            }
        };

        const result = await new Promise((resolve, reject) => {
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('服务器返回了无效数据'));
                    }
                } else {
                    // 尝试解析服务器返回的错误信息
                    try {
                        const errData = JSON.parse(xhr.responseText);
                        reject(new Error(errData.message || '上传失败（HTTP ' + xhr.status + '）'));
                    } catch (e) {
                        reject(new Error('上传失败，服务器返回错误（HTTP ' + xhr.status + '）'));
                    }
                }
            };
            xhr.onerror = function() { reject(new Error('网络错误，请确认服务器是否已启动（node server.js）')); };
            xhr.send(formData);
        });

        if (result.success) {
            progressText.textContent = '上传完成';
            progressFill.style.width = '100%';
            showSuccess('简历附件上传成功！');
            // 上传成功后重置
            setTimeout(resetAttachment, 1500);
        } else {
            alert(result.message || '上传失败');
            progressArea.style.display = 'none';
        }
    } catch (error) {
        console.error('上传错误:', error);
        alert('上传失败: ' + error.message);
        progressArea.style.display = 'none';
    }
}

// ========== 富文本编辑器 ==========
const resumeEditor = document.getElementById('resumeEditor');
const resumeHidden = document.getElementById('resume');

// 同步编辑器内容到隐藏域
function syncEditorContent() {
    resumeHidden.value = resumeEditor.innerHTML;
}
resumeEditor.addEventListener('input', syncEditorContent);
resumeEditor.addEventListener('keyup', syncEditorContent);

// 执行格式化命令
function execCmd(command) {
    resumeEditor.focus();
    document.execCommand(command, false, null);
    syncEditorContent();
}

// ========== 特殊符号面板 ==========
const symbolPanel = document.getElementById('symbolPanel');

// 特殊符号集合
const symbolGroups = {
    greekSymbols: ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ψ','ω','Α','Β','Γ','Δ','Ε','Ζ','Η','Θ','Ι','Κ','Λ','Μ','Ν','Ξ','Ο','Π','Ρ','Σ','Τ','Υ','Φ','Χ','Ψ','Ω'],
    mathSymbols: ['±','×','÷','≈','≠','≤','≥','＜','＞','∞','∑','∏','√','∫','∂','∇','∈','∉','⊂','⊃','∪','∩','∀','∃','∠','⊥','°','′','″','‰','%','‰'],
    unitSymbols: ['℃','℉','㎎','㎏','㎍','㎕','㎖','㎗','㎘','㎛','㎜','㎝','㎞','㎡','㎢','㎣','㎤','㎥','㎟','㏄','㏕','mol','pH'],
    otherSymbols: ['①','②','③','④','⑤','⑥','★','☆','●','○','◆','◇','▲','△','■','□','©','®','™','→','←','↑','↓','↔','⇒','⇔','…','•','¶','§']
};

// 生成符号面板
function buildSymbolPanels() {
    for (const [groupId, symbols] of Object.entries(symbolGroups)) {
        const container = document.getElementById(groupId);
        if (!container) continue;
        symbols.forEach(sym => {
            const span = document.createElement('span');
            span.className = 'symbol-item';
            span.textContent = sym;
            span.title = sym;
            span.addEventListener('click', () => insertSymbol(sym));
            container.appendChild(span);
        });
    }
}
buildSymbolPanels();

function toggleSymbolPanel() {
    symbolPanel.classList.toggle('show');
}

function insertSymbol(symbol) {
    resumeEditor.focus();
    document.execCommand('insertText', false, symbol);
    syncEditorContent();
    symbolPanel.classList.remove('show');
}

// 点击面板外部关闭
document.addEventListener('click', function(e) {
    if (!symbolPanel.contains(e.target) && !e.target.classList.contains('symbol-btn')) {
        symbolPanel.classList.remove('show');
    }
});

// ========== 参会状态切换 ==========
document.querySelectorAll('input[name="attend"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const extra = document.getElementById('attendExtra');
        extra.style.display = this.value === '1' ? 'block' : 'none';
    });
});

// ========== 住宿需求切换 ==========
document.querySelectorAll('input[name="need_hotel"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const hotelDateGroup = document.getElementById('hotelDateGroup');
        hotelDateGroup.style.display = this.value === '1' ? 'block' : 'none';
    });
});

// ========== Session 详情 ==========
const sessionDetails = {
    1: {
        title: '开幕式嘉宾',
        content: `
            <p><strong>时间：</strong>2026年7月25日 08:00-08:30</p>
            <p><strong>地点：</strong>敕勒川1号厅（3层）</p>
            <p><strong>内容：</strong>第二届生物免疫治疗中心建设现场观摩交流会开幕式</p>
            <p><strong>担当：</strong>开幕式嘉宾</p>
            <p><strong>备注：</strong>请提前15分钟到场</p>
        `
    },
    2: {
        title: '从支气管热成形术谈对哮喘定义的重新认识',
        content: `
            <p><strong>时间：</strong>2026年7月25日 08:30-08:55</p>
            <p><strong>地点：</strong>敕勒川1号厅（3层）</p>
            <p><strong>讲题：</strong>从支气管热成形术谈对哮喘定义的重新认识</p>
            <p><strong>担当：</strong>专题演讲</p>
            <p><strong>备注：</strong>演讲时长25分钟</p>
        `
    },
    3: {
        title: '共识启动及框架讨论会',
        content: `
            <p><strong>时间：</strong>2026年7月25日 15:30-17:00</p>
            <p><strong>地点：</strong>紫薇厅（4层）</p>
            <p><strong>内容：</strong>"居家无创气道炎症检测在慢性气道炎症性疾病临床应用专家共识"启动和共识框架讨论会</p>
            <p><strong>担当：</strong>共识起草专家</p>
            <p><strong>备注：</strong>请提前准备相关文献资料</p>
        `
    }
};

function showSessionDetail(taskId) {
    const detail = sessionDetails[taskId];
    if (detail) {
        document.getElementById('sessionModalTitle').textContent = detail.title;
        document.getElementById('sessionModalBody').innerHTML = detail.content;
        document.getElementById('sessionModal').style.display = 'block';
    }
}

function closeSessionModal() {
    document.getElementById('sessionModal').style.display = 'none';
}

// ========== 任务确认 ==========
function confirmTask(taskId) {
    currentTaskId = taskId;
    document.getElementById('taskConfirmModal').style.display = 'block';
}

function closeTaskConfirmModal() {
    document.getElementById('taskConfirmModal').style.display = 'none';
    currentTaskId = null;
}

function submitTaskConfirm() {
    const status = document.querySelector('input[name="taskConfirm"]:checked').value;
    const taskCard = document.querySelector(`[data-task-id="${currentTaskId}"]`);
    const statusEl = taskCard.querySelector('.task-status');
    
    if (status === '1') {
        statusEl.textContent = '接受';
        statusEl.className = 'task-status accepted';
    } else {
        statusEl.textContent = '谢绝';
        statusEl.className = 'task-status pending';
        statusEl.style.background = '#ffebee';
        statusEl.style.color = '#c62828';
    }
    
    closeTaskConfirmModal();
    showSuccess('任务确认成功！');
}

// ========== 一键确认所有任务 ==========
function confirmAll() {
    document.querySelectorAll('.task-card').forEach(card => {
        const statusEl = card.querySelector('.task-status');
        statusEl.textContent = '接受';
        statusEl.className = 'task-status accepted';
    });
    showSuccess('所有任务已确认接受！');
}

// ========== 个人简历表单提交 ==========
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!name || !phone || !email) {
        alert('请填写必填项（姓名、电话、邮箱）');
        return;
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('请输入正确的邮箱地址');
        return;
    }
    
        // 同步编辑器内容
    syncEditorContent();

    const formData = {
        name: name,
        title: document.getElementById('title').value.trim(),
        hospital: document.getElementById('hospital').value.trim(),
        department: document.getElementById('department').value.trim(),
        phone: phone,
        email: email,
        resume: document.getElementById('resume').value,
        photo: getPhotoBase64()
    };

    fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showSuccess('个人简历提交成功！');
        } else {
            showSuccess('个人简历提交成功！（演示模式）');
        }
    }).catch(() => {
        showSuccess('个人简历提交成功！（演示模式）');
    });
});

// ========== 简历附件上传 ==========
function uploadResume() {
    const file = document.getElementById('resumeFile').files[0];
    if (!file) {
        alert('请先选择文件');
        return;
    }
    showSuccess('简历附件提交成功！');
}

// ========== 提交报名 ==========
async function submitRegistration() {
    const attendStatus = document.querySelector('input[name="attend"]:checked').value;
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!name || !phone || !email) {
        alert('请先完善个人信息（姓名、电话、邮箱为必填项）');
        return;
    }
    
    const data = {
        attend_status: attendStatus,
        name: name,
        title: document.getElementById('title').value,
        hospital: document.getElementById('hospital').value,
        department: document.getElementById('department').value,
        phone: phone,
        email: email,
        id_card: document.getElementById('idCard').value,
        need_hotel: attendStatus === '1' ? document.querySelector('input[name="need_hotel"]:checked').value : '0',
        hotel_dates: attendStatus === '1' ? Array.from(document.querySelectorAll('input[name="hotel_dates"]:checked')).map(cb => cb.value).join(',') : '',
        arrival_info: document.getElementById('arrivalInfo').value,
        remarks: document.getElementById('resume').value,
        photo: getPhotoBase64()
    };
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok && result.success) {
            showSuccess(attendStatus === '1' ? '报名成功！我们期待您的到来。' : '您的反馈已提交，感谢您的关注！');
        } else {
            alert(result.message || '提交失败（HTTP ' + response.status + '）');
        }
    } catch (error) {
        console.error('提交错误:', error);
        // 网络不通才走演示模式
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            showSuccess(attendStatus === '1' ? '报名成功！（演示模式 - 后端未启动）' : '反馈已提交！（演示模式 - 后端未启动）');
        } else {
            alert('提交失败: ' + error.message);
        }
    }
}

// ========== 成功提示 ==========
function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ========== 点击弹窗外部关闭 ==========
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
