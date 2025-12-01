import { TestBed } from '@angular/core/testing';

import { Grafici } from './grafici';

describe('Grafici', () => {
  let service: Grafici;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Grafici);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
