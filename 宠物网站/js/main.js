// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化功能
    initNavigation();
    initTabSwitching();
    initMediaUpload();
    initScrollAnimations();
    initTimelineFilter();
    initMediaActions();
});

// 导航功能
function initNavigation() {
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.nav-menu a, .bottom-nav a');

    // 点击导航链接时的处理
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // 如果是页面内锚点
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // 平滑滚动到目标元素
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // 滚动时更新活动导航项
    window.addEventListener('scroll', updateActiveNav);
}

// 更新活动导航项
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            // 更新顶部导航
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            // 更新底部导航
            document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
                item.classList.remove('active');
                const link = item.querySelector('a');
                if (link && link.getAttribute('href') === `#${sectionId}`) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// Tab切换功能
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const petProfile = document.querySelector('.pet-profile');
    const mediaGrid = document.querySelector('.media-grid');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的活动状态
            this.classList.add('active');

            // 根据选中的tab显示不同内容
            if (this.textContent === '添加宠物') {
                showAddPetForm();
            } else {
                showPetProfile();
            }
        });
    });
}

// 显示添加宠物表单
function showAddPetForm() {
    const petProfile = document.querySelector('.pet-profile');
    petProfile.innerHTML = `
        <div class="add-pet-form">
            <h3>添加新宠物</h3>
            <form id="addPetForm">
                <div class="form-group">
                    <label for="petName">宠物名字</label>
                    <input type="text" id="petName" name="petName" required>
                </div>
                <div class="form-group">
                    <label for="petType">宠物类型</label>
                    <select id="petType" name="petType" required>
                        <option value="">请选择</option>
                        <option value="dog">狗狗</option>
                        <option value="cat">猫咪</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="petBreed">品种</label>
                    <input type="text" id="petBreed" name="petBreed" required>
                </div>
                <div class="form-group">
                    <label for="petBirthday">生日</label>
                    <input type="date" id="petBirthday" name="petBirthday">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">创建宠物空间</button>
                    <button type="button" class="btn-secondary" onclick="showPetProfile()">取消</button>
                </div>
            </form>
        </div>
    `;

    // 处理表单提交
    document.getElementById('addPetForm').addEventListener('submit', handleAddPet);
}

// 显示宠物资料
function showPetProfile() {
    location.reload(); // 简单处理，实际应该更新状态
}

// 处理添加宠物
function handleAddPet(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const petData = Object.fromEntries(formData);

    // 这里应该发送数据到服务器
    console.log('新宠物数据:', petData);

    // 显示成功提示
    showNotification('宠物空间创建成功！');

    // 切换回我的宠物tab
    setTimeout(() => {
        document.querySelector('.tab-btn').click();
    }, 1500);
}

// 媒体上传功能
function initMediaUpload() {
    const avatarUpload = document.querySelector('.avatar-upload');
    const addMediaBtn = document.querySelector('.add-btn');

    if (avatarUpload) {
        avatarUpload.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = handleAvatarUpload;
            input.click();
        });
    }

    if (addMediaBtn) {
        addMediaBtn.addEventListener('click', function() {
            showMediaUploadOptions();
        });
    }
}

// 处理头像上传
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImg = document.querySelector('.pet-avatar img');
            if (avatarImg) {
                avatarImg.src = e.target.result;
                showNotification('头像更新成功！');
            }
        };
        reader.readAsDataURL(file);
    }
}

// 显示媒体上传选项
function showMediaUploadOptions() {
    const options = [
        { icon: 'fa-camera', text: '拍照', action: 'camera' },
        { icon: 'fa-images', text: '从相册选择', action: 'gallery' },
        { icon: 'fa-video', text: '录制视频', action: 'video' }
    ];

    // 创建模态框显示选项
    const modal = createModal('上传内容', options);
    document.body.appendChild(modal);
}

// 创建模态框
function createModal(title, options) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()"></div>
        <div class="modal-content">
            <h3>${title}</h3>
            <div class="modal-options">
                ${options.map(option => `
                    <button class="modal-option" onclick="handleModalAction('${option.action}')">
                        <i class="fas ${option.icon}"></i>
                        <span>${option.text}</span>
                    </button>
                `).join('')}
            </div>
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
            position: relative;
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .modal-content h3 {
            margin-bottom: 20px;
            text-align: center;
            color: var(--primary-color);
        }

        .modal-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .modal-option {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
        }

        .modal-option:hover {
            border-color: var(--secondary-color);
            background: #f8fffe;
        }

        .modal-option i {
            font-size: 24px;
            color: var(--secondary-color);
        }

        .modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 20px;
            color: var(--text-secondary);
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    return modal;
}

// 处理模态框操作
function handleModalAction(action) {
    closeModal();

    switch(action) {
        case 'camera':
            // 调用相机
            console.log('打开相机');
            break;
        case 'gallery':
            // 打开相册
            console.log('打开相册');
            break;
        case 'video':
            // 录制视频
            console.log('录制视频');
            break;
    }
}

// 关闭模态框
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// 滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察所有feature卡片
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // 添加样式
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

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 添加动画样式
const animationStyles = document.createElement('style');
animationStyles.textContent = `
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

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        color: var(--text-primary);
        font-weight: 500;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 10px 15px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--secondary-color);
    }

    .form-actions {
        display: flex;
        gap: 15px;
        margin-top: 30px;
    }

    .add-pet-form {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
    }

    .add-pet-form h3 {
        text-align: center;
        margin-bottom: 30px;
        color: var(--primary-color);
    }
`;
document.head.appendChild(animationStyles);

// 时间轴筛选功能
function initTimelineFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const mediaItems = document.querySelectorAll('.media-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const stage = this.dataset.stage;

            // 更新按钮状态
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 过滤媒体项
            filterMediaItems(stage);
        });
    });
}

// 过滤媒体项
function filterMediaItems(stage) {
    const mediaItems = document.querySelectorAll('.media-item');

    mediaItems.forEach(item => {
        if (stage === 'all') {
            item.style.display = 'block';
        } else {
            // 这里可以根据实际数据添加过滤逻辑
            // 暂时显示所有项目
            item.style.display = 'block';
        }
    });
}

// 媒体互动功能
function initMediaActions() {
    const actionBtns = document.querySelectorAll('.action-btn');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            if (this.querySelector('.fa-heart')) {
                toggleLike(this);
            } else if (this.querySelector('.fa-comment')) {
                // 可以扩展评论功能
                showNotification('评论功能开发中...');
            }
        });
    });

    // 点击媒体项查看详情
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发查看详情
            if (e.target.closest('.action-btn')) return;

            viewMediaDetail(this);
        });
    });
}

// 切换点赞状态
function toggleLike(btn) {
    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('span');
    let count = parseInt(countSpan.textContent);

    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ff4757';
        countSpan.textContent = count + 1;
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
        countSpan.textContent = count - 1;
    }
}

// 查看媒体详情
function viewMediaDetail(mediaItem) {
    const img = mediaItem.querySelector('img');
    const modal = createMediaModal(img.src);
    document.body.appendChild(modal);
}

// 创建媒体查看模态框
function createMediaModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeMediaModal()"></div>
        <div class="modal-content">
            <img src="${imageSrc}" alt="查看大图">
            <button class="modal-close" onclick="closeMediaModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // 添加样式
    if (!document.querySelector('#media-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'media-modal-styles';
        style.textContent = `
            .media-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }

            .modal-content {
                position: relative;
                max-width: 90%;
                max-height: 90%;
            }

            .modal-content img {
                max-width: 100%;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 12px;
            }

            .modal-close {
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 30px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    return modal;
}

// 关闭媒体模态框
function closeMediaModal() {
    const modal = document.querySelector('.media-modal');
    if (modal) {
        modal.remove();
    }
}

// 上传媒体功能
function uploadMedia() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = handleMediaUpload;
    input.click();
}

// 处理媒体上传
function handleMediaUpload(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        if (file.type.includes('image')) {
            handleImageUpload(file);
        } else if (file.type.includes('video')) {
            handleVideoUpload(file);
        }
    });
}

// 处理图片上传
function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const mediaGrid = document.getElementById('mediaGrid');
        const newMediaItem = createMediaItem(e.target.result, 'photo');
        mediaGrid.insertBefore(newMediaItem, mediaGrid.firstChild);

        showNotification('图片上传成功！');
    };
    reader.readAsDataURL(file);
}

// 处理视频上传
function handleVideoUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const mediaGrid = document.getElementById('mediaGrid');
        const newMediaItem = createVideoItem(e.target.result, file.name);
        mediaGrid.insertBefore(newMediaItem, mediaGrid.firstChild);

        showNotification('视频上传成功！');
    };
    reader.readAsDataURL(file);
}

// 创建媒体项
function createMediaItem(src, type) {
    const item = document.createElement('div');
    item.className = 'media-item photo';
    item.style.animation = 'fadeIn 0.5s ease';

    if (type === 'photo') {
        item.innerHTML = `
            <img src="${src}" alt="上传的照片">
            <div class="media-overlay">
                <div class="media-actions">
                    <button class="action-btn" onclick="toggleLike(this)">
                        <i class="far fa-heart"></i>
                        <span>0</span>
                    </button>
                    <button class="action-btn">
                        <i class="far fa-comment"></i>
                        <span>0</span>
                    </button>
                </div>
            </div>
        `;
    }

    return item;
}

// 创建视频项
function createVideoItem(src, name) {
    const item = document.createElement('div');
    item.className = 'media-item video';
    item.style.animation = 'fadeIn 0.5s ease';

    item.innerHTML = `
        <video controls>
            <source src="${src}" type="video/mp4">
            您的浏览器不支持视频播放
        </video>
        <div class="media-overlay">
            <div class="media-info">
                <h4>${name}</h4>
            </div>
        </div>
    `;

    return item;
}

// 播放精彩集锦
function playHighlight() {
    showNotification('精彩集锦功能即将推出！');
}

// 跳转到登录页面
function goToLogin() {
    window.location.href = 'login.html';
}

// 检查用户登录状态
function checkAuthStatus() {
    const token = localStorage.getItem('peteternal_token');
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (token) {
        // 已登录，显示用户信息
        if (loginBtn) {
            loginBtn.textContent = '我的账户';
            loginBtn.onclick = () => window.location.href = 'profile.html';
        }
        if (signupBtn) {
            signupBtn.style.display = 'none';
        }
    }
}

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});