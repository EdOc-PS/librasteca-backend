// Cobertura do back: testes de unidade + integração juntos.
//   npx jest --config src/teste/cobertura.config.js --runInBand
const integracao = require('./integracao/jest.config.js');

module.exports = {
  ...integracao,
  testRegex: 'src/teste/(unit|integracao)/.*\.spec\.ts$',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/teste/**', '!src/**/*.module.ts', '!src/main.ts', '!src/common/swagger/**', '!src/**/*.dto.ts', '!src/**/dto/**', '!src/**/seed*.ts'],
  coverageDirectory: '<rootDir>/src/teste/cobertura',
  coverageReporters: ['text-summary', 'json-summary', 'html'],
};
