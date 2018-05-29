// define Book class
class Book {
	constructor (title, description, listPrice, dimension, weight, imageURLs=[], url) {
		this.title = title
		this.description = description
		this.listPrice = listPrice
		this.dimension = dimension
		this.weight = weight
		this.imageURLs = imageURLs
		this.url = url
	}
}

module.exports = Book;