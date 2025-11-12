import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperazioneForm } from './operazione-form';

describe('OperazioneForm', () => {
  let component: OperazioneForm;
  let fixture: ComponentFixture<OperazioneForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperazioneForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperazioneForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
