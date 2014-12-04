var EventDispatcher = require("yaed");
var xnode = require("xnode");
var inherits = require("inherits");

/**
 * CollectionView.
 * @class CollectionView
 */
function CollectionView() {
	xnode.Div.call(this);

	this.itemRenderers = [];
	this.itemRendererClass = null;
	this.dataSource = null;
}

inherits(CollectionView, xnode.Div);

/**
 * Set item renderer class.
 * @method setItemRendererClass
 */
CollectionView.prototype.setItemRendererClass = function(value) {
	this.itemRendererClass = value;
	this.refreshAllItemRenderers();
}

/**
 * Set data source.
 * @method setDataSource
 */
CollectionView.prototype.setDataSource = function(value) {
	if (this.dataSource) {
		this.dataSource.off("change", this.onDataSourceChange, this);
	}

	this.dataSource = value;

	if (this.dataSource) {
		this.dataSource.on("change", this.onDataSourceChange, this);
	}

	this.refreshAllItemRenderers();
}

/**
 * Something in the data source was changed.
 * @method onDataSourceChange
 * @private
 */
CollectionView.prototype.onDataSourceChange = function() {
	this.refreshAllItemRenderers();
}

/**
 * Refresh all item renderers.
 * @method refreshAllItemRenderers
 * @private
 */
CollectionView.prototype.refreshAllItemRenderers = function() {
	for (var i = 0; i < this.itemRenderers.length; i++)
		this.removeChild(this.itemRenderers[i]);

	this.itemRenderers = [];

	//console.log("refresh..");

	if (!this.dataSource)
		return;

	if (!this.itemRendererClass)
		return;

	for (var i = 0; i < this.dataSource.getLength(); i++) {
		var data = this.dataSource.getItemAt(i);
		var renderer = this.createItemRendererForData(data);
		renderer.setData(data);

		this.itemRenderers.push(renderer);
		this.appendChild(renderer);
	}
}

/**
 * Create item renderer suitable for rendering specified data.
 * @method createItemRendererForData
 * @private
 */
CollectionView.prototype.createItemRendererForData = function(data) {
	return new this.itemRendererClass();
}

module.exports = CollectionView;