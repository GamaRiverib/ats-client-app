import { Component, OnInit } from '@angular/core';
import { AtsApiService } from 'src/app/services/ats-api.service';

@Component({
  selector: 'app-admin-times',
  templateUrl: './admin-times.component.html',
  styleUrls: ['./admin-times.component.scss'],
})
export class AdminTimesComponent implements OnInit {

  private config: { exitTime: number, entryTime: number };

  constructor(private api: AtsApiService) {
    this.config = { exitTime: 0, entryTime: 0 };
  }

  async ngOnInit() {
    this.config = await this.api.getCurrentConfig();
  }

}
