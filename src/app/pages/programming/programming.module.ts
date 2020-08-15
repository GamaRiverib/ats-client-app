import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProgrammingPageRoutingModule } from './programming-routing.module';

import { ProgrammingPage } from './programming.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { AdminCodesComponent } from 'src/app/components/admin-codes/admin-codes.component';
import { AdminEmailsComponent } from 'src/app/components/admin-emails/admin-emails.component';
import { AdminPhonesComponent } from 'src/app/components/admin-phones/admin-phones.component';
import { AdminSensorDetailComponent } from 'src/app/components/admin-sensor-detail/admin-sensor-detail.component';
import { AdminSensorListComponent } from 'src/app/components/admin-sensor-list/admin-sensor-list.component';
import { AdminSoundsComponent } from 'src/app/components/admin-sounds/admin-sounds.component';
import { AdminTimesComponent } from 'src/app/components/admin-times/admin-times.component';
import { AdminLoginComponent } from 'src/app/components/admin-login/admin-login.component';

@NgModule({
  entryComponents: [
    AdminCodesComponent,
    AdminEmailsComponent,
    AdminLoginComponent,
    AdminPhonesComponent,
    AdminSensorDetailComponent,
    AdminSensorListComponent,
    AdminSoundsComponent,
    AdminTimesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    ProgrammingPageRoutingModule
  ],
  declarations: [ProgrammingPage]
})
export class ProgrammingPageModule {}
