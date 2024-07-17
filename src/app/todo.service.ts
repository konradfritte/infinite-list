import { Injectable } from '@angular/core';
import { openDB } from 'idb';
import { Todo } from './app.component';

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private db = openDB('bucketdb', 1, {
    upgrade(db) {
      const store = db.createObjectStore('todos', { autoIncrement: true, keyPath: 'id' });

      store.createIndex('reviewAt', 'reviewAt');
      store.createIndex('scheduled', 'scheduled');
    }
  });

  constructor() {
  }

  async getTodos(): Promise<Todo[]> {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    return store.getAll();
  }

  async getTodo(id: number): Promise<Todo> {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    return store.get(id);
  }


  async addTodo(attributes: {}) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const data = {
      ...attributes,
      reviewAt: new Date(),
      createdAt: new Date(),
      reviewedAt: new Date(),
      scheduled: false,
      completed: false
    };

    return await store.add(data);
  }

  async updateTodo(id: number, attributes: {}) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo = await store.get(id) as Todo;

    return store.put({ ...todo, ...attributes });
  }

  async removeTodo(id: number) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    await store.delete(id);
  }

  async getTodosForToday() {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    const index = store.index('reviewAt');


    const now = new Date();

    const reviewDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      24
    );

    const range = IDBKeyRange.upperBound(reviewDate, true);

    const todos = await index.getAll(range)

    return todos.filter(todo => !todo.scheduled && !todo.completed);
  }

  async postpone(id: number) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    todo.reviewAt = this.determineNextReview(todo);
    todo.reviewedAt = new Date();

    await store.put(todo);
  }

  determineNextReview(todo: Todo) {
    const elapsed = todo.reviewAt.getTime() - todo.reviewedAt.getTime();

    const elapsedDays = elapsed / 1000 / 3600 / 24;

    if (elapsedDays >= 1) {
      const timestamp = Date.now() + (elapsed * 2);

      return new Date(timestamp);
    }

    const tomorrow = new Date().setDate(new Date().getDate() + 1);

    return new Date(tomorrow);
  }
}
