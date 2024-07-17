import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  todos = this.todoService.listenToTodos();

  exportData = signal<string>('');

  dialog = viewChild<ElementRef>('dialog');

  constructor(private todoService: TodoService) {

  }

  import(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result as string;

      await this.todoService.importTodos(data);
    }

    reader.readAsText(file);
  }

  export() {
    navigator.clipboard.writeText(this.exportData());
  }

  showDialog() {
    this.exportData.set(JSON.stringify(this.todos(), null, 2));

    this.dialog()?.nativeElement.showModal();
  }

  hideDialog() {
    this.dialog()?.nativeElement.close();
  }
}
