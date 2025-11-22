import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiPageList } from './conti-page-list';

describe('ContiPageList', () => {
  let component: ContiPageList;
  let fixture: ComponentFixture<ContiPageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContiPageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiPageList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
