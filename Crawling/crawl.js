var cheerio = require('cheerio');
var fs = require('fs');
var puppeteer = require('puppeteer');
const PromisePool = require('es6-promise-pool');
const Book = require('./constructor/Book');
const match = require('./scripts/match');

let browser;

// How may urls we want to process in parallel.
const CONCURRENCY = 10;

// Product Category
const productCategory = 'Books';

// product page urls to process
const URLS = [];

// visitedURLs hold ISBN-13 codes for each book
// using ISBN-13 codes as a unique identifier for books.
const visitedURLs = [];

let book = {};
let products = [];
book.products = products;

// This function returns promise that gets resolved once Puppeteer
// opens url, evaluates content and closes it.
const crawlUrl = async (url) => {
	var page = await browser.newPage();
	console.log(`Opening ${url}`);
    await page.goto(url);

	try {

		let product = new Book();
		let title, details, description, listPrice, dimension, weight, imageURLs, isbn;
		let visited = false;
		
	    
		// Evaluate code in a context of page and get data.
		// Parse html with cheerio
	    let content = await page.content();
		let $ = cheerio.load(content);


		// product title
		title = $('#productTitle').text();
		product.title = title;


		//  product price
		listPrice = $('.offer-price').first().text();
		product.listPrice = listPrice;


		// product description
		description = await page.evaluate(() => {

			let iframe = document.getElementById("bookDesc_iframe");

			// grab iframe's document object
			let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
			let iframeP = iframeDoc.getElementById("iframeContent");

		    return iframeP.textContent.trim();
		});

		product.description = description;


		// product details - ISBN, Dimensions, Weight 
		product_details = $('#productDetailsTable > tbody > tr > td > div > ul > li');
		product_details.each(function(i, li) {
			details = $(li).text().trim();
			details = details.replace(/\r?\n|\r/g, ' ');

			if (match.hasISBN(details)) {
				isbn = details.replace('ISBN-13:', '').trim();

				// Different URLs can lead to same product
				// Use ISBN-10 to check if already visited
				if (visitedURLs.includes(isbn)) {
					visited = true;
				} else {
					visitedURLs.push(isbn);
				}
			}

			if (match.hasDimensions(details)) {
				dimension = details.replace('Product Dimensions:', '').trim();
				product.dimension = dimension;
			}

			if (match.hasWeight(details)) {
				weight = details.replace('Shipping Weight:', '').replace('(View shipping rates and policies)', '').trim();
				product.weight = weight;
			}
		});


		//  image URLs
		imageURLs = $('#imgBlkFront').attr('data-a-dynamic-image');
		imageURLs = JSON.parse(imageURLs);
		imageURLs = Object.keys(imageURLs);
		product.imageURLs = imageURLs;


		// product URL
		product.url = url;

		// if visited flat is set to false add product 
	    if (!visited) {book.products.push(product);}
	    
	    console.log(`Closing ${url}`);
	    await page.close();

	} catch(err) {

		console.log(err);
		await page.close();
	}

};


// Every time it's called takes one url from URLS constant and returns 
// crawlUrl(url) promise. When URLS gets empty returns null. Which finishes the pool
const promiseProducer = () => {

    const url = URLS.pop();
    return url ? crawlUrl(url) : null;

};


// Function to create promise pool and gather results and write to file
const createPool = async () => {

	// Runs thru all the urls in a pool of given concurrency.
    const pool = new PromisePool(promiseProducer, CONCURRENCY);
    await pool.start();

    // Write to JSON file
	var json = JSON.stringify(book, null, 4);
    fs.writeFile('books.json', json, function(err){
      console.log('Check file directory for output');
  	})

  	await browser.close();

}

// Get Products from subcategory page
async function productPages(subURL) {

	var pageURL;
	var page = await browser.newPage();
	await page.goto(subURL);

	// Evaluate code in a context of page and get your data.
	let content = await page.content();
	var $ = cheerio.load(content);

	var link = $('#mainResults > ul li');

	// Get first 10 product results from #mainResults list
	link.each(function(i, li) {
		if (i >= 10) { return false; }

		// look for product title in h2 and get parent href attribute
		var a = $(li).find('h2').parent().attr('href');

		if (a.match('https://www.amazon.com')) {
			pageURL = a;
		} else {
			pageURL = 'https://www.amazon.com' + a;
	    }

	    // Add product page urls to URLS
	    URLS.push(pageURL);

	});

	// TO DO:
	// keep following next page

	createPool();
	await page.close();

}


// Once at Category Page, get all subcategory URLs
async function getSubCategory(categoryURL) {

	var page = await browser.newPage();
	await page.goto(categoryURL);

	let content = await page.content();
	var $ = cheerio.load(content);

	//  For purposes of project, only grabbing first category
	// otherwise grab all subcategory urls
	var subCategory = $('#leftNav > ul:nth-child(6) > ul > div > li:nth-child(1)');
	subCategory.each(function(i, li) {
		var a = $(li).find('a').attr('href');
		var subURL = 'https://www.amazon.com' + a;

		productPages(subURL);
	});

	await page.close();

}


// Start at home page and get catgory URL
async function start(product_category) {

	// Launce Puppeteer and new page
	browser = await puppeteer.launch({headless: true});
	var page = await browser.newPage();
	await page.goto('https://www.amazon.com');

	let content = await page.content();
	var $ = cheerio.load(content);
	
	var categoryURL;
	var categories = $('option');
	categories.each(function(i, option) {

		var category = $(option).text();
		category = category.replace(/\r?\n|\r/g, ' ');

		// Only going to Book category for purposes of this implementation, 
		// otherwise go to all categories
		if (category.match(product_category)) {
			var value = $(option).attr('value');
			categoryURL = 'https://www.amazon.com/s/ref=nb_sb_noss?url=' + value + '&field-keywords=';
		}

	});

	getSubCategory(categoryURL);
	await page.close();

}


// Pass in product category and start on home page.
start(productCategory);










