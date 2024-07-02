import { TestBed } from '@angular/core/testing';

import { DatabaseService } from './database.service';
import { openDB } from 'idb';

describe('DatabaseService', () => {
  let service: DatabaseService;

  const db = openDB('bucketdb', 1, {
    upgrade(db) {
      const store = db.createObjectStore('todos', { autoIncrement: true, keyPath: 'id' });

      store.createIndex('reviewAt', 'reviewAt');
      store.createIndex('scheduled', 'scheduled');
    }
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseService);

    (await db).clear('todos');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {

    it('should get a specific to-do from the database', async () => {
      const id = await (await db).add('todos', { title: 'A new to-do' });

      const todo = await service.get(id);

      expect(todo).toBeDefined();
      expect(todo.title).toBe('A new to-do');
    });
  });

  describe('getAll', () => {

    beforeEach(async () => {
      (await db).clear('todos');
    });

    it('should get all to-dos from the database, if there is no query parameter set', async () => {
      await (await db).add('todos', { title: 'A new to-do' });
      await (await db).add('todos', { title: 'Another to-do' });

      const todos = await service.getAll();

      expect(todos).toBeInstanceOf(Array);
      expect(todos.length).toBe(2);

      expect(todos[0].title).toBe('A new to-do')
      expect(todos[1].title).toBe('Another to-do')
    });

    it('should return only those to-dos that match the query parameter, if it is set', async () => {
      const now = new Date();

      await (await db).add('todos', { title: 'A new to-do', reviewAt: new Date(2023, 0, 1) });
      await (await db).add('todos', { title: 'Another to-do', reviewAt: now });
      await (await db).add('todos', { title: 'And yet another to-do', reviewAt: new Date(2100, 0, 1) });

      const query = { index: 'reviewAt', value: IDBKeyRange.upperBound(now) };

      const todos = await service.getAll(query);

      expect(todos.map(t => t.title)).not.toContain('And yet another to-do');
    });
  });

  describe('add', () => {
    it('should add a to-do to the database', async () => {
      const id = await service.add({ title: 'A new to-do' });

      const todo = await (await db).get('todos', id);

      expect(todo).toBeDefined();
      expect(todo.title).toBe('A new to-do');
    });
  });

  describe('update', () => {
    it('should add a to-do to the database', async () => {
      const id = await (await db).add('todos', { title: 'A new to-do' });

      await service.update(id, { title: 'Updated to-do' });

      const todo = await (await db).get('todos', id);

      expect(todo.title).toBe('Updated to-do');
    });
  });

  describe('remove', () => {
    it('should delete a to-do from the database', async () => {
      const id = await (await db).add('todos', { title: 'A new to-do' });

      await service.remove(id);

      const todo = await (await db).get('todos', id);

      expect(todo).toBeUndefined();
    });
  });
});
