import { Component, OnInit, OnDestroy } from '@angular/core';
import { AtsService } from 'src/app/services/ats.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { AtsApiService } from 'src/app/services/ats-api.service';
import { PATHS, SystemState, AtsEvents } from 'src/app/app.values';

@Component({
  selector: 'app-programming',
  templateUrl: './programming.page.html',
  styleUrls: ['./programming.page.scss'],
})
export class ProgrammingPage implements OnInit, OnDestroy {

  private state: number;
  private listeners: { unsubscribe: () => void }[];

  constructor(
    private ats: AtsService,
    private api: AtsApiService,
    private toast: ToastService,
    private router: Router) {
      this.listeners = [];
      this.listeners.push(this.ats.subscribe(AtsEvents.SYSTEM_STATE_CHANGED, this.onSystemStateChanged.bind(this)));
      this.listeners.push(this.ats.subscribe(AtsEvents.SERVER_LWT_ONLINE, this.getSystemState.bind(this)));
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.listeners.forEach(listener => listener.unsubscribe());
  }

  private getSystemState(): void {
    if (this.ats.connected) {
      this.ats.getState().then(this.onSystemStateChanged.bind(this));
    }
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
