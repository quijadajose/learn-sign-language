export class CountryWithDivisionsDto {
  code: string;
  name: string;
  divisions: DivisionDto[];
}

export class DivisionDto {
  code: string;
  name: string;
}
