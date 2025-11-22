import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiPageForm } from './conti-page-form';

describe('ContiPageForm', () => {
  let component: ContiPageForm;
  let fixture: ComponentFixture<ContiPageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContiPageForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiPageForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
