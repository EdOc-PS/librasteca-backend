// NÍVEL 3 (topo): a aplicação NestJS inteira — rotas, guards de JWT e de papéis,
// SignController, SignService, SignRepository e banco — chamada por HTTP com o
// Supertest. Só o R2 (serviço externo) continua simulado.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/database/prisma.service';
import { R2Service } from '@modules/r2/r2.service';
import { HttpExceptionFilter } from '@common/filters/exception.filter';
import { montarCenario } from './fixtures';

const SENHA = 'Teste@123';

describe('Integração N3 — API de sinais por HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let c: Awaited<ReturnType<typeof montarCenario>>;
  const token: Record<string, string> = {};

  beforeAll(async () => {
    ThrottlerGuard.prototype.canActivate = async () => true;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(R2Service).useValue({ delete: jest.fn(), uploadImage: jest.fn(), uploadVideo: jest.fn() })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    c = await montarCenario(prisma, 'n3');
    for (const nome of ['professor', 'professor2', 'aluno', 'gestor']) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: `${nome}@teste.com`, password: SENHA });
      token[nome] = res.body.object.access_token;
    }
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const recentes = async (quem: string) =>
    (await http().get('/sign/recent').set('Authorization', `Bearer ${token[quem]}`)).body.object.map((s: { id: string }) => s.id);

  it('GET /sign/recent sem login responde 401', async () => {
    await http().get('/sign/recent').expect(401);
  });

  it('GET /sign/recent respeita quem pode ver cada sinal', async () => {
    expect(await recentes('professor')).toContain(c.privado.id);
    expect(await recentes('professor2')).not.toContain(c.privado.id);
    expect(await recentes('professor2')).toContain(c.publico.id);
  });

  it('IT-07: aluno não acessa a lista (rota de educador) e recebe 403', async () => {
    await http().get('/sign/recent').set('Authorization', `Bearer ${token.aluno}`).expect(403);
  });

  it('IT-08: DELETE /sign/:id de outro educador responde 403 e o sinal continua', async () => {
    await http().delete(`/sign/${c.privado.id}`).set('Authorization', `Bearer ${token.professor2}`).expect(403);
    expect(await prisma.sign.findUnique({ where: { id: c.privado.id } })).not.toBeNull();
  });

  it('DELETE /sign/:id pelo criador responde 200 e o sinal sai da lista', async () => {
    await http().delete(`/sign/${c.privado.id}`).set('Authorization', `Bearer ${token.professor}`).expect(200);
    expect(await recentes('professor')).not.toContain(c.privado.id);
  });
});
