import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TodoService } from './todo.service';
import { CollectSectionComponent } from './collect-section/collect-section.component';
import { SelectSectionComponent } from './select-section/select-section.component';
import { ReviewSectionComponent } from './review-section/review-section.component';
import { HeaderComponent } from './header/header.component';

export interface Todo {
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
    ReactiveFormsModule,
    CollectSectionComponent,
    SelectSectionComponent,
    ReviewSectionComponent,
    HeaderComponent
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
  nextReviewDate = computed(() => this.todoService.determineNextReview(this.reviewTodo()).toLocaleDateString());

  form = new FormGroup({
    title: new FormControl("", [Validators.required])
  });

  constructor(private todoService: TodoService) {
    this.synchronizeWithDatabase();
  }

  async addTodo(form: FormGroup) {
    await this.todoService.addTodo(form.value);

    this.synchronizeWithDatabase();
  }

  async schedule(id: number) {
    await this.todoService.updateTodo(id, { reviewedAt: new Date(), scheduled: true });

    this.synchronizeWithDatabase();
  }

  async postpone(id: number) {
    await this.todoService.postponeTodo(id);

    this.synchronizeWithDatabase();
  }

  async complete(id: number) {
    await this.todoService.updateTodo(id, { completed: true, scheduled: false });

    this.synchronizeWithDatabase();
  }

  async remove(id: number) {
    await this.todoService.removeTodo(id);

    this.synchronizeWithDatabase();
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

  async export(data: string) {
    navigator.clipboard.writeText(data);
  }

  async import(file: File) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result as string;

      await this.todoService.importTodos(data);

      this.synchronizeWithDatabase();
    }

    reader.readAsText(file);
  }

  private async synchronizeWithDatabase() {
    const todos = await this.todoService.getTodos();
    const todosForToday = await this.todoService.getTodosForToday();

    this.todos.set(todos);
    this.todosForToday.set(todosForToday);
  }
}
