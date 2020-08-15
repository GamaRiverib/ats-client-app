import { Component, OnInit } from '@angular/core';
import { AtsApiService } from 'src/app/services/ats-api.service';

@Component({
  selector: 'app-admin-sounds',
  templateUrl: './admin-sounds.component.html',
  styleUrls: ['./admin-sounds.component.scss'],
})
export class AdminSoundsComponent implements OnInit {

  private config: { beep: boolean, silentAlarm: boolean };

  constructor(private api: AtsApiService) {
    this.config = { beep: false, silentAlarm: false };
  }

  async ngOnInit() {
    this.config = await this.api.getCurrentConfig();
  }

}
