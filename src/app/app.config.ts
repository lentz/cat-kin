import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { App } from './app';
import { MeetTheCatsComponent } from './meet-the-cats.component';

export const routes: Routes = [
  { path: '', component: App },
  { path: 'meet-the-cats', component: MeetTheCatsComponent },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
