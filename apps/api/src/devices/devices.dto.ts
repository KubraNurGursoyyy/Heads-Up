import { IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDeviceDto { @IsString() @MinLength(10) expoPushToken!:string; @IsOptional() @IsString() deviceName?:string; }
