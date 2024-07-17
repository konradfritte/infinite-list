import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
    CollectSectionComponent,
    SelectSectionComponent,
    ReviewSectionComponent,
    HeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  currentView = signal<string>('collect');

  constructor() {
  }

  show(view: string) {
    this.currentView.set(view);
  }
}
