const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Analytics API', () => {
  let server;
  beforeAll((done) => {
    server = app.listen(0, done);
  });
  afterAll(async () => {
    await prisma.$disconnect();
    server.close();
  });

  test('collect event without api key should fail', async () => {
    const res = await request(server).post('/api/analytics/collect').send({ event: 'test' });
    expect(res.status).toBe(401);
  });

  // Add tests for register -> collect -> summary flow. Requires DB, but illustrates approach.
});
