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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  topicHint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryHint?: string;
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

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  category?: string;
}
