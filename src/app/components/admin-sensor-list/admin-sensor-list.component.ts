import { Component, OnInit, OnDestroy } from '@angular/core';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { AtsService } from 'src/app/services/ats.service';
import { Router } from '@angular/router';
import { PATHS, SensorData, SensorTypesFriendlyNames, SensorGroupFriendlyNames } from 'src/app/app.values';
import { ModalController } from '@ionic/angular';
import { AdminSensorDetailComponent } from '../admin-sensor-detail/admin-sensor-detail.component';
import { SystemState, AtsEvents, Sensor } from '../../app.values';

@Component({
  selector: 'app-admin-sensor-list',
  templateUrl: './admin-sensor-list.component.html',
  styleUrls: ['./admin-sensor-list.component.scss'],
})
export class AdminSensorListComponent implements OnInit, OnDestroy {

  private sensors: SensorData[];
  private actived: Sensor[];
  private listeners: { unsubscribe: () => void }[];

  constructor(
    private ats: AtsService,
    private api: AtsApiService,
    private modalController: ModalController,
    private router: Router) {

      this.actived = [];
      this.sensors = [];
      this.listeners = [];
      this.listeners.push(this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SENSOR_ACTIVED, this.onSensorActived.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SENSORS_UPDATED, this.updateSensors.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, this.configureSensors.bind(this)));
  }

  ngOnInit() {
    this.updateSensors(this.ats.sensors || []);
  }

  ngOnDestroy() {
    this.listeners.forEach(listener => listener.unsubscribe());
  }

  private onSystemStateChanged(data: any): void {
    if (data) {
      const system: SystemState = data.system ? data.system : data;
      if (system.state !== 6) {
        this.router.navigate([ PATHS.PROGRAMMING ]);
        return;
      }

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
    }
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

  private configureSensors(): void {
    if (this.ats.connected) {
      this.ats.getState().then(this.onSystemStateChanged.bind(this));
    }
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

  async sensorDetail(sensor: SensorData): Promise<void> {
    const modal = await this.modalController.create({
      component: AdminSensorDetailComponent,
      componentProps: { sensor }
    });
    modal.onWillDismiss().then(async (res: any) => {
      console.log(res);
    }).catch((reason: any) => {
      console.log('ERROR', reason);
    }).finally(() => {
      // TODO
    });
    return await modal.present();
  }

}
