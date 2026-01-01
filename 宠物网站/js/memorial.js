// 纪念日志页面功能
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initCalendar();
    initMailbox();
    initTimeline();
    initRainbowCommunity();
    updateCurrentDate();
});

// 导航切换
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.memorial-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetSection = this.dataset.section;

            // 更新按钮状态
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 更新内容显示
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// 日历功能
function initCalendar() {
    generateCalendar();

    // 月份导航
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        generateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        generateCalendar();
    });
}

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// 生成日历
function generateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 更新月份标题
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('currentMonth').textContent =
        `${currentYear}年${monthNames[currentMonth]}`;

    // 生成日历日期
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // 添加空白日期
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        calendarDays.appendChild(emptyDay);
    }

    // 添加日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // 标记今天
        if (currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate()) {
            dayElement.classList.add('today');
        }

        // 模拟事件
        if (day === 25) { // 生日事件
            dayElement.classList.add('has-event');
            dayElement.innerHTML += '<div class="event-dot"></div>';
        }
        if (day === 14) { // 纪念日
            dayElement.classList.add('has-event');
            dayElement.innerHTML += '<div class="event-dot"></div>';
        }

        dayElement.addEventListener('click', () => selectDate(day));
        calendarDays.appendChild(dayElement);
    }
}

// 选择日期
function selectDate(day) {
    // 清除之前的选择
    document.querySelectorAll('.calendar-day').forEach(d => {
        d.style.background = '';
    });

    // 标记选择的日期
    event.target.style.background = 'var(--secondary-color)';

    // 填充事件表单
    const selectedDate = new Date(currentYear, currentMonth, day);
    document.getElementById('eventDate').value =
        selectedDate.toISOString().split('T')[0];
}

// 添加事件
function addEvent() {
    const event = {
        type: document.getElementById('eventType').value,
        name: document.getElementById('eventName').value,
        date: document.getElementById('eventDate').value,
        repeat: document.getElementById('eventRepeat').value,
        note: document.getElementById('eventNote').value
    };

    // 验证
    if (!event.name || !event.date) {
        showNotification('请填写事件名称和日期', 'error');
        return;
    }

    // 保存到本地存储
    const events = JSON.parse(localStorage.getItem('petEvents') || '[]');
    events.push(event);
    localStorage.setItem('petEvents', JSON.stringify(events));

    // 清空表单
    document.getElementById('eventName').value = '';
    document.getElementById('eventNote').value = '';

    showNotification('事件添加成功！');

    // 重新生成日历
    generateCalendar();
}

// 时空信箱功能
function initMailbox() {
    const tabs = document.querySelectorAll('.mailbox-tabs .tab-btn');
    const contents = document.querySelectorAll('.mailbox-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 发送时空信
function sendTimeLetter() {
    const letter = {
        pet: document.getElementById('futurePet').value,
        deliverDate: document.getElementById('deliverDate').value,
        content: document.getElementById('letterContent').value,
        date: new Date().toISOString()
    };

    if (!letter.content) {
        showNotification('请写下信件内容', 'error');
        return;
    }

    // 保存到本地存储
    const letters = JSON.parse(localStorage.getItem('timeLetters') || '[]');
    letters.push(letter);
    localStorage.setItem('timeLetters', JSON.stringify(letters));

    // 清空表单
    document.getElementById('letterContent').value = '';

    showNotification('信件已投入时空信箱，将在指定日期送达');
}

// 发送彩虹桥信
function sendRainbowLetter() {
    const letter = {
        pet: document.getElementById('memorialPet').value,
        content: document.getElementById('rainbowLetter').value,
        date: new Date().toISOString()
    };

    if (!letter.content) {
        showNotification('请写下您想说的话', 'error');
        return;
    }

    // 保存到本地存储
    const letters = JSON.parse(localStorage.getItem('rainbowLetters') || '[]');
    letters.push(letter);
    localStorage.setItem('rainbowLetters', JSON.stringify(letters));

    // 清空表单
    document.getElementById('rainbowLetter').value = '';

    showNotification('您的思念已放飞到彩虹桥');
}

// 成长轨迹功能
function initTimeline() {
    // 初始化日期
    const today = new Date();
    document.getElementById('timelineDate').value = today.toISOString().split('T')[0];
}

// 添加成长记录
function addTimelineEvent() {
    const event = {
        date: document.getElementById('timelineDate').value,
        title: document.getElementById('timelineTitle').value,
        description: document.getElementById('timelineDesc').value
    };

    if (!event.title || !event.date) {
        showNotification('请填写标题和日期', 'error');
        return;
    }

    // 创建新的时间线项
    const timelineItem = createTimelineItem(event);
    const timeline = document.getElementById('petTimeline');
    timeline.appendChild(timelineItem);

    // 清空表单
    document.getElementById('timelineTitle').value = '';
    document.getElementById('timelineDesc').value = '';

    showNotification('成长记录添加成功！');
}

// 创建时间线项
function createTimelineItem(event) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.style.animation = 'fadeIn 0.5s ease';

    const date = new Date(event.date);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    item.innerHTML = `
        <div class="timeline-marker">
            <i class="fas fa-star"></i>
        </div>
        <div class="timeline-content">
            <div class="timeline-date">${dateStr}</div>
            <h3>${event.title}</h3>
            <p>${event.description}</p>
        </div>
    `;

    return item;
}

// 彩虹桥社区功能
function initRainbowCommunity() {
    // 加载纪念内容
    loadMemorialPosts();
}

// 发布纪念
function postMemorial() {
    const content = document.getElementById('memorialText').value;

    if (!content) {
        showNotification('请写下您的思念', 'error');
        return;
    }

    const post = {
        username: '我',
        content: content,
        date: new Date().toISOString(),
        avatar: 'https://via.placeholder.com/50'
    };

    // 添加到页面
    addMemorialPost(post);

    // 清空输入
    document.getElementById('memorialText').value = '';

    showNotification('纪念发布成功');
}

// 添加纪念帖子
function addMemorialPost(post) {
    const wallGrid = document.querySelector('.wall-grid');
    const postElement = document.createElement('div');
    postElement.className = 'memorial-post';
    postElement.style.animation = 'fadeIn 0.5s ease';

    const postDate = new Date(post.date);
    const timeAgo = getTimeAgo(postDate);

    postElement.innerHTML = `
        <div class="post-avatar">
            <img src="${post.avatar}" alt="用户头像">
        </div>
        <div class="post-content">
            <div class="post-header">
                <span class="username">${post.username}</span>
                <span class="post-date">${timeAgo}</span>
            </div>
            <div class="post-text">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="comfortPost(this)">
                    <i class="fas fa-heart"></i>
                    <span>慰藉</span>
                </button>
                <button class="action-btn" onclick="commentPost(this)">
                    <i class="fas fa-comment"></i>
                    <span>留言</span>
                </button>
            </div>
        </div>
    `;

    // 插入到第一个位置
    wallGrid.insertBefore(postElement, wallGrid.firstChild);
}

// 加载纪念帖子
function loadMemorialPosts() {
    // 模拟加载帖子
    const posts = [
        {
            username: '小明',
            content: '球球，今天是你离开的第100天。还是很想你，你在彩虹桥那边要开心啊...',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: 'https://via.placeholder.com/50',
            image: 'https://via.placeholder.com/300'
        }
    ];

    posts.forEach(post => addMemorialPost(post));
}

// 慰藉功能
function comfortPost(btn) {
    const icon = btn.querySelector('i');
    const count = btn.querySelector('span');

    if (icon.classList.contains('fas')) {
        icon.classList.remove('fas');
        icon.classList.add('far');
        count.textContent = '慰藉';
    } else {
        icon.classList.remove('far');
        icon.classList.add('fas');
        count.textContent = '已慰藉';
    }
}

// 留言功能
function commentPost(btn) {
    const comment = prompt('留下您的慰问留言：');
    if (comment) {
        showNotification('留言已发送');
    }
}

// 计算时间差
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;

    return date.toLocaleDateString();
}

// 更新当前日期
function updateCurrentDate() {
    const today = new Date().toLocaleDateString('zh-CN');
    document.getElementById('currentDate').textContent = today;
    document.getElementById('currentDate2').textContent = today;
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
`;
document.head.appendChild(style);