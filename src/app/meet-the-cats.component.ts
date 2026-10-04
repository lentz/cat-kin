import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import adoptionSnapshot from './adoptable-cats.json';
import {
  ADOPTABLE_CATS,
  getCatAge,
  getCatSummary,
  isBarnCat,
  type AdoptableCat,
} from './cat-profile';

@Component({
  selector: 'app-meet-the-cats',
  imports: [RouterLink],
  templateUrl: './meet-the-cats.component.html',
  styleUrl: './meet-the-cats.component.css',
})
export class MeetTheCatsComponent {
  protected readonly cats = ADOPTABLE_CATS;
  protected readonly snapshotDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(adoptionSnapshot.scrapedAt));

  protected catSummary(cat: AdoptableCat): string {
    return getCatSummary(cat);
  }

  protected catAge(cat: AdoptableCat): string {
    return getCatAge(cat);
  }

  protected catNeedsBarnHome(cat: AdoptableCat): boolean {
    return isBarnCat(cat);
  }
}
