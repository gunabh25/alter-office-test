const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

module.exports.collectEvent = async (req, res, next) => {
  try {
    const { event, url, referrer, device, ipAddress, timestamp, metadata, userId } = req.body;
    const appId = req.appContext && req.appContext.appId;
    if (!appId) return res.status(400).json({ error: 'Invalid app context' });

    // Basic validation
    if (!event) return res.status(400).json({ error: 'event required' });

    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

    await prisma.event.create({
      data: {
        event,
        url,
        referrer,
        device,
        ipAddress,
        timestamp: eventTimestamp,
        metadata,
        appId,
        userId
      }
    });

    // optionally: publish to queue for async aggregations, but here we return 201
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

module.exports.eventSummary = async (req, res, next) => {
  try {
    const { event, startDate, endDate, app_id } = req.query;
    const cacheKey = `eventSummary:${event}:${startDate || 'any'}:${endDate || 'any'}:${app_id || 'all'}`;

    // Try cache
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const where = {};
    if (event) where.event = event;
    if (app_id) where.appId = app_id;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(new Date(endDate).getTime() + 24*3600*1000 - 1);
    }

    // Prisma group/aggregate: get count and unique users and device breakdown
    const total = await prisma.event.count({ where });

    const uniqueUsers = await prisma.event.aggregate({
      _count: { userId: true },
      where: { ...where, userId: { not: null } }
    });
    // device counts
    const deviceCounts = await prisma.$queryRaw`
      SELECT device, COUNT(*) as count
      FROM "Event"
      WHERE ${Object.keys(where).length ? 'true' : 'true'}
      ${app_id ? `AND "appId" = ${app_id}` : ''}
      ${event ? `AND "event" = ${event}` : ''}
      ${startDate ? `AND "timestamp" >= ${new Date(startDate)}` : ''}
      ${endDate ? `AND "timestamp" <= ${new Date(new Date(endDate).getTime() + 24*3600*1000 - 1)}` : ''}
      GROUP BY device;
    `;

    const response = {
      event: event || 'all',
      count: total,
      uniqueUsers: uniqueUsers._count || 0,
      deviceData: deviceCounts.reduce((acc, r) => { acc[r.device || 'unknown'] = Number(r.count); return acc; }, {})
    };

    // cache short-lived
    await cache.set(cacheKey, JSON.stringify(response), 60); // 60s TTL
    res.json(response);
  } catch (err) { next(err); }
};

module.exports.userStats = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const totalEvents = await prisma.event.count({ where: { userId } });
    const latestEvents = await prisma.event.findMany({ where: { userId }, orderBy: { timestamp: 'desc' }, take: 10 });

    // device summary - aggregate metadata.browser, metadata.os if present
    const deviceDetailsRaw = await prisma.$queryRaw`
      SELECT metadata->>'browser' AS browser, metadata->>'os' as os, COUNT(*) as count
      FROM "Event"
      WHERE "userId" = ${userId}
      GROUP BY browser, os
      ORDER BY count DESC
      LIMIT 1;
    `;

    const ip = (await prisma.event.findFirst({ where: { userId }, orderBy: { timestamp: 'desc' } })).ipAddress;

    const deviceDetails = deviceDetailsRaw.length ? { browser: deviceDetailsRaw[0].browser, os: deviceDetailsRaw[0].os } : {};

    res.json({
      userId,
      totalEvents,
      deviceDetails,
      ipAddress: ip,
      recentEvents: latestEvents
    });
  } catch (err) { next(err); }
};
