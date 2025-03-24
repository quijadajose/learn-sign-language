import { UpdateUserDto } from 'src/auth/domain/dto/update-user/update-user';

describe('UpdateUserDto', () => {
  it('should be defined', () => {
    expect(new UpdateUserDto()).toBeDefined();
  });
});
