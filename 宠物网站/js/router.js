// 简单的路由管理器
class Router {
    constructor() {
        this.routes = {};
        this.init();
    }

    init() {
        // 监听hash变化
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // 页面加载时处理路由
        this.handleRoute();
    }

    // 注册路由
    register(path, handler) {
        this.routes[path] = handler;
    }

    // 处理当前路由
    handleRoute() {
        const hash = window.location.hash;
        const path = hash.slice(1); // 移除#号

        // 如果是宠物详情路由
        if (path.startsWith('pet-')) {
            const petId = path.split('-')[1];
            this.showPetDetail(petId);
        }
        // 如果是其他锚点路由
        else if (path && this.routes[path]) {
            this.routes[path]();
        }
        // 滚动到对应的section
        else if (path) {
            this.scrollToSection(path);
        }
    }

    // 滚动到指定section
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // 显示宠物详情
    showPetDetail(petId) {
        // 这里可以显示一个模态框或跳转到详情页
        console.log('显示宠物详情:', petId);
        // 示例：创建一个简单的模态框
        this.showPetModal(petId);
    }

    // 显示宠物模态框
    showPetModal(petId) {
        // 检查是否已有模态框
        let modal = document.getElementById('petModal');
        if (modal) {
            modal.remove();
        }

        // 创建模态框
        modal = document.createElement('div');
        modal.id = 'petModal';
        modal.className = 'pet-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closePetModal()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="closePetModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pet-detail">
                    <h2>宠物详情</h2>
                    <p>宠物ID: ${petId}</p>
                    <p>这里将显示宠物的详细信息...</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

// 关闭宠物模态框
window.closePetModal = function() {
    const modal = document.getElementById('petModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// 添加模态框样式
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    .pet-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .pet-modal.active {
        opacity: 1;
        visibility: visible;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
    }

    .modal-content {
        position: relative;
        background: white;
        padding: 40px;
        border-radius: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 24px;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
    }

    .modal-close:hover {
        background: #f5f5f5;
        color: var(--text-primary);
    }

    .pet-detail h2 {
        color: var(--primary-color);
        margin-bottom: 20px;
    }

    @media (max-width: 768px) {
        .modal-content {
            padding: 30px 20px;
            margin: 20px;
            width: calc(100% - 40px);
        }
    }
`;
document.head.appendChild(modalStyle);

// 创建并导出路由实例
const router = new Router();
export default router;