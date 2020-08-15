import { Component, OnInit, Input } from '@angular/core';
import { SensorData } from 'src/app/app.values';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-admin-sensor-detail',
  templateUrl: './admin-sensor-detail.component.html',
  styleUrls: ['./admin-sensor-detail.component.scss'],
})
export class AdminSensorDetailComponent implements OnInit {

  @Input() sensor: SensorData;

  constructor(private modalController: ModalController) { }

  ngOnInit() {
  }

  async back() {
    this.modalController.dismiss({ }, 'back');
  }

}
