import { Component } from '@angular/core';
import { AppShell } from './shared/app-shell/app-shell';

@Component({
  selector: 'rtw-root',
  imports: [AppShell],
  template: '<rtw-app-shell />',
})
export class App {}
