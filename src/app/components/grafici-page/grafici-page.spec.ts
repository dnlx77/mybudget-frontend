import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficiPage } from './grafici-page';

describe('GraficiPage', () => {
  let component: GraficiPage;
  let fixture: ComponentFixture<GraficiPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficiPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
