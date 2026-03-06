import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { cleanDatabase } from './test-utils';

describe('Authentication (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testUser = {
        email: 'test-e2e@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        isRightHanded: true,
        role: 'admin',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Aplicamos los mismos pipes que en el main.ts para que los tests sean reales
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
        dataSource = app.get(DataSource);
    }, 60000);

    beforeEach(async () => {
        // Limpiamos la base de datos antes de cada test
        await cleanDatabase(dataSource);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    }, 60000);

    describe('/auth/register (POST)', () => {
        it('Should register a new user successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data).toHaveProperty('token');
        });

        it('Should fail when registering an existing email', async () => {
            // Primero registramos uno
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);

            // Intentamos registrar el mismo - Tu API devuelve 409 Conflict
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(409);
        });
    });

    describe('/auth/login (POST)', () => {
        it('Should login and return a JWT token', async () => {
            // 1. Registro previo
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);

            // 2. Login - Tu API devuelve 200 OK
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body.message).toBe('User logged in successfully');
            expect(response.body.data).toHaveProperty('token');
        });

        it('Should fail with incorrect password', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser);

            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('Should fail with non-existent email', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'non-existent@example.com',
                    password: 'password123',
                })
                .expect(401);
        });

        it('Should fail with invalid email format', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                })
                .expect(400);
        });
    });

    describe('/users/me (GET)', () => {
        it('Should get user profile with a valid token', async () => {
            // 1. Registro
            const regResponse = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    ...testUser,
                    email: `profile-${Date.now()}@example.com`
                });

            const token = regResponse.body.data.token;

            // 2. Consulta de perfil usando el token
            const response = await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('firstName');
            expect(response.body).not.toHaveProperty('hashPassword');
        });

        it('Should return 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/users/me')
                .expect(401);
        });

        it('Should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer invalid-token`)
                .expect(401);
        });
    });
});
