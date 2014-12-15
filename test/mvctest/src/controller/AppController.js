var ItemController = require("./ItemController");
var ItemModel = require("../model/ItemModel");

function AppController(appModel, appView) {
	this.appModel = appModel;
	this.appView = appView;

	this.appView.setCollection(this.appModel.getCollection());
	this.appView.getItemCollectionView().setItemControllerClass(ItemController);

	this.appView.on("addClick", this.onAppViewAddClick, this);
}

module.exports = AppController;

AppController.prototype.onAppViewAddClick = function() {
	this.appModel.getCollection().addItem(new ItemModel("new item"));
}