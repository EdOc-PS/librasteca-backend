// NÍVEL 1 (base da abordagem Bottom-up): SignRepository + PrismaService + PostgreSQL.
// Nenhum módulo acima existe ainda: o próprio teste é o "driver" que chama o repositório.
import { PrismaService } from '@/database/prisma.service';
import { SignRepository } from '@modules/sign/repositories/sign.repository';
import { montarCenario } from './fixtures';

describe('Integração N1 — SignRepository com o banco', () => {
  const prisma = new PrismaService();
  const repository = new SignRepository(prisma);
  let c: Awaited<ReturnType<typeof montarCenario>>;

  beforeAll(async () => {
    c = await montarCenario(prisma, 'n1');
  });
  afterAll(() => prisma.$disconnect());

  const ids = (list: { id: string }[]) => list.map((s) => s.id);

  it('IT-01: o dono da turma vê o sinal privado dela e o sinal público', async () => {
    const recentes = ids(await repository.findRecent(c.professor.id, false, 50));
    expect(recentes).toEqual(expect.arrayContaining([c.privado.id, c.publico.id]));
  });

  it('o aluno matriculado vê o sinal privado da turma', async () => {
    expect(ids(await repository.findRecent(c.aluno.id, false, 50))).toContain(c.privado.id);
  });

  it('IT-02: o educador de fora vê o público, mas não o privado', async () => {
    const recentes = ids(await repository.findRecent(c.professor2.id, false, 50));
    expect(recentes).toContain(c.publico.id);
    expect(recentes).not.toContain(c.privado.id);
  });

  it('o gestor vê todos, do mais novo para o mais antigo, respeitando o limite', async () => {
    const recentes = await repository.findRecent(c.gestor.id, true, 2);
    expect(recentes).toHaveLength(2);
    // O público foi criado depois do privado
    expect(ids(recentes)).toEqual([c.publico.id, c.privado.id]);
  });
});
