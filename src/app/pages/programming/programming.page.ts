import { Component, OnInit } from '@angular/core';
import { AtsService, SystemState, AtsEvents } from 'src/app/services/ats.service';
import { Router } from '@angular/router';
import { Toast } from '@ionic-native/toast/ngx';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { PATHS } from 'src/app/app.values';

@Component({
  selector: 'app-programming',
  templateUrl: './programming.page.html',
  styleUrls: ['./programming.page.scss'],
})
export class ProgrammingPage implements OnInit {

  private state: number;

  constructor(
    private ats: AtsService,
    private api: AtsApiService,
    private toast: Toast,
    private router: Router) {
      this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this));
      this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, () => {
        if (this.ats.connected) {
          this.ats.getState().then(this.onSystemStateChanged.bind(this));
        }
      });
  }

  ngOnInit() {
  }

  private onSystemStateChanged(data: any): void {
    console.log('state when programming', data);
    if (data) {
      const system: SystemState = data.system ? data.system : data;
      this.state = system.state;
      switch (this.state) {
        case 6:
          this.router.navigateByUrl(PATHS.PROGRAMMING_SENSORS);
          break;
        default:
          this.router.navigate([ PATHS.PROGRAMMING ]);
          this.state = -1;
      }
    }
  }

  get programming(): boolean {
    return this.state === 6;
  }

  async logout(): Promise<void> {
    try {
      await this.api.unsetProgrammingMode();
    } catch (reason) {
      if (reason && reason.error) {
        switch (reason.error) {
          case 0:
            this.toast.showLongTop('Not authorized');
            break;
          case 1:
            this.toast.showLongTop('System is not programming mode');
            break;
          default:
            this.toast.showLongTop('There was a problem');
        }
      } else {
        this.toast.showLongTop('There was wrong');
      }
    }
  }

}
