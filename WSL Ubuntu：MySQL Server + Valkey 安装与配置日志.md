# WSL Ubuntu：MySQL Server + Valkey 安装与配置日志

## 1. MySQL Server

### 安装

```bash
sudo apt update
sudo apt install mysql-server
```

查看版本：

```bash
mysql --version
```

启动：

```bash
sudo service mysql start
```

查看状态：

```bash
sudo service mysql status
```

### 配置 root 密码

Ubuntu 安装的 MySQL 默认可能使用 `auth_socket`，此时：

```bash
sudo mysql
```

可以直接进入 MySQL。

查看 root 的认证方式：

```sql
SELECT user, host, plugin FROM mysql.user;
```

如果看到：

```text
root | localhost | auth_socket
```

说明 root 使用 Linux Socket 认证。

MySQL 8.4 不再默认加载 `mysql_native_password`，因此不要使用：

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED WITH mysql_native_password
BY '123456789';
```

否则会出现：

```text
ERROR 1524 (HY000): Plugin 'mysql_native_password' is not loaded
```

改用 MySQL 8 默认的 `caching_sha2_password`：

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED WITH caching_sha2_password
BY '123456789';

FLUSH PRIVILEGES;
```

确认：

```sql
SELECT user, host, plugin FROM mysql.user;
```

应该看到：

```text
root | localhost | caching_sha2_password
```

退出：

```sql
exit;
```

测试密码登录：

```bash
mysql -u root -p
```

输入设置的密码即可。

---

## 2. Valkey

### 安装

```bash
sudo apt update
sudo apt install valkey-server
```

查看版本：

```bash
valkey-server --version
```

启动：

```bash
sudo systemctl start valkey
```

查看状态：

```bash
sudo systemctl status valkey
```

### 配置密码

编辑配置文件：

```bash
sudo nano /etc/valkey/valkey.conf
```

找到：

```conf
# requirepass foobared
```

修改为：

```conf
requirepass 123456789
```

保存后重启：

```bash
sudo systemctl restart valkey
```

查看状态：

```bash
sudo systemctl status valkey
```

### 测试密码

直接进入：

```bash
valkey-cli
```

执行：

```text
PING
```

如果返回：

```text
(error) NOAUTH Authentication required.
```

说明密码已经生效。

认证：

```text
AUTH 123456789
```

返回：

```text
OK
```

再次：

```text
PING
```

返回：

```text
PONG
```

说明 Valkey 配置成功。

---

## 3. Node.js 连接配置

### MySQL

例如使用 `mysql2`：

```bash
npm install mysql2
```

配置：

```js
const connection = mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "123456789",
    database: "your_database",
});
```

### Valkey

Valkey 与 Redis 协议兼容，可以使用 `ioredis`：

```bash
npm install ioredis
```

配置：

```js
import Redis from "ioredis";

const valkey = new Redis({
    host: "127.0.0.1",
    port: 6379,
    password: "123456789",
});
```

测试：

```js
await valkey.set("test", "hello");

console.log(await valkey.get("test"));
```

输出：

```text
hello
```

---

## 4. WSL 中服务管理

### MySQL

启动：

```bash
sudo systemctl start mysql
```

停止：

```bash
sudo systemctl stop mysql
```

重启：

```bash
sudo systemctl restart mysql
```

状态：

```bash
sudo systemctl status mysql
```

### Valkey

启动：

```bash
sudo systemctl start valkey
```

停止：

```bash
sudo systemctl stop valkey
```

重启：

```bash
sudo systemctl restart valkey
```

状态：

```bash
sudo systemctl status valkey
```

---

## 5. 开启 WSL systemd

如果希望 WSL 启动后自动管理 MySQL 和 Valkey，可以开启 systemd。

编辑：

```bash
sudo nano /etc/wsl.conf
```

加入：

```ini
[boot]
systemd=true
```

保存后，在 Windows 中执行：

```cmd
wsl --shutdown
```

重新打开 Ubuntu。

检查：

```bash
systemctl status
```

之后即可使用：

```bash
sudo systemctl start mysql
sudo systemctl start valkey
```

管理服务。

## 6. 常用检查命令

查看 MySQL 3306：

```bash
sudo ss -tlnp | grep 3306
```

查看 Valkey 6379：

```bash
sudo ss -tlnp | grep 6379
```

查看 MySQL：

```bash
sudo systemctl status mysql
```

查看 Valkey：

```bash
sudo systemctl status valkey
```

---

## 7. 当前配置

| 服务 | 地址 | 端口 | 用户 | 密码 |
|---|---|---:|---|---|
| MySQL | `127.0.0.1` | `3306` | `root` | `123456789` |
| Valkey | `127.0.0.1` | `6379` | - | `123456789` |

> 注意：实际项目不要把生产环境密码直接写进代码或提交到 Git，建议使用 `.env` 或其他密钥管理方式。