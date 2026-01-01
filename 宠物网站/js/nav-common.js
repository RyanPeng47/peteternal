// 通用导航功能
(function() {
    // 获取token和用户信息
    const getToken = () => localStorage.getItem('peteternal_token');
    const getUser = () => {
        const userStr = localStorage.getItem('peteternal_user');
        return userStr ? JSON.parse(userStr) : null;
    };

    // 检查认证状态并更新导航
    function updateNavigation() {
        const token = getToken();
        const user = getUser();

        // 查找所有顶部导航栏
        const topNavs = document.querySelectorAll('.top-nav .nav-container');

        topNavs.forEach(nav => {
            let navActions = nav.querySelector('.nav-actions');

            if (!navActions) {
                // 如果没有nav-actions，创建一个
                navActions = document.createElement('div');
                navActions.className = 'nav-actions';
                nav.appendChild(navActions);
            }

            if (token && user) {
                // 已登录状态
                navActions.innerHTML = `
                    <span class="welcome-text">欢迎，${user.nickname || user.username}</span>
                    <button class="btn-profile" onclick="goToProfile()">
                        <i class="fas fa-user"></i>
                        个人中心
                    </button>
                    <button class="btn-logout" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        退出
                    </button>
                `;
            } else {
                // 未登录状态
                navActions.innerHTML = `
                    <button class="btn-login" onclick="goToLogin()">
                        <i class="fas fa-sign-in-alt"></i>
                        登录
                    </button>
                    <button class="btn-signup" onclick="goToLogin()">
                        <i class="fas fa-user-plus"></i>
                        注册
                    </button>
                `;
            }
        });

        // 更新底部导航的active状态
        updateBottomNavActive();
    }

    // 更新底部导航的active状态
    function updateBottomNavActive() {
        const currentPage = window.location.pathname.split('/').pop();
        const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');

        bottomNavItems.forEach(item => {
            const href = item.querySelector('a')?.getAttribute('href') ||
                          item.getAttribute('href') || '';

            // 移除所有active类
            item.classList.remove('active');

            // 根据当前页面设置active状态
            if ((currentPage === '' || currentPage === 'index.html') && href.includes('index.html')) {
                item.classList.add('active');
            } else if (currentPage === 'social.html' && href.includes('social.html')) {
                item.classList.add('active');
            } else if (currentPage === 'profile.html' && href.includes('profile.html')) {
                item.classList.add('active');
            }
        });
    }

    // 页面跳转函数
    window.goToLogin = function() {
        window.location.href = 'login.html';
    };

    window.goToProfile = function() {
        window.location.href = 'profile.html';
    };

    window.logout = function() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('peteternal_token');
            localStorage.removeItem('peteternal_user');
            window.location.href = 'index.html';
        }
    };

    // 初始化导航
    document.addEventListener('DOMContentLoaded', function() {
        updateNavigation();

        // 监听storage变化（多标签页同步）
        window.addEventListener('storage', function(e) {
            if (e.key === 'peteternal_token' || e.key === 'peteternal_user') {
                updateNavigation();
            }
        });
    });

    // 导出函数供其他脚本使用
    window.updateNavigation = updateNavigation;
})();

// 添加导航样式
const navStyle = document.createElement('style');
navStyle.textContent = `
    .nav-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .welcome-text {
        color: var(--text-secondary);
        font-size: 14px;
    }

    .btn-profile,
    .btn-logout,
    .btn-login,
    .btn-signup {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .btn-profile {
        background: var(--secondary-color);
        color: white;
    }

    .btn-profile:hover {
        background: #7BC7B5;
        transform: translateY(-2px);
    }

    .btn-logout {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .btn-logout:hover {
        color: var(--primary-color);
        border-color: var(--primary-color);
    }

    .btn-login {
        background: var(--primary-color);
        color: white;
    }

    .btn-login:hover {
        background: #6D5A44;
    }

    .btn-signup {
        background: var(--secondary-color);
        color: white;
    }

    .btn-signup:hover {
        background: #7BC7B5;
    }

    @media (max-width: 768px) {
        .welcome-text {
            display: none;
        }

        .nav-actions {
            gap: 8px;
        }

        .btn-profile,
        .btn-logout,
        .btn-login,
        .btn-signup {
            padding: 6px 12px;
            font-size: 13px;
        }

        .btn-profile i,
        .btn-logout i,
        .btn-login i,
        .btn-signup i {
            margin-right: 0;
        }

        .btn-profile span,
        .btn-logout span,
        .btn-login span,
        .btn-signup span {
            display: none;
        }
    }
`;
document.head.appendChild(navStyle);