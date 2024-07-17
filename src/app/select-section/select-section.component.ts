import { Component, computed } from '@angular/core';
import { Todo } from '../app.component';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-select-section',
  standalone: true,
  imports: [],
  templateUrl: './select-section.component.html',
  styleUrl: './select-section.component.scss'
})
export class SelectSectionComponent {
  todos = this.todoService.listenToTodos();
  todosForToday = this.todoService.listenToTodosForToday();

  reviewTodo = computed(() => this.todosForToday()[0]);

  constructor(private todoService: TodoService) {
  }

  async schedule(id: number) {
    await this.todoService.updateTodo(id, { reviewedAt: new Date(), scheduled: true });
  }

  async postpone(id: number) {
    await this.todoService.postponeTodo(id);
  }

  getReviewDate(todo: Todo) {
    const review = this.todoService.determineNextReview(todo);

    return review.toLocaleDateString();
  }
}
