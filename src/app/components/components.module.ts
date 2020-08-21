import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SensorListComponent } from './sensor-list/sensor-list.component';
import { AdminCodesComponent } from './admin-codes/admin-codes.component';
import { AdminEmailsComponent } from './admin-emails/admin-emails.component';
import { AdminPhonesComponent } from './admin-phones/admin-phones.component';
import { AdminSensorDetailComponent } from './admin-sensor-detail/admin-sensor-detail.component';
import { AdminSensorListComponent } from './admin-sensor-list/admin-sensor-list.component';
import { AdminSoundsComponent } from './admin-sounds/admin-sounds.component';
import { AdminTimesComponent } from './admin-times/admin-times.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';

@NgModule({
  declarations: [
    AdminCodesComponent,
    AdminEmailsComponent,
    AdminLoginComponent,
    AdminPhonesComponent,
    AdminSensorDetailComponent,
    AdminSensorListComponent,
    AdminSoundsComponent,
    AdminTimesComponent,
    SensorListComponent
  ],
  exports: [
    AdminCodesComponent,
    AdminEmailsComponent,
    AdminLoginComponent,
    AdminPhonesComponent,
    AdminSensorDetailComponent,
    AdminSensorListComponent,
    AdminSoundsComponent,
    AdminTimesComponent,
    SensorListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class ComponentsModule { }
