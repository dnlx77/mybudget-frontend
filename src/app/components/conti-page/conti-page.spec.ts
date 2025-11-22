import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiPage } from './conti-page';

describe('ContiPage', () => {
  let component: ContiPage;
  let fixture: ComponentFixture<ContiPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContiPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
