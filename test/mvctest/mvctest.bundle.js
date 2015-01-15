(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
(function() {
	/**
	 * The basic xnode class.
	 * It sets the underlying node element by calling
	 * document.createElement
	 */
	function XNode(type, content) {
		this.node = document.createElement(type);

		if (content !== undefined)
			this.node.innerHTML = content;
	}

	/**
	 * This method creates an extended class using
	 * the XNode class defined above.
	 */
	function createExtendedXNodeElement(elementType, content) {
		var f = function(content) {
			XNode.call(this, elementType, content);
		};

		f.prototype = Object.create(XNode.prototype);
		f.prototype.constructor = f;

		return f;
	}

	/**
	 * Create a read only property that returns the
	 * value of the corresponding property of the
	 * underlying node object.
	 */
	function createXNodeReadOnlyProperty(propertyName) {
		Object.defineProperty(XNode.prototype, propertyName, {
			get: function() {
				return this.node[propertyName];
			}
		});
	}

	/**
	 * Create a read write property that operates on
	 * the corresponding property of the underlying
	 * node object.
	 */
	function createXNodeReadWriteProperty(propertyName) {
		Object.defineProperty(XNode.prototype, propertyName, {
			get: function() {
				return this.node[propertyName];
			},

			set: function(value) {
				this.node[propertyName] = value;
			}
		});
	}

	/**
	 * Create a method that routes the call through, down
	 * to the same method on the underlying node object.
	 */
	function createXNodeMethod(methodName) {
		XNode.prototype[methodName] = function() {
			return this.node[methodName].apply(this.node, arguments);
		}
	}

	/**
	 * Modify the Node.property function, so that it accepts
	 * XNode objects. All XNode objects will be changed to
	 * the underlying node objects, and the corresponding
	 * method will be called.
	 */
	function createNodeToXNodeMethodWrapper(methodName) {
		var originalFunction = Node.prototype[methodName];

		Node.prototype[methodName] = function() {
			for (var a in arguments) {
				if (arguments[a] instanceof XNode)
					arguments[a] = arguments[a].node;
			}

			return originalFunction.apply(this, arguments);
		}
	}

	/**
	 * Set up read only properties.
	 */
	createXNodeReadOnlyProperty("style");

	/**
	 * Set up read/write properties.
	 */
	createXNodeReadWriteProperty("innerHTML");
	createXNodeReadWriteProperty("href");
	createXNodeReadWriteProperty("id");
	createXNodeReadWriteProperty("value");
	createXNodeReadWriteProperty("type");

	/**
	 * Set up methods to be routed to the underlying node object.
	 */
	createXNodeMethod("appendChild");
	createXNodeMethod("removeChild");
	createXNodeMethod("addEventListener");
	createXNodeMethod("removeEventListener");

	/**
	 * Set up methods on Node.property.
	 */
	createNodeToXNodeMethodWrapper("appendChild");
	createNodeToXNodeMethodWrapper("removeChild");

	/**
	 * Create event listener aliases.
	 */
	XNode.prototype.on = XNode.prototype.addEventListener;
	XNode.prototype.off = XNode.prototype.removeEventListener;

	/**
	 * Work both as a npm module and standalone.
	 */
	var target;

	if (typeof module !== "undefined" && module.exports) {
		target = {};
		module.exports = target;
	} else {
		xnode = {};
		target = xnode;
	}

	/**
	 * Create extended classes.
	 */
	target.Div = createExtendedXNodeElement("div");
	target.Button = createExtendedXNodeElement("button");
	target.Ul = createExtendedXNodeElement("ul");
	target.Li = createExtendedXNodeElement("li");
	target.A = createExtendedXNodeElement("a");
	target.Option = createExtendedXNodeElement("option");
	target.Select = createExtendedXNodeElement("select");
	target.Input = createExtendedXNodeElement("input");
})();
},{}],3:[function(require,module,exports){
/**
 * AS3/jquery style event dispatcher. Slightly modified. The
 * jquery style on/off/trigger style of adding listeners is
 * currently the preferred one.
 *
 * The on method for adding listeners takes an extra parameter which is the
 * scope in which listeners should be called. So this:
 *
 *     object.on("event", listener, this);
 *
 * Has the same function when adding events as:
 *
 *     object.on("event", listener.bind(this));
 *
 * However, the difference is that if we use the second method it
 * will not be possible to remove the listeners later, unless
 * the closure created by bind is stored somewhere. If the
 * first method is used, we can remove the listener with:
 *
 *     object.off("event", listener, this);
 *
 * @class EventDispatcher
 */
function EventDispatcher() {
	this.listenerMap = {};
}

/**
 * Add event listener.
 * @method addEventListener
 */
EventDispatcher.prototype.addEventListener = function(eventType, listener, scope) {
	if (!this.listenerMap)
		this.listenerMap = {};

	if (!eventType)
		throw new Error("Event type required for event dispatcher");

	if (!listener)
		throw new Error("Listener required for event dispatcher");

	this.removeEventListener(eventType, listener, scope);

	if (!this.listenerMap.hasOwnProperty(eventType))
		this.listenerMap[eventType] = [];

	this.listenerMap[eventType].push({
		listener: listener,
		scope: scope
	});
}

/**
 * Remove event listener.
 * @method removeEventListener
 */
EventDispatcher.prototype.removeEventListener = function(eventType, listener, scope) {
	if (!this.listenerMap)
		this.listenerMap = {};

	if (!this.listenerMap.hasOwnProperty(eventType))
		return;

	var listeners = this.listenerMap[eventType];

	for (var i = 0; i < listeners.length; i++) {
		var listenerObj = listeners[i];

		if (listener == listenerObj.listener && scope == listenerObj.scope) {
			listeners.splice(i, 1);
			i--;
		}
	}

	if (!listeners.length)
		delete this.listenerMap[eventType];
}

/**
 * Dispatch event.
 * @method dispatchEvent
 */
EventDispatcher.prototype.dispatchEvent = function(event /* ... */ ) {
	if (!this.listenerMap)
		this.listenerMap = {};

	var eventType;
	var listenerParams;

	if (typeof event == "string") {
		eventType = event;

		if (arguments.length > 1)
			listenerParams = Array.prototype.slice.call(arguments, 1);

		else listenerParams = [{
			type: eventType,
			target: this
		}];
	} else {
		eventType = event.type;
		event.target = this;
		listenerParams = [event];
	}

	if (!this.listenerMap.hasOwnProperty(eventType))
		return;

	for (var i in this.listenerMap[eventType]) {
		var listenerObj = this.listenerMap[eventType][i];
		listenerObj.listener.apply(listenerObj.scope, listenerParams);
	}
}

/**
 * Jquery style alias for addEventListener
 * @method on
 */
EventDispatcher.prototype.on = EventDispatcher.prototype.addEventListener;

/**
 * Jquery style alias for removeEventListener
 * @method off
 */
EventDispatcher.prototype.off = EventDispatcher.prototype.removeEventListener;

/**
 * Jquery style alias for dispatchEvent
 * @method trigger
 */
EventDispatcher.prototype.trigger = EventDispatcher.prototype.dispatchEvent;

/**
 * Make something an event dispatcher. Can be used for multiple inheritance.
 * @method init
 * @static
 */
EventDispatcher.init = function(cls) {
	cls.prototype.addEventListener = EventDispatcher.prototype.addEventListener;
	cls.prototype.removeEventListener = EventDispatcher.prototype.removeEventListener;
	cls.prototype.dispatchEvent = EventDispatcher.prototype.dispatchEvent;
	cls.prototype.on = EventDispatcher.prototype.on;
	cls.prototype.off = EventDispatcher.prototype.off;
	cls.prototype.trigger = EventDispatcher.prototype.trigger;
}

if (typeof module !== 'undefined') {
	module.exports = EventDispatcher;
}
},{}],4:[function(require,module,exports){
var inherits = require("inherits");
var EventDispatcher = require("yaed");

/**
 * Collection.
 * @class Collection
 */
function Collection() {
	this.items = [];
}

inherits(Collection, EventDispatcher);

/**
 * Add item at end.
 * @method addItem
 */
Collection.prototype.addItem = function(item) {
	this.items.push(item);

	this.triggerChange("add", item, this.items.length - 1);
}

/**
 * Add item at index.
 * @method addItem
 */
Collection.prototype.addItemAt = function(index, item) {
	if (index < 0)
		index = 0;

	if (index > this.items.length)
		index = this.items.length;

	var after = this.items.splice(index);
	this.items.push(item);
	this.items = this.items.concat(after);

	this.triggerChange("add", item, index);
}

/**
 * Get length.
 * @method getLength
 */
Collection.prototype.getLength = function() {
	return this.items.length;
}

/**
 * Get item at index.
 * @method getItemAt
 */
Collection.prototype.getItemAt = function(index) {
	return this.items[index];
}

/**
 * Find item index.
 * @method getItemIndex
 */
Collection.prototype.getItemIndex = function(item) {
	return this.items.indexOf(item);
}

/**
 * Remove item at.
 * @method removeItemAt
 */
Collection.prototype.removeItemAt = function(index) {
	if (index < 0 || index >= this.items.length)
		return;

	var item = this.getItemAt(index);

	this.items.splice(index, 1);
	this.triggerChange("remove", item, index);
}

/**
 * Remove item.
 * @method removeItem
 */
Collection.prototype.removeItem = function(item) {
	var index = this.getItemIndex(item);

	this.removeItemAt(index);
}

/**
 * Trigger change event.
 * @method triggerChange
 * @private
 */
Collection.prototype.triggerChange = function(eventKind, item, index) {
	this.trigger({
		type: eventKind,
		item: item,
		index: index
	});

	this.trigger({
		type: "change",
		kind: eventKind,
		item: item,
		index: index
	});
}

module.exports = Collection;
},{"inherits":1,"yaed":3}],5:[function(require,module,exports){
var EventDispatcher = require("yaed");
var xnode = require("xnode");
var inherits = require("inherits");
var CollectionViewManager=require("./CollectionViewManager");

/**
 * CollectionView.
 * @class CollectionView
 */
function CollectionView() {
	xnode.Div.call(this);

	this.manager=new CollectionViewManager(this);
}

inherits(CollectionView, xnode.Div);

/**
 * Set item renderer class.
 * @method setItemRendererClass
 */
CollectionView.prototype.setItemRendererClass = function(value) {
	this.manager.setItemRendererClass(value);
}

/**
 * Set item renderer factory.
 * @method setItemRendererFactory
 */
CollectionView.prototype.setItemRendererFactory = function(value) {
	this.manager.setItemRendererFactory(value);
}

/**
 * Set item controller class.
 * @method setItemRendererClass
 */
CollectionView.prototype.setItemControllerClass = function(value) {
	this.manager.setItemControllerClass(value);
}

/**
 * Set item controller factory.
 * @method setItemRendererFactory
 */
CollectionView.prototype.setItemControllerFactory = function(value) {
	this.manager.setItemControllerFactory(value);
}

/**
 * Set data source.
 * @method setDataSource
 */
CollectionView.prototype.setDataSource = function(value) {
	this.manager.setDataSource(value);
}

module.exports = CollectionView;
},{"./CollectionViewManager":6,"inherits":1,"xnode":2,"yaed":3}],6:[function(require,module,exports){
var EventDispatcher = require("yaed");
var xnode = require("xnode");
var inherits = require("inherits");
var EventDispatcher = require("yaed");

/**
 * CollectionViewManager.
 * @class CollectionViewManager
 */
function CollectionViewManager(target) {
	this.itemRenderers = [];
	this.itemRendererClass = null;
	this.itemRendererFactory = null;
	this.itemControllerClass = null;
	this.itemControllerFactory = null;
	this.dataSource = null;
	this.target = null;

	this.setTarget(target);
}

inherits(CollectionViewManager, EventDispatcher);

/**
 * Set target.
 * @method setTarget
 */
CollectionViewManager.prototype.setTarget = function(value) {
	this.removeAllItemRenderers();
	this.target = value;
	this.removeAllItemRenderers();
}

/**
 * Set item renderer class.
 * @method setItemRendererClass
 */
CollectionViewManager.prototype.setItemRendererClass = function(value) {
	if (value && typeof value != "function")
		throw new Error("The item renderer class should be a function");

	this.itemRendererClass = value;
	this.refreshAllItemRenderers();
}

/**
 * Set item renderer factory.
 * @method setItemRendererFactory
 */
CollectionViewManager.prototype.setItemRendererFactory = function(value) {
	if (value && typeof value != "function")
		throw new Error("The item renderer factory should be a function");

	this.itemRendererFactory = value;
	this.refreshAllItemRenderers();
}

/**
 * Set item controller class.
 * @method setItemRendererClass
 */
CollectionViewManager.prototype.setItemControllerClass = function(value) {
	if (value && typeof value != "function")
		throw new Error("The item renderer class should be a function");

	this.itemControllerClass = value;
	this.refreshAllItemRenderers();
}

/**
 * Set item controller factory.
 * @method setItemRendererFactory
 */
CollectionViewManager.prototype.setItemControllerFactory = function(value) {
	if (value && typeof value != "function")
		throw new Error("The item renderer factory should be a function");

	this.itemControllerFactory = value;
	this.refreshAllItemRenderers();
}

/**
 * Set data source.
 * @method setDataSource
 */
CollectionViewManager.prototype.setDataSource = function(value) {
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
CollectionViewManager.prototype.onDataSourceChange = function() {
	this.refreshAllItemRenderers();
}

/**
 * Remove all item renderers.
 * @method removeAllItemRenderers
 * @private
 */
CollectionViewManager.prototype.removeAllItemRenderers = function() {
	for (var i = 0; i < this.itemRenderers.length; i++) {
		if (this.itemRenderers[i].__controller)
			this.itemRenderers[i].__controller.setData(null);

		else
			this.itemRenderers[i].setData(null);

		this.target.removeChild(this.itemRenderers[i]);
	}

	this.itemRenderers = [];
}

/**
 * Refresh all item renderers.
 * @method refreshAllItemRenderers
 * @private
 */
CollectionViewManager.prototype.refreshAllItemRenderers = function() {
	this.removeAllItemRenderers();

	if (!this.dataSource)
		return;

	if (!this.itemRendererClass && !this.itemRendererFactory)
		return;

	if (!this.target)
		return;

	for (var i = 0; i < this.dataSource.getLength(); i++) {
		var data = this.dataSource.getItemAt(i);
		var renderer = this.createItemRenderer();

		if (this.itemControllerClass || this.itemControllerFactory) {
			renderer.__controller = this.createItemController(renderer);
			renderer.__controller.setData(data);
		} else {
			renderer.setData(data);
		}

		this.itemRenderers.push(renderer);
		this.target.appendChild(renderer);
	}

	this.trigger("postUpdate");
}

/**
 * Create item renderer.
 * @method createItemRenderer
 * @private
 */
CollectionViewManager.prototype.createItemRenderer = function() {
	if (this.itemRendererFactory)
		return this.itemRendererFactory();

	if (this.itemRendererClass)
		return new this.itemRendererClass();

	throw new Error("Can't create item renderer!");
}

/**
 * Create item controller.
 * @method createItemController
 * @private
 */
CollectionViewManager.prototype.createItemController = function(renderer) {
	if (this.itemControllerFactory)
		return this.itemControllerFactory(renderer);

	if (this.itemControllerClass)
		return new this.itemControllerClass(renderer);

	throw new Error("Can't create item controller!");
}

module.exports = CollectionViewManager;
},{"inherits":1,"xnode":2,"yaed":3}],7:[function(require,module,exports){
module.exports = {
	Collection: require("./Collection"),
	CollectionView: require("./CollectionView"),
	CollectionViewManager: require("./CollectionViewManager")
};
},{"./Collection":4,"./CollectionView":5,"./CollectionViewManager":6}],8:[function(require,module,exports){
var App = require("./src/app/App.js");

window.onload = function() {
	document.body.appendChild(new App());
}
},{"./src/app/App.js":9}],9:[function(require,module,exports){
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
},{"../controller/AppController":10,"../model/AppModel":12,"../view/AppView":14,"inherits":1,"xnode":2}],10:[function(require,module,exports){
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
},{"../model/ItemModel":13,"./ItemController":11}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{"../../../../src/index":7,"./ItemModel":13}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{"../../../../src/index.js":7,"./ItemView":15,"inherits":1,"xnode":2,"yaed":3}],15:[function(require,module,exports){
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
},{"inherits":1,"xnode":2,"yaed":3}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94bm9kZS9zcmMveG5vZGUuanMiLCJub2RlX21vZHVsZXMveWFlZC9zcmMvRXZlbnREaXNwYXRjaGVyLmpzIiwic3JjL0NvbGxlY3Rpb24uanMiLCJzcmMvQ29sbGVjdGlvblZpZXcuanMiLCJzcmMvQ29sbGVjdGlvblZpZXdNYW5hZ2VyLmpzIiwic3JjL2luZGV4LmpzIiwidGVzdC9tdmN0ZXN0L212Y3Rlc3QuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL2FwcC9BcHAuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL2NvbnRyb2xsZXIvQXBwQ29udHJvbGxlci5qcyIsInRlc3QvbXZjdGVzdC9zcmMvY29udHJvbGxlci9JdGVtQ29udHJvbGxlci5qcyIsInRlc3QvbXZjdGVzdC9zcmMvbW9kZWwvQXBwTW9kZWwuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL21vZGVsL0l0ZW1Nb2RlbC5qcyIsInRlc3QvbXZjdGVzdC9zcmMvdmlldy9BcHBWaWV3LmpzIiwidGVzdC9tdmN0ZXN0L3NyYy92aWV3L0l0ZW1WaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIoZnVuY3Rpb24oKSB7XG5cdC8qKlxuXHQgKiBUaGUgYmFzaWMgeG5vZGUgY2xhc3MuXG5cdCAqIEl0IHNldHMgdGhlIHVuZGVybHlpbmcgbm9kZSBlbGVtZW50IGJ5IGNhbGxpbmdcblx0ICogZG9jdW1lbnQuY3JlYXRlRWxlbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gWE5vZGUodHlwZSwgY29udGVudCkge1xuXHRcdHRoaXMubm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG5cblx0XHRpZiAoY29udGVudCAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0dGhpcy5ub2RlLmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cdH1cblxuXHQvKipcblx0ICogVGhpcyBtZXRob2QgY3JlYXRlcyBhbiBleHRlbmRlZCBjbGFzcyB1c2luZ1xuXHQgKiB0aGUgWE5vZGUgY2xhc3MgZGVmaW5lZCBhYm92ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KGVsZW1lbnRUeXBlLCBjb250ZW50KSB7XG5cdFx0dmFyIGYgPSBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0XHRYTm9kZS5jYWxsKHRoaXMsIGVsZW1lbnRUeXBlLCBjb250ZW50KTtcblx0XHR9O1xuXG5cdFx0Zi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFhOb2RlLnByb3RvdHlwZSk7XG5cdFx0Zi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBmO1xuXG5cdFx0cmV0dXJuIGY7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmVhZCBvbmx5IHByb3BlcnR5IHRoYXQgcmV0dXJucyB0aGVcblx0ICogdmFsdWUgb2YgdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgb2YgdGhlXG5cdCAqIHVuZGVybHlpbmcgbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVYTm9kZVJlYWRPbmx5UHJvcGVydHkocHJvcGVydHlOYW1lKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFhOb2RlLnByb3RvdHlwZSwgcHJvcGVydHlOYW1lLCB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5ub2RlW3Byb3BlcnR5TmFtZV07XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmVhZCB3cml0ZSBwcm9wZXJ0eSB0aGF0IG9wZXJhdGVzIG9uXG5cdCAqIHRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5IG9mIHRoZSB1bmRlcmx5aW5nXG5cdCAqIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoWE5vZGUucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIHtcblx0XHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm5vZGVbcHJvcGVydHlOYW1lXTtcblx0XHRcdH0sXG5cblx0XHRcdHNldDogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0dGhpcy5ub2RlW3Byb3BlcnR5TmFtZV0gPSB2YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSBtZXRob2QgdGhhdCByb3V0ZXMgdGhlIGNhbGwgdGhyb3VnaCwgZG93blxuXHQgKiB0byB0aGUgc2FtZSBtZXRob2Qgb24gdGhlIHVuZGVybHlpbmcgbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVYTm9kZU1ldGhvZChtZXRob2ROYW1lKSB7XG5cdFx0WE5vZGUucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5ub2RlW21ldGhvZE5hbWVdLmFwcGx5KHRoaXMubm9kZSwgYXJndW1lbnRzKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogTW9kaWZ5IHRoZSBOb2RlLnByb3BlcnR5IGZ1bmN0aW9uLCBzbyB0aGF0IGl0IGFjY2VwdHNcblx0ICogWE5vZGUgb2JqZWN0cy4gQWxsIFhOb2RlIG9iamVjdHMgd2lsbCBiZSBjaGFuZ2VkIHRvXG5cdCAqIHRoZSB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0cywgYW5kIHRoZSBjb3JyZXNwb25kaW5nXG5cdCAqIG1ldGhvZCB3aWxsIGJlIGNhbGxlZC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZU5vZGVUb1hOb2RlTWV0aG9kV3JhcHBlcihtZXRob2ROYW1lKSB7XG5cdFx0dmFyIG9yaWdpbmFsRnVuY3Rpb24gPSBOb2RlLnByb3RvdHlwZVttZXRob2ROYW1lXTtcblxuXHRcdE5vZGUucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRmb3IgKHZhciBhIGluIGFyZ3VtZW50cykge1xuXHRcdFx0XHRpZiAoYXJndW1lbnRzW2FdIGluc3RhbmNlb2YgWE5vZGUpXG5cdFx0XHRcdFx0YXJndW1lbnRzW2FdID0gYXJndW1lbnRzW2FdLm5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBvcmlnaW5hbEZ1bmN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFNldCB1cCByZWFkIG9ubHkgcHJvcGVydGllcy5cblx0ICovXG5cdGNyZWF0ZVhOb2RlUmVhZE9ubHlQcm9wZXJ0eShcInN0eWxlXCIpO1xuXG5cdC8qKlxuXHQgKiBTZXQgdXAgcmVhZC93cml0ZSBwcm9wZXJ0aWVzLlxuXHQgKi9cblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcImlubmVySFRNTFwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcImhyZWZcIik7XG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJpZFwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcInZhbHVlXCIpO1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwidHlwZVwiKTtcblxuXHQvKipcblx0ICogU2V0IHVwIG1ldGhvZHMgdG8gYmUgcm91dGVkIHRvIHRoZSB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJhcHBlbmRDaGlsZFwiKTtcblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJyZW1vdmVDaGlsZFwiKTtcblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJhZGRFdmVudExpc3RlbmVyXCIpO1xuXHRjcmVhdGVYTm9kZU1ldGhvZChcInJlbW92ZUV2ZW50TGlzdGVuZXJcIik7XG5cblx0LyoqXG5cdCAqIFNldCB1cCBtZXRob2RzIG9uIE5vZGUucHJvcGVydHkuXG5cdCAqL1xuXHRjcmVhdGVOb2RlVG9YTm9kZU1ldGhvZFdyYXBwZXIoXCJhcHBlbmRDaGlsZFwiKTtcblx0Y3JlYXRlTm9kZVRvWE5vZGVNZXRob2RXcmFwcGVyKFwicmVtb3ZlQ2hpbGRcIik7XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBldmVudCBsaXN0ZW5lciBhbGlhc2VzLlxuXHQgKi9cblx0WE5vZGUucHJvdG90eXBlLm9uID0gWE5vZGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdFhOb2RlLnByb3RvdHlwZS5vZmYgPSBYTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblxuXHQvKipcblx0ICogV29yayBib3RoIGFzIGEgbnBtIG1vZHVsZSBhbmQgc3RhbmRhbG9uZS5cblx0ICovXG5cdHZhciB0YXJnZXQ7XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IHRhcmdldDtcblx0fSBlbHNlIHtcblx0XHR4bm9kZSA9IHt9O1xuXHRcdHRhcmdldCA9IHhub2RlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBleHRlbmRlZCBjbGFzc2VzLlxuXHQgKi9cblx0dGFyZ2V0LkRpdiA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwiZGl2XCIpO1xuXHR0YXJnZXQuQnV0dG9uID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJidXR0b25cIik7XG5cdHRhcmdldC5VbCA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwidWxcIik7XG5cdHRhcmdldC5MaSA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwibGlcIik7XG5cdHRhcmdldC5BID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJhXCIpO1xuXHR0YXJnZXQuT3B0aW9uID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJvcHRpb25cIik7XG5cdHRhcmdldC5TZWxlY3QgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcInNlbGVjdFwiKTtcblx0dGFyZ2V0LklucHV0ID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJpbnB1dFwiKTtcbn0pKCk7IiwiLyoqXG4gKiBBUzMvanF1ZXJ5IHN0eWxlIGV2ZW50IGRpc3BhdGNoZXIuIFNsaWdodGx5IG1vZGlmaWVkLiBUaGVcbiAqIGpxdWVyeSBzdHlsZSBvbi9vZmYvdHJpZ2dlciBzdHlsZSBvZiBhZGRpbmcgbGlzdGVuZXJzIGlzXG4gKiBjdXJyZW50bHkgdGhlIHByZWZlcnJlZCBvbmUuXG4gKlxuICogVGhlIG9uIG1ldGhvZCBmb3IgYWRkaW5nIGxpc3RlbmVycyB0YWtlcyBhbiBleHRyYSBwYXJhbWV0ZXIgd2hpY2ggaXMgdGhlXG4gKiBzY29wZSBpbiB3aGljaCBsaXN0ZW5lcnMgc2hvdWxkIGJlIGNhbGxlZC4gU28gdGhpczpcbiAqXG4gKiAgICAgb2JqZWN0Lm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIsIHRoaXMpO1xuICpcbiAqIEhhcyB0aGUgc2FtZSBmdW5jdGlvbiB3aGVuIGFkZGluZyBldmVudHMgYXM6XG4gKlxuICogICAgIG9iamVjdC5vbihcImV2ZW50XCIsIGxpc3RlbmVyLmJpbmQodGhpcykpO1xuICpcbiAqIEhvd2V2ZXIsIHRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgaWYgd2UgdXNlIHRoZSBzZWNvbmQgbWV0aG9kIGl0XG4gKiB3aWxsIG5vdCBiZSBwb3NzaWJsZSB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBsYXRlciwgdW5sZXNzXG4gKiB0aGUgY2xvc3VyZSBjcmVhdGVkIGJ5IGJpbmQgaXMgc3RvcmVkIHNvbWV3aGVyZS4gSWYgdGhlXG4gKiBmaXJzdCBtZXRob2QgaXMgdXNlZCwgd2UgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgd2l0aDpcbiAqXG4gKiAgICAgb2JqZWN0Lm9mZihcImV2ZW50XCIsIGxpc3RlbmVyLCB0aGlzKTtcbiAqXG4gKiBAY2xhc3MgRXZlbnREaXNwYXRjaGVyXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RGlzcGF0Y2hlcigpIHtcblx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xufVxuXG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lci5cbiAqIEBtZXRob2QgYWRkRXZlbnRMaXN0ZW5lclxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudFR5cGUsIGxpc3RlbmVyLCBzY29wZSkge1xuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXApXG5cdFx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG5cdGlmICghZXZlbnRUeXBlKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIkV2ZW50IHR5cGUgcmVxdWlyZWQgZm9yIGV2ZW50IGRpc3BhdGNoZXJcIik7XG5cblx0aWYgKCFsaXN0ZW5lcilcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciByZXF1aXJlZCBmb3IgZXZlbnQgZGlzcGF0Y2hlclwiKTtcblxuXHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lciwgc2NvcGUpO1xuXG5cdGlmICghdGhpcy5saXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKVxuXHRcdHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuXG5cdHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcblx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0c2NvcGU6IHNjb3BlXG5cdH0pO1xufVxuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lci5cbiAqIEBtZXRob2QgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudFR5cGUsIGxpc3RlbmVyLCBzY29wZSkge1xuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXApXG5cdFx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG5cdGlmICghdGhpcy5saXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKVxuXHRcdHJldHVybjtcblxuXHR2YXIgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGxpc3RlbmVyT2JqID0gbGlzdGVuZXJzW2ldO1xuXG5cdFx0aWYgKGxpc3RlbmVyID09IGxpc3RlbmVyT2JqLmxpc3RlbmVyICYmIHNjb3BlID09IGxpc3RlbmVyT2JqLnNjb3BlKSB7XG5cdFx0XHRsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0aS0tO1xuXHRcdH1cblx0fVxuXG5cdGlmICghbGlzdGVuZXJzLmxlbmd0aClcblx0XHRkZWxldGUgdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdO1xufVxuXG4vKipcbiAqIERpc3BhdGNoIGV2ZW50LlxuICogQG1ldGhvZCBkaXNwYXRjaEV2ZW50XG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50IC8qIC4uLiAqLyApIHtcblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwKVxuXHRcdHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcblxuXHR2YXIgZXZlbnRUeXBlO1xuXHR2YXIgbGlzdGVuZXJQYXJhbXM7XG5cblx0aWYgKHR5cGVvZiBldmVudCA9PSBcInN0cmluZ1wiKSB7XG5cdFx0ZXZlbnRUeXBlID0gZXZlbnQ7XG5cblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpXG5cdFx0XHRsaXN0ZW5lclBhcmFtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0XHRlbHNlIGxpc3RlbmVyUGFyYW1zID0gW3tcblx0XHRcdHR5cGU6IGV2ZW50VHlwZSxcblx0XHRcdHRhcmdldDogdGhpc1xuXHRcdH1dO1xuXHR9IGVsc2Uge1xuXHRcdGV2ZW50VHlwZSA9IGV2ZW50LnR5cGU7XG5cdFx0ZXZlbnQudGFyZ2V0ID0gdGhpcztcblx0XHRsaXN0ZW5lclBhcmFtcyA9IFtldmVudF07XG5cdH1cblxuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSlcblx0XHRyZXR1cm47XG5cblx0Zm9yICh2YXIgaSBpbiB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV0pIHtcblx0XHR2YXIgbGlzdGVuZXJPYmogPSB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV1baV07XG5cdFx0bGlzdGVuZXJPYmoubGlzdGVuZXIuYXBwbHkobGlzdGVuZXJPYmouc2NvcGUsIGxpc3RlbmVyUGFyYW1zKTtcblx0fVxufVxuXG4vKipcbiAqIEpxdWVyeSBzdHlsZSBhbGlhcyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICogQG1ldGhvZCBvblxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9uID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXG4vKipcbiAqIEpxdWVyeSBzdHlsZSBhbGlhcyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICogQG1ldGhvZCBvZmZcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cbi8qKlxuICogSnF1ZXJ5IHN0eWxlIGFsaWFzIGZvciBkaXNwYXRjaEV2ZW50XG4gKiBAbWV0aG9kIHRyaWdnZXJcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuXG4vKipcbiAqIE1ha2Ugc29tZXRoaW5nIGFuIGV2ZW50IGRpc3BhdGNoZXIuIENhbiBiZSB1c2VkIGZvciBtdWx0aXBsZSBpbmhlcml0YW5jZS5cbiAqIEBtZXRob2QgaW5pdFxuICogQHN0YXRpY1xuICovXG5FdmVudERpc3BhdGNoZXIuaW5pdCA9IGZ1bmN0aW9uKGNscykge1xuXHRjbHMucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdGNscy5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0Y2xzLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuXHRjbHMucHJvdG90eXBlLm9uID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbjtcblx0Y2xzLnByb3RvdHlwZS5vZmYgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9mZjtcblx0Y2xzLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS50cmlnZ2VyO1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudERpc3BhdGNoZXI7XG59IiwidmFyIGluaGVyaXRzID0gcmVxdWlyZShcImluaGVyaXRzXCIpO1xudmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoXCJ5YWVkXCIpO1xuXG4vKipcbiAqIENvbGxlY3Rpb24uXG4gKiBAY2xhc3MgQ29sbGVjdGlvblxuICovXG5mdW5jdGlvbiBDb2xsZWN0aW9uKCkge1xuXHR0aGlzLml0ZW1zID0gW107XG59XG5cbmluaGVyaXRzKENvbGxlY3Rpb24sIEV2ZW50RGlzcGF0Y2hlcik7XG5cbi8qKlxuICogQWRkIGl0ZW0gYXQgZW5kLlxuICogQG1ldGhvZCBhZGRJdGVtXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG5cdHRoaXMuaXRlbXMucHVzaChpdGVtKTtcblxuXHR0aGlzLnRyaWdnZXJDaGFuZ2UoXCJhZGRcIiwgaXRlbSwgdGhpcy5pdGVtcy5sZW5ndGggLSAxKTtcbn1cblxuLyoqXG4gKiBBZGQgaXRlbSBhdCBpbmRleC5cbiAqIEBtZXRob2QgYWRkSXRlbVxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5hZGRJdGVtQXQgPSBmdW5jdGlvbihpbmRleCwgaXRlbSkge1xuXHRpZiAoaW5kZXggPCAwKVxuXHRcdGluZGV4ID0gMDtcblxuXHRpZiAoaW5kZXggPiB0aGlzLml0ZW1zLmxlbmd0aClcblx0XHRpbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuXG5cdHZhciBhZnRlciA9IHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4KTtcblx0dGhpcy5pdGVtcy5wdXNoKGl0ZW0pO1xuXHR0aGlzLml0ZW1zID0gdGhpcy5pdGVtcy5jb25jYXQoYWZ0ZXIpO1xuXG5cdHRoaXMudHJpZ2dlckNoYW5nZShcImFkZFwiLCBpdGVtLCBpbmRleCk7XG59XG5cbi8qKlxuICogR2V0IGxlbmd0aC5cbiAqIEBtZXRob2QgZ2V0TGVuZ3RoXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5pdGVtcy5sZW5ndGg7XG59XG5cbi8qKlxuICogR2V0IGl0ZW0gYXQgaW5kZXguXG4gKiBAbWV0aG9kIGdldEl0ZW1BdFxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXRJdGVtQXQgPSBmdW5jdGlvbihpbmRleCkge1xuXHRyZXR1cm4gdGhpcy5pdGVtc1tpbmRleF07XG59XG5cbi8qKlxuICogRmluZCBpdGVtIGluZGV4LlxuICogQG1ldGhvZCBnZXRJdGVtSW5kZXhcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0SXRlbUluZGV4ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRyZXR1cm4gdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xufVxuXG4vKipcbiAqIFJlbW92ZSBpdGVtIGF0LlxuICogQG1ldGhvZCByZW1vdmVJdGVtQXRcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUucmVtb3ZlSXRlbUF0ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0aWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLml0ZW1zLmxlbmd0aClcblx0XHRyZXR1cm47XG5cblx0dmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW1BdChpbmRleCk7XG5cblx0dGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHR0aGlzLnRyaWdnZXJDaGFuZ2UoXCJyZW1vdmVcIiwgaXRlbSwgaW5kZXgpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBpdGVtLlxuICogQG1ldGhvZCByZW1vdmVJdGVtXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG5cdHZhciBpbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pO1xuXG5cdHRoaXMucmVtb3ZlSXRlbUF0KGluZGV4KTtcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGNoYW5nZSBldmVudC5cbiAqIEBtZXRob2QgdHJpZ2dlckNoYW5nZVxuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUudHJpZ2dlckNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50S2luZCwgaXRlbSwgaW5kZXgpIHtcblx0dGhpcy50cmlnZ2VyKHtcblx0XHR0eXBlOiBldmVudEtpbmQsXG5cdFx0aXRlbTogaXRlbSxcblx0XHRpbmRleDogaW5kZXhcblx0fSk7XG5cblx0dGhpcy50cmlnZ2VyKHtcblx0XHR0eXBlOiBcImNoYW5nZVwiLFxuXHRcdGtpbmQ6IGV2ZW50S2luZCxcblx0XHRpdGVtOiBpdGVtLFxuXHRcdGluZGV4OiBpbmRleFxuXHR9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uOyIsInZhciBFdmVudERpc3BhdGNoZXIgPSByZXF1aXJlKFwieWFlZFwiKTtcbnZhciB4bm9kZSA9IHJlcXVpcmUoXCJ4bm9kZVwiKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcbnZhciBDb2xsZWN0aW9uVmlld01hbmFnZXI9cmVxdWlyZShcIi4vQ29sbGVjdGlvblZpZXdNYW5hZ2VyXCIpO1xuXG4vKipcbiAqIENvbGxlY3Rpb25WaWV3LlxuICogQGNsYXNzIENvbGxlY3Rpb25WaWV3XG4gKi9cbmZ1bmN0aW9uIENvbGxlY3Rpb25WaWV3KCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLm1hbmFnZXI9bmV3IENvbGxlY3Rpb25WaWV3TWFuYWdlcih0aGlzKTtcbn1cblxuaW5oZXJpdHMoQ29sbGVjdGlvblZpZXcsIHhub2RlLkRpdik7XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgY2xhc3MuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckNsYXNzXG4gKi9cbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZS5zZXRJdGVtUmVuZGVyZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtUmVuZGVyZXJDbGFzcyh2YWx1ZSk7XG59XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgZmFjdG9yeS5cbiAqIEBtZXRob2Qgc2V0SXRlbVJlbmRlcmVyRmFjdG9yeVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0SXRlbVJlbmRlcmVyRmFjdG9yeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtUmVuZGVyZXJGYWN0b3J5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSBjb250cm9sbGVyIGNsYXNzLlxuICogQG1ldGhvZCBzZXRJdGVtUmVuZGVyZXJDbGFzc1xuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0SXRlbUNvbnRyb2xsZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtQ29udHJvbGxlckNsYXNzKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSBjb250cm9sbGVyIGZhY3RvcnkuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckZhY3RvcnlcbiAqL1xuQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLnNldEl0ZW1Db250cm9sbGVyRmFjdG9yeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtQ29udHJvbGxlckZhY3RvcnkodmFsdWUpO1xufVxuXG4vKipcbiAqIFNldCBkYXRhIHNvdXJjZS5cbiAqIEBtZXRob2Qgc2V0RGF0YVNvdXJjZVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXREYXRhU291cmNlKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uVmlldzsiLCJ2YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG52YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG5cbi8qKlxuICogQ29sbGVjdGlvblZpZXdNYW5hZ2VyLlxuICogQGNsYXNzIENvbGxlY3Rpb25WaWV3TWFuYWdlclxuICovXG5mdW5jdGlvbiBDb2xsZWN0aW9uVmlld01hbmFnZXIodGFyZ2V0KSB7XG5cdHRoaXMuaXRlbVJlbmRlcmVycyA9IFtdO1xuXHR0aGlzLml0ZW1SZW5kZXJlckNsYXNzID0gbnVsbDtcblx0dGhpcy5pdGVtUmVuZGVyZXJGYWN0b3J5ID0gbnVsbDtcblx0dGhpcy5pdGVtQ29udHJvbGxlckNsYXNzID0gbnVsbDtcblx0dGhpcy5pdGVtQ29udHJvbGxlckZhY3RvcnkgPSBudWxsO1xuXHR0aGlzLmRhdGFTb3VyY2UgPSBudWxsO1xuXHR0aGlzLnRhcmdldCA9IG51bGw7XG5cblx0dGhpcy5zZXRUYXJnZXQodGFyZ2V0KTtcbn1cblxuaW5oZXJpdHMoQ29sbGVjdGlvblZpZXdNYW5hZ2VyLCBFdmVudERpc3BhdGNoZXIpO1xuXG4vKipcbiAqIFNldCB0YXJnZXQuXG4gKiBAbWV0aG9kIHNldFRhcmdldFxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLnNldFRhcmdldCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMucmVtb3ZlQWxsSXRlbVJlbmRlcmVycygpO1xuXHR0aGlzLnRhcmdldCA9IHZhbHVlO1xuXHR0aGlzLnJlbW92ZUFsbEl0ZW1SZW5kZXJlcnMoKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSByZW5kZXJlciBjbGFzcy5cbiAqIEBtZXRob2Qgc2V0SXRlbVJlbmRlcmVyQ2xhc3NcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXRJdGVtUmVuZGVyZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgIT0gXCJmdW5jdGlvblwiKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIlRoZSBpdGVtIHJlbmRlcmVyIGNsYXNzIHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuXG5cdHRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MgPSB2YWx1ZTtcblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNldCBpdGVtIHJlbmRlcmVyIGZhY3RvcnkuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckZhY3RvcnlcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXRJdGVtUmVuZGVyZXJGYWN0b3J5ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPSBcImZ1bmN0aW9uXCIpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVGhlIGl0ZW0gcmVuZGVyZXIgZmFjdG9yeSBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcblxuXHR0aGlzLml0ZW1SZW5kZXJlckZhY3RvcnkgPSB2YWx1ZTtcblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNldCBpdGVtIGNvbnRyb2xsZXIgY2xhc3MuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckNsYXNzXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUuc2V0SXRlbUNvbnRyb2xsZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgIT0gXCJmdW5jdGlvblwiKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIlRoZSBpdGVtIHJlbmRlcmVyIGNsYXNzIHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuXG5cdHRoaXMuaXRlbUNvbnRyb2xsZXJDbGFzcyA9IHZhbHVlO1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogU2V0IGl0ZW0gY29udHJvbGxlciBmYWN0b3J5LlxuICogQG1ldGhvZCBzZXRJdGVtUmVuZGVyZXJGYWN0b3J5XG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUuc2V0SXRlbUNvbnRyb2xsZXJGYWN0b3J5ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPSBcImZ1bmN0aW9uXCIpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVGhlIGl0ZW0gcmVuZGVyZXIgZmFjdG9yeSBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcblxuXHR0aGlzLml0ZW1Db250cm9sbGVyRmFjdG9yeSA9IHZhbHVlO1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogU2V0IGRhdGEgc291cmNlLlxuICogQG1ldGhvZCBzZXREYXRhU291cmNlXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUuc2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh0aGlzLmRhdGFTb3VyY2UpIHtcblx0XHR0aGlzLmRhdGFTb3VyY2Uub2ZmKFwiY2hhbmdlXCIsIHRoaXMub25EYXRhU291cmNlQ2hhbmdlLCB0aGlzKTtcblx0fVxuXG5cdHRoaXMuZGF0YVNvdXJjZSA9IHZhbHVlO1xuXG5cdGlmICh0aGlzLmRhdGFTb3VyY2UpIHtcblx0XHR0aGlzLmRhdGFTb3VyY2Uub24oXCJjaGFuZ2VcIiwgdGhpcy5vbkRhdGFTb3VyY2VDaGFuZ2UsIHRoaXMpO1xuXHR9XG5cblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNvbWV0aGluZyBpbiB0aGUgZGF0YSBzb3VyY2Ugd2FzIGNoYW5nZWQuXG4gKiBAbWV0aG9kIG9uRGF0YVNvdXJjZUNoYW5nZVxuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5vbkRhdGFTb3VyY2VDaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhbGwgaXRlbSByZW5kZXJlcnMuXG4gKiBAbWV0aG9kIHJlbW92ZUFsbEl0ZW1SZW5kZXJlcnNcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUucmVtb3ZlQWxsSXRlbVJlbmRlcmVycyA9IGZ1bmN0aW9uKCkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaXRlbVJlbmRlcmVycy5sZW5ndGg7IGkrKykge1xuXHRcdGlmICh0aGlzLml0ZW1SZW5kZXJlcnNbaV0uX19jb250cm9sbGVyKVxuXHRcdFx0dGhpcy5pdGVtUmVuZGVyZXJzW2ldLl9fY29udHJvbGxlci5zZXREYXRhKG51bGwpO1xuXG5cdFx0ZWxzZVxuXHRcdFx0dGhpcy5pdGVtUmVuZGVyZXJzW2ldLnNldERhdGEobnVsbCk7XG5cblx0XHR0aGlzLnRhcmdldC5yZW1vdmVDaGlsZCh0aGlzLml0ZW1SZW5kZXJlcnNbaV0pO1xuXHR9XG5cblx0dGhpcy5pdGVtUmVuZGVyZXJzID0gW107XG59XG5cbi8qKlxuICogUmVmcmVzaCBhbGwgaXRlbSByZW5kZXJlcnMuXG4gKiBAbWV0aG9kIHJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMucmVtb3ZlQWxsSXRlbVJlbmRlcmVycygpO1xuXG5cdGlmICghdGhpcy5kYXRhU291cmNlKVxuXHRcdHJldHVybjtcblxuXHRpZiAoIXRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MgJiYgIXRoaXMuaXRlbVJlbmRlcmVyRmFjdG9yeSlcblx0XHRyZXR1cm47XG5cblx0aWYgKCF0aGlzLnRhcmdldClcblx0XHRyZXR1cm47XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGFTb3VyY2UuZ2V0TGVuZ3RoKCk7IGkrKykge1xuXHRcdHZhciBkYXRhID0gdGhpcy5kYXRhU291cmNlLmdldEl0ZW1BdChpKTtcblx0XHR2YXIgcmVuZGVyZXIgPSB0aGlzLmNyZWF0ZUl0ZW1SZW5kZXJlcigpO1xuXG5cdFx0aWYgKHRoaXMuaXRlbUNvbnRyb2xsZXJDbGFzcyB8fCB0aGlzLml0ZW1Db250cm9sbGVyRmFjdG9yeSkge1xuXHRcdFx0cmVuZGVyZXIuX19jb250cm9sbGVyID0gdGhpcy5jcmVhdGVJdGVtQ29udHJvbGxlcihyZW5kZXJlcik7XG5cdFx0XHRyZW5kZXJlci5fX2NvbnRyb2xsZXIuc2V0RGF0YShkYXRhKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVuZGVyZXIuc2V0RGF0YShkYXRhKTtcblx0XHR9XG5cblx0XHR0aGlzLml0ZW1SZW5kZXJlcnMucHVzaChyZW5kZXJlcik7XG5cdFx0dGhpcy50YXJnZXQuYXBwZW5kQ2hpbGQocmVuZGVyZXIpO1xuXHR9XG5cblx0dGhpcy50cmlnZ2VyKFwicG9zdFVwZGF0ZVwiKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaXRlbSByZW5kZXJlci5cbiAqIEBtZXRob2QgY3JlYXRlSXRlbVJlbmRlcmVyXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUl0ZW1SZW5kZXJlciA9IGZ1bmN0aW9uKCkge1xuXHRpZiAodGhpcy5pdGVtUmVuZGVyZXJGYWN0b3J5KVxuXHRcdHJldHVybiB0aGlzLml0ZW1SZW5kZXJlckZhY3RvcnkoKTtcblxuXHRpZiAodGhpcy5pdGVtUmVuZGVyZXJDbGFzcylcblx0XHRyZXR1cm4gbmV3IHRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MoKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjcmVhdGUgaXRlbSByZW5kZXJlciFcIik7XG59XG5cbi8qKlxuICogQ3JlYXRlIGl0ZW0gY29udHJvbGxlci5cbiAqIEBtZXRob2QgY3JlYXRlSXRlbUNvbnRyb2xsZXJcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUuY3JlYXRlSXRlbUNvbnRyb2xsZXIgPSBmdW5jdGlvbihyZW5kZXJlcikge1xuXHRpZiAodGhpcy5pdGVtQ29udHJvbGxlckZhY3RvcnkpXG5cdFx0cmV0dXJuIHRoaXMuaXRlbUNvbnRyb2xsZXJGYWN0b3J5KHJlbmRlcmVyKTtcblxuXHRpZiAodGhpcy5pdGVtQ29udHJvbGxlckNsYXNzKVxuXHRcdHJldHVybiBuZXcgdGhpcy5pdGVtQ29udHJvbGxlckNsYXNzKHJlbmRlcmVyKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjcmVhdGUgaXRlbSBjb250cm9sbGVyIVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uVmlld01hbmFnZXI7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdENvbGxlY3Rpb246IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIiksXG5cdENvbGxlY3Rpb25WaWV3OiByZXF1aXJlKFwiLi9Db2xsZWN0aW9uVmlld1wiKSxcblx0Q29sbGVjdGlvblZpZXdNYW5hZ2VyOiByZXF1aXJlKFwiLi9Db2xsZWN0aW9uVmlld01hbmFnZXJcIilcbn07IiwidmFyIEFwcCA9IHJlcXVpcmUoXCIuL3NyYy9hcHAvQXBwLmpzXCIpO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobmV3IEFwcCgpKTtcbn0iLCJ2YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG5cbnZhciBBcHBNb2RlbCA9IHJlcXVpcmUoXCIuLi9tb2RlbC9BcHBNb2RlbFwiKTtcbnZhciBBcHBWaWV3ID0gcmVxdWlyZShcIi4uL3ZpZXcvQXBwVmlld1wiKTtcbnZhciBBcHBDb250cm9sbGVyID0gcmVxdWlyZShcIi4uL2NvbnRyb2xsZXIvQXBwQ29udHJvbGxlclwiKTtcblxuZnVuY3Rpb24gQXBwKCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLnN0eWxlLnRvcCA9IDA7XG5cdHRoaXMuc3R5bGUubGVmdCA9IDA7XG5cdHRoaXMuc3R5bGUuYm90dG9tID0gMDtcblx0dGhpcy5zdHlsZS5yaWdodCA9IDA7XG5cblx0dGhpcy5hcHBNb2RlbCA9IG5ldyBBcHBNb2RlbCgpO1xuXHR0aGlzLmFwcFZpZXcgPSBuZXcgQXBwVmlldygpO1xuXHR0aGlzLmFwcENvbnRyb2xsZXIgPSBuZXcgQXBwQ29udHJvbGxlcih0aGlzLmFwcE1vZGVsLCB0aGlzLmFwcFZpZXcpO1xuXG5cdHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5hcHBWaWV3KTtcbn1cblxuaW5oZXJpdHMoQXBwLCB4bm9kZS5EaXYpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDsiLCJ2YXIgSXRlbUNvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi9JdGVtQ29udHJvbGxlclwiKTtcbnZhciBJdGVtTW9kZWwgPSByZXF1aXJlKFwiLi4vbW9kZWwvSXRlbU1vZGVsXCIpO1xuXG5mdW5jdGlvbiBBcHBDb250cm9sbGVyKGFwcE1vZGVsLCBhcHBWaWV3KSB7XG5cdHRoaXMuYXBwTW9kZWwgPSBhcHBNb2RlbDtcblx0dGhpcy5hcHBWaWV3ID0gYXBwVmlldztcblxuXHR0aGlzLmFwcFZpZXcuc2V0Q29sbGVjdGlvbih0aGlzLmFwcE1vZGVsLmdldENvbGxlY3Rpb24oKSk7XG5cdHRoaXMuYXBwVmlldy5nZXRJdGVtQ29sbGVjdGlvblZpZXcoKS5zZXRJdGVtQ29udHJvbGxlckNsYXNzKEl0ZW1Db250cm9sbGVyKTtcblxuXHR0aGlzLmFwcFZpZXcub24oXCJhZGRDbGlja1wiLCB0aGlzLm9uQXBwVmlld0FkZENsaWNrLCB0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBcHBDb250cm9sbGVyO1xuXG5BcHBDb250cm9sbGVyLnByb3RvdHlwZS5vbkFwcFZpZXdBZGRDbGljayA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLmFwcE1vZGVsLmdldENvbGxlY3Rpb24oKS5hZGRJdGVtKG5ldyBJdGVtTW9kZWwoXCJuZXcgaXRlbVwiKSk7XG59IiwiZnVuY3Rpb24gSXRlbUNvbnRyb2xsZXIoaXRlbVZpZXcpIHtcblx0dGhpcy5pdGVtVmlldyA9IGl0ZW1WaWV3O1xuXHR0aGlzLml0ZW1WaWV3Lm9uKFwiY2hhbmdlXCIsIHRoaXMub25JdGVtVmlld0NoYW5nZSwgdGhpcyk7XG5cblx0Y29uc29sZS5sb2coXCJpdGVtIGNvbnRyb2xsZXIgY3JlYXRlZC4uLlwiKTtcbn1cblxuSXRlbUNvbnRyb2xsZXIucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbihpdGVtTW9kZWwpIHtcblx0aWYgKHRoaXMuaXRlbU1vZGVsKSB7XG5cdFx0XG5cdH1cblxuXHR0aGlzLml0ZW1Nb2RlbCA9IGl0ZW1Nb2RlbDtcblxuXHRpZiAodGhpcy5pdGVtTW9kZWwpIHtcblx0XHR0aGlzLml0ZW1WaWV3LnNldFZhbHVlKHRoaXMuaXRlbU1vZGVsLmdldFZhbHVlKCkpO1xuXHR9XG59XG5cbkl0ZW1Db250cm9sbGVyLnByb3RvdHlwZS5vbkl0ZW1WaWV3Q2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuaXRlbU1vZGVsLnNldFZhbHVlKHRoaXMuaXRlbVZpZXcuZ2V0VmFsdWUoKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbUNvbnRyb2xsZXI7IiwidmFyIEl0ZW1Nb2RlbCA9IHJlcXVpcmUoXCIuL0l0ZW1Nb2RlbFwiKTtcbnZhciB4bm9kZWMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vc3JjL2luZGV4XCIpO1xuXG5mdW5jdGlvbiBBcHBNb2RlbCgpIHtcblx0dGhpcy5jb2xsZWN0aW9uID0gbmV3IHhub2RlYy5Db2xsZWN0aW9uKCk7XG5cdHRoaXMuY29sbGVjdGlvbi5hZGRJdGVtKG5ldyBJdGVtTW9kZWwoXCJoZWxsb1wiKSk7XG5cdHRoaXMuY29sbGVjdGlvbi5hZGRJdGVtKG5ldyBJdGVtTW9kZWwoXCJ3b3JsZFwiKSk7XG59XG5cbkFwcE1vZGVsLnByb3RvdHlwZS5nZXRDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7IiwiZnVuY3Rpb24gSXRlbU1vZGVsKHYpIHtcblx0dGhpcy52YWx1ZSA9IHY7XG59XG5cbkl0ZW1Nb2RlbC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMudmFsdWU7XG59XG5cbkl0ZW1Nb2RlbC5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih2KSB7XG5cdHRoaXMudmFsdWUgPSB2O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1Nb2RlbDsiLCJ2YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgeG5vZGVjID0gcmVxdWlyZShcIi4uLy4uLy4uLy4uL3NyYy9pbmRleC5qc1wiKTtcbnZhciBJdGVtVmlldyA9IHJlcXVpcmUoXCIuL0l0ZW1WaWV3XCIpO1xudmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoXCJ5YWVkXCIpO1xuXG5mdW5jdGlvbiBBcHBWaWV3KCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLnN0eWxlLmxlZnQgPSBcIjBcIjtcblx0dGhpcy5zdHlsZS50b3AgPSBcIjBcIjtcblx0dGhpcy5zdHlsZS5yaWdodCA9IFwiMFwiO1xuXHR0aGlzLnN0eWxlLmJvdHRvbSA9IFwiMFwiO1xuXG5cdHZhciBiID0gbmV3IHhub2RlLkJ1dHRvbihcInRlc3RcIik7XG5cdGIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdGIuc3R5bGUubGVmdCA9IFwiMzAwcHhcIjtcblx0Yi5zdHlsZS50b3AgPSBcIjEwcHhcIjtcblx0dGhpcy5hcHBlbmRDaGlsZChiKTtcblx0Yi5vbihcImNsaWNrXCIsIHRoaXMub25CdXR0b25DbGljay5iaW5kKHRoaXMpKTtcblxuXHR0aGlzLmNvbGxlY3Rpb25WaWV3ID0gbmV3IHhub2RlYy5Db2xsZWN0aW9uVmlldygpO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmxlZnQgPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS50b3AgPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS53aWR0aCA9IFwiMjAwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS5ib3R0b20gPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnNldEl0ZW1SZW5kZXJlckNsYXNzKEl0ZW1WaWV3KTtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS5vdmVyZmxvdyA9IFwic2Nyb2xsXCI7XG5cdHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5jb2xsZWN0aW9uVmlldyk7XG59XG5cbmluaGVyaXRzKEFwcFZpZXcsIHhub2RlLkRpdik7XG5FdmVudERpc3BhdGNoZXIuaW5pdChBcHBWaWV3KTtcblxuQXBwVmlldy5wcm90b3R5cGUuc2V0Q29sbGVjdGlvbiA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zZXREYXRhU291cmNlKGNvbGxlY3Rpb24pO1xufVxuXG5BcHBWaWV3LnByb3RvdHlwZS5nZXRJdGVtQ29sbGVjdGlvblZpZXcgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuY29sbGVjdGlvblZpZXc7XG59XG5cbkFwcFZpZXcucHJvdG90eXBlLm9uQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcblx0dGhpcy50cmlnZ2VyKFwiYWRkQ2xpY2tcIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwVmlldzsiLCJ2YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG5cbmZ1bmN0aW9uIEl0ZW1WaWV3KCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuXHR0aGlzLnN0eWxlLmhlaWdodCA9IFwiNDBweFwiO1xuXHR0aGlzLnN0eWxlLmJhY2tncm91bmQgPSBcIiNmZjAwMDBcIjtcblx0dGhpcy5zdHlsZS5ib3JkZXJCb3R0b20gPSBcIjFweCBzb2xpZCBibGFja1wiO1xuXG5cdHRoaXMuaW5wdXQgPSBuZXcgeG5vZGUuSW5wdXQoKTtcblx0dGhpcy5pbnB1dC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblx0dGhpcy5pbnB1dC5zdHlsZS5sZWZ0ID0gXCIxMHB4XCI7XG5cdHRoaXMuaW5wdXQuc3R5bGUudG9wID0gXCIxMHB4XCI7XG5cblx0dmFyIHNjb3BlID0gdGhpcztcblxuXHR0aGlzLmlucHV0Lm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHNjb3BlLnRyaWdnZXIoXCJjaGFuZ2VcIik7XG5cdH0pO1xuXG5cdHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5pbnB1dCk7XG59XG5cbmluaGVyaXRzKEl0ZW1WaWV3LCB4bm9kZS5EaXYpO1xuRXZlbnREaXNwYXRjaGVyLmluaXQoSXRlbVZpZXcpO1xuXG5JdGVtVmlldy5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHR0aGlzLmlucHV0LnZhbHVlID0gdmFsdWU7XG59XG5cbkl0ZW1WaWV3LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5pbnB1dC52YWx1ZTtcbn1cblxuSXRlbVZpZXcucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbihpdGVtTW9kZWwpIHtcblx0Y29uc29sZS5sb2coXCJ0aGlzIGlzIG5vdCByZWFsbHkgdXNlZCFcIilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVmlldzsiXX0=
