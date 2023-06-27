export interface Todo {
  id: string;
  title: string;
  done: boolean;
  description?: string;
}

export interface CreateTodoDto {
  title: string;
  done: boolean;
  description: string;
}
