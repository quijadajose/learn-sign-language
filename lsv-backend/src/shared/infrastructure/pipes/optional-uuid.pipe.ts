import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * BE-21: valida IDs opcionales de query. Acepta ausencia, cadena vacía y "global"
 * (centinela usado por el cliente para "sin región"); cualquier otro valor debe ser UUID.
 */
@Injectable()
export class OptionalUUIDPipe implements PipeTransform {
  transform(value: unknown): string | undefined {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'global'
    ) {
      return undefined;
    }
    if (typeof value !== 'string' || !isUUID(value)) {
      throw new BadRequestException('errors.common.invalidId');
    }
    return value;
  }
}
