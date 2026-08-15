export const getCorsOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8080';
  const origins = [frontendUrl];
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost',
      'http://localhost:8080',
      'http://localhost:5173',
    );
  }
  return [...new Set(origins)];
};
