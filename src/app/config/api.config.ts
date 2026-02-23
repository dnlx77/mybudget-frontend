import { environment } from "../../environments/environment";

export const API_CONFIG = {
  // Ora prende dinamicamente l'URL corretto in base a se sei in ng serve o ng build
  // (Nota: l'environment.apiUrl contiene già '/api/v1')
  BASE_URL: environment.apiUrl,
  
  // Metodo helper per costruire gli URL
  getEndpoint(resource: string): string {
    // Rimuoviamo this.API_VERSION perché è già dentro BASE_URL
    return `${this.BASE_URL}/${resource}`;
  }
};