import { Injectable, computed, signal } from '@angular/core';
import { Todo } from './app.component';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private todos = signal<Todo[]>([]);
  private todosForToday = signal<Todo[]>([]);

  constructor(private databaseService: DatabaseService) {
    this.synchronizeWithDatabase();
  }

  async getTodos(): Promise<Todo[]> {
    const todos = await this.databaseService.getAll();

    return todos;
  }

  async getTodo(id: number): Promise<Todo> {
    return this.databaseService.get(id);
  }

  listenToTodos() {
    return computed(() => this.todos());
  }

  listenToTodosForToday() {
    return computed(() => this.todosForToday());
  }

  async addTodo(attributes: {}) {
    const data = {
      ...attributes,
      reviewAt: new Date(),
      reviewedAt: new Date(),
      scheduled: false,
      completed: false
    };

    const result = this.databaseService.add(data);

    this.synchronizeWithDatabase();

    return result;
  }

  async updateTodo(id: number, attributes: {}) {
    const result = this.databaseService.update(id, attributes);

    this.synchronizeWithDatabase();

    return result;
  }

  async removeTodo(id: number) {
    await this.databaseService.remove(id);

    this.synchronizeWithDatabase();
  }

  async getTodosForToday() {
    const now = new Date();

    const reviewDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      24
    );

    const query = {
      index: 'reviewAt',
      value: IDBKeyRange.upperBound(reviewDate, true)
    };

    const todos = await this.databaseService.getAll(query);

    return todos.filter(todo => !todo.scheduled && !todo.completed);
  }

  async postponeTodo(id: number) {
    const todo = await this.databaseService.get(id);

    const attributes = {
      reviewAt: this.determineNextReview(todo),
      reviewedAt: new Date(new Date().toDateString()),
      scheduled: false
    }

    const result = this.databaseService.update(id, attributes);

    this.synchronizeWithDatabase();

    return result;
  }

  determineNextReview(todo: Todo) {
    const elapsed = todo.reviewAt.getTime() - todo.reviewedAt.getTime();

    const elapsedDays = elapsed / 1000 / 3600 / 24;

    if (elapsedDays >= 1 && !todo.scheduled) {
      return this.determineDateIn(elapsed * 2);
    }

    return this.determineTomorrowDate();
  }

  async importTodos(data: string) {
    const todos = JSON.parse(data, (key, value) => {
      const dates = ['reviewAt', 'reviewedAt', 'createdAt'];

      return dates.includes(key) ? new Date(value) : value;
    }) as Todo[];

    const requests = todos.map(todo => {
      const { id, ...attributes } = todo;

      return this.databaseService.add(attributes);
    });

    const result = Promise.all(requests);

    this.synchronizeWithDatabase();

    return result;
  }

  private determineDateIn(time: number) {
    const timestamp = Date.now() + time;

    const nextReview = new Date(new Date(timestamp).toDateString());

    return nextReview;
  }

  private determineTomorrowDate() {
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today.setDate(today.getDate() + 1));

    return tomorrow;
  }

  private async synchronizeWithDatabase() {
    const todos = await this.getTodos();
    const todosForToday = await this.getTodosForToday();

    this.todos.set(todos);
    this.todosForToday.set(todosForToday);
  }
}
