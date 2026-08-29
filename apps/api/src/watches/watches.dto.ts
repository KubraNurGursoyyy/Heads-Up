import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { NotificationMode } from '@prisma/client';

export class CreateWatchDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;

  @IsOptional()
  @IsEnum(NotificationMode)
  notificationMode?: NotificationMode;
}

export class SuggestWatchDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;
}

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(NotificationMode)
  notificationMode?: NotificationMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importanceThreshold?: number;
}
