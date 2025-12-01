import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsPageList } from './tags-page-list';

describe('TagsPageList', () => {
  let component: TagsPageList;
  let fixture: ComponentFixture<TagsPageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagsPageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsPageList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
