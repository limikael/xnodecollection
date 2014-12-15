function ItemModel(v) {
	this.value = v;
}

ItemModel.prototype.getValue = function() {
	return this.value;
}

ItemModel.prototype.setValue = function(v) {
	this.value = v;
}

module.exports = ItemModel;