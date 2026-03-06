jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest
    .fn()
    .mockResolvedValue({ ext: 'png', mime: 'image/png' }),
}));
