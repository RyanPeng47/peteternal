import { authAPI, getToken, setToken, setUser } from './api.js';

// DOM元素
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const loadingOverlay = document.getElementById('loadingOverlay');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    if (getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // 绑定表单事件
    loginFormElement.addEventListener('submit', handleLogin);
    registerFormElement.addEventListener('submit', handleRegister);

    // 添加输入验证
    addInputValidation();
});

// 切换登录/注册表单
window.toggleAuthForm = function() {
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
};

// 切换密码可见性
window.togglePasswordVisibility = function(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // 显示加载状态
    showLoading();

    try {
        const result = await authAPI.login({
            username,
            password
        });

        // 记住登录状态
        if (rememberMe) {
            localStorage.setItem('peteternal_remember', 'true');
        } else {
            sessionStorage.setItem('peteternal_token', result.token);
        }

        // 显示成功消息
        showMessage('登录成功！正在跳转...', 'success');

        // 延迟跳转
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        showMessage(error.message || '登录失败', 'error');
    } finally {
        hideLoading();
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const nickname = document.getElementById('registerNickname').value.trim() || username;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // 验证密码匹配
    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }

    // 验证同意条款
    if (!agreeTerms) {
        showMessage('请同意服务条款和隐私政策', 'error');
        return;
    }

    // 显示加载状态
    showLoading();

    try {
        const result = await authAPI.register({
            username,
            email,
            nickname,
            password
        });

        // 显示成功消息
        showMessage('注册成功！正在跳转...', 'success');

        // 延迟跳转
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        showMessage(error.message || '注册失败', 'error');
    } finally {
        hideLoading();
    }
}

// 添加输入验证
function addInputValidation() {
    // 用户名验证
    const usernameInput = document.getElementById('registerUsername');
    usernameInput.addEventListener('input', function() {
        const value = this.value;
        const hint = this.nextElementSibling;

        if (value.length < 3 || value.length > 50) {
            hint.style.color = '#ff6b6b';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            hint.style.color = '#ff6b6b';
        } else {
            hint.style.color = 'var(--text-secondary)';
        }
    });

    // 邮箱验证
    const emailInput = document.getElementById('registerEmail');
    emailInput.addEventListener('input', function() {
        const value = this.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (value && !emailRegex.test(value)) {
            this.style.borderColor = '#ff6b6b';
        } else {
            this.style.borderColor = '';
        }
    });

    // 密码强度验证
    const passwordInput = document.getElementById('registerPassword');
    passwordInput.addEventListener('input', function() {
        const value = this.value;
        const hint = this.nextElementSibling;

        if (value.length < 6) {
            hint.style.color = '#ff6b6b';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            hint.style.color = '#ffa500';
        } else {
            hint.style.color = 'var(--text-secondary)';
        }
    });

    // 确认密码验证
    const confirmPasswordInput = document.getElementById('confirmPassword');
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const value = this.value;

        if (value && value !== password) {
            this.style.borderColor = '#ff6b6b';
        } else {
            this.style.borderColor = '';
        }
    });
}

// 显示加载状态
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// 显示消息
function showMessage(message, type = 'error') {
    // 移除现有消息
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;

    // 插入到活动表单的开头
    const activeForm = loginForm.style.display !== 'none' ? loginForm : registerForm;
    const formTitle = activeForm.querySelector('h2');
    activeForm.insertBefore(messageDiv, formTitle);

    // 自动移除消息
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}