// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 获取存储的token
const getToken = () => {
    return localStorage.getItem('peteternal_token');
};

// 设置token
const setToken = (token) => {
    localStorage.setItem('peteternal_token', token);
};

// 清除token
const clearToken = () => {
    localStorage.removeItem('peteternal_token');
};

// 获取用户信息
const getUser = () => {
    const userStr = localStorage.getItem('peteternal_user');
    return userStr ? JSON.parse(userStr) : null;
};

// 设置用户信息
const setUser = (user) => {
    localStorage.setItem('peteternal_user', JSON.stringify(user));
};

// 清除用户信息
const clearUser = () => {
    localStorage.removeItem('peteternal_user');
};

// 基础请求函数
const request = async (url, options = {}) => {
    const token = getToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();

        if (!response.ok) {
            // 如果是401错误，清除登录信息
            if (response.status === 401) {
                clearToken();
                clearUser();
                window.location.href = 'index.html';
            }
            throw new Error(data.error || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
};

// 认证相关API
export const authAPI = {
    // 注册
    register: async (userData) => {
        const data = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (data.token) {
            setToken(data.token);
            setUser(data.user);
        }

        return data;
    },

    // 登录
    login: async (credentials) => {
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (data.token) {
            setToken(data.token);
            setUser(data.user);
        }

        return data;
    },

    // 验证token
    verify: async () => {
        return await request('/auth/verify', {
            method: 'GET'
        });
    },

    // 登出
    logout: () => {
        clearToken();
        clearUser();
    }
};

// 宠物相关API
export const petAPI = {
    // 获取宠物列表
    getPets: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/pets?${queryString}`);
    },

    // 获取宠物详情
    getPet: async (id) => {
        return await request(`/pets/${id}`);
    },

    // 创建宠物
    createPet: async (petData) => {
        return await request('/pets', {
            method: 'POST',
            body: JSON.stringify(petData)
        });
    },

    // 更新宠物
    updatePet: async (id, petData) => {
        return await request(`/pets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(petData)
        });
    },

    // 删除宠物
    deletePet: async (id) => {
        return await request(`/pets/${id}`, {
            method: 'DELETE'
        });
    },

    // 获取宠物媒体
    getPetMedia: async (petId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/pets/${petId}/media?${queryString}`);
    },

    // 获取宠物事件
    getPetEvents: async (petId) => {
        return await request(`/pets/${petId}/events`);
    }
};

// 媒体相关API
export const mediaAPI = {
    // 上传单个文件
    uploadFile: async (file, petId, options = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pet_id', petId);

        if (options.caption) {
            formData.append('caption', options.caption);
        }
        if (options.stage) {
            formData.append('stage', options.stage);
        }
        if (options.tags) {
            formData.append('tags', options.tags);
        }

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/media/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '上传失败');
        }

        return await response.json();
    },

    // 上传多个文件
    uploadFiles: async (files, petId, options = {}) => {
        const formData = new FormData();

        files.forEach(file => {
            formData.append('files', file);
        });

        formData.append('pet_id', petId);

        if (options.stage) {
            formData.append('stage', options.stage);
        }

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/media/upload-multiple`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '上传失败');
        }

        return await response.json();
    },

    // 获取媒体列表
    getMedia: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/media?${queryString}`);
    },

    // 删除媒体
    deleteMedia: async (id) => {
        return await request(`/media/${id}`, {
            method: 'DELETE'
        });
    }
};

// 社交相关API
export const socialAPI = {
    // 获取附近用户
    getNearbyUsers: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/social/nearby?${queryString}`);
    },

    // 获取动态列表
    getPosts: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/social/posts?${queryString}`);
    },

    // 发布动态
    createPost: async (postData) => {
        return await request('/social/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    },

    // 点赞/取消点赞
    toggleLike: async (targetType, targetId) => {
        return await request('/social/like', {
            method: 'POST',
            body: JSON.stringify({
                target_type: targetType,
                target_id: targetId
            })
        });
    },

    // 添加评论
    addComment: async (commentData) => {
        return await request('/social/comment', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    },

    // 获取评论列表
    getComments: async (targetType, targetId, params = {}) => {
        const queryString = new URLSearchParams({
            target_type: targetType,
            target_id: targetId,
            ...params
        }).toString();
        return await request(`/social/comments?${queryString}`);
    },

    // 关注/取消关注
    toggleFollow: async (followingId) => {
        return await request('/social/follow', {
            method: 'POST',
            body: JSON.stringify({
                following_id: followingId
            })
        });
    },

    // 获取关注列表
    getFollowing: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/social/following?${queryString}`);
    },

    // 获取粉丝列表
    getFollowers: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/social/followers?${queryString}`);
    }
};

// 纪念相关API
export const memorialAPI = {
    // 获取纪念事件
    getEvents: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/memorial/events?${queryString}`);
    },

    // 创建纪念事件
    createEvent: async (eventData) => {
        return await request('/memorial/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    },

    // 发送时空信
    sendTimeLetter: async (letterData) => {
        return await request('/memorial/time-letters', {
            method: 'POST',
            body: JSON.stringify(letterData)
        });
    },

    // 获取时空信
    getTimeLetters: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/memorial/time-letters?${queryString}`);
    },

    // 获取成长时间线
    getTimeline: async (petId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`/memorial/timeline/${petId}?${queryString}`);
    },

    // 添加成长记录
    addTimelineEvent: async (petId, eventData) => {
        return await request(`/memorial/timeline/${petId}`, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }
};

// 空间装饰API
export const decorationAPI = {
    // 获取装饰配置
    getDecorations: async (petId) => {
        return await request(`/decoration/${petId}`);
    },

    // 更新装饰配置
    updateDecoration: async (petId, decorationData) => {
        return await request(`/decoration/${petId}`, {
            method: 'PUT',
            body: JSON.stringify(decorationData)
        });
    },

    // 获取主题列表
    getThemes: async () => {
        return await request('/decoration/themes');
    },

    // 获取挂件列表
    getWidgets: async (category) => {
        const url = category ? `/decoration/widgets?category=${category}` : '/decoration/widgets';
        return await request(url);
    },

    // 获取音乐列表
    getMusic: async (type) => {
        const url = type ? `/decoration/music?type=${type}` : '/decoration/music';
        return await request(url);
    }
};

// AI卡通化API
export const aiAPI = {
    // 生成卡通形象
    generateAvatar: async (imageFile, style) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('style', style);

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/ai/generate-avatar`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '生成失败');
        }

        return await response.json();
    },

    // 获取生成历史
    getHistory: async (petId, params = {}) => {
        const queryString = new URLSearchParams({ pet_id: petId, ...params }).toString();
        return await request(`/ai/history?${queryString}`);
    },

    // 创建表情包
    createSticker: async (avatarId, template) => {
        return await request('/ai/sticker', {
            method: 'POST',
            body: JSON.stringify({
                avatar_id: avatarId,
                template: template
            })
        });
    }
};

// 导出通用函数
export { getToken, setToken, clearToken, getUser, setUser, clearUser };