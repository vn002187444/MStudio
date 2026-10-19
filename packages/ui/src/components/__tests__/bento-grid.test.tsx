import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BentoCard } from '../bento-grid';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

describe('BentoCard', () => {
  it('renders with default colSpan and rowSpan', () => {
    const html = renderToStaticMarkup(<BentoCard>Test</BentoCard>);
    assert.match(html, /bento-col-1/);
    assert.match(html, /row-span-1/);
  });

  const colSpans = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
  for (const span of colSpans) {
    it(`renders correct classes for colSpan ${span}`, () => {
      const html = renderToStaticMarkup(<BentoCard colSpan={span}>Test</BentoCard>);
      assert.match(html, new RegExp(`bento-col-${span}`));
      assert.match(html, new RegExp(`lg:col-span-${span}`));
      
      // Responsive classes checking
      if (span > 6) {
        assert.match(html, /md:col-span-6/);
        assert.match(html, /bento-col-md-6/);
      } else {
        assert.match(html, new RegExp(`md:col-span-${span}`));
        assert.match(html, new RegExp(`bento-col-md-${span}`));
      }
      assert.match(html, /col-span-1/); // Default mobile span
    });
  }

  const rowSpans = [1, 2] as const;
  for (const span of rowSpans) {
    it(`renders correct classes for rowSpan ${span}`, () => {
      const html = renderToStaticMarkup(<BentoCard rowSpan={span}>Test</BentoCard>);
      assert.match(html, new RegExp(`row-span-${span}`));
    });
  }
});
