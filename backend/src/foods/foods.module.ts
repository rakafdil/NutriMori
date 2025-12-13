import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { FoodsRepository } from './foods.repository';

@Module({
  imports: [AuthModule],
  controllers: [FoodsController],
  providers: [FoodsService, FoodsRepository],
  exports: [FoodsService, FoodsRepository],
})
export class FoodsModule {}
