var ItemModel = require("./ItemModel");
var xnodec = require("../../../../src/index");

function AppModel() {
	this.collection = new xnodec.Collection();
	this.collection.addItem(new ItemModel("hello"));
	this.collection.addItem(new ItemModel("world"));
}

AppModel.prototype.getCollection = function() {
	return this.collection;
}

module.exports = AppModel;