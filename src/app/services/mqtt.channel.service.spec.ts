import { TestBed } from '@angular/core/testing';

import { Mqtt.ChannelService } from './mqtt.channel.service';

describe('Mqtt.ChannelService', () => {
  let service: Mqtt.ChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mqtt.ChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
