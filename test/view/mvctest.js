var Collection = require("../../src/Collection");
var CollectionView = require("../../src/CollectionView");
var inherits = require("inherits");
var xnode = require("xnode");
var EventDispatcher = require("yaed");

function ItemRenderer() {
	xnode.Div.call(this);

	this.style.position = "relative";
	this.style.height = "40px";
	this.style.background = "#ff0000";
	this.style.borderBottom = "1px solid black";

	this.input = new xnode.Input();
	this.input.style.position = "absolute";
	this.input.style.left = "10px";
	this.input.style.top = "10px";

	var scope = this;

	this.input.on("change", function() {
		scope.trigger("hello");

		console.log("change: " + scope.input.value + " m: " + scope.itemModel);
		if (scope.itemModel)
			scope.itemModel.setValue(scope.input.value);
	});

	this.appendChild(this.input);
	//	this.innerHTML = "hello";
}

inherits(ItemRenderer, xnode.Div);
EventDispatcher.init(ItemRenderer);

ItemRenderer.prototype.setData = function(itemModel) {
	this.itemModel = itemModel;
	console.log("setting data");
	this.input.value = itemModel.getValue();
}

function ItemModel(v) {
	this.value = v;
}

ItemModel.prototype.getValue = function() {
	return this.value;
}

ItemModel.prototype.setValue = function(v) {
	this.value = v;
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
	this.collection.addItem(new ItemModel("hello"));
	this.collection.addItem(new ItemModel("world"));

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
	this.collection.addItem(new ItemModel("test"));
}

window.onload = function() {
	console.log("window on load, creating app..");

	document.body.appendChild(new App());
}