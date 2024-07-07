import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Todo } from '../app.component';

@Component({
  selector: 'app-collect-section',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './collect-section.component.html',
  styleUrl: './collect-section.component.scss'
})
export class CollectSectionComponent {
  @Output() todoAdded = new EventEmitter<FormGroup>();
  @Output() todoRemoved = new EventEmitter<number>();

  todos = input.required<Todo[]>();

  form = new FormGroup({
    title: new FormControl("", [Validators.required])
  });

  async addTodo() {
    this.todoAdded.emit(this.form);

    this.form.reset();
  }

  remove(id: number) {
    this.todoRemoved.emit(id);
  }
}
