import { TestBed } from '@angular/core/testing';
import { TodoService } from './todo.service';
import { DatabaseService } from './database.service';
import { Todo } from './app.component';

describe('TodoService', () => {
  let service: TodoService;
  let databaseService: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DatabaseService', ['get', 'getAll', 'add', 'update', 'remove']);

    TestBed.configureTestingModule({
      providers: [TodoService, { provide: DatabaseService, useValue: spy }],
    });

    service = TestBed.inject(TodoService);
    databaseService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
  });

  describe('add', () => {
    it('should call the database service add method', async () => {
      await service.addTodo({ title: 'A new to-do' }) as number;

      expect(databaseService.add).toHaveBeenCalled();
    });

    it('should return the id of the added to-do', async () => {
      databaseService.add.and.returnValue(new Promise((resolve) => resolve(1)));

      const id = await service.addTodo({ title: 'A new to-do' }) as number;

      expect(id).toBe(1);
    });
  });

  describe('getTodos', () => {
    it('should retrieve all to-dos', async () => {
      const todos = [
        { id: 1, title: 'A new to-do' },
        { id: 2, title: 'Another to-do' },
        { id: 3, title: 'Yet another to-do' }
      ];

      databaseService.getAll.and.returnValue(new Promise((resolve) => resolve(todos as Todo[])));

      const result = await service.getTodos();

      expect(result.length).toBe(3);
      expect(result[0].title).toBe('A new to-do');
    });

    it('should call the database getAll method with no arguments', async () => {
      await service.getTodos();

      expect(databaseService.getAll).toHaveBeenCalledWith();
    });
  });

  describe('getTodo', () => {
    it('should return the retrieved to-do', async () => {
      const todo = { id: 1, title: 'A new to-do' };

      databaseService.get.and.returnValue(new Promise((resolve) => resolve(todo as Todo)));

      const result = await service.getTodo(1);

      expect(result.id).toBe(1);
      expect(result.title).toBe('A new to-do')
    });

    it('should call the database get method with a specific to-do id', async () => {

      await service.getTodo(1);

      expect((databaseService.get as any)).toHaveBeenCalledWith(1);
    });
  });

  describe('updateTodo', () => {
    it('should return the id of an updated to-do', async () => {

      databaseService.update.and.returnValue(new Promise((resolve) => resolve(1)));

      const id = await service.updateTodo(1, { title: 'updated todo' }) as number;

      expect(id).toBe(1);
    });

    it('should call the database update method with specific id and attributes', async () => {
      await service.updateTodo(1, { title: 'updated todo' });

      expect(databaseService.update as any).toHaveBeenCalledWith(1, { title: 'updated todo' });
    });
  });

  describe('removeTodo', () => {
    it('should call the database remove method with a specific to-do id', async () => {
      await service.removeTodo(1);

      expect(databaseService.remove as any).toHaveBeenCalledWith(1);
    });
  });

  describe('getTodosForToday', () => {
    it('should call the database getAll method with a query object testing whether review date is in the past or present', async () => {
      databaseService.getAll.and.returnValue(new Promise((resolve) => resolve([])));

      await service.getTodosForToday();

      const index = databaseService.getAll.calls.argsFor(0)[0]?.index;
      const value = databaseService.getAll.calls.argsFor(0)[0]?.value as IDBKeyRange;

      const today = new Date(new Date().toDateString());
      const tomorrow = new Date(today.setDate(today.getDate() + 1));

      expect(index).toBe('reviewAt');
      expect(value.upper).toEqual(tomorrow);
    });

    it('should filter out all to-dos that are already scheduled', async () => {
      const todos = [
        { id: 1, title: 'A new to-do', scheduled: true },
        { id: 2, title: 'Another to-do', scheduled: false },
        { id: 3, title: 'And yet another to-do', scheduled: false },
      ] as Todo[];

      databaseService.getAll.and.returnValue(new Promise((resolve) => resolve(todos)));

      const result = await service.getTodosForToday();

      expect(result.length).toBe(2);
      expect(result.map(t => t.title)).not.toContain('A new to-do');
    });

    it('should filter out all to-dos that are already completed', async () => {
      const todos = [
        { id: 1, title: 'A new to-do', completed: false },
        { id: 2, title: 'Another to-do', completed: true },
        { id: 3, title: 'And yet another to-do', completed: false },
      ] as Todo[];

      databaseService.getAll.and.returnValue(new Promise((resolve) => resolve(todos)));

      const result = await service.getTodosForToday();

      expect(result.length).toBe(2);
      expect(result.map(t => t.title)).not.toContain('Another to-do');
    });
  });

  describe('postponeTodo', () => {
    it('should call the determineNextReview method with a specific todo object', async () => {
      spyOn(service, 'determineNextReview');

      const todo = {
        id: 1,
        title: 'to-do',
        reviewAt: new Date(),
        reviewedAt: new Date(),
      } as Todo;


      databaseService.get.and.returnValue(new Promise((resolve) => resolve(todo)));

      await service.postponeTodo(1);

      expect(service.determineNextReview).toHaveBeenCalledWith(todo);
    });

    it('should deschedule a to-do and call the database update method', async () => {
      const todo = {
        id: 1,
        title: 'to-do',
        reviewAt: new Date(),
        reviewedAt: new Date(),
        scheduled: true
      } as Todo;

      databaseService.get.and.returnValue(new Promise((resolve) => resolve(todo)));

      await service.postponeTodo(1);

      const attributes = databaseService.update.calls.argsFor(0)[1] as any;

      expect(attributes.scheduled).toBe(false);
      expect(attributes.reviewAt).not.toEqual(todo.reviewAt);
      expect(attributes.reviewedAt).toEqual(new Date(new Date().toDateString()));
    });
  });

  describe('determineNextReview', () => {
    it('should set the next review date to be tomorrow for to-dos which were reviewed today already', async () => {

      const todo = {
        id: 1,
        title: 'todo',
        reviewedAt: new Date(),
        reviewAt: new Date(),
      } as Todo;

      const today = new Date(new Date().toDateString());
      const expectedReviewDate = new Date(today.setDate(today.getDate() + 1));

      const nextReview = service.determineNextReview(todo);

      expect(nextReview).toEqual(expectedReviewDate);
    });

    it('should set the next review date to be tomorrow for to-dos which were scheduled already', async () => {

      const todo = {
        id: 1,
        title: 'todo',
        reviewedAt: new Date(2023, 0, 1),
        reviewAt: new Date(),
        scheduled: true
      } as Todo;

      const today = new Date(new Date().toDateString());
      const expectedReviewDate = new Date(today.setDate(today.getDate() + 1));

      const nextReview = service.determineNextReview(todo);

      expect(nextReview).toEqual(expectedReviewDate);
    });

    it('should double the time elapsed time between the last reviews for to-dos whose past review date is at least 1 day ago', async () => {

      const cases = [
        { reviewedAt: new Date(2024, 0, 1), reviewAt: new Date(2024, 0, 2), interval: 2 },
        { reviewedAt: new Date(2024, 0, 1), reviewAt: new Date(2024, 0, 3), interval: 4 },
        { reviewedAt: new Date(2024, 0, 1), reviewAt: new Date(2024, 0, 5), interval: 8 },
      ]

      cases.forEach(c => {
        const todo = {
          id: 1,
          title: 'todo',
          reviewedAt: c.reviewedAt,
          reviewAt: c.reviewAt
        } as Todo;

        const today = new Date(new Date().toDateString());
        const expectedReviewDate = new Date(today.setDate(today.getDate() + c.interval));

        const nextReview = service.determineNextReview(todo);

        expect(nextReview).toEqual(expectedReviewDate);
      })
    });
  });

  describe('importTodos', () => {
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

      const attributes = databaseService.add.calls.argsFor(0)[0] as any;

      expect(attributes.id).toBeUndefined();
      expect(attributes.title).toBe('An imported to-do');
      expect(attributes.createdAt).toBeInstanceOf(Date);
      expect(attributes.scheduled).toBe(false);
    });
  });
});