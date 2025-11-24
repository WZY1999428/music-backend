const Router = require('@koa/router');
const fs = require('fs');
const path = require('path');

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'all'];

function registerRoutes(routerDir, prefix = '') {
  const router = new Router();

  function parseRouteName(name) {
    // 替换 [param] 为 :param
    return name.replace(/\[([^\]]+)\]/g, ':$1');
  }

  function walk(dir, parentPath = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath, path.posix.join(parentPath, file));
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
        const mod = require(fullPath);

        // 解析路由方法和路径
        let method = 'get';
        let routeName = path.basename(file, path.extname(file)); // 去掉扩展名

        // 文件名支持 method 后缀，如 login.get.js
        const parts = routeName.split('.');
        if (parts.length === 2 && HTTP_METHODS.includes(parts[1].toLowerCase())) {
          routeName = parts[0];
          method = parts[1].toLowerCase();
        }

        // 解析 params，比如 xxx[id] -> xxx/:id
        routeName = parseRouteName(routeName);

        // index.js 映射根路径
        if (routeName === 'index') routeName = '';

        const routePath = path.posix.join(parentPath, routeName);
        let handlers = [];

        if (typeof mod === 'function') {
          handlers = [mod];
        } else if (Array.isArray(mod)) {
          handlers = mod; // 支持中间件数组
        } else {
          return;
        }
        const routerPath = prefix + (routePath.startsWith('/') ? routePath : '/' + routePath);
        router[method](routerPath, ...handlers);
        // console.log(routerPath);
      }
    });
  }

  walk(routerDir);

  return router;
}

module.exports = registerRoutes;
