// Testes de integração (Bottom-up) do back, no banco local de testes.
// Rodar a partir de librasteca-backend (com o container sinaliza-postgres-teste no ar):
//   npx jest --config src/teste/integracao/jest.config.js --runInBand
const base = require('../jest.config.js');

module.exports = {
  ...base,
  testRegex: 'src/teste/integracao/.*\.spec\.ts$',
  globalSetup: '<rootDir>/src/teste/integracao/global-setup.js',
  setupFiles: ['<rootDir>/src/teste/integracao/env.js'],
  testTimeout: 30_000,
  // O pool do pg fica aberto após o Prisma desconectar; encerra ao fim da suíte
  forceExit: true,
};
