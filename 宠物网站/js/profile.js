import { authAPI, petAPI, mediaAPI, socialAPI } from './api.js';

// DOM元素
let currentUser = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initSidebarNav();
    loadUserData();
    loadMyPets();
    loadMyMedia();
});

// 检查认证状态
async function checkAuth() {
    const token = localStorage.getItem('peteternal_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const result = await authAPI.verify();
        currentUser = result.user;
    } catch (error) {
        console.error('认证失败:', error);
        localStorage.removeItem('peteternal_token');
        localStorage.removeItem('peteternal_user');
        window.location.href = 'login.html';
    }
}

// 初始化侧边栏导航
function initSidebarNav() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.dataset.section;

            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // 显示对应的内容
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// 加载用户数据
async function loadUserData() {
    try {
        if (!currentUser) return;

        // 更新页面显示
        document.getElementById('userNickname').textContent = currentUser.nickname || currentUser.username;
        document.getElementById('userBio').textContent = currentUser.bio || '这个人很懒，什么都没留下...';
        document.getElementById('userAvatar').src = currentUser.avatar_url || 'https://via.placeholder.com/120';

        // 更新统计信息
        document.getElementById('petCount').textContent = '...';
        document.getElementById('postCount').textContent = '...';
        document.getElementById('followingCount').textContent = '...';

        // 加载统计数据（这里可以调用相应的API）
        loadUserStats();

        // 填充设置表单
        document.getElementById('usernameInput').value = currentUser.username;
        document.getElementById('nicknameInput').value = currentUser.nickname || '';
        document.getElementById('emailInput').value = currentUser.email;
        document.getElementById('locationInput').value = currentUser.location || '';
        document.getElementById('bioInput').value = currentUser.bio || '';
    } catch (error) {
        console.error('加载用户数据失败:', error);
    }
}

// 加载用户统计
async function loadUserStats() {
    try {
        // 这里应该调用实际的API获取统计数据
        // 暂时使用模拟数据
        setTimeout(() => {
            document.getElementById('petCount').textContent = '2';
            document.getElementById('postCount').textContent = '15';
            document.getElementById('followingCount').textContent = '28';
        }, 1000);
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 加载我的宠物
async function loadMyPets() {
    try {
        const result = await petAPI.getPets();
        const petsGrid = document.getElementById('myPetsGrid');

        if (result.pets.length === 0) {
            petsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paw"></i>
                    <p>还没有添加宠物</p>
                    <button class="add-pet-btn" onclick="location.href='index.html#space'">
                        <i class="fas fa-plus"></i>
                        添加第一只宠物
                    </button>
                </div>
            `;
            return;
        }

        petsGrid.innerHTML = result.pets.map(pet => `
            <div class="pet-card" onclick="viewPet(${pet.id})">
                <img src="${pet.avatar_url || 'https://via.placeholder.com/150'}" alt="${pet.name}">
                <h3>${pet.name}</h3>
                <p>${pet.breed || '未知品种'} · ${calculateAge(pet.birth_date)}</p>
                <span class="pet-status ${pet.status === 'rainbow_bridge' ? 'rainbow' : 'alive'}">
                    ${pet.status === 'rainbow_bridge' ? '在彩虹桥' : '健康快乐'}
                </span>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载宠物列表失败:', error);
    }
}

// 加载我的媒体
async function loadMyMedia() {
    try {
        const result = await mediaAPI.getMedia();
        const mediaGrid = document.getElementById('myMediaGrid');

        if (result.media.length === 0) {
            mediaGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera"></i>
                    <p>还没有上传任何照片或视频</p>
                </div>
            `;
            return;
        }

        mediaGrid.innerHTML = result.media.map(item => {
            if (item.type === 'photo') {
                return `
                    <div class="media-item" onclick="viewMedia(${item.id})">
                        <img src="${item.file_url}" alt="${item.caption || '照片'}">
                    </div>
                `;
            } else {
                return `
                    <div class="media-item" onclick="viewMedia(${item.id})">
                        <img src="${item.thumbnail_url}" alt="${item.caption || '视频'}">
                        <div class="video-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                `;
            }
        }).join('');
    } catch (error) {
        console.error('加载媒体失败:', error);
    }
}

// 计算年龄
function calculateAge(birthDate) {
    if (!birthDate) return '年龄未知';

    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths < 12) {
        return `${diffMonths}个月`;
    } else {
        const years = Math.floor(diffMonths / 12);
        const months = diffMonths % 12;
        return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
    }
}

// 查看宠物详情
function viewPet(petId) {
    window.location.href = `index.html#pet-${petId}`;
}

// 查看媒体详情
function viewMedia(mediaId) {
    // 可以打开模态框显示大图或播放视频
    console.log('查看媒体:', mediaId);
}

// 编辑资料
function editProfile() {
    // 滚动到设置部分
    document.querySelector('[data-section="settings"]').click();
}

// 上传头像
function uploadAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // 这里应该调用API上传头像
                console.log('上传头像:', file);
                showNotification('头像上传成功！');
            } catch (error) {
                showNotification('头像上传失败', 'error');
            }
        }
    };
    input.click();
}

// 保存设置
async function saveSettings() {
    try {
        const settings = {
            username: document.getElementById('usernameInput').value,
            nickname: document.getElementById('nicknameInput').value,
            email: document.getElementById('emailInput').value,
            location: document.getElementById('locationInput').value,
            bio: document.getElementById('bioInput').value
        };

        // 这里应该调用API保存设置
        console.log('保存设置:', settings);
        showNotification('设置保存成功！');
    } catch (error) {
        showNotification('保存失败', 'error');
    }
}

// 修改密码
function changePassword() {
    showNotification('密码修改功能开发中...');
}

// 退出登录
window.logout = function() {
    if (confirm('确定要退出登录吗？')) {
        authAPI.logout();
        window.location.href = 'index.html';
    }
};

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : 'var(--primary-color)'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }

    .empty-state i {
        font-size: 48px;
        margin-bottom: 20px;
        opacity: 0.5;
    }

    .empty-state p {
        margin-bottom: 20px;
    }

    .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 36px;
    }
`;
document.head.appendChild(style);