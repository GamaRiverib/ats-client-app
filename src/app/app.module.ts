import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HTTP } from '@ionic-native/http/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { MqttModule } from 'ngx-mqtt';
// import { SocketIoModule } from 'ngx-socket-io';
import { Toast } from '@ionic-native/toast/ngx';
import { Vibration } from '@ionic-native/vibration/ngx';

// const serverUrl = 'http://192.168.0.173:3000';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    MqttModule.forRoot({ connectOnCreate: false }),
    // SocketIoModule.forRoot({ url: serverUrl }),
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    HTTP,
    NativeStorage,
    Toast,
    Vibration,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
