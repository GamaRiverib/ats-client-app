import { TestBed } from '@angular/core/testing';

import { Ws.ChannelService } from './ws.channel.service';

describe('Ws.ChannelService', () => {
  let service: Ws.ChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ws.ChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
