import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // ⬅️ Rimuovi i vecchi import
import { authInterceptor } from './interceptors/auth.interceptor'; // Importa la funzione, non la classe
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { routes } from './app.routes';

echarts.use([
  BarChart, LineChart, PieChart,
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  CanvasRenderer
]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // ✅ HTTP CLIENT CONFIGURATO IN MODO MODERNO
    provideHttpClient(
      withInterceptors([authInterceptor]) // Qui carichiamo la funzione
    ),
    
    provideEchartsCore({ echarts })
  ]
};