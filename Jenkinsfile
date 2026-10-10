pipeline {
    agent any

    environment {
        // 将 NVM 的 Node 路径以及系统的基础路径拼接起来
        PATH = "/root/.nvm/versions/node/v24.12.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
    }
    
    stages {
        stage('环境检查') {
            steps {
                echo '============================== [1/4] 检查环境版本 =============================='
                sh 'node -v'
                sh 'npm -v'
                echo '环境检查通过！'
            }
        }

        stage('安装依赖') {
            steps {
                echo '============================== [2/4] 开始安装项目依赖 (npm i) =============================='
                sh 'npm i'
                echo '依赖安装完成！'
            }
        }

        stage('项目构建') {
            steps {
                echo '============================== [3/4] 开始构建项目 (npm run build) =============================='
                sh 'npm run build'
                echo '项目构建成功！'
            }
        }

        stage('服务重启') {
            steps {
                echo '============================== [4/4] 使用 PM2 重启服务 (koa-serve) =============================='
                sh 'npm start'
                echo '服务已成功重启并上线！'
            }
        }
    }
}