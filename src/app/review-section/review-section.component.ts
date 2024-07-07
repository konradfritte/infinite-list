import { Component, computed } from '@angular/core';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-review-section',
  standalone: true,
  imports: [],
  templateUrl: './review-section.component.html',
  styleUrl: './review-section.component.scss'
})
export class ReviewSectionComponent {
  todos = computed(() => {
    const todos = this.todoService.listenToTodos();

    return todos().filter(todo => todo.scheduled);
  });


  constructor(private todoService: TodoService) {

  }

  async complete(id: number) {
    await this.todoService.updateTodo(id, { completed: true, scheduled: false });
  }

  async postpone(id: number) {
    await this.todoService.postponeTodo(id);
  }
}
