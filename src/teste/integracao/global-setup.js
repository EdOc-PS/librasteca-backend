// Antes da suíte: aplica as migrações e recria os dados de partida (usuários,
// categorias, configurações de mão) no banco local de testes.
const path = require('path');
const { execSync } = require('child_process');

module.exports = () => {
  const cwd = path.resolve(__dirname, '../../..');
  const env = { ...process.env, DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/sinaliza_teste' };
  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'pipe' });
  execSync('npx ts-node -r tsconfig-paths/register src/teste/e2e/seed.ts', { cwd, env, stdio: 'pipe' });
};
