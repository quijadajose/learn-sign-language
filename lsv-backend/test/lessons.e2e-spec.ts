import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

describe('Lessons (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;
    let languageId: string;
    let stageId: string;
    let lessonId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        dataSource = app.get(DataSource);
        adminToken = await getAdminToken(app, dataSource);

        // Setup base data
        const langRes = await request(app.getHttpServer())
            .post('/languages')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Lesson Lang', description: 'Test', countryCode: 'US' })
            .expect(201);
        languageId = langRes.body.id;

        const stageRes = await request(app.getHttpServer())
            .post('/stage')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Lesson Stage', description: 'Test', languageId })
            .expect(201);
        stageId = stageRes.body.id;
    }, 60000);

    afterAll(async () => {
        if (app) {
            await cleanDatabase(dataSource);
            await app.close();
        }
    });

    describe('Lesson CRUD', () => {
        it('/lesson (POST) - Should create a lesson', async () => {
            const response = await request(app.getHttpServer())
                .post('/lesson')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Alfabeto 1',
                    description: 'Aprende las letras A-E',
                    content: 'Contenido educativo...',
                    languageId: languageId,
                    stageId: stageId
                })
                .expect(201);

            expect(response.body.name).toBe('Alfabeto 1');
            lessonId = response.body.id;
        });

        it('/lesson/:id (GET) - Should find lesson by ID', async () => {
            const response = await request(app.getHttpServer())
                .get(`/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.id).toBe(lessonId);
        });

        it('/lesson/:id/image (POST) - Should upload image', async () => {
            const filePath = join(__dirname, 'test-img.png');
            const minPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
            writeFileSync(filePath, minPng);

            const response = await request(app.getHttpServer())
                .post(`/lesson/${lessonId}/image`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', filePath)
                .expect(201);

            expect(response.body).toHaveProperty('imageUrl');
            unlinkSync(filePath);
        });

        it('/lesson/:id (PUT) - Should update lesson', async () => {
            const response = await request(app.getHttpServer())
                .put(`/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Alfabeto 1 Actualizado',
                    description: 'Descripción editada',
                    content: 'Nuevo contenido',
                    languageId: languageId,
                    stageId: stageId
                })
                .expect(200);

            expect(response.body.name).toBe('Alfabeto 1 Actualizado');
        });

        it('/lesson/:id (DELETE) - Should delete lesson', async () => {
            await request(app.getHttpServer())
                .delete(`/lesson/${lessonId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200); // LessonController.remove devuelve message { message: '...' }
        });
    });
});
