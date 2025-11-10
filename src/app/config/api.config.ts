export const API_CONFIG = {
  BASE_URL: 'http://mybudget-angular.test/api',
  API_VERSION: 'v1',
  
  // Metodo helper per costruire gli URL
  getEndpoint(resource: string): string {
    return `${this.BASE_URL}/${this.API_VERSION}/${resource}`;
  }
};