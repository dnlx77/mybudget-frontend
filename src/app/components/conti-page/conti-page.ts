import { Component, OnInit, OnDestroy } from '@angular/core';
import { ContiPageList } from '../conti-page-list/conti-page-list';

@Component({
  selector: 'app-conti-page',
  imports: [ContiPageList],
  templateUrl: './conti-page.html',
  styleUrl: './conti-page.css',
})
export class ContiPage implements OnInit, OnDestroy{
  ngOnInit(): void {
    console.log('Conti inizializzato');
  }

  ngOnDestroy(): void {
    console.log('Conti distrutto');
  }
}
