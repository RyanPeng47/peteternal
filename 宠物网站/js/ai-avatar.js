// AI卡通页面功能
document.addEventListener('DOMContentLoaded', function() {
    initUpload();
    initStyleSelection();
    initResultActions();
    initStickerCreation();
});

// 上传功能
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');

    // 点击上传按钮
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // 点击上传区域
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// 处理文件
function handleFile(file) {
    // 检查文件类型
    if (!file.type.includes('image')) {
        showNotification('请选择图片文件', 'error');
        return;
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
        showNotification('文件大小不能超过10MB', 'error');
        return;
    }

    // 预览图片
    const reader = new FileReader();
    reader.onload = (e) => {
        showPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 显示预览
function showPreview(imageSrc) {
    const uploadArea = document.getElementById('uploadArea');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    const styleSection = document.getElementById('styleSection');

    previewImage.src = imageSrc;
    uploadArea.style.display = 'none';
    previewSection.style.display = 'block';
    styleSection.style.display = 'block';

    // 添加动画效果
    previewSection.style.animation = 'fadeIn 0.5s ease';
    styleSection.style.animation = 'fadeIn 0.5s ease 0.2s both';

    // 更换照片功能
    const changeBtn = document.querySelector('.change-photo-btn');
    changeBtn.onclick = () => {
        document.getElementById('fileInput').click();
    };
}

// 风格选择
function initStyleSelection() {
    const styleCards = document.querySelectorAll('.style-card');

    styleCards.forEach(card => {
        card.addEventListener('click', function() {
            // 移除其他选中状态
            styleCards.forEach(c => c.classList.remove('selected'));

            // 添加选中状态
            this.classList.add('selected');

            // 生成卡通形象
            const style = this.dataset.style;
            generateAvatar(style);
        });
    });
}

// 生成卡通形象
function generateAvatar(style) {
    const resultSection = document.getElementById('resultSection');
    const processingOverlay = document.getElementById('processingOverlay');
    const generatedImage = document.getElementById('generatedImage');

    // 显示结果区域
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });

    // 显示处理中
    processingOverlay.style.display = 'flex';

    // 模拟AI生成过程
    setTimeout(() => {
        // 生成模拟图片
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // 根据不同风格生成不同的效果
        switch(style) {
            case 'pixar':
                drawPixarStyle(ctx);
                break;
            case 'watercolor':
                drawWatercolorStyle(ctx);
                break;
            case 'cyberpunk':
                drawCyberpunkStyle(ctx);
                break;
            case 'cartoon':
                drawCartoonStyle(ctx);
                break;
        }

        // 显示结果
        generatedImage.src = canvas.toDataURL();
        processingOverlay.style.display = 'none';

        // 保存到历史记录
        saveToHistory(generatedImage.src, style);

        showNotification('卡通形象生成成功！');
    }, 3000);
}

// 绘制皮克斯风格
function drawPixarStyle(ctx) {
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(1, '#4ECDC4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);

    // 绘制3D效果的圆形
    ctx.fillStyle = '#FFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, Math.PI * 2);
    ctx.fill();

    // 添加眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(170, 180, 10, 0, Math.PI * 2);
    ctx.arc(230, 180, 10, 0, Math.PI * 2);
    ctx.fill();

    // 添加嘴巴
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(200, 210, 30, 0, Math.PI);
    ctx.stroke();
}

// 绘制水彩风格
function drawWatercolorStyle(ctx) {
    // 水彩背景
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.fillRect(0, 0, 400, 400);

    // 添加水彩效果
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(118, 75, 162, ${0.1 + i * 0.05})`;
        ctx.beginPath();
        ctx.arc(
            200 + Math.random() * 100 - 50,
            200 + Math.random() * 100 - 50,
            50 + Math.random() * 50,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // 绘制主体
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(200, 200, 80, 0, Math.PI * 2);
    ctx.stroke();

    // 添加细节
    ctx.fillStyle = '#764ba2';
    ctx.beginPath();
    ctx.arc(175, 185, 5, 0, Math.PI * 2);
    ctx.arc(225, 185, 5, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制赛博朋克风格
function drawCyberpunkStyle(ctx) {
    // 背景网格
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 400, 400);

    // 网格线
    ctx.strokeStyle = '#f093fb';
    ctx.lineWidth = 1;
    for (let i = 0; i < 400; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 400);
        ctx.moveTo(0, i);
        ctx.lineTo(400, i);
        ctx.stroke();
    }

    // 霓虹效果
    ctx.shadowColor = '#f5576c';
    ctx.shadowBlur = 20;

    ctx.strokeStyle = '#f5576c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.lineTo(250, 150);
    ctx.lineTo(250, 250);
    ctx.lineTo(150, 250);
    ctx.closePath();
    ctx.stroke();

    // 添加科技感细节
    ctx.fillStyle = '#f093fb';
    ctx.font = '20px monospace';
    ctx.fillText('AI PET', 160, 280);
}

// 绘制卡通风格
function drawCartoonStyle(ctx) {
    // 黄色背景
    ctx.fillStyle = '#fee140';
    ctx.fillRect(0, 0, 400, 400);

    // 卡通形象
    ctx.fillStyle = '#fa709a';
    ctx.beginPath();
    ctx.arc(200, 200, 90, 0, Math.PI * 2);
    ctx.fill();

    // 大眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(170, 180, 25, 30, 0, 0, Math.PI * 2);
    ctx.ellipse(230, 180, 25, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(170, 180, 10, 0, Math.PI * 2);
    ctx.arc(230, 180, 10, 0, Math.PI * 2);
    ctx.fill();

    // 可爱的嘴巴
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(200, 220, 15, 0, Math.PI);
    ctx.fill();

    // 腮红
    ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    ctx.beginPath();
    ctx.arc(140, 200, 20, 0, Math.PI * 2);
    ctx.arc(260, 200, 20, 0, Math.PI * 2);
    ctx.fill();
}

// 结果操作
function initResultActions() {
    const downloadBtn = document.querySelector('.download-btn');
    const shareBtn = document.querySelector('.share-btn');
    const stickerBtn = document.querySelector('.sticker-btn');
    const regenerateBtn = document.querySelector('.regenerate-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', shareImage);
    }

    if (stickerBtn) {
        stickerBtn.addEventListener('click', showStickerSection);
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            const selectedStyle = document.querySelector('.style-card.selected');
            if (selectedStyle) {
                generateAvatar(selectedStyle.dataset.style);
            } else {
                showNotification('请先选择一个风格', 'error');
            }
        });
    }
}

// 下载图片
function downloadImage() {
    const link = document.createElement('a');
    link.download = `pet-avatar-${Date.now()}.png`;
    link.href = document.getElementById('generatedImage').src;
    link.click();

    showNotification('图片下载成功！');
}

// 分享图片
function shareImage() {
    const imageData = document.getElementById('generatedImage').src;

    if (navigator.share) {
        navigator.share({
            title: '我的宠物卡通形象',
            text: '快看我的爱宠卡通形象！',
            url: window.location.href
        }).then(() => {
            showNotification('分享成功！');
        }).catch(() => {
            copyToClipboard(window.location.href);
        });
    } else {
        copyToClipboard(window.location.href);
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showNotification('链接已复制到剪贴板');
}

// 显示表情包制作区域
function showStickerSection() {
    const stickerSection = document.getElementById('stickerSection');
    stickerSection.style.display = 'block';
    stickerSection.scrollIntoView({ behavior: 'smooth' });
}

// 表情包制作
function initStickerCreation() {
    const templateCards = document.querySelectorAll('.template-card');
    const stickerResult = document.getElementById('stickerResult');

    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            const template = this.dataset.template;
            createSticker(template);
        });
    });
}

// 创建表情包
function createSticker(template) {
    const stickerResult = document.getElementById('stickerResult');
    const sourceImage = document.getElementById('generatedImage').src;

    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // 绘制原图
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, 200, 200);

        // 添加表情效果
        switch(template) {
            case 'happy':
                addHappyEffect(ctx);
                break;
            case 'love':
                addLoveEffect(ctx);
                break;
            case 'sleepy':
                addSleepyEffect(ctx);
                break;
            case 'cute':
                addCuteEffect(ctx);
                break;
        }

        // 显示结果
        stickerResult.innerHTML = `
            <img src="${canvas.toDataURL()}" alt="表情包">
            <button class="sticker-download-btn" onclick="downloadSticker('${canvas.toDataURL()}')">
                <i class="fas fa-download"></i>
                下载表情包
            </button>
        `;
    };
    img.src = sourceImage;
}

// 添加开心效果
function addHappyEffect(ctx) {
    ctx.fillStyle = 'rgba(255, 223, 0, 0.3)';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('^_^', 100, 50);
}

// 添加喜爱效果
function addLoveEffect(ctx) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
        ctx.fillText('♥', 30 + i * 70, 180);
    }
}

// 添加困困效果
function addSleepyEffect(ctx) {
    ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Z z z', 150, 50);
}

// 添加可爱效果
function addCuteEffect(ctx) {
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(100, 100, 90, 0, Math.PI * 2);
    ctx.stroke();
}

// 下载表情包
function downloadSticker(dataUrl) {
    const link = document.createElement('a');
    link.download = `pet-sticker-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    showNotification('表情包下载成功！');
}

// 保存到历史记录
function saveToHistory(imageSrc, style) {
    const history = JSON.parse(localStorage.getItem('avatarHistory') || '[]');
    const newHistoryItem = {
        id: Date.now(),
        image: imageSrc,
        style: style,
        date: new Date().toLocaleDateString()
    };

    history.unshift(newHistoryItem);

    // 只保留最近10条记录
    if (history.length > 10) {
        history.pop();
    }

    localStorage.setItem('avatarHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

// 更新历史记录显示
function updateHistoryDisplay() {
    const historyGrid = document.getElementById('historyGrid');
    const history = JSON.parse(localStorage.getItem('avatarHistory') || '[]');

    if (history.length === 0) {
        historyGrid.innerHTML = `
            <div class="history-placeholder">
                <i class="fas fa-history"></i>
                <p>暂无历史记录</p>
            </div>
        `;
        return;
    }

    historyGrid.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.image}', '${item.style}')">
            <img src="${item.image}" alt="历史作品">
            <div class="history-item-info">
                <h4>${getStyleName(item.style)}</h4>
                <p>${item.date}</p>
            </div>
        </div>
    `).join('');
}

// 获取风格名称
function getStyleName(style) {
    const styleNames = {
        pixar: '皮克斯3D',
        watercolor: '手绘水彩',
        cyberpunk: '赛博朋克',
        cartoon: '美式卡通'
    };
    return styleNames[style] || style;
}

// 从历史记录加载
function loadFromHistory(imageSrc, style) {
    document.getElementById('generatedImage').src = imageSrc;
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });

    // 更新风格选择状态
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.style === style) {
            card.classList.add('selected');
        }
    });

    showNotification('已加载历史作品');
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff6b6b' : 'var(--primary-color)'};
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .sticker-download-btn {
        margin-top: 20px;
        padding: 10px 20px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
    }

    .sticker-download-btn:hover {
        background: #6D5A44;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// 初始化历史记录显示
updateHistoryDisplay();