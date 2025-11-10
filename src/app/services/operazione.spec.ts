import { TestBed } from '@angular/core/testing';

import { Operazione } from './operazione.service';

describe('Operazione', () => {
  let service: Operazione;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Operazione);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
