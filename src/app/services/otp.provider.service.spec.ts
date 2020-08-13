import { TestBed } from '@angular/core/testing';

import { Otp.ProviderService } from './otp.provider.service';

describe('Otp.ProviderService', () => {
  let service: Otp.ProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Otp.ProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
