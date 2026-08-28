import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { WatchesModule } from './watches/watches.module';
import { SourcesModule } from './sources/sources.module';
import { ArticlesModule } from './articles/articles.module';
import { DevicesModule } from './devices/devices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthController } from './health.controller';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
    AuthModule,
    AiModule,
    SourcesModule,
    WatchesModule,
    ArticlesModule,
    DevicesModule,
    NotificationsModule,
    PipelineModule,
    JobsModule,
    SystemModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
