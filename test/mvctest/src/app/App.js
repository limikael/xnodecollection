var xnode = require("xnode");
var inherits = require("inherits");

var AppModel = require("../model/AppModel");
var AppView = require("../view/AppView");
var AppController = require("../controller/AppController");

function App() {
	xnode.Div.call(this);

	this.style.position = "absolute";
	this.style.top = 0;
	this.style.left = 0;
	this.style.bottom = 0;
	this.style.right = 0;

	this.appModel = new AppModel();
	this.appView = new AppView();
	this.appController = new AppController(this.appModel, this.appView);

	this.appendChild(this.appView);
}

inherits(App, xnode.Div);

module.exports = App;