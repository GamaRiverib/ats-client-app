import { Component, OnInit, OnDestroy } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { MqttService } from 'ngx-mqtt';

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
  }

  async ngOnDestroy(): Promise<void> {
    console.log('AppComponent destroy');
    this.mqttService.disconnect();
  }

  ngOnInit() {

  }
}
