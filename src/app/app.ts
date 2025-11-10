import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from './components/login/login';
import { ContiList } from './components/conti-list/conti-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, ContiList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mybudget-frontend');
}
