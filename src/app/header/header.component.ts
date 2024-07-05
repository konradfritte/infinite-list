import { Component, ElementRef, EventEmitter, Output, input, signal, viewChild } from '@angular/core';
import { Todo } from '../app.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() dataImported = new EventEmitter();
  @Output() dataExported = new EventEmitter<string>();

  todos = input.required<Todo[]>();

  exportData = signal<string>('');

  dialog = viewChild<ElementRef>('dialog');

  import(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    this.dataImported.emit(file);
  }

  export() {
    this.dataExported.emit(this.exportData());
  }

  showDialog() {
    this.exportData.set(JSON.stringify(this.todos(), null, 2));

    this.dialog()?.nativeElement.showModal();
  }

  hideDialog() {
    this.dialog()?.nativeElement.close();
  }
}
