import { Module } from '@nestjs/common';
import { TodosModule } from './todos/todos.module';
import { TodosService } from './todos/todos.service';
import { TodosController } from './todos/todos.controller';

@Module({
  imports: [TodosModule],
  controllers: [TodosController],
  providers: [TodosService],
})
export class AppModule {}
