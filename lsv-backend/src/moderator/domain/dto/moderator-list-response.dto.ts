import { User } from '../../../shared/domain/entities/user.js';
import { PermissionScope } from '../../../shared/domain/entities/moderatorPermission.js';
import { Language } from '../../../shared/domain/entities/language.js';
import { Region } from '../../../shared/domain/entities/region.js';

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
