import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import { AtsService } from 'src/app/services/ats.service';
import { SensorTypesFriendlyNames, SensorGroupFriendlyNames,
         KEYS_ICONS, SensorData, Sensor, AtsEvents } from 'src/app/app.values';

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.page.html',
  styleUrls: ['./sensors.page.scss'],
})
export class SensorsPage implements OnInit, OnDestroy {

  private sensors: SensorData[];
  @Input() actived: Sensor[] = [];
  private code: string;
  private color: string;
  private listeners: { unsubscribe: () => void }[];

  constructor(
    private ats: AtsService,
    private alertController: AlertController,
    private toast: ToastService) {

      this.sensors = [];
      this.listeners = [];
      this.listeners.push(this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SENSOR_ACTIVED, this.onSensorActived.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SENSORS_UPDATED, this.updateSensors.bind(this)));
  }

  ngOnInit() {
    this.color = KEYS_ICONS[1];
    this.updateSensors(this.ats.sensors || []);
    this.actived.forEach((sensor: Sensor) => {
      this.onSensorActived({ sensor, value: 1 });
    });
  }

  ngOnDestroy() {
    this.listeners.forEach(listener => listener.unsubscribe());
  }

  private addSensor(s: Sensor, actived: boolean): void {
    const sensor: SensorData = {
      location: s.location,
      name: s.name,
      type: s.type,
      group: s.group,
      typeName: SensorTypesFriendlyNames[s.type],
      groupName: SensorGroupFriendlyNames[s.group],
      actived,
      bypass: s.bypass,
      online: s.online || false
    };
    this.sensors.push(sensor);
  }

  private configureSensors(): void {
    this.sensors = this.ats.sensors.map((s: Sensor) => {
      const actived = this.actived.findIndex(a => {
        return a.location.mac === s.location.mac &&
          a.location.pin === s.location.pin;
      }) >= 0;
      const data: SensorData = {
        location: s.location,
        name: s.name,
        type: s.type,
        group: s.group,
        typeName: SensorTypesFriendlyNames[s.type],
        groupName: SensorGroupFriendlyNames[s.group],
        actived,
        bypass: s.bypass,
        online: s.online || false
      };
      return data;
    });
  }

  private updateSensors(sensors: Sensor[]): void {
    sensors.forEach((s: Sensor) => {
      const index = this.sensors.findIndex(d => d.location.mac === s.location.mac &&
        d.location.pin === s.location.pin);
      if (index < 0) {
        this.addSensor(s, false);
      } else {
        this.sensors[index].name = s.name;
        this.sensors[index].type = s.type;
        this.sensors[index].group = s.group;
        this.sensors[index].typeName = SensorTypesFriendlyNames[s.type];
        this.sensors[index].groupName = SensorGroupFriendlyNames[s.group];
        this.sensors[index].bypass = s.bypass;
        this.sensors[index].online = s.online || false;
      }
    });
  }

  private handleError(reason: { error: number}): void {
    switch (reason.error) {
      case 0:
        this.code = undefined;
        this.toast.showLongTop('Not authorized');
        break;
      case 1:
        this.toast.showLongTop('System is not ready or disarmed');
        break;
      default:
        this.code = undefined;
        this.toast.showLongTop('There was a problem');
    }
  }

  private requestCode(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (this.code) {
        return resolve();
      }
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
                resolve();
              } else {
                this.toast.showLongCenter('Bad code');
                reject({ error: 'BAD_CODE_LENGTH' });
              }
            }
          }
        ]
      });

      await alert.present();
    });
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
    this.color = KEYS_ICONS[data.state];
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

  async bypass(sensor: SensorData): Promise<void> {
    try {
      await this.requestCode();
      if (sensor.bypass) {
        await this.ats.clearBypassOne(sensor.location, this.code);
      } else {
        await this.ats.bypass(sensor.location, this.code);
      }
    } catch (reason) {
      this.handleError(reason);
    }
  }

}
