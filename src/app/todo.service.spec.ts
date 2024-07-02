import { TestBed } from '@angular/core/testing';
import { TodoService } from './todo.service';
import { openDB } from 'idb';

describe('TodoService', () => {
  let service: TodoService;

  const db = openDB('bucketdb', 1, {
    upgrade(db) {
      const store = db.createObjectStore('todos', { autoIncrement: true, keyPath: 'id' });

      store.createIndex('reviewAt', 'reviewAt');
      store.createIndex('scheduled', 'scheduled');
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a to-do to the database', async () => {
    const attributes = { title: 'todo' };

    await service.addTodo(attributes);

    const result = await service.getTodos();
    const todo = result.find(todo => todo.title == attributes.title);


    expect(todo).toBeDefined();
    expect(todo?.id).toBeDefined();
  })

  it('retrieve all to-dos from the database', async () => {
    const attributes = { title: 'todo' };

    await service.addTodo(attributes);

    const todos = await service.getTodos();

    expect(todos.length).toBeGreaterThan(0);
  });

  it('should get a specific to-do from the database', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    const todo = await service.getTodo(id);

    expect(todo).toBeDefined();
    expect(todo.title).toBe('todo');
  });

  it('should update a specific to-do', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    await service.updateTodo(id, { title: 'updated todo' });

    const todo = await service.getTodo(id);

    expect(todo.title).toBe('updated todo');
  })

  it('should delete a specific to-do from the database', async () => {
    const attributes = { title: 'todo' };

    const id = await service.addTodo(attributes) as number;

    await service.removeTodo(id);

    expect(await service.getTodo(id)).toBeUndefined();
  });

  it('should return all to-dos whose review date is in the past', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    await service.updateTodo(id, { reviewAt: new Date(2024, 5, 1) });

    const todos = await service.getTodosForToday();

    const todo = todos.find(t => t.id == id);

    expect(todo).toBeDefined();
  });

  it('should return all to-dos whose review date is today', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    await service.updateTodo(id, { reviewAt: new Date() });

    const todos = await service.getTodosForToday();

    const todo = todos.find(t => t.id == id);

    expect(todo).toBeDefined();
  });


  it('should not return the to-dos whose review date is in the future', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    await service.updateTodo(id, { reviewAt: new Date(2100, 0, 1) });

    const todos = await service.getTodosForToday();

    const todo = todos.find(t => t.id == id);

    expect(todo).toBeUndefined();
  });

  it('should not return the to-dos that are completed or already scheduled', async () => {

    const cases = [
      { completed: true },
      { scheduled: true }
    ];

    cases.forEach(async (c) => {
      const id = await service.addTodo({ title: 'todo' }) as number;

      await service.updateTodo(id, { reviewAt: new Date(2023, 0, 1), completed: true });

      const todos = await service.getTodosForToday();

      const todo = todos.find(t => t.id == id);

      expect(todo).toBeUndefined();
    });
  });

  it('should postpone a to-do and unschedule it', async () => {
    const id = await service.addTodo({ title: 'todo' }) as number;

    await service.updateTodo(id, { reviewAt: new Date(), scheduled: true });

    await service.postponeTodo(id);

    const todo = await service.getTodo(id);

    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

    const reviewedDate = new Date(todo.reviewedAt.getFullYear(), todo.reviewedAt.getMonth(), todo.reviewedAt.getDate());
    const expectedReviewedDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const reviewDate = new Date(todo.reviewAt.getFullYear(), todo.reviewAt.getMonth(), todo.reviewAt.getDate());
    const expectedReviewDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    expect(reviewDate.getTime()).toBe(expectedReviewDate.getTime());
    expect(reviewedDate.getTime()).toBe(expectedReviewedDate.getTime());

    expect(todo.scheduled).toBe(false);
  });

  it('should set the next review date to be tomorrow for to-dos which were reviewed or scheduled today already', async () => {
    const cases = [
      { reviewAt: new Date() },
      { reviewedAt: new Date(2023, 0, 1), scheduled: true }
    ];

    cases.forEach(async (c) => {
      const id = await service.addTodo({ title: 'todo' }) as number;

      await service.updateTodo(id, c);

      const todo = await service.getTodo(id);

      const nextReview = service.determineNextReview(todo);
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));

      const reviewDate = new Date(nextReview.getFullYear(), nextReview.getMonth(), nextReview.getDate());
      const expectedDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

      expect(reviewDate.getTime()).toBe(expectedDate.getTime());
    });
  });

  it('should double the time elapsed time between the last reviews for to-dos whose past review date is at least 1 day ago', async () => {

    const cases = [
      { reviewAt: new Date(2024, 0, 2), reviewedAt: new Date(2024, 0, 1), expectedInterval: new Date().getDate() + 2 },
      { reviewAt: new Date(2024, 0, 5), reviewedAt: new Date(2024, 0, 1), expectedInterval: new Date().getDate() + 8 },
      { reviewAt: new Date(2024, 0, 9), reviewedAt: new Date(2024, 0, 1), expectedInterval: new Date().getDate() + 16 }
    ];

    cases.forEach(async ({ reviewAt, reviewedAt, expectedInterval }) => {
      const id = await service.addTodo({ title: 'todo' }) as number;

      await service.updateTodo(id, { reviewAt, reviewedAt });

      const todo = await service.getTodo(id);

      const nextReview = service.determineNextReview(todo);

      expect(nextReview.getDate()).toBe(expectedInterval);
    });
  });

  it('should import to-dos from a json string into the database', async () => {
    const json = JSON.stringify([
      {
        "title": "An imported to-do",
        "createdAt": "2024-07-01T18:35:44.782Z",
        "reviewedAt": "2024-07-01T18:36:51.734Z",
        "reviewAt": "2024-07-01T18:35:44.782Z",
        "scheduled": false,
        "completed": true,
        "id": 5
      }]);

    const ids = await service.importTodos(json) as number[];

    const todo = await service.getTodo(ids[0]);

    expect(todo.title).toBe("An imported to-do");

    expect(todo.createdAt).toBeInstanceOf(Date);
    expect(todo.reviewedAt).toBeInstanceOf(Date);
    expect(todo.reviewAt).toBeInstanceOf(Date);

    expect(todo.scheduled).toBeFalse();
    expect(todo.completed).toBeTrue();
  });
});