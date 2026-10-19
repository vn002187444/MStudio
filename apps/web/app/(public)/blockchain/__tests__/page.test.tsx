import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { metadata } from '../page';

describe('Blockchain Route Metadata', () => {
  it('has correct title and description', () => {
    assert.equal(metadata.title, 'Blockchain & Web3 | MStudio Channel');
    assert.equal(metadata.description, 'Tin tức chuyên sâu về Blockchain, Web3, tiền mã hóa, DeFi và hạ tầng phi tập trung thời gian thực.');
  });

  it('has correct robots directives', () => {
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  });
});
