import { Injectable } from '@angular/core';
import { openDB } from 'idb';
import { Todo } from './app.component';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private db = openDB('bucketdb', 1, {
    upgrade(db) {
      const store = db.createObjectStore('todos', { autoIncrement: true, keyPath: 'id' });

      store.createIndex('reviewAt', 'reviewAt');
      store.createIndex('scheduled', 'scheduled');
    }
  });

  constructor() { }

  async get(id: IDBValidKey) {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    return store.get(id) as Promise<Todo>;
  }

  async getAll(query?: { index: string, value: IDBKeyRange | IDBValidKey}) {
    const tx = (await this.db).transaction('todos', 'readonly');
    const store = tx.objectStore('todos');

    if (!query) {
      return store.getAll() as Promise<Todo[]>;
    }

    const index = store.index(query.index);

    return index.getAll(query.value) as Promise<Todo[]>

  }

  async add(attributes: {}) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    return store.add(attributes);
  }

  async update(id: IDBValidKey, attributes: {}) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    const todo = await store.get(id) as Todo;

    return store.put({ ...todo, ...attributes });
  }

  async remove(id: IDBValidKey) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    const store = tx.objectStore('todos');

    await store.delete(id);
  }
}
