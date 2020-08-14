import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SensorListComponent } from './sensor.list/sensor.list.component';

@NgModule({
  declarations: [
    SensorListComponent
  ],
  exports: [
    SensorListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class ComponentsModule { }
