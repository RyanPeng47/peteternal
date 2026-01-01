// 装饰页面功能
document.addEventListener('DOMContentLoaded', function() {
    initTabSwitching();
    initThemeSelection();
    initWidgetSelection();
    initMusicPlayer();
});

// Tab切换功能
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.decoration-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 添加当前活动状态
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 主题选择功能
function initThemeSelection() {
    const themeCards = document.querySelectorAll('.theme-card');

    themeCards.forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
            showNotification(`已应用 "${this.querySelector('h3').textContent}" 主题`);
        });
    });
}

// 应用主题
function applyTheme(themeName) {
    const themes = {
        sakura: {
            background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)',
            animation: 'sakura'
        },
        grass: {
            background: 'linear-gradient(135deg, #90EE90, #98D8C8)',
            animation: 'grass'
        },
        starry: {
            background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
            animation: 'stars'
        },
        rainbow: {
            background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)',
            animation: 'rainbow'
        },
        weather: {
            background: 'linear-gradient(135deg, #74b9ff, #a29bfe)',
            animation: 'weather'
        }
    };

    const selectedTheme = themes[themeName];
    if (selectedTheme) {
        // 这里应该将主题设置保存到后端
        console.log('应用主题:', themeName);

        // 创建主题预览效果
        createThemeEffect(selectedTheme);
    }
}

// 创建主题效果
function createThemeEffect(theme) {
    // 创建临时效果展示
    const effect = document.createElement('div');
    effect.className = 'theme-effect';
    effect.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        background: ${theme.background};
        opacity: 0.1;
        z-index: -1;
        animation: fadeIn 0.5s ease;
    `;

    document.body.appendChild(effect);

    // 3秒后淡出
    setTimeout(() => {
        effect.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => effect.remove(), 500);
    }, 3000);
}

// 挂件选择功能
function initWidgetSelection() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const widgetItems = document.querySelectorAll('.widget-item');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;

            // 更新按钮状态
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 过滤显示挂件
            widgetItems.forEach(item => {
                if (item.classList.contains(category)) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 初始化显示第一个分类
    if (categoryBtns.length > 0) {
        categoryBtns[0].click();
    }

    // 挂件点击事件
    widgetItems.forEach(item => {
        item.addEventListener('click', function() {
            const widgetName = this.querySelector('span').textContent;
            toggleWidget(this, widgetName);
        });
    });
}

// 切换挂件
function toggleWidget(widgetElement, name) {
    widgetElement.classList.toggle('selected');

    if (widgetElement.classList.contains('selected')) {
        widgetElement.style.borderColor = 'var(--primary-color)';
        showNotification(`已添加 "${name}" 挂件`);
    } else {
        widgetElement.style.borderColor = 'transparent';
        showNotification(`已移除 "${name}" 挂件`);
    }
}

// 音乐播放器功能
function initMusicPlayer() {
    const playBtns = document.querySelectorAll('.play-btn');
    const uploadBtn = document.querySelector('.upload-btn');

    playBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const playlist = this.closest('.playlist-card');
            const title = playlist.querySelector('h4').textContent;
            togglePlay(this, title);
        });
    });

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/mp3,audio/wav';
            input.onchange = handleMusicUpload;
            input.click();
        });
    }
}

// 切换播放状态
let currentPlaying = null;

function togglePlay(btn, title) {
    const icon = btn.querySelector('i');

    // 如果点击的是当前播放的音乐
    if (currentPlaying === btn) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        currentPlaying = null;
        showNotification(`已暂停播放 "${title}"`);
    } else {
        // 停止之前的播放
        if (currentPlaying) {
            const prevIcon = currentPlaying.querySelector('i');
            prevIcon.classList.remove('fa-pause');
            prevIcon.classList.add('fa-play');
        }

        // 开始新的播放
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        currentPlaying = btn;
        showNotification(`正在播放 "${title}"`);

        // 模拟播放完成（5秒后）
        setTimeout(() => {
            if (currentPlaying === btn) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                currentPlaying = null;
            }
        }, 5000);
    }
}

// 处理音乐上传
function handleMusicUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
            showNotification('文件大小不能超过10MB');
            return;
        }

        // 检查文件类型
        if (!file.type.includes('audio')) {
            showNotification('请上传音频文件');
            return;
        }

        // 显示上传进度
        showNotification(`正在上传 "${file.name}"...`);

        // 模拟上传完成
        setTimeout(() => {
            showNotification('音乐上传成功！');
            addCustomPlaylist(file.name);
        }, 1500);
    }
}

// 添加自定义歌单
function addCustomPlaylist(fileName) {
    const playlistGrid = document.querySelector('.playlist-grid');
    const newPlaylist = document.createElement('div');
    newPlaylist.className = 'playlist-card';
    newPlaylist.innerHTML = `
        <div class="playlist-cover">
            <i class="fas fa-music"></i>
        </div>
        <h4>${fileName.replace(/\.[^/.]+$/, '')}</h4>
        <p>自定义音乐</p>
        <button class="play-btn">
            <i class="fas fa-play"></i>
        </button>
    `;

    playlistGrid.insertBefore(newPlaylist, playlistGrid.firstChild);

    // 为新歌单添加播放事件
    const playBtn = newPlaylist.querySelector('.play-btn');
    playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const title = newPlaylist.querySelector('h4').textContent;
        togglePlay(this, title);
    });

    // 添加动画效果
    newPlaylist.style.animation = 'fadeIn 0.5s ease';
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-color);
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

    @keyframes fadeOut {
        from {
            opacity: 0.1;
        }
        to {
            opacity: 0;
        }
    }

    .widget-item {
        transition: all 0.3s ease;
    }

    .widget-item.selected {
        border-color: var(--primary-color) !important;
        background: #fff5f5;
    }
`;
document.head.appendChild(style);