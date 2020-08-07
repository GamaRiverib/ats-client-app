import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule) },
  { path: 'sensors', loadChildren: () => import('./pages/sensors/sensors.module').then( m => m.SensorsPageModule) },
  { path: 'activity', loadChildren: () => import('./pages/activity/activity.module').then( m => m.ActivityPageModule) },
  { path: 'programming', loadChildren: () => import('./pages/programming/programming.module').then( m => m.ProgrammingPageModule) },
  { path: 'settings', loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule) }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
