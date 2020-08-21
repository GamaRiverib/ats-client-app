import { Component, OnInit, OnDestroy } from '@angular/core';

import { HTTP } from '@ionic-native/http/ngx';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { MqttService } from 'ngx-mqtt';
import { SERVER_TRUST_MODE, environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Home',
      url: 'home',
      icon: 'home'
    },
    {
      title: 'Sensors',
      url: 'sensors',
      icon: 'hardware-chip'
    },
    {
      title: 'Activity',
      url: 'activity',
      icon: 'reader'
    },
    {
      title: 'Programming',
      url: 'programming',
      icon: 'keypad'
    },
    {
      title: 'Settings',
      url: 'settings',
      icon: 'options'
    }
  ];
  public labels = [];

  constructor(
    private http: HTTP,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private mqttService: MqttService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
    this.platform.resume.subscribe(async () => {
      console.log('app resume');
    });
    this.platform.pause.subscribe(async () => {
      console.log('app pause');
    });
    const mode = SERVER_TRUST_MODE as 'nocheck' | 'default' | 'legacy' | 'pinned';
    this.http.setServerTrustMode(mode).then(() => {
      console.log(`Set server trust mode ${mode} successful`);
    }).catch((reason: any) => {
      console.log(`Set server trust mode ${mode} fails`, reason);
    });

    if (environment.production === false) {
      console.log('Running with development parameters');
    }
  }

  async ngOnDestroy(): Promise<void> {
    console.log('AppComponent destroy');
    this.mqttService.disconnect();
  }

  ngOnInit() {

  }
}
