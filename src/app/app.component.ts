import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
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
  dialog = viewChild<ElementRef>('dialog');
  exportData = signal('');

  todos = signal<Todo[]>([]);
  todosForToday = signal<Todo[]>([]);

  scheduledTodos = computed(() => this.todos().filter(todo => todo.scheduled));
  reviewTodo = computed(() => this.todosForToday()[0]);

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
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo: Todo = await store.get(id);

    todo.reviewAt = this.determineNextReview(todo);
    todo.reviewedAt = new Date();

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

  async showDialog(state: boolean) {
    const dialog = this.dialog()?.nativeElement;

    if (!state) {
      dialog.close();

      return;
    }

    this.exportData.set(JSON.stringify(this.todos(), null, 2));

    dialog.showModal();
  }

  async export() {
    navigator.clipboard.writeText(this.exportData());
  }

  async import(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result as string;

      const todos: Todo[] = JSON.parse(data);

      const tx = (await this.db).transaction('todos', 'readwrite');
      const store = tx.objectStore('todos');

      const requests = todos.map(todo => {
        const { id, ...attributes } = todo;

        return store.add(attributes);
      });

      await Promise.all(requests);

      this.synchronizeWithDatabase();
    }

    reader.readAsText(file);
  }

  determineNextReview(todo: Todo) {
    const now = Date.now();

    const elapsed = now - todo.reviewedAt.getTime();

    const elapsedDays = elapsed / 1000 / 3600 / 24;

    if (elapsedDays > 1) {
      return new Date(now + (elapsed * 2));
    }

    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

    return tomorrow;
  }

  private async getTodosForToday() {
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

  private async synchronizeWithDatabase() {
    const todos = await this.getTodos();
    const todosForToday = await this.getTodosForToday();

    this.todos.set(todos);
    this.todosForToday.set(todosForToday);
  }
}
