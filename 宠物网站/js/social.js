// 宠友圈页面功能
document.addEventListener('DOMContentLoaded', function() {
    initCommunityNavigation();
    initPostActions();
    initNearbyFriends();
    initBreedHelp();
});

// 社区导航切换
function initCommunityNavigation() {
    const navBtns = document.querySelectorAll('.community-nav .nav-btn');
    const breedHelp = document.getElementById('breedHelp');
    const feedSection = document.querySelector('.feed-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const community = this.dataset.community;

            // 更新按钮状态
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 切换内容显示
            if (community === 'breeds') {
                breedHelp.style.display = 'block';
                feedSection.style.display = 'none';
            } else {
                breedHelp.style.display = 'none';
                feedSection.style.display = 'block';
                filterPosts(community);
            }
        });
    });
}

// 过滤动态
function filterPosts(community) {
    const posts = document.querySelectorAll('.post-item');

    posts.forEach(post => {
        if (community === 'all') {
            post.style.display = 'block';
        } else if (community === 'rainbow') {
            post.style.display = post.classList.contains('rainbow-post') ? 'block' : 'none';
        } else {
            // 这里可以根据实际需要添加更多过滤逻辑
            post.style.display = 'block';
        }
    });
}

// 发布动态
function publishPost() {
    const content = document.getElementById('postContent').value;

    if (!content.trim()) {
        showNotification('请输入动态内容', 'error');
        return;
    }

    // 创建新动态
    const newPost = createPostElement({
        user: '我',
        avatar: 'https://via.placeholder.com/50',
        time: '刚刚',
        content: content,
        images: [],
        likes: 0,
        comments: 0
    });

    // 添加到动态列表顶部
    const feed = document.getElementById('postsFeed');
    feed.insertBefore(newPost, feed.firstChild);

    // 清空输入框
    document.getElementById('postContent').value = '';

    showNotification('发布成功！');
}

// 创建动态元素
function createPostElement(postData) {
    const article = document.createElement('article');
    article.className = 'post-item';
    article.style.animation = 'fadeIn 0.5s ease';

    let imagesHTML = '';
    if (postData.images && postData.images.length > 0) {
        imagesHTML = `
            <div class="post-images">
                ${postData.images.map(img => `<img src="${img}" alt="动态图片">`).join('')}
            </div>
        `;
    }

    article.innerHTML = `
        <div class="post-header">
            <img src="${postData.avatar}" alt="用户头像" class="user-avatar">
            <div class="post-meta">
                <h4>${postData.user}</h4>
                <span class="post-time">${postData.time}</span>
            </div>
            <button class="follow-btn">关注</button>
        </div>
        <div class="post-content">
            <p>${postData.content}</p>
            ${imagesHTML}
        </div>
        <div class="post-stats">
            <button class="stat-btn like-btn" onclick="toggleLike(this)">
                <i class="far fa-heart"></i>
                <span>${postData.likes}</span>
            </button>
            <button class="stat-btn comment-btn">
                <i class="far fa-comment"></i>
                <span>${postData.comments}</span>
            </button>
            <button class="stat-btn share-btn" onclick="sharePost(this)">
                <i class="far fa-share-square"></i>
                <span>分享</span>
            </button>
        </div>
        <div class="post-comments">
            <div class="add-comment">
                <input type="text" placeholder="写评论...">
                <button class="comment-submit" onclick="addComment(this)">发送</button>
            </div>
        </div>
    `;

    return article;
}

// 初始化动态操作
function initPostActions() {
    // 点赞功能
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleLike(this);
        });
    });

    // 分享功能
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            sharePost(this);
        });
    });

    // 评论功能
    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', function() {
            addComment(this);
        });
    });
}

// 切换点赞
function toggleLike(btn) {
    const icon = btn.querySelector('i');
    const count = btn.querySelector('span');
    let likes = parseInt(count.textContent);

    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        count.textContent = likes + 1;
        btn.classList.add('liked');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        count.textContent = likes - 1;
        btn.classList.remove('liked');
    }
}

// 分享功能
function sharePost(btn) {
    if (navigator.share) {
        navigator.share({
            title: 'PetEternal - 宠友圈动态',
            text: '快来看看这个可爱的宠物动态！',
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

// 添加评论
function addComment(btn) {
    const input = btn.previousElementSibling;
    const comment = input.value.trim();

    if (!comment) {
        showNotification('请输入评论内容', 'error');
        return;
    }

    // 创建评论元素
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
        <img src="https://via.placeholder.com/30" alt="评论者头像">
        <div class="comment-content">
            <span class="comment-user">我：</span>
            <span class="comment-text">${comment}</span>
        </div>
    `;

    // 添加到评论区
    const commentsSection = btn.closest('.post-comments');
    const addCommentDiv = btn.closest('.add-comment');
    commentsSection.insertBefore(commentDiv, addCommentDiv);

    // 清空输入框
    input.value = '';

    // 更新评论数
    const postStats = commentsSection.previousElementSibling;
    const commentBtn = postStats.querySelector('.comment-btn span');
    let comments = parseInt(commentBtn.textContent);
    commentBtn.textContent = comments + 1;

    showNotification('评论成功！');
}

// 附近的朋友功能
function initNearbyFriends() {
    // 切换位置
    const changeBtn = document.querySelector('.change-location-btn');
    if (changeBtn) {
        changeBtn.addEventListener('click', changeLocation);
    }

    // 关注功能
    document.querySelectorAll('.friend-card .follow-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === '关注') {
                this.textContent = '已关注';
                this.style.background = '#ddd';
                showNotification('关注成功！');
            } else {
                this.textContent = '关注';
                this.style.background = '';
            }
        });
    });
}

// 切换位置
function changeLocation() {
    const locations = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区'];
    const currentLocation = document.getElementById('currentLocation');
    const currentIndex = locations.indexOf(currentLocation.textContent);
    const nextIndex = (currentIndex + 1) % locations.length;

    currentLocation.textContent = locations[nextIndex];

    // 模拟加载新的附近朋友
    showNotification('已切换到 ' + locations[nextIndex]);
    loadNearbyFriends();
}

// 加载附近的朋友
function loadNearbyFriends() {
    // 这里应该调用后端API获取真实数据
    // 目前使用模拟数据
    const mockFriends = [
        { name: '小白', breed: '泰迪', distance: '1km' },
        { name: '大橘', breed: '橘猫', distance: '2km' },
        { name: '哈士奇', breed: '哈士奇', distance: '3km' }
    ];

    const container = document.querySelector('.nearby-friends');
    container.innerHTML = mockFriends.map(friend => `
        <div class="friend-card">
            <img src="https://via.placeholder.com/80" alt="${friend.name}" class="friend-avatar">
            <h4>${friend.name}</h4>
            <p>${friend.breed} · ${friend.distance}</p>
            <button class="follow-btn" onclick="toggleFollow(this)">关注</button>
        </div>
    `).join('');
}

// 切换关注
function toggleFollow(btn) {
    if (btn.textContent === '关注') {
        btn.textContent = '已关注';
        btn.style.background = '#ddd';
        showNotification('关注成功！');
    } else {
        btn.textContent = '关注';
        btn.style.background = '';
        showNotification('已取消关注');
    }
}

// 品种互助功能
function initBreedHelp() {
    const breedBtns = document.querySelectorAll('.breed-btn');

    breedBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const breed = this.dataset.breed;

            // 更新按钮状态
            breedBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 加载对应的求助内容
            loadBreedHelp(breed);
        });
    });
}

// 加载品种求助内容
function loadBreedHelp(breed) {
    const helpPosts = document.querySelector('.help-posts');

    // 模拟数据
    const breedData = {
        golden: [
            { title: '金毛太胖了怎么办？', content: '我家金毛才1岁就已经30公斤了...', tags: ['金毛', '减肥', '饮食'] },
            { title: '金毛掉毛问题求助', content: '每天掉毛特别多，有什么办法吗？', tags: ['金毛', '掉毛', '护理'] }
        ],
        husky: [
            { title: '哈士奇拆家怎么办？', content: '才2个月大的哈士奇就开始拆家了...', tags: ['哈士奇', '拆家', '训练'] }
        ]
    };

    const posts = breedData[breed] || breedData.golden;

    helpPosts.innerHTML = posts.map(post => `
        <div class="help-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <div class="help-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="help-answers">
                <div class="answer">
                    <strong>养宠达人：</strong>
                    这是个常见问题，建议您...
                </div>
            </div>
        </div>
    `).join('');
}

// 加载更多动态
function loadMorePosts() {
    const btn = document.querySelector('.load-more-btn');
    const icon = btn.querySelector('i');

    // 显示加载动画
    icon.style.animation = 'spin 1s linear infinite';
    btn.disabled = true;

    // 模拟加载
    setTimeout(() => {
        // 添加模拟动态
        const feed = document.getElementById('postsFeed');
        for (let i = 0; i < 3; i++) {
            const mockPost = createPostElement({
                user: '用户' + Math.floor(Math.random() * 100),
                avatar: 'https://via.placeholder.com/50',
                time: Math.floor(Math.random() * 60) + '分钟前',
                content: '这是一个动态内容示例...',
                likes: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 50)
            });
            feed.appendChild(mockPost);
        }

        // 恢复按钮状态
        icon.style.animation = '';
        btn.disabled = false;

        showNotification('加载成功');
    }, 1000);
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

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);