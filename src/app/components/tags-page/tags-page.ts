import { Component, OnDestroy, OnInit } from '@angular/core';
import { TagsPageList } from '../tags-page-list/tags-page-list';

@Component({
  selector: 'app-tags-page',
  imports: [TagsPageList],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.css',
})
export class TagsPage implements OnInit, OnDestroy{
  ngOnInit(): void {
    console.log('Tags inizializzato');
  }

  ngOnDestroy(): void {
    console.log('Tags distrutto');
  }
}
