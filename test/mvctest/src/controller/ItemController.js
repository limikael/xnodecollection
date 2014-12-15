function ItemController(itemView) {
	this.itemView = itemView;
	this.itemView.on("change", this.onItemViewChange, this);

	console.log("item controller created...");
}

ItemController.prototype.setData = function(itemModel) {
	if (this.itemModel) {
		
	}

	this.itemModel = itemModel;

	if (this.itemModel) {
		this.itemView.setValue(this.itemModel.getValue());
	}
}

ItemController.prototype.onItemViewChange = function() {
	this.itemModel.setValue(this.itemView.getValue());
}

module.exports = ItemController;