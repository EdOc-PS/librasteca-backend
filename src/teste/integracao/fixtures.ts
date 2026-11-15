// Monta o cenário dos testes de integração direto no banco:
//   - turma do Professor 1, com Aluno 1 matriculado e Professor 2 FORA dela;
//   - um sinal privado nessa turma (criado pelo Professor 1);
//   - um sinal público criado pelo gestor.
import { assertTestDatabase } from '../e2e/guard';
import { PrismaService } from '@/database/prisma.service';

assertTestDatabase();

export async function montarCenario(prisma: PrismaService, sufixo: string) {
  const user = (email: string) => prisma.user.findUniqueOrThrow({ where: { email } });
  const [gestor, professor, professor2, aluno, adminTurma] = await Promise.all([
    user('gestor@teste.com'), user('professor@teste.com'), user('professor2@teste.com'),
    user('aluno@teste.com'), user('aluno2@teste.com'),
  ]);
  const category = await prisma.category.findFirstOrThrow();
  const handConfig = await prisma.handConfig.findFirstOrThrow();

  const turma = await prisma.classroom.create({
    data: { name: `Turma ${sufixo}`, classCode: `IT${sufixo}`.slice(0, 6).toUpperCase(), teacherId: professor.id },
  });
  await prisma.classroomEnrollment.createMany({
    data: [
      { userId: aluno.id, classroomId: turma.id, roleInClass: 'STUDENT' },
      // Aluno 2 é administrador da turma: tem as mesmas permissões do dono
      { userId: adminTurma.id, classroomId: turma.id, roleInClass: 'STUDENT', isAdmin: true },
    ],
  });

  const base = { categoryId: category.id, handConfigId: handConfig.id, anotherUrl: 'https://youtu.be/dQw4w9WgXcQ' };
  const privado = await prisma.sign.create({
    data: { ...base, name: `Privado ${sufixo}`, slug: `privado-${sufixo}`, creatorId: professor.id, classrooms: { connect: { id: turma.id } } },
  });
  const publico = await prisma.sign.create({
    data: { ...base, name: `Publico ${sufixo}`, slug: `publico-${sufixo}`, creatorId: gestor.id, globalStatus: 'PUBLIC' },
  });

  return { gestor, professor, professor2, aluno, adminTurma, turma, privado, publico };
}
