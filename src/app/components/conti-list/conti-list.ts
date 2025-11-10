import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContoService, Conto, ContoResponse } from '../../services/conto.service';

@Component({
  selector: 'app-conti-list',
  imports: [CommonModule],
  templateUrl: './conti-list.html',
  styleUrl: './conti-list.css',
})
export class ContiList implements OnInit {
  
  conti: Conto[] = [];
  loading: boolean = true;
  error: string | null = null;

  /**
   * PERCHÉ constructor(private accountService: AccountService)?
   * - Dependency Injection: Angular inietta il servizio automaticamente
   * - 'private' significa che è una proprietà privata della classe
   * - Lo usiamo con 'this.accountService' dentro la classe
   */
  constructor(private contoService: ContoService) { }

  /**
   * ngOnInit è un "lifecycle hook" (gancio del ciclo di vita)
   * Viene eseguito automaticamente quando il componente viene caricato
   * 
   * PERCHÉ qui e non nel constructor?
   * - Nel constructor: solo inizializzazione
   * - In ngOnInit: logica che dipende da dati/servizi
   * 
   * È come il metodo __construct() in PHP, ma separato dalla logica
   */
  ngOnInit(): void {
    this.loadConti();
  }

  /**
   * Carica i conti dall'API
   */
  loadConti(): void {
    this.loading = true;
    this.error = null;

    /**
     * QUI USIAMO subscribe()!
     * 
     * this.accountService.getConti() ritorna un Observable
     * .subscribe() si mette in ascolto e quando arrivano i dati:
     * - (response) => { ... }  è quello che fare quando arrivano
     * - (error) => { ... }     è quello che fare se c'è errore
     */
    this.contoService.getConti().subscribe(
      // Primo parametro: SUCCESS - quando i dati arrivano
      (response) => {
        console.log('Conti ricevuti:', response);
        
        // Controlliamo che la risposta sia OK
        if (response.success) {
          // response.data è un array di Conto
          this.conti = response.data as Conto[];
        } else {
          this.error = response.message;
        }
        
        this.loading = false;
      },
      
      // Secondo parametro: ERROR - se c'è un errore HTTP
      (error) => {
        console.error('Errore nel caricamento conti:', error);
        this.error = `Errore: ${error.message || 'Impossibile caricare i conti'}`;
        this.loading = false;
      }
    );
  }
}