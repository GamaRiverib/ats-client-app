import { TestBed } from '@angular/core/testing';

import { AtsApiService } from './ats-api.service';

describe('AtsApiService', () => {
  let service: AtsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
