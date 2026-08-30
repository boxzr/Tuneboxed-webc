import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCartoon, searchQuery } from './genreBackdrop.ts';

test('named prompts search as themselves', () => {
  assert.equal(searchQuery('Sunset'), 'Sunset');
  assert.equal(searchQuery('2016 Rap'), '2016 Rap');
});

test('filler at the front of a prompt is dropped', () => {
  assert.equal(searchQuery('Feels Like Stranger Things'), 'Stranger Things');
});

test('cartoons are kept, photos and generated stock are not', () => {
  assert.equal(
    isCartoon(
      'https://upload.wikimedia.org/wikipedia/commons/0/02/Hip_Hop_Guy_With_Money_Cartoon.svg',
      'File:Hip Hop Guy With Money Cartoon.svg',
    ),
    true,
  );
  assert.equal(
    isCartoon(
      'https://upload.wikimedia.org/wikipedia/commons/5/5c/Woman-Sitting-Sunset-Silhouette.svg',
      'File:Woman-Sitting-Sunset-Silhouette.svg',
    ),
    false,
  );
  assert.equal(
    isCartoon('https://images.rawpixel.com/editor_1024/sunset.jpg', 'Tropical sunset clipart'),
    false,
  );
  assert.equal(isCartoon('https://example.com/scan.pdf', 'Cartoons.pdf'), false);
});
