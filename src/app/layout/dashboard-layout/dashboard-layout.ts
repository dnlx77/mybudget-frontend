import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContiPanelComponent } from '../conti-panel/conti-panel.component';
import { OperazioniPanelComponent } from '../operazioni-panel/operazioni-panel.component';
import { PagamentiRateWidgetComponent } from '../pagamenti-rate-widget/pagamenti-rate-widget.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [CommonModule, ContiPanelComponent, OperazioniPanelComponent, PagamentiRateWidgetComponent],
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
