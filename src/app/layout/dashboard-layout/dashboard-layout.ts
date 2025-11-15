import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContiPanelComponent } from '../conti-panel/conti-panel.component';
import { OperazioniPanelComponent } from '../operazioni-panel/operazioni-panel.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [CommonModule, ContiPanelComponent, OperazioniPanelComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout implements OnInit, OnDestroy {
  
  ngOnInit(): void {
    console.log('Dashboard inizializzato');
  }

  ngOnDestroy(): void {
    console.log('Dashboard distrutto');
  }
}
