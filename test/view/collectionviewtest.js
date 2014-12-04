var Collection = require("../../src/Collection");
var CollectionView = require("../../src/CollectionView");
var inherits = require("inherits");
var xnode = require("xnode");

function ItemRenderer() {
	xnode.Div.call(this);

	this.style.height = "20px";
	this.style.background = "#ff0000";
	//this.style.width = "50%";
	this.innerHTML = "hello";
}

inherits(ItemRenderer, xnode.Div);

ItemRenderer.prototype.setData = function(data) {
	this.innerHTML = data;
}

function App() {
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

	this.collection = new Collection();
	this.collection.addItem("hello");
	this.collection.addItem("world");

	this.collectionView = new CollectionView();
	this.collectionView.style.position = "absolute";
	this.collectionView.style.left = "10px";
	this.collectionView.style.top = "10px";
	this.collectionView.style.width = "200px";
	this.collectionView.style.bottom = "10px";
	this.collectionView.style.border = "1px solid black";
	this.collectionView.setDataSource(this.collection);
	this.collectionView.setItemRendererClass(ItemRenderer);
	this.collectionView.style.overflow = "scroll";
	this.appendChild(this.collectionView);

	console.log("creating app...");
}

inherits(App, xnode.Div);

App.prototype.onButtonClick = function() {
	this.collection.addItem("test");
}

window.onload = function() {
	console.log("window on load, creating app..");

	document.body.appendChild(new App());
}