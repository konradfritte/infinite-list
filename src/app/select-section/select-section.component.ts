import { Component, EventEmitter, Output, computed, input, signal } from '@angular/core';
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
  @Output() todoScheduled = new EventEmitter<number>();
  @Output() todoPostponed = new EventEmitter<number>();

  todos = input<Todo[]>([]);
  todosForToday = input<Todo[]>([]);

  reviewTodo = computed(() => this.todosForToday()[0]);

  constructor(private todoService: TodoService) {
  }

  async schedule(id: number) {
    this.todoScheduled.emit(id);
  }

  async postpone(id: number) {
    this.todoPostponed.emit(id);
  }

  getReviewDate(todo: Todo) {
    const review = this.todoService.determineNextReview(todo);

    return review.toLocaleDateString();
  }
}
