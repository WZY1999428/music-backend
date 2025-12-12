const { Token } = require("./sqlite/model"); // 你的 SQLite 封装模型
const jwt = require("jsonwebtoken");

/**
 * 生成 token 并保存到 SQLite
 * @param {String} userId
 * @param {String} expiresIn 可选，默认 '1d'
 * @returns {Promise<String>} token
 */
async function createToken(userId, expiresIn = "1d") {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const existing = await Token.findOne({ userId });
  if (existing) {
    await Token.update({ userId }, { token, expiresAt: payload.exp * 1000 }); // 你的 insert 实际是 upsert
  } else {
    await Token.insert({ userId, token, expiresAt: payload.exp * 1000 });
  }
  return token;
}

/** 
 * @param {String} token
 * @returns {Promise<{userId: String}>} 验证后的 payload
 */
async function checkToken(token) {
  try {
    // 验证 JWT 签名和过期
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 检查数据库是否存在且未过期
    const record = await Token.findOne({ userId: payload.userId, token, enabled: 1, expiresAt: { $gt: Date.now() } });
    if (!record) throw new Error("Token revoked or expired");
    return payload; // 返回 payload，更通用
  } catch (err) {
    throw new Error(err.message);
  }
}
/**
 * 根据 user_id 获取 token
 * @param {String} userId
 * @returns {Promise<String|null>} token
 */
async function getTokenByUserId(userId) {
  const record = await Token.findOne({ userId });
  return record ? record.token : null;
}
module.exports = {
  createToken,
  checkToken,
  getTokenByUserId,
};
