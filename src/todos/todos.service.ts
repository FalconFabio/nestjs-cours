import { v4 as uuid } from 'uuid';
import Redis from 'ioredis';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Todo } from './interfaces/todo.interface';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Observable } from 'rxjs';

import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class TodosService {
  private redis: Redis;
  private readonly todosKey = 'todos';
  private client: ClientProxy;

  constructor() {
    this.redis = new Redis();
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3021,
      },
    });
  }

  async findOne(id: string): Promise<Todo | null> {
    const todos = await this.getTodosFromRedis();
    return todos.find((todo) => todo.id === id) || null;
  }

  async findAll(): Promise<Todo[]> {
    return await this.getTodosFromRedis();
  }

  countTodos(todos): Observable<number> {
    console.log('waw');
    const pattern = 'getTodoCount';
    const payload = todos;
    return this.client.send<number>(pattern, payload);
  }

  async create(createTodoDto: CreateTodoDto): Promise<void> {
    const newTodo: Todo = {
      ...createTodoDto,
      id: uuid(),
      description: createTodoDto.description || '',
    };
    const todos = await this.getTodosFromRedis();
    todos.push(newTodo);
    await this.setTodosToRedis(todos);
    this.countTodos(todos).subscribe((result) => {
      console.log('Le nombre total de tâches est :', result);
    });
  }

  async update(
    id: string,
    todo: Todo,
  ): Promise<{ updatedTodo: number; todo: Todo[] }> {
    const todos = await this.getTodosFromRedis();
    const todoToUpdateIndex = todos.findIndex((t) => t.id === id);

    if (todoToUpdateIndex === -1) {
      throw new NotFoundException();
    }

    const todoToUpdate = todos[todoToUpdateIndex];

    if (todo.hasOwnProperty('done')) {
      todoToUpdate.done = todo.done;
    }
    if (todo.title) {
      todoToUpdate.title = todo.title;
    }
    if (todo.description) {
      todoToUpdate.description = todo.description;
    }

    todos[todoToUpdateIndex] = todoToUpdate;
    await this.setTodosToRedis(todos);

    return { updatedTodo: 1, todo: todos };
  }

  async delete(id: string): Promise<{ deletedTodos: number; nbTodos: number }> {
    const todos = await this.getTodosFromRedis();
    const initialLength = todos.length;
    const updatedTodos = todos.filter((t) => t.id !== id);
    const deletedTodos = initialLength - updatedTodos.length;

    if (deletedTodos > 0) {
      await this.setTodosToRedis(updatedTodos);
    }

    return { deletedTodos, nbTodos: updatedTodos.length };
  }

  private async getTodosFromRedis(): Promise<Todo[]> {
    const todos = await this.redis.get(this.todosKey);
    return todos ? JSON.parse(todos) : [];
  }

  private async setTodosToRedis(todos: Todo[]): Promise<void> {
    await this.redis.set(this.todosKey, JSON.stringify(todos));
  }
}
