import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsPageForm } from './tags-page-form';

describe('TagsPageForm', () => {
  let component: TagsPageForm;
  let fixture: ComponentFixture<TagsPageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagsPageForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsPageForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
