import {
  IsString,
  MinLength,
} from 'class-validator';

export class BootstrapDto {
  @IsString()
  @MinLength(32)
  accessKey!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}