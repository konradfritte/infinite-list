import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { openDB } from 'idb';

interface Todo {
  id: number,
  title: string,
  createdAt: Date,
  reviewedAt: Date,
  reviewAt: Date,
  scheduled: boolean,
  completed: boolean
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ReactiveFormsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  todos = signal<Todo[]>([]);
  todosForToday = signal<Todo[]>([]);

  scheduledTodos = computed(() => this.todos().filter(todo => todo.scheduled));
  reviewTodo = computed(() => this.todosForToday()[0])

  form = new FormGroup({
    title: new FormControl("", [Validators.required])
  });

  private db = openDB('bucketdb', 1, {
    upgrade(db) {
      const store = db.createObjectStore('todos', { autoIncrement: true, keyPath: 'id' });

      store.createIndex('reviewAt', 'reviewAt');
      store.createIndex('scheduled', 'scheduled');
    }
  });


  constructor() {
    this.synchronizeWithDatabase();
  }

  async addTodo() {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const data = {
      ...this.form.value,
      createdAt: new Date(),
      reviewedAt: new Date(),
      reviewAt: new Date(),
      scheduled: false,
      completed: false
    };

    await store.add(data);

    this.synchronizeWithDatabase();

    this.form.reset();

    console.log(this.form);
  }

  async schedule(id: number) {
    const now = Date.now();
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    todo.reviewedAt = new Date(now);
    todo.scheduled = true;

    await store.put(todo);

    this.synchronizeWithDatabase();
  }

  async deschedule(id: number) {
    const now = Date.now();
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    todo.reviewedAt = new Date(now);
    todo.reviewAt = new Date(new Date().setDate(new Date().getDate() + 1));
    todo.scheduled = false;

    await store.put(todo);

    this.synchronizeWithDatabase();
  }

  async postpone(id: number) {
    const now = Date.now();

    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    const elapsed = now - todo.reviewedAt.getTime();

    const elapsedDays = elapsed / 1000 / 3600 / 24;

    todo.reviewedAt = new Date(now);
    todo.reviewAt = elapsedDays > 1 ? new Date(now + (elapsed * 2)) : new Date(new Date().setDate(new Date().getDate() + 1));

    await store.put(todo);

    this.synchronizeWithDatabase();
  }

  async complete(id: number) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    todo.completed = true;
    todo.scheduled = false;

    await store.put(todo);

    this.synchronizeWithDatabase();
  }

  async remove(id: number) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    await store.delete(id);

    this.synchronizeWithDatabase();
  }

  private async getTodos() {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    return await store.getAll();
  }

  private async getTodosForToday() {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    const index = store.index('reviewAt');


    const now = new Date();

    const lower = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0
    );

    const upper = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      24
    )

    const range = IDBKeyRange.bound(lower, upper);

    const todos = await index.getAll(range)

    return todos.filter(todo => !todo.scheduled && !todo.completed);
  }

  private async synchronizeWithDatabase() {
    const todos = await this.getTodos();
    const todosForToday = await this.getTodosForToday();

    this.todos.set(todos);
    this.todosForToday.set(todosForToday);
  }
}
