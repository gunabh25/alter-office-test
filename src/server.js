require('dotenv').config();
const app = require('./app');
const { port } = require('./config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function start() {
  app.locals.prisma = prisma;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
start().catch(e => {
  console.error(e);
  process.exit(1);
});
