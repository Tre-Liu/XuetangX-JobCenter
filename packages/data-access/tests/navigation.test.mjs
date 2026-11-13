import test from 'node:test';
import assert from 'node:assert/strict';
const navigation = await import('../navigation.mjs').catch(() => ({}));
test('CMS handoff preserves the caller query and config without accepting unsafe return locations', () => {
 assert.equal(typeof navigation.safeReturnUrl, 'function');
 assert.equal(navigation.safeReturnUrl('http://localhost:5186/?view=course', 'http://localhost:5188/course.html'), 'http://localhost:5186/?view=course');
 for (const raw of ['javascript:alert(1)', 'data:text/html,hello', 'https://other.example/index.html', 'http://user:pass@localhost/index.html', 'file:///etc/passwd']) {
  assert.equal(navigation.safeReturnUrl(raw, 'http://localhost:5188/course.html'), null);
 }
 assert.equal(navigation.safeReturnUrl('http://school.example/course', 'https://school.example/cms/'), null);
});
test('offline handoff allows a sibling html file but never changes a web page into a file navigation', () => {
 assert.equal(typeof navigation.safeReturnUrl, 'function');
 assert.equal(navigation.safeReturnUrl('../ai-course/index.html?view=course', 'file:///project/platform-cms/course.html'), 'file:///project/ai-course/index.html?view=course');
 assert.equal(navigation.safeReturnUrl('file:///project/ai-course/index.html', 'https://school.example/cms/'), null);
 assert.equal(navigation.safeReturnUrl('file:///etc/passwd', 'file:///project/platform-cms/course.html'), null);
});
