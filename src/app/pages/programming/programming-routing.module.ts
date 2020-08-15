import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgrammingPage } from './programming.page';
import { AdminSensorListComponent } from 'src/app/components/admin-sensor-list/admin-sensor-list.component';
import { AdminCodesComponent } from 'src/app/components/admin-codes/admin-codes.component';
import { AdminTimesComponent } from 'src/app/components/admin-times/admin-times.component';
import { AdminSoundsComponent } from 'src/app/components/admin-sounds/admin-sounds.component';
import { AdminPhonesComponent } from 'src/app/components/admin-phones/admin-phones.component';
import { AdminEmailsComponent } from 'src/app/components/admin-emails/admin-emails.component';
import { AdminLoginComponent } from 'src/app/components/admin-login/admin-login.component';

const routes: Routes = [
  {
    path: '',
    component: ProgrammingPage,
    children: [
      { path: '', component: AdminLoginComponent },
      { path: 'sensors', component: AdminSensorListComponent },
      { path: 'codes', component: AdminCodesComponent },
      { path: 'times', component: AdminTimesComponent },
      { path: 'sounds', component: AdminSoundsComponent },
      { path: 'phones', component: AdminPhonesComponent },
      { path: 'emails', component: AdminEmailsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProgrammingPageRoutingModule {}
