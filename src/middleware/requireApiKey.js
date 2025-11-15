const bcrypt = require('bcrypt');

module.exports = function() {
  return async (req, res, next) => {
    const apiKey = req.get('x-api-key') || req.get('authorization');
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    const prisma = req.app.locals.prisma;
    // Lookup by prefix or other strategy. Here we store prefix as rawPrefix
    const prefix = apiKey.slice(0, 8);
    const keyRecord = await prisma.apiKey.findFirst({
      where: { rawPrefix: prefix, revoked: false },
      include: { app: true }
    });

    if (!keyRecord) return res.status(401).json({ error: 'Invalid API key' });

    // Check expiry
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'API key expired' });
    }

    const match = await bcrypt.compare(apiKey, keyRecord.keyHash);
    if (!match) return res.status(401).json({ error: 'Invalid API key' });

    // attach app context
    req.appContext = { appId: keyRecord.appId, app: keyRecord.app };
    next();
  };
};
