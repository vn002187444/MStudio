import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { metadata } from '../page';

describe('Góc Tối Route Metadata', () => {
  it('has correct title and description', () => {
    assert.equal(metadata.title, 'Góc Tối | MStudio Channel');
    assert.equal(metadata.description, 'Hồ sơ điều tra, phóng sự góc khuất xã hội, tệ nạn, ma tuý, scandal và ký sự ăn chơi — góc nhìn chân thực, kiểm chứng đa chiều.');
  });

  it('has correct robots directives', () => {
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  });
});
