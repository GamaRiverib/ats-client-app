import { Component, OnInit, OnDestroy } from '@angular/core';
import { AtsService, AtsEvents } from 'src/app/services/ats.service';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  private code: string;
  private online = false;

  constructor(
    private ats: AtsService,
    private api: AtsApiService,
    private toast: ToastService) {
      this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, d => this.online = true);
      this.ats.subscribe(AtsEvents.SERVER_LWT_OFFLINE, d => this.online = false);
  }

  ngOnInit() {
    this.online = this.ats.connected;
  }

  ngOnDestroy() {
    // TOOD: unsubscribe
  }

  async login(): Promise<void> {
    if (!this.code) {
      console.log('Missing code');
      this.toast.showShortTop('Type your code', 'Missing code', [500, 500]);
    }
    if (!this.online) {
      console.log('Is not connected');
      this.toast.showShortBottom('System is offline', 'Is not connected', [500, 500]);
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
      this.toast.showLongTop(message);
    }
  }

}
