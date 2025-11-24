<template>
    <div class="loginPage">
        <div class="login-card">
            <div class="logo-area">
                <img class="logo" src="/logo2.png" alt="logo">
                <!-- <span class="logo-icon">☁️🌿</span>-->
                <span class="logo-text">小清新云盘</span>
            </div>
            <div class="form-wrapper">
                <template v-if="isInitialized">
                    <h2 class="title">💖 欢迎回来！管理员登录</h2>
                    <el-form @submit.prevent="handleLogin">
                        <el-form-item>
                            <el-input size="large" type="text" v-model="loginForm.username" placeholder="用户名" />
                        </el-form-item>
                        <el-form-item>
                            <el-input size="large" type="password" v-model="loginForm.password" placeholder="密码" />
                        </el-form-item>
                        <div class="remember-me">
                            <el-checkbox v-model="loginForm.rememberMe">
                                <span>记住我</span>
                            </el-checkbox>
                        </div>
                        <el-button size="large" class="w-full" type="primary">🚀 登 录</el-button>
                    </el-form>
                </template>

                <template v-else>
                    <h2 class="title">✨ 欢迎使用！请设置管理员账号</h2>
                    <el-form label-position="top">
                        <el-form-item>
                            <el-input size="large" type="text" v-model="initForm.username" placeholder="管理员用户名" />
                        </el-form-item>
                        <el-form-item>
                            <el-input size="large" type="password" v-model="initForm.password" placeholder="设置密码" />
                        </el-form-item>
                        <el-form-tiem label-position="left">
                            <el-input size="large" type="password" v-model="initForm.confirmPassword"
                                placeholder="确认密码" />
                        </el-form-tiem>
                        <el-button size="large" class="w-full mt-5" type="primary">✨ 立即初始化并登录</el-button>
                    </el-form>
                    <p class="safety-tip">⚠️ 提示: 此账号是您网盘的唯一凭证，请务必妥善保管。</p>
                </template>
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios'; // 假设使用 axios 进行 HTTP 请求

// --- 状态管理 ---
const isInitialized = ref(true); // 默认假设已初始化，进入登录页
const errorMessage = ref('');

// --- 表单数据 ---
const loginForm = ref({
    username: '',
    password: '',
    rememberMe: false
});

const initForm = ref({
    username: '',
    password: '',
    confirmPassword: ''
});

// --- 接口常量 (对应我们设计的接口) ---
const API_URL = '/api';

// --- 核心逻辑 ---

// 1. 检查网盘初始化状态
const checkInitializationStatus = async () => {
    // try {
    //     errorMessage.value = '';
    //     const response = await axios.get(`${API_URL}/user/status`);
    //     // 假设后端返回 { status: 'initialized' } 表示已初始化
    //     isInitialized.value = response.data.status === 'initialized';
    // } catch (error) {
    //     // 假设接口报错或返回特定状态码表示未初始化
    //     // 稳妥起见，这里假设任何非正常响应都可能意味着需要初始化
    //     isInitialized.value = false;
    // }
};

// 2. 初始化网盘
const handleInitialize = async () => {
    errorMessage.value = '';
    if (initForm.value.password !== initForm.value.confirmPassword) {
        errorMessage.value = '两次输入的密码不一致哦！';
        return;
    }
    try {
        // 提交初始化数据到 /api/user/initialize
        await axios.post(`${API_URL}/user/initialize`, {
            username: initForm.value.username,
            password: initForm.value.password,
        });

        // 初始化成功后，应立即登录或切换到登录页
        alert('初始化成功！请登录。');
        isInitialized.value = true;
        // 自动填写用户名，方便用户直接登录
        loginForm.value.username = initForm.value.username;
    } catch (error) {
        errorMessage.value = error.response?.data?.message || '初始化失败，请稍后重试。';
    }
};

// 3. 管理员登录
const handleLogin = async () => {
    errorMessage.value = '';
    try {
        // 提交登录数据到 /api/auth/login
        const response = await axios.post(`${API_URL}/auth/login`, {
            username: loginForm.value.username,
            password: loginForm.value.password,
            rememberMe: loginForm.value.rememberMe
        });

        // 登录成功，跳转到网盘主界面
        console.log('登录成功！Token:', response.data.token);
        // router.push('/main'); // 实际应用中会进行路由跳转
        alert('登录成功，即将进入网盘主页！');

    } catch (error) {
        errorMessage.value = error.response?.data?.message || '登录失败，请检查用户名和密码。';
    }
};

// 在组件挂载时，立即检查状态
onMounted(() => {
    checkInitializationStatus();
});
</script>

<style lang="scss">
// --- 核心色值（薄荷绿治愈主题）---
$text-color-dark: #333333; // 主要文字
$text-color-light: #666666; // 辅助文字
$card-background: #FFFFFF; // 卡片背景
$error-color: #FFADAD; // 警告色（低饱和度珊瑚粉）

.loginPage {
    width: 100%;
    height: 100vh; // 使用 100vh 确保占据整个视口高度
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url(bg.png);
    background-size: cover;
    background-position: center center;

    .login-card {
        width: 100%;
        max-width: 380px; // 限制最大宽度，保持极简居中效果
        padding: 40px 30px;
        background-color: $card-background;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); // 增加一点柔和的阴影
        text-align: center;
        transition: all 0.3s ease;

        .logo-area {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            .logo{
                width: 32px;
            }
            .logo-text {
                font-size: 24px;
                font-weight: bold;
                color: $text-color-dark;
                margin-left: 10px;
            }
        }

        .title {
            color: $text-color-dark;
            font-size: 20px;
            margin-bottom: 30px;
            font-weight: 500;
        }


        .remember-me {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 25px;
            font-size: 14px;
            color: $text-color-light;
        }

        .safety-tip {
            margin-top: 20px;
            font-size: 12px;
            color: $text-color-light;
        }

        .error-message {
            margin-top: 15px;
            color: $error-color;
            font-size: 14px;
            font-weight: 500;
        }
    }
}
</style>