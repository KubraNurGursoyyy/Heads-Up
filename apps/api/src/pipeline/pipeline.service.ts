import { Injectable, Logger } from '@nestjs/common'; import { createHash } from 'crypto'; import { NotificationMode, Watch } from '@prisma/client'; import { PrismaService } from '../prisma/prisma.service'; import { SourcesService } from '../sources/sources.service'; import { AiService } from '../ai/ai.service'; import { NotificationsService } from '../notifications/notifications.service';
@Injectable() export class PipelineService {
  private logger=new Logger(PipelineService.name); constructor(private p:PrismaService,private sources:SourcesService,private ai:AiService,private notifications:NotificationsService){}
  async processWatch(watchId:string){
    const watch=await this.p.watch.findUnique({where:{id:watchId}}); if(!watch||!watch.active)return {skipped:true};
    const queries=[...((watch.searchQueries as string[])??[]),watch.topic]; const discovered=await this.sources.discover(queries); let attached=0,pushed=0;
    for(const d of discovered){
      const url=d.url; const fingerprint=createHash('sha256').update(`${d.title}|${d.description??''}|${url}`).digest('hex');
      const article=await this.p.article.upsert({where:{canonicalUrl:url},update:{title:d.title,description:d.description,sourceName:d.sourceName,publishedAt:d.publishedAt},create:{canonicalUrl:url,fingerprint,title:d.title,description:d.description,sourceName:d.sourceName,sourceType:d.sourceType,publishedAt:d.publishedAt}}).catch(async()=>this.p.article.findFirstOrThrow({where:{OR:[{canonicalUrl:url},{fingerprint}]}}));
      const exists=await this.p.watchArticle.findUnique({where:{watchId_articleId:{watchId,articleId:article.id}}}); if(exists) continue;
      const analysis=await this.ai.analyzeArticle(watch,article); if(!analysis.relevant||analysis.relevanceScore<0.35) continue;
      const eventKey=this.normalizeEventKey(analysis.eventKey,analysis.eventType,article.title);
      await this.p.watchArticle.create({data:{watchId,articleId:article.id,relevanceScore:analysis.relevanceScore,importanceScore:analysis.importanceScore,isNewInformation:analysis.isNewInformation,eventType:analysis.eventType,eventKey,summary:analysis.summary}}); attached++;
      if(this.shouldPush(watch,analysis.importanceScore,analysis.isNewInformation,analysis.eventType)){
        await this.notifications.send(watch.userId,watch.id,article.id,eventKey,article.canonicalUrl,` ${watch.topic}`,analysis.summary||article.title); pushed++;
      }
    }
    await this.p.watch.update({where:{id:watch.id},data:{lastCheckedAt:new Date()}}); this.logger.log(`${watch.topic}: discovered=${discovered.length} attached=${attached} pushed=${pushed}`); return {discovered:discovered.length,attached,pushed};
  }
  private normalizeEventKey(raw:string,eventType:string,title:string){ const base=(raw||`${eventType}_${title}`).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,180); return base||'update'; }
  private shouldPush(w:Watch,importance:number,isNew:boolean,eventType:string){
    if(w.notificationMode===NotificationMode.OFF)return false; if(w.notificationMode===NotificationMode.ALL_RELEVANT)return true;
    if(w.notificationMode===NotificationMode.IMPORTANT_ONLY)return isNew&&importance>=w.importanceThreshold;
    const events=((w.notifyEvents as string[])??[]).map(x=>x.toLowerCase()); return isNew&&events.some(x=>eventType.toLowerCase().includes(x)||x.includes(eventType.toLowerCase()));
  }
}
