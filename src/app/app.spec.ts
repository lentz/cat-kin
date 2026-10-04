import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MeetTheCatsComponent } from './meet-the-cats.component';
import { routes } from './app.config';
import { AppRoot } from './app-root';
import { ADOPTABLE_CATS, App, findMatchingCat, MATCHABLE_CATS, QUESTIONS } from './app';

describe('Cat & Kin', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, MeetTheCatsComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('shows the welcome screen and starts the quiz', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    ).toContain('The cat who gets you');

    fixture.nativeElement.querySelector('.button-primary').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.question-count')?.textContent).toContain('1');
  });

  it('requires an answer before moving to the next question', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.button-primary').click();
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector('.next-button') as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);

    fixture.nativeElement.querySelector('.answer-option').click();
    fixture.detectChanges();

    expect(nextButton.disabled).toBe(false);
    nextButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.question-count')?.textContent).toContain('2');
  });

  it('matches completed answers to an individual adoptable cat', () => {
    expect(findMatchingCat(Array(QUESTIONS.length).fill(null))).toBeNull();
    expect(findMatchingCat([0, 0, 0, 0, 0])).toBeNull();
    expect(findMatchingCat(Array(QUESTIONS.length).fill(99))).toBeNull();

    expect(ADOPTABLE_CATS.length).toBeGreaterThan(0);
    expect(new Set(ADOPTABLE_CATS.map((cat) => cat.id)).size).toBe(ADOPTABLE_CATS.length);
    expect(ADOPTABLE_CATS.every((cat) => cat.images.length && cat.sourceUrl)).toBe(true);
    expect(MATCHABLE_CATS.every((cat) => cat.matchable && !cat.applicationPending)).toBe(true);

    const cozyMatch = findMatchingCat(Array(QUESTIONS.length).fill(0));
    const independentMatch = findMatchingCat(Array(QUESTIONS.length).fill(3));

    expect(cozyMatch).not.toBeNull();
    expect(independentMatch).not.toBeNull();
    expect(MATCHABLE_CATS).toContain(cozyMatch);
    expect(MATCHABLE_CATS).toContain(independentMatch);
    expect(cozyMatch?.id).not.toBe(independentMatch?.id);
  });

  it('keeps non-individual listings in the gallery but out of quiz matches', () => {
    expect(ADOPTABLE_CATS.some((cat) => !cat.matchable)).toBe(true);
    expect(
      ADOPTABLE_CATS.filter((cat) => cat.applicationPending).every((cat) => !cat.matchable),
    ).toBe(true);
    expect(MATCHABLE_CATS.every((cat) => cat.matchable && !cat.applicationPending)).toBe(true);
  });

  it('uses profile-relevant quiz choices and respects barn-home suitability', () => {
    expect(QUESTIONS.map((question) => question.prompt)).toEqual([
      'What kind of energy fits your day-to-day?',
      'How would you like your cat to warm up to you?',
      'What would you most enjoy doing together?',
      'What kind of home can you offer?',
      'How much affection would feel right?',
      'What personality would be the best fit?',
    ]);
    expect(findMatchingCat([0, 0, 0, 0, 0, 0])?.details.moreInfo).not.toMatch(
      /barn cat|barn kitty|working cat|mouse hunter|mouser|property protector/i,
    );

    const barnMatch = findMatchingCat([0, 0, 0, 3, 0, 0]);
    expect(barnMatch).not.toBeNull();
    expect(`${barnMatch?.details.description} ${barnMatch?.details.moreInfo}`).toMatch(
      /barn cat|barn kitty|working cat|mouse hunter|mouser|property protector/i,
    );
  });

  it('shows every scraped cat and photo on the gallery route', () => {
    const fixture = TestBed.createComponent(MeetTheCatsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#gallery-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.gallery-card')).toHaveLength(
      ADOPTABLE_CATS.length,
    );
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.gallery-card-copy h2',
        ) as NodeListOf<HTMLHeadingElement>,
        (heading) => heading.textContent?.trim(),
      ),
    ).toEqual(ADOPTABLE_CATS.map((cat) => cat.name));
    expect(fixture.nativeElement.querySelectorAll('.gallery-photo[alt]')).toHaveLength(
      ADOPTABLE_CATS.length,
    );

    expect(fixture.nativeElement.querySelector('.gallery-cta a')?.getAttribute('href')).toBe(
      '/?startQuiz=true',
    );
  });

  it('navigates to the gallery URL and starts the quiz from its CTA', async () => {
    const fixture = TestBed.createComponent(AppRoot);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/meet-the-cats');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#gallery-title')).not.toBeNull();
    expect(router.url).toBe('/meet-the-cats');

    await router.navigateByUrl('/?startQuiz=true');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.question-count')?.textContent).toContain('1');
  });

  it('shows the matched cat after all questions and can restart the quiz', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.button-primary').click();
    fixture.detectChanges();

    for (let question = 0; question < QUESTIONS.length; question += 1) {
      const answer = fixture.nativeElement.querySelectorAll(
        '.answer-option',
      )[0] as HTMLButtonElement;
      answer.click();
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.next-button').click();
      fixture.detectChanges();
    }

    const matchedCat = findMatchingCat(Array(QUESTIONS.length).fill(0));
    expect(fixture.nativeElement.querySelector('.result-copy h2')?.textContent).toContain(
      matchedCat?.name,
    );
    expect(fixture.nativeElement.querySelector('.result-photo')?.getAttribute('src')).toBe(
      matchedCat?.images[0].url,
    );
    expect(fixture.nativeElement.querySelector('.result-copy a')?.getAttribute('href')).toBe(
      matchedCat?.sourceUrl,
    );

    fixture.nativeElement.querySelector('.result-copy .text-button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#welcome-title')).not.toBeNull();
  });
});
