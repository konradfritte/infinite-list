import { Component, EventEmitter, Output, input } from '@angular/core';
import { Todo } from '../app.component';

@Component({
  selector: 'app-review-section',
  standalone: true,
  imports: [],
  templateUrl: './review-section.component.html',
  styleUrl: './review-section.component.scss'
})
export class ReviewSectionComponent {
  @Output() todoCompleted = new EventEmitter<number>();
  @Output() todoPostponed = new EventEmitter<number>();

  todos = input.required<Todo[]>();


  complete(id: number) {
    this.todoCompleted.emit(id);
  }

  postpone(id: number) {
    this.todoPostponed.emit(id);
  }
}
