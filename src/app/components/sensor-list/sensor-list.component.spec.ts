import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SensorListComponent } from './sensor-list.component';

describe('SensorListComponent', () => {
  let component: SensorListComponent;
  let fixture: ComponentFixture<SensorListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SensorListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SensorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
