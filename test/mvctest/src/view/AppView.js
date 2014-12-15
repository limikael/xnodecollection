var inherits = require("inherits");
var xnode = require("xnode");
var xnodec = require("../../../../src/index.js");
var ItemView = require("./ItemView");
var EventDispatcher = require("yaed");

function AppView() {
	xnode.Div.call(this);

	this.style.position = "absolute";
	this.style.left = "0";
	this.style.top = "0";
	this.style.right = "0";
	this.style.bottom = "0";

	var b = new xnode.Button("test");
	b.style.position = "absolute";
	b.style.left = "300px";
	b.style.top = "10px";
	this.appendChild(b);
	b.on("click", this.onButtonClick.bind(this));

	this.collectionView = new xnodec.CollectionView();
	this.collectionView.style.position = "absolute";
	this.collectionView.style.left = "10px";
	this.collectionView.style.top = "10px";
	this.collectionView.style.width = "200px";
	this.collectionView.style.bottom = "10px";
	this.collectionView.style.border = "1px solid black";
	this.collectionView.setItemRendererClass(ItemView);
	this.collectionView.style.overflow = "scroll";
	this.appendChild(this.collectionView);
}

inherits(AppView, xnode.Div);
EventDispatcher.init(AppView);

AppView.prototype.setCollection = function(collection) {
	this.collectionView.setDataSource(collection);
}

AppView.prototype.getItemCollectionView = function() {
	return this.collectionView;
}

AppView.prototype.onButtonClick = function() {
	this.trigger("addClick");
}

module.exports = AppView;