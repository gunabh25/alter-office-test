const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function generateApiKey() {
  // strong random key
  return crypto.randomBytes(32).toString('hex');
}

module.exports.registerApp = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const { name, ownerEmail, expiresInDays } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    // optionally: verify Google OAuth token here and extract ownerEmail
    const app = await prisma.app.create({ data: { name, ownerEmail } });

    const rawKey = await generateApiKey();
    const prefix = rawKey.slice(0,8);
    const keyHash = await bcrypt.hash(rawKey, 10);

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays*24*3600*1000) : null;

    await prisma.apiKey.create({
      data: {
        keyHash,
        rawPrefix: prefix,
        appId: app.id,
        expiresAt
      }
    });

    // return the rawKey once
    res.json({ appId: app.id, apiKey: rawKey });
  } catch (err) { next(err); }
};

module.exports.getApiKey = async (req, res, next) => {
  try {
    // This endpoint should be protected or require OAuth; here simplified: fetch latest key for appId
    const prisma = req.app.locals.prisma;
    const { appId } = req.query;
    if (!appId) return res.status(400).json({ error: 'appId required' });

    const keys = await prisma.apiKey.findMany({ where: { appId }, orderBy: { createdAt: 'desc' }});
    if (!keys || keys.length === 0) return res.status(404).json({ error: 'No API key found' });

    // For security we shouldn’t return raw key; better to regenerate. But per brief provide retrieval option — produce warning.
    return res.status(403).json({ error: 'Retrieving raw API keys is not supported for security. Please regenerate.'});
  } catch (err) { next(err); }
};

module.exports.revokeApiKey = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const { apiKeyPrefix, appId } = req.body;
    if (!apiKeyPrefix || !appId) return res.status(400).json({ error: 'apiKeyPrefix and appId required' });

    await prisma.apiKey.updateMany({
      where: { rawPrefix: apiKeyPrefix, appId },
      data: { revoked: true }
    });

    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports.regenerateApiKey = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const { appId, revokeExisting=true, expiresInDays } = req.body;
    if (!appId) return res.status(400).json({ error: 'appId required' });

    if (revokeExisting) {
      await prisma.apiKey.updateMany({ where: { appId }, data: { revoked: true }});
    }

    const rawKey = await generateApiKey();
    const prefix = rawKey.slice(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays*24*3600*1000) : null;

    await prisma.apiKey.create({
      data: { keyHash, rawPrefix: prefix, appId, expiresAt }
    });

    res.json({ apiKey: rawKey }); // return once
  } catch (err) { next(err); }
};
