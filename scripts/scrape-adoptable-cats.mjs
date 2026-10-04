import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const baseUrl = 'https://24petconnect.com';
const listingUrl = `${baseUrl}/lodnadopt?at=CAT`;
const outputPath = fileURLToPath(new URL('../src/app/adoptable-cats.json', import.meta.url));
const pageSize = 30;

async function getDocument(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Cat-and-Kin adoption listing snapshot' },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }

  return new JSDOM(await response.text()).window.document;
}

function textContent(element) {
  if (!element) return '';

  const clone = element.cloneNode(true);
  clone.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith(' '));
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

function toCamelCase(value) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, next) => (next ? next.toUpperCase() : ''))
    .replace(/^[A-Z]/, (first) => first.toLowerCase());
}

function isPhotoUrl(url) {
  return Boolean(url) && !/no_pic/i.test(url);
}

function parseListing(document) {
  const countText = document.querySelector('#AnimalCountHeader')?.textContent ?? '';
  const total = Number(countText.match(/of\s+(\d+)/i)?.[1] ?? 0);
  const cats = [...document.querySelectorAll('.gridResult')].map((card) => {
    const description = textContent(card.querySelector('.text_Description'));
    const parsedName = description.match(/Hi I'm (.+?)(?:\s*\([^)]*\))?\.?$/i)?.[1]?.trim();
    const name =
      parsedName ??
      (/^More Cats!?$/i.test(description)
        ? 'More Cats'
        : /^Interested in a barn cat\??$/i.test(description)
          ? 'Barn Cats'
          : '');
    const image = card.querySelector('img');

    return {
      id: card.id.replace(/^Result_/, ''),
      name,
      listingDescription: description,
      listingStatus: textContent(card.querySelector('.text_MoreInfo')),
      imageUrl: image?.getAttribute('src') ? new URL(image.getAttribute('src'), baseUrl).href : '',
      imageAlt: image?.getAttribute('alt') ?? '',
    };
  });

  if (!total || !cats.length || cats.some((cat) => !cat.id || !cat.name)) {
    throw new Error(`Could not parse the cat listing page: ${countText}`);
  }

  return { total, cats };
}

function parseProfile(document, listingCat) {
  const details = Object.fromEntries(
    [...document.querySelectorAll('[class*="line_"]')]
      .map((row) => [
        toCamelCase(textContent(row.querySelector('[class^="column_"]'))),
        textContent(row.querySelector('[class^="text_"]')),
      ])
      .filter(([label, value]) => label && value),
  );
  const profileImages = [
    ...document.querySelectorAll('#ImageAndFlag img, img.smallImageHover'),
  ].flatMap((image) => {
    const src = image.getAttribute('src');
    if (!src) return [];

    const url = new URL(src, baseUrl).href;
    return isPhotoUrl(url)
      ? [{ url, alt: image.getAttribute('alt') || `Photo of ${listingCat.name}` }]
      : [];
  });
  const images = [
    ...(isPhotoUrl(listingCat.imageUrl)
      ? [{ url: listingCat.imageUrl, alt: `Photo of ${listingCat.name}` }]
      : []),
    ...profileImages,
  ].filter(
    (image, index, all) => all.findIndex((candidate) => candidate.url === image.url) === index,
  );
  if (!images.length) return null;

  const sourceUrl = `${baseUrl}/lodnadopt/Details/LODN/${listingCat.id}`;
  const links = [...document.querySelectorAll('[class*="line_"] a[href]')].map((anchor) => ({
    label: textContent(anchor.closest('[class*="line_"]')?.querySelector('[class^="column_"]')),
    text: textContent(anchor),
    url: new URL(anchor.getAttribute('href'), sourceUrl).href,
  }));
  const applicationPending = /application pending/i.test(
    `${listingCat.listingStatus} ${details.moreInfo ?? ''}`,
  );

  return {
    ...listingCat,
    sourceUrl,
    matchable: !applicationPending,
    applicationPending,
    images,
    links,
    details,
  };
}

const firstPage = parseListing(await getDocument(listingUrl));
const listings = [...firstPage.cats];

for (let index = pageSize; index < firstPage.total; index += pageSize) {
  const pageUrl = new URL(listingUrl);
  pageUrl.searchParams.set('index', String(index));
  const page = parseListing(await getDocument(pageUrl));
  listings.push(...page.cats);
}

const actualCatListings = listings.filter((cat) => !/^(?:more cats|barn cats)$/i.test(cat.name));
const cats = [];
for (let offset = 0; offset < actualCatListings.length; offset += 3) {
  const batch = actualCatListings.slice(offset, offset + 3);
  cats.push(
    ...(
      await Promise.all(
        batch.map(async (cat) => {
          const sourceUrl = `${baseUrl}/lodnadopt/Details/LODN/${cat.id}`;
          return parseProfile(await getDocument(sourceUrl), cat);
        }),
      )
    ).filter(Boolean),
  );
  if (offset + 3 < actualCatListings.length) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

const dataset = {
  source: '24Petconnect',
  sourceUrl: listingUrl,
  scrapedAt: new Date().toISOString(),
  total: cats.length,
  cats,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Saved ${cats.length} cat profiles to ${outputPath}`);
