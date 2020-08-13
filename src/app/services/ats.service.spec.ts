import { TestBed } from '@angular/core/testing';

import { AtsService } from './ats.service';

describe('AtsService', () => {
  let service: AtsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
