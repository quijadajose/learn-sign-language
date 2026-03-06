import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Users Module (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userToken: string;
    let adminToken: string;

    const testUser = {
        email: 'user-test@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Test',
        age: 25,
        isRightHanded: true,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        dataSource = app.get(DataSource);

        // Registro y Login
        await request(app.getHttpServer()).post('/auth/register').send(testUser);
        const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
        userToken = loginRes.body.data.token;

        adminToken = await getAdminToken(app, dataSource);
    }, 60000);

    afterAll(async () => {
        if (app) {
            await cleanDatabase(dataSource);
            await app.close();
        }
    });

    describe('User Profile', () => {
        it('/users/me (GET) - Should get current user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.email).toBe(testUser.email);
            expect(response.body.firstName).toBe(testUser.firstName);
        });

        it('/users/me (PUT) - Should update profile', async () => {
            const updateData = {
                firstName: 'Johnny',
                lastName: 'Test Updated',
                age: 26,
            };
            const response = await request(app.getHttpServer())
                .put('/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.firstName).toBe('Johnny');
        });
    });

    describe('Language Enrollment', () => {
        let languageId: string;

        it('Should create a language for testing enrollment (Admin)', async () => {
            const res = await request(app.getHttpServer())
                .post('/languages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Enrollment Lang', description: 'Test', countryCode: 'US' })
                .expect(201);
            languageId = res.body.id;
        });

        it('/users/enroll (POST) - Should enroll user in language', async () => {
            await request(app.getHttpServer())
                .post('/users/enroll')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ languageId })
                .expect(201);
        });

        it('/users/enrolled-languages (GET) - Should list enrolled languages', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/enrolled-languages')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.some(l => l.languageId === languageId)).toBe(true);
        });

        it('Should enroll in a second language to allow unenrollment', async () => {
            const res = await request(app.getHttpServer())
                .post('/languages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Second Lang', description: 'Test', countryCode: 'US' })
                .expect(201);
            const secondLangId = res.body.id;

            await request(app.getHttpServer())
                .post('/users/enroll')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ languageId: secondLangId })
                .expect(201);
        });

        it('/users/enrolled-languages/:id (DELETE) - Should unenroll user', async () => {
            await request(app.getHttpServer())
                .delete(`/users/enrolled-languages/${languageId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
        });
    });
});
