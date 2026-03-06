import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Quiz Variants (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;
    let lessonVariantId: string;
    let regionId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        dataSource = app.get(DataSource);
        adminToken = await getAdminToken(app, dataSource);

        // Prep data
        const langRes = await request(app.getHttpServer()).post('/languages').set('Authorization', `Bearer ${adminToken}`).send({ name: 'QV Lang', description: 'Test', countryCode: 'US' });
        const regRes = await request(app.getHttpServer()).post('/region').set('Authorization', `Bearer ${adminToken}`).send({ name: 'QV Region', code: 'QVR', description: 'Test', languageId: langRes.body.id });
        regionId = regRes.body.id;

        const stageRes = await request(app.getHttpServer()).post('/stage').set('Authorization', `Bearer ${adminToken}`).send({ name: 'QV Stage', description: 'Test', languageId: langRes.body.id });
        const lessonRes = await request(app.getHttpServer()).post('/lesson').set('Authorization', `Bearer ${adminToken}`).send({
            name: 'QV Lesson',
            description: 'Test',
            content: 'Test',
            languageId: langRes.body.id,
            stageId: stageRes.body.id
        });

        const lvRes = await request(app.getHttpServer()).post(`/lesson/${lessonRes.body.id}/variants`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'QV Variant',
                description: 'Test',
                content: 'Test',
                regionId: regionId
            });
        lessonVariantId = lvRes.body.id;
    }, 60000);

    afterAll(async () => {
        if (app) {
            await cleanDatabase(dataSource);
            await app.close();
        }
    });

    describe('Quiz Variant CRUD', () => {
        let quizVariantId: string;

        it('/quiz-variants (POST) - Should create a quiz variant', async () => {
            const response = await request(app.getHttpServer())
                .post('/quiz-variants')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    lessonVariantId: lessonVariantId,
                    questions: [
                        {
                            question: '¿Localismo de esta región?',
                            options: [
                                { text: 'Opción A', isCorrect: true },
                                { text: 'Opción B', isCorrect: false }
                            ]
                        }
                    ]
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            quizVariantId = response.body.id;
        });

        it('/quiz-variants/lesson-variant/:lessonVariantId (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get(`/quiz-variants/lesson-variant/${lessonVariantId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('/quiz-variants/:id (PUT) - Should update variant', async () => {
            const response = await request(app.getHttpServer())
                .put(`/quiz-variants/${quizVariantId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    lessonVariantId: lessonVariantId,
                    questions: [
                        {
                            question: '¿Localismo actualizado?',
                            options: [{ text: 'Nueva Opción', isCorrect: true }]
                        }
                    ]
                })
                .expect(200);

            expect(response.body.questionVariants[0].question).toBe('¿Localismo actualizado?');
        });

        it('/quiz-variants/:id (DELETE)', async () => {
            await request(app.getHttpServer())
                .delete(`/quiz-variants/${quizVariantId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });
    });
});
