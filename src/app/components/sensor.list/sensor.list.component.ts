import { Component, OnInit, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Toast } from '@ionic-native/toast/ngx';
import { Sensor, SensorLocation, AtsService, AtsEvents } from 'src/app/services/ats.service';
import { SensorTypesFriendlyNames, SensorGroupFriendlyNames, KEYS_ICONS } from 'src/app/app.values';

interface SensorData {
  location: SensorLocation;
  name: string;
  type: string;
  group: string;
  actived: boolean;
  bypass: boolean;
  online: boolean;
}

@Component({
  selector: 'app-sensor.list',
  templateUrl: './sensor.list.component.html',
  styleUrls: ['./sensor.list.component.scss'],
})
export class SensorListComponent implements OnInit {

  private sensors: SensorData[];
  @Input() actived: Sensor[] = [];
  private code: string;
  private color: string;

  constructor(
    private ats: AtsService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toast: Toast) {

      this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this));
      this.ats.subscribe(AtsEvents.SENSOR_ACTIVED, this.onSensorActived.bind(this));
      this.ats.subscribe(AtsEvents.SENSORS_UPDATED, this.updateSensors.bind(this));
  }

  ngOnInit() {
    this.configureSensors();
  }

  private addSensor(s: Sensor, actived: boolean): void {
    const sensor: SensorData = {
      location: s.location,
      name: s.name,
      type: SensorTypesFriendlyNames[s.type],
      group: SensorGroupFriendlyNames[s.group],
      actived,
      bypass: s.bypass,
      online: s.online || false
    };
    this.sensors.push(sensor);
  }

  private configureSensors(): void {
    console.log('configureSensors', this.actived);
    this.sensors = this.ats.sensors.map((s: Sensor) => {
      const actived = this.actived.findIndex(a => {
        return a.location.mac === s.location.mac &&
          a.location.pin === s.location.pin;
      }) >= 0;
      const data: SensorData = {
        location: s.location,
        name: s.name,
        type: SensorTypesFriendlyNames[s.type],
        group: SensorGroupFriendlyNames[s.group],
        actived,
        bypass: s.bypass,
        online: s.online || false
      };
      return data;
    });
  }

  private updateSensors(sensors: Sensor[]): void {
    this.ats.sensors.forEach((s: Sensor) => {
      const index = this.sensors.findIndex(d => d.location.mac === s.location.mac &&
        d.location.pin === s.location.pin);
      if (index < 0) {
        this.addSensor(s, false);
      } else {
        this.sensors[index].name = s.name;
        this.sensors[index].type = SensorTypesFriendlyNames[s.type];
        this.sensors[index].group = SensorGroupFriendlyNames[s.group];
        this.sensors[index].bypass = s.bypass;
        this.sensors[index].online = s.online || false;
      }
    });
  }

  private handleError(reason: { error: number}): void {
    switch (reason.error) {
      case 0:
        this.toast.showLongTop('Not authorized');
        break;
      case 1:
        this.toast.showLongTop('System is not ready or disarmed');
        break;
      default:
        this.toast.showLongTop('There was a problem');
    }
  }

  private async requestCode(bypass?: boolean): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Type your code',
      inputs: [
        {
          name: 'code',
          type: 'password',
          attributes: {
            maxlength: 4,
            inputmode: 'decimal'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Disarm system canceled');
          }
        }, {
          text: 'Ok',
          cssClass: 'primary',
          handler: async (params) => {
            if (params.code && params.code.length > 0) {
              this.code = params.code;
            } else {
              this.toast.showLongCenter('Bad code');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private onSystemStateChanged(data: any): void {
    this.sensors.forEach((s: SensorData) => s.actived = false);
    if (data && data.activedSensors) {
      data.activedSensors.forEach((s: Sensor) => {
        const index = this.sensors.findIndex(d => d.location.mac === s.location.mac && d.location.pin === s.location.pin);
        if (index >= 0) {
          this.sensors[index].actived = true;
          this.sensors[index].online = true;
        }
      });
    }
    this.color = KEYS_ICONS[data.state || 1];
  }

  private onSensorActived(data: { sensor: Sensor, value: number }): void {
    if (data.sensor) {
      const s = data.sensor;
      const index = this.sensors.findIndex(d => d.location.mac === s.location.mac && d.location.pin === s.location.pin);
      if (index >= 0) {
        this.sensors[index].actived = data.value === 1;
      }
    }
  }

  async back() {
    this.modalController.dismiss({ }, 'back');
  }

}