import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ADOPTABLE_CATS,
  getCatAge,
  getCatDescription,
  getCatSummary,
  getDetail,
  isBarnCat,
} from './cat-profile';
import adoptionSnapshot from './adoptable-cats.json';

export { ADOPTABLE_CATS, getCatAge, getCatSummary } from './cat-profile';

type Trait =
  'affection' | 'playfulness' | 'curiosity' | 'independence' | 'gentleness' | 'adventure';
type TraitScores = Record<Trait, number>;
type Phase = 'welcome' | 'quiz' | 'result';
type AdoptableCat = (typeof ADOPTABLE_CATS)[number];

interface Answer {
  readonly label: string;
  readonly emoji: string;
  readonly traits: Partial<Record<Trait, number>>;
  readonly homeType?: 'indoor' | 'barn';
}

interface Question {
  readonly prompt: string;
  readonly note: string;
  readonly answers: readonly Answer[];
}

const TRAITS: readonly Trait[] = [
  'affection',
  'playfulness',
  'curiosity',
  'independence',
  'gentleness',
  'adventure',
];
const HOME_QUESTION_INDEX = 3;

const PROFILE_KEYWORDS: Record<Trait, readonly RegExp[]> = {
  affection: [
    /\b(?:affectionate|affection|cuddly|cuddle\w*|snuggle\w*|devoted|sweetheart)\b/i,
    /\b(?:purr\w*|lap cat|head scritch\w*|scritch\w*|attention|leaning in|pets? gladly)\b/i,
    /\b(?:affection must be earned|affection on her schedule|loves? (?:being )?petted|loves? (?:all )?(?:the )?(?:love|attention))\b/i,
  ],
  playfulness: [
    /\b(?:playful|romp\w*|wrestl\w*|zoomies|goofy|silly|antics|mischievous)\b/i,
    /\b(?:chasing toys|chase\w*|toys|games|spirited|spunky|spunk|fun-loving)\b/i,
    /\b(?:playful side|play and wrestle|play and cuddle)\b/i,
  ],
  curiosity: [
    /\b(?:curious|curiosity|clever|inquisitive|intelligent|smart)\b/i,
    /\b(?:explor\w*|investigat\w*|new hides|window watching|watching birds|survey her territory)\b/i,
    /\b(?:fascinated by|wants? to know)\b/i,
  ],
  independence: [
    /\b(?:independent|particular|reserved|on her schedule|on his schedule|own pace)\b/i,
    /\b(?:doesn't demand attention|ignore you|ignores you|sometimes I like attention|sometimes I don’t)\b/i,
    /\b(?:say hi to you first|let me say hi|chooses her friends wisely|set their own pace|respect\w* (?:their|her|his) pace|on her own terms|on his own terms)\b/i,
  ],
  gentleness: [
    /\b(?:gentle|calm|easygoing|soft spoken|patient|mellow|peaceful|quiet|shy|reserved)\b/i,
    /\b(?:cozy|relax\w*|snooz\w*|low[ -]traffic|low[ -]key|slow to warm)\b/i,
    /\b(?:soft place to land|once she feels safe|once he feels safe|with patience and time)\b/i,
  ],
  adventure: [
    /\b(?:adventur\w*|outdoors?|roam\w*|outdoor crew|indoor-outdoor)\b/i,
    /\b(?:barn cat|barn kitty|mouse hunter|mouser|property protector|work(?:ing)? cat)\b/i,
    /\b(?:vertical spaces|climbing|wander through|on the job|defend your land)\b/i,
  ],
};

export const QUESTIONS: readonly Question[] = [
  {
    prompt: 'What kind of energy fits your day-to-day?',
    note: 'Think about the pace that would feel good at home.',
    answers: [
      { label: 'Mostly mellow, with plenty of cozy naps', emoji: '☕', traits: { gentleness: 2 } },
      {
        label: 'Curious and ready to investigate everything',
        emoji: '🌿',
        traits: { curiosity: 2, adventure: 1 },
      },
      {
        label: 'Playful, with regular games and zoomies',
        emoji: '🎉',
        traits: { playfulness: 2 },
      },
      {
        label: 'Independent, content to do their own thing',
        emoji: '🎧',
        traits: { independence: 2 },
      },
    ],
  },
  {
    prompt: 'How would you like your cat to warm up to you?',
    note: 'Every cat has their own social style.',
    answers: [
      {
        label: 'An affectionate buddy who seeks cuddles',
        emoji: '💌',
        traits: { affection: 2 },
      },
      {
        label: 'A friendly greeter who enjoys attention',
        emoji: '💭',
        traits: { affection: 2, playfulness: 1 },
      },
      {
        label: 'A shy sweetheart who needs a little patience',
        emoji: '🪩',
        traits: { gentleness: 2, independence: 1 },
      },
      {
        label: 'An independent friend who approaches on their terms',
        emoji: '🌙',
        traits: { independence: 2 },
      },
    ],
  },
  {
    prompt: 'What would you most enjoy doing together?',
    note: 'Choose the little moments you hope to share.',
    answers: [
      {
        label: 'Snuggling up for a quiet break',
        emoji: '🫶',
        traits: { affection: 2, gentleness: 1 },
      },
      {
        label: 'Playing games and chasing favorite toys',
        emoji: '🔎',
        traits: { playfulness: 2 },
      },
      {
        label: 'Watching the world and exploring new spaces',
        emoji: '⚡',
        traits: { curiosity: 2, adventure: 1 },
      },
      {
        label: 'Sharing a room while they relax nearby',
        emoji: '✨',
        traits: { independence: 1, gentleness: 2 },
      },
    ],
  },
  {
    prompt: 'What kind of home can you offer?',
    note: 'Some cats are specifically looking for a barn or safe outdoor working-cat home.',
    answers: [
      {
        label: 'A cozy indoor home with sunny windows',
        emoji: '🌤️',
        traits: { gentleness: 1, curiosity: 1 },
        homeType: 'indoor',
      },
      {
        label: 'An active indoor home with room to play',
        emoji: '🏕️',
        traits: { playfulness: 1, curiosity: 1 },
        homeType: 'indoor',
      },
      {
        label: 'A calm, low-traffic indoor home',
        emoji: '🏡',
        traits: { gentleness: 2, independence: 1 },
        homeType: 'indoor',
      },
      {
        label: 'A barn, stable, or suitable outdoor property',
        emoji: '🪴',
        traits: { adventure: 2, independence: 1 },
        homeType: 'barn',
      },
    ],
  },
  {
    prompt: 'How much affection would feel right?',
    note: 'There’s no wrong amount of togetherness.',
    answers: [
      {
        label: 'A lap cat who seeks pets and cuddles',
        emoji: '🤍',
        traits: { affection: 2 },
      },
      {
        label: 'A companion who likes company but not constant cuddles',
        emoji: '😹',
        traits: { affection: 1, independence: 1 },
      },
      {
        label: 'A playful pal; games are our love language',
        emoji: '🧠',
        traits: { playfulness: 2 },
      },
      {
        label: 'A gentle friend who chooses when to come close',
        emoji: '🕊️',
        traits: { independence: 1, gentleness: 1 },
      },
    ],
  },
  {
    prompt: 'What personality would be the best fit?',
    note: 'Go with the temperament you’d enjoy living with.',
    answers: [
      { label: 'A gentle, easygoing companion', emoji: '🧸', traits: { gentleness: 2 } },
      {
        label: 'A curious explorer with lots to discover',
        emoji: '🦋',
        traits: { curiosity: 2, adventure: 1 },
      },
      {
        label: 'A goofy, playful cat who keeps me laughing',
        emoji: '🍒',
        traits: { playfulness: 2 },
      },
      {
        label: 'A more reserved cat who likes their own space',
        emoji: '😎',
        traits: { independence: 2, gentleness: 1 },
      },
    ],
  },
];

export const MATCHABLE_CATS = ADOPTABLE_CATS.filter((cat) => cat.matchable);

function getProfileTraits(cat: AdoptableCat): TraitScores {
  const profile = `${getDetail(cat, 'description')} ${getDetail(cat, 'moreInfo')}`;
  const scores: TraitScores = {
    affection: 0,
    playfulness: 0,
    curiosity: 0,
    independence: 0,
    gentleness: 0,
    adventure: 0,
  };

  for (const trait of TRAITS) {
    scores[trait] = Math.min(
      5,
      PROFILE_KEYWORDS[trait].filter((keyword) => keyword.test(profile)).length,
    );
  }

  return scores;
}

export function findMatchingCat(answers: readonly (number | null)[]): AdoptableCat | null {
  if (
    answers.length !== QUESTIONS.length ||
    answers.some(
      (answer, questionIndex) =>
        answer === null ||
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= (QUESTIONS[questionIndex]?.answers.length ?? 0),
    )
  ) {
    return null;
  }

  const answerScores: TraitScores = {
    affection: 0,
    playfulness: 0,
    curiosity: 0,
    independence: 0,
    gentleness: 0,
    adventure: 0,
  };

  for (const trait of TRAITS) {
    answerScores[trait] = answers.reduce<number>((total, answerIndex, questionIndex) => {
      if (answerIndex === null) return total;
      return total + (QUESTIONS[questionIndex]?.answers[answerIndex]?.traits[trait] ?? 0);
    }, 0);
  }
  const answerMagnitude = Math.sqrt(
    TRAITS.reduce((total, trait) => total + answerScores[trait] ** 2, 0),
  );
  const prefersBarnCat =
    QUESTIONS[HOME_QUESTION_INDEX]?.answers[answers[HOME_QUESTION_INDEX] ?? 0]?.homeType === 'barn';

  let bestMatch: AdoptableCat | null = null;
  let bestScore = -1;

  for (const cat of MATCHABLE_CATS) {
    if (isBarnCat(cat) !== prefersBarnCat) continue;

    const profileScores = getProfileTraits(cat);
    const profileMagnitude = Math.sqrt(
      TRAITS.reduce((total, trait) => total + profileScores[trait] ** 2, 0),
    );
    const dotProduct = TRAITS.reduce(
      (total, trait) => total + answerScores[trait] * profileScores[trait],
      0,
    );
    const score =
      answerMagnitude && profileMagnitude ? dotProduct / (answerMagnitude * profileMagnitude) : 0;

    if (score > bestScore) {
      bestMatch = cat;
      bestScore = score;
    }
  }

  return bestMatch;
}

@Component({
  selector: 'app-root',
  imports: [RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly phase = signal<Phase>('welcome');
  protected readonly questionIndex = signal(0);
  protected readonly answers = signal<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  protected readonly questions = QUESTIONS;
  protected readonly matchableCatCount = MATCHABLE_CATS.length;
  protected readonly snapshotDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(adoptionSnapshot.scrapedAt));
  protected readonly currentQuestion = computed(() => QUESTIONS[this.questionIndex()]);
  protected readonly currentAnswer = computed(() => this.answers()[this.questionIndex()] ?? null);
  protected readonly completedCount = computed(
    () => this.answers().filter((answer) => answer !== null).length,
  );
  protected readonly progressPercent = computed(
    () => (this.completedCount() / QUESTIONS.length) * 100,
  );
  protected readonly matchingCat = computed(() => findMatchingCat(this.answers()));

  constructor(route: ActivatedRoute) {
    if (route.snapshot.queryParamMap.get('startQuiz') === 'true') {
      this.phase.set('quiz');
    }
  }

  protected catSummary(cat: AdoptableCat): string {
    return getCatSummary(cat);
  }

  protected catAge(cat: AdoptableCat): string {
    return getCatAge(cat);
  }

  protected catDescription(cat: AdoptableCat): string {
    return getCatDescription(cat);
  }

  protected catNeedsBarnHome(cat: AdoptableCat): boolean {
    return isBarnCat(cat);
  }

  protected startQuiz(): void {
    this.phase.set('quiz');
    this.questionIndex.set(0);
  }

  protected selectAnswer(answerIndex: number): void {
    this.answers.update((answers) =>
      answers.map((answer, index) => (index === this.questionIndex() ? answerIndex : answer)),
    );
  }

  protected nextQuestion(): void {
    if (this.currentAnswer() === null) return;

    if (this.questionIndex() === QUESTIONS.length - 1) {
      this.phase.set('result');
      return;
    }

    this.questionIndex.update((index) => index + 1);
  }

  protected previousQuestion(): void {
    if (this.questionIndex() === 0) {
      this.phase.set('welcome');
      return;
    }

    this.questionIndex.update((index) => index - 1);
  }

  protected restartQuiz(): void {
    this.answers.set(Array(QUESTIONS.length).fill(null));
    this.questionIndex.set(0);
    this.phase.set('welcome');
  }
}
