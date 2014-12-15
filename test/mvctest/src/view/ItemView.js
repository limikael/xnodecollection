var inherits = require("inherits");
var xnode = require("xnode");
var EventDispatcher = require("yaed");

function ItemView() {
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
		scope.trigger("change");
	});

	this.appendChild(this.input);
}

inherits(ItemView, xnode.Div);
EventDispatcher.init(ItemView);

ItemView.prototype.setValue = function(value) {
	this.input.value = value;
}

ItemView.prototype.getValue = function() {
	return this.input.value;
}

ItemView.prototype.setData = function(itemModel) {
	console.log("this is not really used!")
}

module.exports = ItemView;