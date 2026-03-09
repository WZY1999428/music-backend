INSERT INTO biz_customer 
(user_id, product_id, status, product_data, money_data, user_data, images, descript, title, phone, submit_date, created_at, updated_at)
VALUES
(13, 101, 1, '{"name":"耳机","spec":"黑色"}', '{"price":199,"currency":"CNY"}', '{"nickname":"用户A"}', '["img1.jpg","img2.jpg"]', '商品很好', '蓝牙耳机', '13800001231', NOW(), NOW(), NOW()),

(13, 102, 0, '{"name":"键盘","spec":"RGB"}', '{"price":299,"currency":"CNY"}', '{"nickname":"用户B"}', '["img3.jpg"]', '机械键盘', '机械键盘', '13800001232', NOW(), NOW(), NOW()),

(13, 103, 1, '{"name":"鼠标","spec":"无线"}', '{"price":129,"currency":"CNY"}', '{"nickname":"用户C"}', '["img4.jpg"]', '无线鼠标', '游戏鼠标', '13800001233', NOW(), NOW(), NOW()),

(13, 104, 2, '{"name":"显示器","spec":"27寸"}', '{"price":1299,"currency":"CNY"}', '{"nickname":"用户D"}', '["img5.jpg"]', '高清显示器', '27寸显示器', '13800001234', NOW(), NOW(), NOW()),

(13, 105, 1, '{"name":"U盘","spec":"64G"}', '{"price":59,"currency":"CNY"}', '{"nickname":"用户E"}', '["img6.jpg"]', '高速U盘', '64G U盘', '13800001235', NOW(), NOW(), NOW()),

(13, 106, 0, '{"name":"硬盘","spec":"1TB"}', '{"price":399,"currency":"CNY"}', '{"nickname":"用户F"}', '["img7.jpg"]', '移动硬盘', '1TB硬盘', '13800001236', NOW(), NOW(), NOW()),

(13, 107, 1, '{"name":"充电器","spec":"65W"}', '{"price":89,"currency":"CNY"}', '{"nickname":"用户G"}', '["img8.jpg"]', '快充充电器', '65W充电器', '13800001237', NOW(), NOW(), NOW()),

(13, 108, 2, '{"name":"数据线","spec":"Type-C"}', '{"price":29,"currency":"CNY"}', '{"nickname":"用户H"}', '["img9.jpg"]', '耐用数据线', 'TypeC数据线', '13800001238', NOW(), NOW(), NOW()),

(13, 109, 1, '{"name":"音箱","spec":"蓝牙"}', '{"price":159,"currency":"CNY"}', '{"nickname":"用户I"}', '["img10.jpg"]', '蓝牙音箱', '桌面音箱', '13800001239', NOW(), NOW(), NOW()),

(13, 110, 0, '{"name":"路由器","spec":"WiFi6"}', '{"price":499,"currency":"CNY"}', '{"nickname":"用户J"}', '["img11.jpg"]', '高速路由', 'WiFi6路由器', '13800001240', NOW(), NOW(), NOW());