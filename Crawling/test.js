var assert = require('assert');
const Book = require('./constructor/Book');
const match = require('./scripts/match');

describe('Books', function() {
	it('title should equal to Hello World', function() {
		var book = new Book();
		book.title = 'hello world';
		assert.equal(book.title, 'hello world');
	});
});


describe('Has ISBN', function() {
	it('should have ISBN-13: in product details', function() {
		assert.equal(match.hasISBN('ISBN-13: DSDs322342'), true);
	});
});

describe('Has dimensions', function() {
	it('should have dimension in product details', function() {
		assert.equal(match.hasDimensions('Product Dimensions:'), true);
	});
});

describe('Has weight', function() {
	it('should have weight in product details', function() {
		assert.equal(match.hasWeight('Shipping Weight:'), true);
	});
});