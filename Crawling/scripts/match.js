function hasISBN(str) {
	if (str.match('ISBN-13:')) {
		return true;
	} else {
		return false;
	}
}

function hasDimensions(str) {
	if (str.match('Product Dimensions:')) {
		return true;
	} else {
		return false;
	}
} 

function hasWeight(str) {
	if (str.match('Shipping Weight:')) {
		return true;
	} else {
		return false;
	}
}

module.exports.hasISBN = hasISBN;
module.exports.hasDimensions = hasDimensions;
module.exports.hasWeight = hasWeight;