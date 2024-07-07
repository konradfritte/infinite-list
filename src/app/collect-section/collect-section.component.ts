import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TodoService } from '../todo.service';

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
  todos = this.todoService.listenToTodos();

  form = new FormGroup({
    title: new FormControl("", [Validators.required])
  });

  constructor(private todoService: TodoService) { }

  async addTodo() {
    await this.todoService.addTodo(this.form.value);

    this.form.reset();
  }

  async remove(id: number) {
    await this.todoService.removeTodo(id);
  }
}
