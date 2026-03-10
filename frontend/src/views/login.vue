<template>
    <div class="loginPage">
        <div class="login-card">
            <div class="logo-area">
                <img class="logo" src="/logo2.png" alt="logo">
                <span class="logo-text">小清新云盘</span>   
            </div>
            <div class="form-wrapper">
                <template v-if="isInitialized">
                    <h2 class="title">💖 欢迎回来！管理员登录</h2>
                    <el-form :model="loginForm" :rules="loginFormRules" ref="formRef">
                        <el-form-item prop="username">
                            <el-input size="large" type="text" v-model="loginForm.username" placeholder="用户名" />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input size="large" type="password" v-model="loginForm.password" placeholder="密码" />
                        </el-form-item>
                        <div class="remember-me">
                            <el-checkbox v-model="loginForm.rememberMe">
                                <span>记住我</span>
                            </el-checkbox>
                        </div>
                        <el-button size="large" @click="handleLogin" :loading="submitLoading" class="w-full"
                            type="primary">🚀 登 录</el-button>
                    </el-form>
                </template>

                <template v-else>
                    <h2 class="title">✨ 欢迎使用！请设置管理员账号</h2>
                    <el-form :model="initForm" :rules="initFormRules" ref="formRef">
                        <el-form-item prop="username">
                            <el-input size="large" type="text" v-model="initForm.username" placeholder="管理员用户名" />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input size="large" type="password" v-model="initForm.password" placeholder="设置密码" />
                        </el-form-item>
                        <el-form-item label-position="left" prop="confirmPassword">
                            <el-input size="large" type="password" v-model="initForm.confirmPassword"
                                placeholder="确认密码" />
                        </el-form-item>
                        <el-button size="large" @click="handleInitialize" :loading="submitLoading" class="w-full mt-5"
                            type="primary">✨
                            立即初始化并登录</el-button>
                    </el-form>
                    <p class="safety-tip">⚠️ 提示: 此账号是您网盘的唯一凭证，请务必妥善保管。</p>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userStatus, initialize, userLogin } from '@/request/user';
import { ElMessage } from "element-plus";
import { useRouter } from 'vue-router';
const router = useRouter();
const userStore = useUserStore();
const isInitialized = ref(true);
const formRef = ref(null);
// --- 表单数据 ---
const loginForm = ref({
    username: 'hkta',
    password: '123456',
    rememberMe: false
});
const submitLoading = ref(false);

const initForm = ref({
    username: '',
    password: '',
    confirmPassword: ''
});


const initFormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: ['blur', 'submit'] }],
    confirmPassword: [{
        required: true, trigger: ['blur', 'submit'], validator: (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入密码'));
            } else if (value !== initForm.value.password) {
                callback(new Error('两次输入的密码不一致哦！'));
            } else {
                callback();
            }
        }
    }],
}


const loginFormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: ['blur', 'submit'] }],
};

// 1. 检查网盘初始化状态
const checkInitializationStatus = async () => {
    return await userStatus().then((res) => res.data).catch((error) => false);
};

// 2. 初始化网盘
function handleInitialize() {
    formRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true;
            initialize({
                username: initForm.value.username,
                password: initForm.value.password
            }).then(toHome).finally(() => submitLoading.value = false)
        }
    })
};

function toHome(res) {
    setItem("token", res.data);
    ElMessage.success(res.msg);
    setTimeout(() => {
        userStore.fetchUserInfo();
        router.replace("/");
    }, 50);
}
// 3. 管理员登录
const handleLogin = async () => {
    formRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true;
            await userLogin({
                username: loginForm.value.username,
                password: loginForm.value.password,
                rememberMe: loginForm.value.rememberMe
            }).then(toHome).finally(() => submitLoading.value = false)
        }
    })
};

// 在组件挂载时，立即检查状态
onMounted(async () => {
    isInitialized.value = await checkInitializationStatus();
    console.log(isInitialized.value);
    
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
    background-image: url('@/assets/bg.png');
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

            .logo {
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