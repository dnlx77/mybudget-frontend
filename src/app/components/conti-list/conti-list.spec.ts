import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiList } from './conti-list';

describe('ContiList', () => {
  let component: ContiList;
  let fixture: ComponentFixture<ContiList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContiList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
