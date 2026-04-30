export const getCorsOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8080';
  return [
    frontendUrl,
    'http://localhost',
    'http://localhost:8080',
    'http://localhost:5173',
  ];
};
