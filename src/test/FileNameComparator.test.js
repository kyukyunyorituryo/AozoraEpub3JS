// FileNameComparator.test.js
import { expect } from 'chai';
import FileNameComparator from './util/FileNameComparator.js';

describe('FileNameComparator', () => {
  let comparator;

  beforeEach(() => {
    comparator = new FileNameComparator();
  });

  it('should compare strings case-insensitively', () => {
    const result = comparator.compare('abc', 'ABC');
    expect(result).to.equal(0);
  });

  it('should compare strings with different lengths', () => {
    const result = comparator.compare('abc', 'abcd');
    expect(result).to.be.lessThan(0);
  });

  it('should compare strings with special characters', () => {
    const result = comparator.compare('abc_', 'abc/');
    expect(result).to.equal(0);
  });

  it('should compare strings with different Japanese characters', () => {
    const result1 = comparator.compare('一', '二');
    const result2 = comparator.compare('三', '一');
    expect(result1).to.be.lessThan(0);
    expect(result2).to.be.greaterThan(0);
  });

  it('should compare strings with mixed Japanese and Latin characters', () => {
    const result = comparator.compare('abc一', 'abc二');
    expect(result).to.be.lessThan(0);
  });

  it('should handle empty strings', () => {
    const result = comparator.compare('', '');
    expect(result).to.equal(0);
  });

  it('should handle empty strings vs non-empty strings', () => {
    const result = comparator.compare('', 'abc');
    expect(result).to.be.lessThan(0);
  });

  it('should compare strings with ordinal Japanese characters', () => {
    const result1 = comparator.compare('上', '前');
    const result2 = comparator.compare('中', '下');
    expect(result1).to.be.lessThan(0);
    expect(result2).to.be.lessThan(0);
  });

  it('should handle complex mixed cases', () => {
    const result = comparator.compare('abc上123', 'abc中456');
    expect(result).to.be.lessThan(0);
  });
});
