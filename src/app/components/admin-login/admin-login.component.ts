import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Toast } from '@ionic-native/toast/ngx';
import { Vibration } from '@ionic-native/vibration/ngx';
import { AtsService, AtsEvents } from 'src/app/services/ats.service';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { isNumber } from 'util';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
})
export class AdminLoginComponent implements OnInit {

  private hybrid = false;
  private code: string;
  private online = false;

  constructor(
    private ats: AtsService,
    private api: AtsApiService,
    private platform: Platform,
    private toast: Toast,
    private vibration: Vibration) {
      this.hybrid = this.platform.is('hybrid');
      this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, d => this.online = true);
      this.ats.subscribe(AtsEvents.SERVER_LWT_OFFLINE, d => this.online = false);
  }

  ngOnInit() {
    this.online = this.ats.connected;
  }

  async login(): Promise<void> {
    if (!this.code) {
      console.log('Missing code');
      this.toast.showShortTop('Type your code');
      if (this.hybrid) {
        this.vibration.vibrate([500, 500]);
      }
    }
    if (!this.online) {
      console.log('Is not connected');
      this.toast.showShortBottom('System is offline');
      if (this.hybrid) {
        this.vibration.vibrate([500, 500]);
      }
    }

    try {
      await this.api.setProgrammingMode(this.code);
      this.code = '';
    } catch (reason) {
      let message = 'There was wrong';
      if (reason && typeof reason.error === 'number') {
        switch (reason.error) {
          case 0:
            this.code = undefined;
            message = 'Not authorized';
            break;
          case 1:
            message = 'System is not ready or disarmed';
            break;
          default:
            this.code = undefined;
            message = 'There was a problem';
        }
      }
      if (this.hybrid) {
        this.toast.showLongTop(message);
      } else {
        alert(message);
      }
    }
  }

}
