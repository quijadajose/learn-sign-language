import { User } from 'src/shared/domain/entities/user';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { Language } from 'src/shared/domain/entities/language';
import { Region } from 'src/shared/domain/entities/region';

export interface ModeratorListItem {
  id: string;
  userId: string;
  user: User;
  scope: PermissionScope;
  language?: Language;
  region?: Region;
  createdAt: Date;
}

export class ModeratorListResponseDto {
  data: ModeratorListItem[];
  total: number;
}







