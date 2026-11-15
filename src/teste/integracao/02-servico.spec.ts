// NÍVEL 2: SignService + SignRepository (já validado no N1) + banco.
// O teste continua sendo o driver. O R2 (Cloudflare, serviço externo) e as
// notificações ficam simulados; todo o resto é real.
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SignRepository } from '@modules/sign/repositories/sign.repository';
import { SignService } from '@modules/sign/sign.service';
import { Role } from '@common/enums/enum';
import { montarCenario } from './fixtures';

describe('Integração N2 — SignService com repositório e banco', () => {
  const prisma = new PrismaService();
  const r2 = { delete: jest.fn(), uploadImage: jest.fn(), uploadVideo: jest.fn() };
  const service = new SignService(new SignRepository(prisma), r2 as any, prisma, {} as any, {} as any);
  let c: Awaited<ReturnType<typeof montarCenario>>;

  beforeAll(async () => {
    c = await montarCenario(prisma, 'n2');
  });
  afterAll(() => prisma.$disconnect());

  const editar = (userId: string, roles: Role[], texto: string) =>
    service.update(c.privado.id, { examplePt: texto } as any, {}, userId, roles);
  const exemploNoBanco = async () => (await prisma.sign.findUnique({ where: { id: c.privado.id } }))?.examplePt;

  it('IT-03: o criador edita o próprio sinal e a mudança é gravada', async () => {
    await editar(c.professor.id, [Role.EDUCATOR], 'pelo criador');
    expect(await exemploNoBanco()).toBe('pelo criador');
  });

  it('IT-04: o administrador da turma edita o sinal da turma', async () => {
    await editar(c.adminTurma.id, [Role.STUDENT], 'pelo admin da turma');
    expect(await exemploNoBanco()).toBe('pelo admin da turma');
  });

  it('IT-05: o gestor edita o sinal de qualquer educador', async () => {
    await editar(c.gestor.id, [Role.EDUCATOR, Role.MANAGER], 'pelo gestor');
    expect(await exemploNoBanco()).toBe('pelo gestor');
  });

  it('IT-06: o educador de fora não edita nem exclui, e o banco não muda', async () => {
    await expect(editar(c.professor2.id, [Role.EDUCATOR], 'invasor')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.delete(c.privado.id, c.professor2.id, [Role.EDUCATOR])).rejects.toBeInstanceOf(ForbiddenException);
    expect(await exemploNoBanco()).toBe('pelo gestor');
    expect(r2.delete).not.toHaveBeenCalled();
  });

  it('o criador exclui o sinal, que some do banco', async () => {
    await service.delete(c.privado.id, c.professor.id, [Role.EDUCATOR]);
    expect(await prisma.sign.findUnique({ where: { id: c.privado.id } })).toBeNull();
  });
});
