import { Component, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, ModalController, Platform } from '@ionic/angular';
import { Toast } from '@ionic-native/toast/ngx';
import { Vibration } from '@ionic-native/vibration/ngx';
import { AtsService, AtsEvents, Sensor, SystemState, AtsStates, AtsModes } from 'src/app/services/ats.service';
import { SensorListComponent } from 'src/app/components/sensor.list/sensor.list.component';
import { KEYS_ICONS } from 'src/app/app.values';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  private loading = false;
  private online = false;

  private stateLoaded = false;
  private stateLoadedTimeout: NodeJS.Timeout;
  private stateLoadedRetryCount = 0;

  private timeoutIntervalId: NodeJS.Timeout;

  private systemState: number;
  private systemMode: number;
  private activedSensors: Sensor[] | number[];
  private state: string;
  private color: string;
  private icon: string;
  private message: string;
  private action: string;

  constructor(
    private ats: AtsService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private modalController: ModalController,
    private platform: Platform,
    private toast: Toast,
    private vibration: Vibration) { }

  ngOnInit() {

    console.log('Subscribing to ATS events');
    this.ats.subscribe(AtsEvents.SENSOR_ACTIVED, this.onSensorActived.bind(this));
    this.ats.subscribe(AtsEvents.SYSTEM_ALERT, this.onAlert.bind(this));
    this.ats.subscribe(AtsEvents.SIREN_ACTIVED, this.onSirenActived.bind(this));
    this.ats.subscribe(AtsEvents.SIREN_SILENCED, this.onSirenSilenced.bind(this));
    this.ats.subscribe(AtsEvents.SYSTEM_ALARMED, this.onSystemAlarmed.bind(this));
    this.ats.subscribe(AtsEvents.SYSTEM_ARMED, this.onSystemArmed.bind(this));
    this.ats.subscribe(AtsEvents.SYSTEM_DISARMED, this.onSystemDisarmed.bind(this));
    this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this));
    this.ats.subscribe(AtsEvents.MAX_ALERTS, this.onMaxAlerts.bind(this));
    this.ats.subscribe(AtsEvents.MAX_UNAUTHORIZED_INTENTS, this.onMaxUnauthorizedIntents.bind(this));
    this.ats.subscribe(AtsEvents.BYPASS_CHANGE, this.onBypassChange.bind(this));

    // this.ats.subscribe(AtsEvents.WEB_SOCKET_CONNECTED, this.onConnected.bind(this));
    // this.ats.subscribe(AtsEvents.WEB_SOCKET_DISCONNECTED, this.onDisconnected.bind(this));

    this.ats.subscribe(AtsEvents.MQTT_CONNECTED, this.onRemotelyConnected.bind(this));
    this.ats.subscribe(AtsEvents.MQTT_DISCONNECTED, this.onRemotelyDisconnected.bind(this));

    this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, this.onServerConnectionChange.bind(this, true));
    this.ats.subscribe(AtsEvents.SERVER_LWT_OFFLINE, this.onServerConnectionChange.bind(this, false));

    if (this.ats.connected) {
      this.ats.getState().then(this.onSystemStateChanged.bind(this));
    }

    this.loading = !this.ats.connected;
    this.online = this.ats.connected;
    this.icon = `${KEYS_ICONS[1]}`;
    this.color = `${KEYS_ICONS[1]}`;
  }

  private onSensorActived(data: any): void {
    console.log('onSensorActived', data);
  }

  private onAlert(data: any): void {
    if (data && data.system) {
      const activedSensors: Array<number> = data.system.activedSensors || [];
      const sensors: Array<string> = [];
      activedSensors.forEach((i: number) => {
          const s: Sensor = this.ats.getSensor(i);
          if (s) {
              sensors.push(s.name);
          }
      });
      this.toast.showLongTop(`Received system alert: ${sensors}`);
    } else {
      this.toast.showLongTop('Received system alert');
    }
    // vibrator.vibrate([1000, 300, 300]);
    // setTopnavColor(appColors.warning);
    // TODO: log to recent activity
  }

  private onSirenActived(data: any): void {
    this.toast.showLongTop('Siren actived');
  }

  private onSirenSilenced(data: any): void {
    this.toast.showLongTop('Siren silenced');
  }

  private onSystemAlarmed(data: any): void {
    // console.log('onSystemAlarmed', data);
    if (this.platform.is('hybrid')) {
      this.vibration.vibrate([1000, 1000, 1000, 1000]);
    }
    // setTopnavColor(appColors.danger);
  }

  private onSystemArmed(data: any): void {
    // console.log('onSystemArmed', data);
    if (this.platform.is('hybrid')) {
      this.vibration.vibrate(1000);
    }
  }

  private onSystemDisarmed(data: any): void {
    // console.log('onSystemDisarmed', data);
    if (this.platform.is('hybrid')) {
      this.vibration.vibrate([1000, 1000]);
    }
    // setTopnavColor(appColors.dark);
  }

  private handleTimeout(state: number, leftTimeout: number): void {
    const view = this;
    if (leftTimeout > 0 && (state === 4 || state === 2)) {
      let timeout: number = leftTimeout;
      if (!this.timeoutIntervalId) {
        this.timeoutIntervalId = setInterval(() => {
          if (timeout > 0) {
            timeout--;
            const message = `${timeout || 0} seconds to ${state === 2 ? 'arm' : 'disarm'}`;
            view.message = message;
          } else {
              timeout = null;
              view.message = 'Waiting confirmation...';
              clearInterval(view.timeoutIntervalId);
              view.timeoutIntervalId = undefined;
              view.ats.getState()
                .then(this.onSystemStateChanged.bind(this))
                .catch(error => console.log(error));
          }
        }, 1000);
      }
    } else if (this.timeoutIntervalId) {
      clearInterval(this.timeoutIntervalId);
      this.timeoutIntervalId = undefined;
    }
  }

  private onSystemStateChanged(data: any): void {
    console.log('onSystemStateChanged', data);
    if (data) {
      this.stateLoaded = true;
      const system: SystemState = data.system ? data.system : data;
      const systemState: number = system.state;
      const systemMode: number = system.mode;
      const state: string = AtsStates[systemState];
      const mode: string = AtsModes[systemMode];
      const activedSensors: Array<any> = system.activedSensors || [];
      const activedSensorsCount: number = system.activedSensors ? system.activedSensors.length : 0;
      const timeout: number | null = Math.ceil(data.leftTimeout || ((system.leftTime - system.uptime) / 1000));

      this.handleTimeout(systemState, timeout);

      this.systemState = systemState;
      this.systemMode = systemMode;
      this.activedSensors = activedSensors;
      this.state = state;
      this.icon = `${KEYS_ICONS[systemState]}`;
      this.color = `${KEYS_ICONS[systemState]}`;

      switch (systemState) {
        case 0:
          this.message = '';
          this.action = 'ARM';
          break;
        case 1:
          this.message = activedSensorsCount > 1 ? `${activedSensorsCount} sensors actived` : '1 sensor actived';
          this.action = 'VIEW SENSORS';
          break;
        case 2:
          this.message = timeout ? `${timeout || 0} seconds to arm` : 'Waiting confirmation...';
          this.action = '';
          break;
        case 3:
          this.message = `${mode}`;
          this.action = 'DISARM';
          break;
        case 4:
          this.message = timeout ? `${timeout || 0} seconds to disarm` : 'Waiting confirmation...';
          this.action = 'DISARM';
          break;
        case 5:
          this.message = '';
          this.action = 'DISARM';
          break;
        case 6:
          this.message = 'Programming mode';
          this.action = 'EXIT';
          break;
        default:
          this.state = '';
          this.message = '';
          this.action = '';
      }
    }
  }

  private onMaxAlerts(data: any): void {
    console.log(data);
    let info  = '';
    if (data && data.system) {
      // TODO
      const sensors: Array<number> = data.system.activedSensors;
      const sensor: Sensor = this.ats.getSensor(sensors[0]);
      info = `Sensor ${sensor.name} actived`;
      console.log(data.extras);
      console.log(`ALERT ${info}`);
    }

    if (this.platform.is('hybrid')) {
      this.vibration.vibrate([2000, 300, 300]);
    }
  }

  private onMaxUnauthorizedIntents(data: any): void {
    this.toast.showLongTop('Maximum unauthorized intents');
    console.log('onMaxUnauthorizedIntents', data);
  }

  private onBypassChange(data: any): void {
    console.log('onBypassChange', data);
  }

  private getStateIfNotLoaded(): void {
    const MAX_RETRIES = 5;
    if (this.stateLoadedRetryCount >= MAX_RETRIES) {
      this.message = 'It seems that the server is not responding';
      return;
    }
    if (this.stateLoaded) {
      this.stateLoadedRetryCount = 0;
      clearTimeout(this.stateLoadedTimeout);
      this.stateLoadedTimeout = undefined;
      return;
    }

    this.stateLoadedRetryCount++;
    this.message = `Waiting state... Retry ${this.stateLoadedRetryCount} of ${MAX_RETRIES}`;
    this.stateLoadedTimeout = setTimeout(this.getStateIfNotLoaded.bind(this), 5000);
    this.ats.getState()
      .then((data: any) => {
        clearTimeout(this.stateLoadedTimeout);
        this.stateLoadedTimeout = undefined;
        this.onSystemStateChanged.call(this, data);
      })
      .catch((reason: any) => {
        console.log(reason);
    });
  }

  private onConnected(data: any): void {
    // showNotification('Connected');
    this.online = true;
    this.loading = false;
    console.log('onLocallyConnected');
    setTimeout(this.getStateIfNotLoaded.bind(this), 2000);
  }

  private onDisconnected(data: any): void {
    // showNotification('Disconnected', 6000);
    if (!this.ats.connected) {
      this.online = false;
      this.loading = true;
    }
  }

  private onRemotelyConnected(data: any): void {
    this.online = true;
    this.loading = false;
    console.log('onRemotelyConnected');
    setTimeout(this.getStateIfNotLoaded.bind(this), 2000);
  }

  private onRemotelyDisconnected(data: any): void {
    if (!this.ats.connected) {
      this.online = false;
      this.loading = true;
      this.message = 'Connecting...';
    }
  }

  private onServerConnectionChange(online: boolean): void {
    const message: string = online ? 'Server online' : 'Server offline';
    this.toast.showShortTop(message);
  }

  get actionAvailable(): boolean {
    return this.systemState === undefined || this.systemState === 2 || this.systemState === 6;
  }

  execAction(): void {
    switch (this.systemState) {
      case 0:
        this.armSystem();
        break;
      case 1:
        this.showSensors();
        break;
      case 3:
      case 4:
      case 5:
        this.disarmSystem();
        break;
      case 6:
        this.exitProgramming();
        break;
      default:
        break;
    }
  }

  async armSystem(): Promise<void> {
    const buttons = [];
    const cancelButton = {
      text: 'Cancel',
      role: 'cancel',
      icon: 'close',
      handler: () => {
        console.log('Arm system canceled');
      }
    };
    buttons.push(cancelButton);
    const view = this;
    AtsModes.forEach((text: string, mode: number) => {
      buttons.push({
        text,
        handler: async () => {
          console.log('Select mode', text);
          try {
            view.actionSheetController.dismiss();
            await view.ats.arm(mode);
            console.log('arming system...');
          } catch (reason) {
            if (reason) {
              switch (reason.error) {
                case 0:
                  view.toast.showLongCenter('Not authorized');
                  break;
                case 1:
                  view.toast.showLongCenter('System is not ready to arm');
                  break;
                default:
                  view.toast.showLongCenter('There was a problem');
              }
            }
          }
        }
      });
    });
    const actionSheet = await this.actionSheetController.create({
      header: 'Select mode',
      buttons,
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,
    });
    await actionSheet.present();
  }

  async showSensors(): Promise<void> {
    const actived = this.activedSensors;
    const modal = await this.modalController.create({
      component: SensorListComponent,
      componentProps: { actived }
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

  async disarmSystem(): Promise<void> {
    const view = this;
    const alert = await this.alertController.create({
      header: 'Disarm system',
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
              try {
                await view.ats.disarm(params.code);
                console.log('disarming system...');
              } catch (reason) {
                if (reason) {
                  switch (reason.error) {
                    case 0:
                      view.toast.showLongCenter('Not authorized');
                      break;
                    case 1:
                      view.toast.showLongCenter('System is not armed or alarmed');
                      break;
                    default:
                      view.toast.showLongCenter('There was a problem');
                  }
                }
              }
            } else {
              view.toast.showLongCenter('Bad code');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  exitProgramming(): void {

  }

}
