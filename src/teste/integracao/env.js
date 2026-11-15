// Toda a suíte aponta para o banco local de testes, nunca para o Neon
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/sinaliza_teste';
