import adoptionSnapshot from './adoptable-cats.json';

export type AdoptableCat = (typeof adoptionSnapshot.cats)[number];

export const ADOPTABLE_CATS: readonly AdoptableCat[] = adoptionSnapshot.cats;

export function getDetail(cat: AdoptableCat, label: string): string {
  return Object.entries(cat.details).find(([key]) => key === label)?.[1] ?? '';
}

export function getCatSummary(cat: AdoptableCat): string {
  const profileText =
    getDetail(cat, 'moreInfo')
      .split(/Are you viewing my information on a third party site/i)[0]
      ?.trim() || getDetail(cat, 'description');
  const maxLength = 190;

  if (profileText.length <= maxLength) return profileText;

  const shortened = profileText.slice(0, maxLength);
  return `${shortened.slice(0, shortened.lastIndexOf(' '))}…`;
}

export function getCatAge(cat: AdoptableCat): string {
  const age = getDetail(cat, 'age');
  return age
    .replace(/^The shelter staff think I am about /i, '')
    .replace(/^My age is /i, '')
    .replace(/\.$/, '');
}

export function getCatDescription(cat: AdoptableCat): string {
  return getDetail(cat, 'description');
}

export function isBarnCat(cat: AdoptableCat): boolean {
  const profile = `${getDetail(cat, 'description')} ${getDetail(cat, 'moreInfo')}`;
  return /\b(?:barn cat|barn kitty|working cat|mouse hunter|mouser|property protector)\b/i.test(
    profile,
  );
}
