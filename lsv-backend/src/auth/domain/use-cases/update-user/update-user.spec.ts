import { UpdateUserDto } from 'src/auth/application/dtos/update-user/update-user';

describe('UpdateUserDto', () => {
  it('should be defined', () => {
    expect(new UpdateUserDto()).toBeDefined();
  });
});
