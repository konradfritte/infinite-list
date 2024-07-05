import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectSectionComponent } from './collect-section.component';

describe('CollectSectionComponent', () => {
  let component: CollectSectionComponent;
  let fixture: ComponentFixture<CollectSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
