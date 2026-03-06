import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase, getAdminToken } from './test-utils';

describe('Leaderboard (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userToken: string;
    let languageId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        dataSource = app.get(DataSource);

        const adminToken = await getAdminToken(app, dataSource);

        // Prep user and language
        const testUser = {
            email: 'leader-user@example.com',
            password: 'password123',
            firstName: 'Leader',
            lastName: 'User',
            age: 20,
            isRightHanded: true,
        };
        await request(app.getHttpServer()).post('/auth/register').send(testUser);
        const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
        userToken = loginRes.body.data.token;

        const langRes = await request(app.getHttpServer()).post('/languages').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Leader Lang', description: 'Test', countryCode: 'US' });
        languageId = langRes.body.id;
    }, 60000);

    afterAll(async () => {
        if (app) {
            await cleanDatabase(dataSource);
            await app.close();
        }
    });

    it('/leaderboard (GET) - Should return general leaderboard', async () => {
        const response = await request(app.getHttpServer())
            .get('/leaderboard')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('data');
    });

    it('/leaderboard/language/:id (GET) - Should return language specific leaderboard', async () => {
        const response = await request(app.getHttpServer())
            .get(`/leaderboard/language/${languageId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('data');
    });
});
