const { Token } = require("./sqlite/model"); // 你的 SQLite 封装模型
const jwt = require("jsonwebtoken");


// 内存 Map 保存临时 token（可选）
const fileTokens = new Map();

function generateFileToken(fileId, expiresIn = "1h") {
  let token = null;
  const now = Date.now();

  try {
    if (!fileTokens.has(fileId)) throw new Error("缓存中不存在");

    const ca = fileTokens.get(fileId);
    const payload = jwt.verify(ca.token, process.env.JWT_SECRET);

    const iatMs = payload.iat * 1000;
    const expMs = payload.exp * 1000;

    const life = expMs - iatMs;
    const used = now - iatMs;

    // 超过 2/4 生命周期，直接刷新
    if (used >= life / 2) {
      throw new Error("Token half expired");
    }

    // 已过期，理论上 verify 已经会抛，但留着更直观
    if (now >= expMs) {
      fileTokens.delete(fileId);
      throw new Error("Token expired");
    }

    token = ca.token;
  } catch (err) {
    token = jwt.sign({ fileId }, process.env.JWT_SECRET, { expiresIn });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    fileTokens.set(fileId, {
      token,
      expiresAt: payload.exp * 1000
    });
  }

  return token;
}

/**
 * 验证 token（不依赖数据库）
 * @param {String} token
 * @returns {Promise<{fileId: String}>}
 */
async function verifyFileToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { fileId } = payload;

    if (!fileTokens.has(fileId)) {
      throw new Error("Token expired");
    }

    const record = fileTokens.get(fileId);

    // 关键校验：必须是当前 token
    if (record.token !== token) {
      throw new Error("Token expired");
    }

    if (Date.now() >= record.expiresAt) {
      fileTokens.delete(fileId);
      throw new Error("Token expired");
    }

    return { fileId };
  } catch (err) {
    throw new Error("Token expired");
  }
}



/**
 * 生成 token 并保存到 SQLite
 * @param {String} fileId
 * @param {String} expiresIn 可选，默认 '1d'
 * @returns {Promise<String>} token
 */
async function createToken(userId, expiresIn = "1d") {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const existing = await Token.findOne([{ field: "userId", value: userId }]);
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
    const record = await Token.findOne([
      { field: "userId", value: payload.userId },
      { field: "token", value: token },
      { field: "enabled", value: 1 },
      { field: "expiresAt", value: Date.now(), op: ">" },
    ]);
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
  const record = await Token.findOne([{ field: "userId", value: userId }]);
  return record ? record.token : null;
}
module.exports = {
  createToken,
  checkToken,
  getTokenByUserId,
  generateFileToken,
  verifyFileToken,
  fileTokens
};
