import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperazioniList } from './operazioni-list';

describe('OperazioniList', () => {
  let component: OperazioniList;
  let fixture: ComponentFixture<OperazioniList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperazioniList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperazioniList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
