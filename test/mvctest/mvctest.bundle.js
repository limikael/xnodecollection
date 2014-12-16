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
		listenerParams = Array.prototype.slice.call(arguments, 1);
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

/**
 * Set target.
 * @method setTarget
 */
CollectionViewManager.prototype.setTarget = function(value) {
	this.removeAllItemRenderers();
	this.target=value;
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
	CollectionView: require("./CollectionView")
};
},{"./Collection":4,"./CollectionView":5}],8:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94bm9kZS9zcmMveG5vZGUuanMiLCJub2RlX21vZHVsZXMveWFlZC9zcmMvRXZlbnREaXNwYXRjaGVyLmpzIiwic3JjL0NvbGxlY3Rpb24uanMiLCJzcmMvQ29sbGVjdGlvblZpZXcuanMiLCJzcmMvQ29sbGVjdGlvblZpZXdNYW5hZ2VyLmpzIiwic3JjL2luZGV4LmpzIiwidGVzdC9tdmN0ZXN0L212Y3Rlc3QuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL2FwcC9BcHAuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL2NvbnRyb2xsZXIvQXBwQ29udHJvbGxlci5qcyIsInRlc3QvbXZjdGVzdC9zcmMvY29udHJvbGxlci9JdGVtQ29udHJvbGxlci5qcyIsInRlc3QvbXZjdGVzdC9zcmMvbW9kZWwvQXBwTW9kZWwuanMiLCJ0ZXN0L212Y3Rlc3Qvc3JjL21vZGVsL0l0ZW1Nb2RlbC5qcyIsInRlc3QvbXZjdGVzdC9zcmMvdmlldy9BcHBWaWV3LmpzIiwidGVzdC9tdmN0ZXN0L3NyYy92aWV3L0l0ZW1WaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIihmdW5jdGlvbigpIHtcblx0LyoqXG5cdCAqIFRoZSBiYXNpYyB4bm9kZSBjbGFzcy5cblx0ICogSXQgc2V0cyB0aGUgdW5kZXJseWluZyBub2RlIGVsZW1lbnQgYnkgY2FsbGluZ1xuXHQgKiBkb2N1bWVudC5jcmVhdGVFbGVtZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBYTm9kZSh0eXBlLCBjb250ZW50KSB7XG5cdFx0dGhpcy5ub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcblxuXHRcdGlmIChjb250ZW50ICE9PSB1bmRlZmluZWQpXG5cdFx0XHR0aGlzLm5vZGUuaW5uZXJIVE1MID0gY29udGVudDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGFuIGV4dGVuZGVkIGNsYXNzIHVzaW5nXG5cdCAqIHRoZSBYTm9kZSBjbGFzcyBkZWZpbmVkIGFib3ZlLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoZWxlbWVudFR5cGUsIGNvbnRlbnQpIHtcblx0XHR2YXIgZiA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcblx0XHRcdFhOb2RlLmNhbGwodGhpcywgZWxlbWVudFR5cGUsIGNvbnRlbnQpO1xuXHRcdH07XG5cblx0XHRmLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoWE5vZGUucHJvdG90eXBlKTtcblx0XHRmLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGY7XG5cblx0XHRyZXR1cm4gZjtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSByZWFkIG9ubHkgcHJvcGVydHkgdGhhdCByZXR1cm5zIHRoZVxuXHQgKiB2YWx1ZSBvZiB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBvZiB0aGVcblx0ICogdW5kZXJseWluZyBub2RlIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVhOb2RlUmVhZE9ubHlQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoWE5vZGUucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIHtcblx0XHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm5vZGVbcHJvcGVydHlOYW1lXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSByZWFkIHdyaXRlIHByb3BlcnR5IHRoYXQgb3BlcmF0ZXMgb25cblx0ICogdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgb2YgdGhlIHVuZGVybHlpbmdcblx0ICogbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KHByb3BlcnR5TmFtZSkge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShYTm9kZS5wcm90b3R5cGUsIHByb3BlcnR5TmFtZSwge1xuXHRcdFx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubm9kZVtwcm9wZXJ0eU5hbWVdO1xuXHRcdFx0fSxcblxuXHRcdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHR0aGlzLm5vZGVbcHJvcGVydHlOYW1lXSA9IHZhbHVlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIG1ldGhvZCB0aGF0IHJvdXRlcyB0aGUgY2FsbCB0aHJvdWdoLCBkb3duXG5cdCAqIHRvIHRoZSBzYW1lIG1ldGhvZCBvbiB0aGUgdW5kZXJseWluZyBub2RlIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVhOb2RlTWV0aG9kKG1ldGhvZE5hbWUpIHtcblx0XHRYTm9kZS5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLm5vZGVbbWV0aG9kTmFtZV0uYXBwbHkodGhpcy5ub2RlLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBNb2RpZnkgdGhlIE5vZGUucHJvcGVydHkgZnVuY3Rpb24sIHNvIHRoYXQgaXQgYWNjZXB0c1xuXHQgKiBYTm9kZSBvYmplY3RzLiBBbGwgWE5vZGUgb2JqZWN0cyB3aWxsIGJlIGNoYW5nZWQgdG9cblx0ICogdGhlIHVuZGVybHlpbmcgbm9kZSBvYmplY3RzLCBhbmQgdGhlIGNvcnJlc3BvbmRpbmdcblx0ICogbWV0aG9kIHdpbGwgYmUgY2FsbGVkLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlTm9kZVRvWE5vZGVNZXRob2RXcmFwcGVyKG1ldGhvZE5hbWUpIHtcblx0XHR2YXIgb3JpZ2luYWxGdW5jdGlvbiA9IE5vZGUucHJvdG90eXBlW21ldGhvZE5hbWVdO1xuXG5cdFx0Tm9kZS5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdGZvciAodmFyIGEgaW4gYXJndW1lbnRzKSB7XG5cdFx0XHRcdGlmIChhcmd1bWVudHNbYV0gaW5zdGFuY2VvZiBYTm9kZSlcblx0XHRcdFx0XHRhcmd1bWVudHNbYV0gPSBhcmd1bWVudHNbYV0ubm9kZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG9yaWdpbmFsRnVuY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU2V0IHVwIHJlYWQgb25seSBwcm9wZXJ0aWVzLlxuXHQgKi9cblx0Y3JlYXRlWE5vZGVSZWFkT25seVByb3BlcnR5KFwic3R5bGVcIik7XG5cblx0LyoqXG5cdCAqIFNldCB1cCByZWFkL3dyaXRlIHByb3BlcnRpZXMuXG5cdCAqL1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwiaW5uZXJIVE1MXCIpO1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwiaHJlZlwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcImlkXCIpO1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwidmFsdWVcIik7XG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJ0eXBlXCIpO1xuXG5cdC8qKlxuXHQgKiBTZXQgdXAgbWV0aG9kcyB0byBiZSByb3V0ZWQgdG8gdGhlIHVuZGVybHlpbmcgbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRjcmVhdGVYTm9kZU1ldGhvZChcImFwcGVuZENoaWxkXCIpO1xuXHRjcmVhdGVYTm9kZU1ldGhvZChcInJlbW92ZUNoaWxkXCIpO1xuXHRjcmVhdGVYTm9kZU1ldGhvZChcImFkZEV2ZW50TGlzdGVuZXJcIik7XG5cdGNyZWF0ZVhOb2RlTWV0aG9kKFwicmVtb3ZlRXZlbnRMaXN0ZW5lclwiKTtcblxuXHQvKipcblx0ICogU2V0IHVwIG1ldGhvZHMgb24gTm9kZS5wcm9wZXJ0eS5cblx0ICovXG5cdGNyZWF0ZU5vZGVUb1hOb2RlTWV0aG9kV3JhcHBlcihcImFwcGVuZENoaWxkXCIpO1xuXHRjcmVhdGVOb2RlVG9YTm9kZU1ldGhvZFdyYXBwZXIoXCJyZW1vdmVDaGlsZFwiKTtcblxuXHQvKipcblx0ICogQ3JlYXRlIGV2ZW50IGxpc3RlbmVyIGFsaWFzZXMuXG5cdCAqL1xuXHRYTm9kZS5wcm90b3R5cGUub24gPSBYTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0WE5vZGUucHJvdG90eXBlLm9mZiA9IFhOb2RlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXG5cdC8qKlxuXHQgKiBXb3JrIGJvdGggYXMgYSBucG0gbW9kdWxlIGFuZCBzdGFuZGFsb25lLlxuXHQgKi9cblx0dmFyIHRhcmdldDtcblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdHRhcmdldCA9IHt9O1xuXHRcdG1vZHVsZS5leHBvcnRzID0gdGFyZ2V0O1xuXHR9IGVsc2Uge1xuXHRcdHhub2RlID0ge307XG5cdFx0dGFyZ2V0ID0geG5vZGU7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGV4dGVuZGVkIGNsYXNzZXMuXG5cdCAqL1xuXHR0YXJnZXQuRGl2ID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJkaXZcIik7XG5cdHRhcmdldC5CdXR0b24gPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcImJ1dHRvblwiKTtcblx0dGFyZ2V0LlVsID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJ1bFwiKTtcblx0dGFyZ2V0LkxpID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJsaVwiKTtcblx0dGFyZ2V0LkEgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcImFcIik7XG5cdHRhcmdldC5JbnB1dCA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwiaW5wdXRcIik7XG59KSgpOyIsIi8qKlxuICogQVMzL2pxdWVyeSBzdHlsZSBldmVudCBkaXNwYXRjaGVyLiBTbGlnaHRseSBtb2RpZmllZC4gVGhlXG4gKiBqcXVlcnkgc3R5bGUgb24vb2ZmL3RyaWdnZXIgc3R5bGUgb2YgYWRkaW5nIGxpc3RlbmVycyBpc1xuICogY3VycmVudGx5IHRoZSBwcmVmZXJyZWQgb25lLlxuICpcbiAqIFRoZSBvbiBtZXRob2QgZm9yIGFkZGluZyBsaXN0ZW5lcnMgdGFrZXMgYW4gZXh0cmEgcGFyYW1ldGVyIHdoaWNoIGlzIHRoZVxuICogc2NvcGUgaW4gd2hpY2ggbGlzdGVuZXJzIHNob3VsZCBiZSBjYWxsZWQuIFNvIHRoaXM6XG4gKlxuICogICAgIG9iamVjdC5vbihcImV2ZW50XCIsIGxpc3RlbmVyLCB0aGlzKTtcbiAqXG4gKiBIYXMgdGhlIHNhbWUgZnVuY3Rpb24gd2hlbiBhZGRpbmcgZXZlbnRzIGFzOlxuICpcbiAqICAgICBvYmplY3Qub24oXCJldmVudFwiLCBsaXN0ZW5lci5iaW5kKHRoaXMpKTtcbiAqXG4gKiBIb3dldmVyLCB0aGUgZGlmZmVyZW5jZSBpcyB0aGF0IGlmIHdlIHVzZSB0aGUgc2Vjb25kIG1ldGhvZCBpdFxuICogd2lsbCBub3QgYmUgcG9zc2libGUgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgbGF0ZXIsIHVubGVzc1xuICogdGhlIGNsb3N1cmUgY3JlYXRlZCBieSBiaW5kIGlzIHN0b3JlZCBzb21ld2hlcmUuIElmIHRoZVxuICogZmlyc3QgbWV0aG9kIGlzIHVzZWQsIHdlIGNhbiByZW1vdmUgdGhlIGxpc3RlbmVyIHdpdGg6XG4gKlxuICogICAgIG9iamVjdC5vZmYoXCJldmVudFwiLCBsaXN0ZW5lciwgdGhpcyk7XG4gKlxuICogQGNsYXNzIEV2ZW50RGlzcGF0Y2hlclxuICovXG5mdW5jdGlvbiBFdmVudERpc3BhdGNoZXIoKSB7XG5cdHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcbn1cblxuLyoqXG4gKiBBZGQgZXZlbnQgbGlzdGVuZXIuXG4gKiBAbWV0aG9kIGFkZEV2ZW50TGlzdGVuZXJcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBsaXN0ZW5lciwgc2NvcGUpIHtcblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwKVxuXHRcdHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcblxuXHRpZiAoIWV2ZW50VHlwZSlcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJFdmVudCB0eXBlIHJlcXVpcmVkIGZvciBldmVudCBkaXNwYXRjaGVyXCIpO1xuXG5cdGlmICghbGlzdGVuZXIpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiTGlzdGVuZXIgcmVxdWlyZWQgZm9yIGV2ZW50IGRpc3BhdGNoZXJcIik7XG5cblx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHNjb3BlKTtcblxuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSlcblx0XHR0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcblxuXHR0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV0ucHVzaCh7XG5cdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdHNjb3BlOiBzY29wZVxuXHR9KTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXIuXG4gKiBAbWV0aG9kIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBsaXN0ZW5lciwgc2NvcGUpIHtcblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwKVxuXHRcdHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcblxuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSlcblx0XHRyZXR1cm47XG5cblx0dmFyIGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBsaXN0ZW5lck9iaiA9IGxpc3RlbmVyc1tpXTtcblxuXHRcdGlmIChsaXN0ZW5lciA9PSBsaXN0ZW5lck9iai5saXN0ZW5lciAmJiBzY29wZSA9PSBsaXN0ZW5lck9iai5zY29wZSkge1xuXHRcdFx0bGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblx0XHRcdGktLTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIWxpc3RlbmVycy5sZW5ndGgpXG5cdFx0ZGVsZXRlIHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbn1cblxuLyoqXG4gKiBEaXNwYXRjaCBldmVudC5cbiAqIEBtZXRob2QgZGlzcGF0Y2hFdmVudFxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbihldmVudCAvKiAuLi4gKi8gKSB7XG5cdGlmICghdGhpcy5saXN0ZW5lck1hcClcblx0XHR0aGlzLmxpc3RlbmVyTWFwID0ge307XG5cblx0dmFyIGV2ZW50VHlwZTtcblx0dmFyIGxpc3RlbmVyUGFyYW1zO1xuXG5cdGlmICh0eXBlb2YgZXZlbnQgPT0gXCJzdHJpbmdcIikge1xuXHRcdGV2ZW50VHlwZSA9IGV2ZW50O1xuXHRcdGxpc3RlbmVyUGFyYW1zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0fSBlbHNlIHtcblx0XHRldmVudFR5cGUgPSBldmVudC50eXBlO1xuXHRcdGV2ZW50LnRhcmdldCA9IHRoaXM7XG5cdFx0bGlzdGVuZXJQYXJhbXMgPSBbZXZlbnRdO1xuXHR9XG5cblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpXG5cdFx0cmV0dXJuO1xuXG5cdGZvciAodmFyIGkgaW4gdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG5cdFx0dmFyIGxpc3RlbmVyT2JqID0gdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdW2ldO1xuXHRcdGxpc3RlbmVyT2JqLmxpc3RlbmVyLmFwcGx5KGxpc3RlbmVyT2JqLnNjb3BlLCBsaXN0ZW5lclBhcmFtcyk7XG5cdH1cbn1cblxuLyoqXG4gKiBKcXVlcnkgc3R5bGUgYWxpYXMgZm9yIGFkZEV2ZW50TGlzdGVuZXJcbiAqIEBtZXRob2Qgb25cbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblxuLyoqXG4gKiBKcXVlcnkgc3R5bGUgYWxpYXMgZm9yIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAqIEBtZXRob2Qgb2ZmXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub2ZmID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXG4vKipcbiAqIEpxdWVyeSBzdHlsZSBhbGlhcyBmb3IgZGlzcGF0Y2hFdmVudFxuICogQG1ldGhvZCB0cmlnZ2VyXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcblxuLyoqXG4gKiBNYWtlIHNvbWV0aGluZyBhbiBldmVudCBkaXNwYXRjaGVyLiBDYW4gYmUgdXNlZCBmb3IgbXVsdGlwbGUgaW5oZXJpdGFuY2UuXG4gKiBAbWV0aG9kIGluaXRcbiAqIEBzdGF0aWNcbiAqL1xuRXZlbnREaXNwYXRjaGVyLmluaXQgPSBmdW5jdGlvbihjbHMpIHtcblx0Y2xzLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXHRjbHMucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cdGNscy5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudDtcblx0Y2xzLnByb3RvdHlwZS5vbiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub247XG5cdGNscy5wcm90b3R5cGUub2ZmID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vZmY7XG5cdGNscy5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUudHJpZ2dlcjtcbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gRXZlbnREaXNwYXRjaGVyO1xufVxuIiwidmFyIGluaGVyaXRzID0gcmVxdWlyZShcImluaGVyaXRzXCIpO1xudmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoXCJ5YWVkXCIpO1xuXG4vKipcbiAqIENvbGxlY3Rpb24uXG4gKiBAY2xhc3MgQ29sbGVjdGlvblxuICovXG5mdW5jdGlvbiBDb2xsZWN0aW9uKCkge1xuXHR0aGlzLml0ZW1zID0gW107XG59XG5cbmluaGVyaXRzKENvbGxlY3Rpb24sIEV2ZW50RGlzcGF0Y2hlcik7XG5cbi8qKlxuICogQWRkIGl0ZW0gYXQgZW5kLlxuICogQG1ldGhvZCBhZGRJdGVtXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmFkZEl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG5cdHRoaXMuaXRlbXMucHVzaChpdGVtKTtcblxuXHR0aGlzLnRyaWdnZXJDaGFuZ2UoXCJhZGRcIiwgaXRlbSwgdGhpcy5pdGVtcy5sZW5ndGggLSAxKTtcbn1cblxuLyoqXG4gKiBBZGQgaXRlbSBhdCBpbmRleC5cbiAqIEBtZXRob2QgYWRkSXRlbVxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5hZGRJdGVtQXQgPSBmdW5jdGlvbihpbmRleCwgaXRlbSkge1xuXHRpZiAoaW5kZXggPCAwKVxuXHRcdGluZGV4ID0gMDtcblxuXHRpZiAoaW5kZXggPiB0aGlzLml0ZW1zLmxlbmd0aClcblx0XHRpbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuXG5cdHZhciBhZnRlciA9IHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4KTtcblx0dGhpcy5pdGVtcy5wdXNoKGl0ZW0pO1xuXHR0aGlzLml0ZW1zID0gdGhpcy5pdGVtcy5jb25jYXQoYWZ0ZXIpO1xuXG5cdHRoaXMudHJpZ2dlckNoYW5nZShcImFkZFwiLCBpdGVtLCBpbmRleCk7XG59XG5cbi8qKlxuICogR2V0IGxlbmd0aC5cbiAqIEBtZXRob2QgZ2V0TGVuZ3RoXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5pdGVtcy5sZW5ndGg7XG59XG5cbi8qKlxuICogR2V0IGl0ZW0gYXQgaW5kZXguXG4gKiBAbWV0aG9kIGdldEl0ZW1BdFxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXRJdGVtQXQgPSBmdW5jdGlvbihpbmRleCkge1xuXHRyZXR1cm4gdGhpcy5pdGVtc1tpbmRleF07XG59XG5cbi8qKlxuICogRmluZCBpdGVtIGluZGV4LlxuICogQG1ldGhvZCBnZXRJdGVtSW5kZXhcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0SXRlbUluZGV4ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRyZXR1cm4gdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xufVxuXG4vKipcbiAqIFJlbW92ZSBpdGVtIGF0LlxuICogQG1ldGhvZCByZW1vdmVJdGVtQXRcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUucmVtb3ZlSXRlbUF0ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0aWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLml0ZW1zLmxlbmd0aClcblx0XHRyZXR1cm47XG5cblx0dmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW1BdChpbmRleCk7XG5cblx0dGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHR0aGlzLnRyaWdnZXJDaGFuZ2UoXCJyZW1vdmVcIiwgaXRlbSwgaW5kZXgpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBpdGVtLlxuICogQG1ldGhvZCByZW1vdmVJdGVtXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLnJlbW92ZUl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG5cdHZhciBpbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGl0ZW0pO1xuXG5cdHRoaXMucmVtb3ZlSXRlbUF0KGluZGV4KTtcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGNoYW5nZSBldmVudC5cbiAqIEBtZXRob2QgdHJpZ2dlckNoYW5nZVxuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUudHJpZ2dlckNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50S2luZCwgaXRlbSwgaW5kZXgpIHtcblx0dGhpcy50cmlnZ2VyKHtcblx0XHR0eXBlOiBldmVudEtpbmQsXG5cdFx0aXRlbTogaXRlbSxcblx0XHRpbmRleDogaW5kZXhcblx0fSk7XG5cblx0dGhpcy50cmlnZ2VyKHtcblx0XHR0eXBlOiBcImNoYW5nZVwiLFxuXHRcdGtpbmQ6IGV2ZW50S2luZCxcblx0XHRpdGVtOiBpdGVtLFxuXHRcdGluZGV4OiBpbmRleFxuXHR9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uOyIsInZhciBFdmVudERpc3BhdGNoZXIgPSByZXF1aXJlKFwieWFlZFwiKTtcbnZhciB4bm9kZSA9IHJlcXVpcmUoXCJ4bm9kZVwiKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcbnZhciBDb2xsZWN0aW9uVmlld01hbmFnZXI9cmVxdWlyZShcIi4vQ29sbGVjdGlvblZpZXdNYW5hZ2VyXCIpO1xuXG4vKipcbiAqIENvbGxlY3Rpb25WaWV3LlxuICogQGNsYXNzIENvbGxlY3Rpb25WaWV3XG4gKi9cbmZ1bmN0aW9uIENvbGxlY3Rpb25WaWV3KCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLm1hbmFnZXI9bmV3IENvbGxlY3Rpb25WaWV3TWFuYWdlcih0aGlzKTtcbn1cblxuaW5oZXJpdHMoQ29sbGVjdGlvblZpZXcsIHhub2RlLkRpdik7XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgY2xhc3MuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckNsYXNzXG4gKi9cbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZS5zZXRJdGVtUmVuZGVyZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtUmVuZGVyZXJDbGFzcyh2YWx1ZSk7XG59XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgZmFjdG9yeS5cbiAqIEBtZXRob2Qgc2V0SXRlbVJlbmRlcmVyRmFjdG9yeVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0SXRlbVJlbmRlcmVyRmFjdG9yeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtUmVuZGVyZXJGYWN0b3J5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSBjb250cm9sbGVyIGNsYXNzLlxuICogQG1ldGhvZCBzZXRJdGVtUmVuZGVyZXJDbGFzc1xuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0SXRlbUNvbnRyb2xsZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtQ29udHJvbGxlckNsYXNzKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSBjb250cm9sbGVyIGZhY3RvcnkuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckZhY3RvcnlcbiAqL1xuQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLnNldEl0ZW1Db250cm9sbGVyRmFjdG9yeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXRJdGVtQ29udHJvbGxlckZhY3RvcnkodmFsdWUpO1xufVxuXG4vKipcbiAqIFNldCBkYXRhIHNvdXJjZS5cbiAqIEBtZXRob2Qgc2V0RGF0YVNvdXJjZVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMubWFuYWdlci5zZXREYXRhU291cmNlKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uVmlldzsiLCJ2YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG5cbi8qKlxuICogQ29sbGVjdGlvblZpZXdNYW5hZ2VyLlxuICogQGNsYXNzIENvbGxlY3Rpb25WaWV3TWFuYWdlclxuICovXG5mdW5jdGlvbiBDb2xsZWN0aW9uVmlld01hbmFnZXIodGFyZ2V0KSB7XG5cdHRoaXMuaXRlbVJlbmRlcmVycyA9IFtdO1xuXHR0aGlzLml0ZW1SZW5kZXJlckNsYXNzID0gbnVsbDtcblx0dGhpcy5pdGVtUmVuZGVyZXJGYWN0b3J5ID0gbnVsbDtcblx0dGhpcy5pdGVtQ29udHJvbGxlckNsYXNzID0gbnVsbDtcblx0dGhpcy5pdGVtQ29udHJvbGxlckZhY3RvcnkgPSBudWxsO1xuXHR0aGlzLmRhdGFTb3VyY2UgPSBudWxsO1xuXHR0aGlzLnRhcmdldCA9IG51bGw7XG5cblx0dGhpcy5zZXRUYXJnZXQodGFyZ2V0KTtcbn1cblxuLyoqXG4gKiBTZXQgdGFyZ2V0LlxuICogQG1ldGhvZCBzZXRUYXJnZXRcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXRUYXJnZXQgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHR0aGlzLnJlbW92ZUFsbEl0ZW1SZW5kZXJlcnMoKTtcblx0dGhpcy50YXJnZXQ9dmFsdWU7XG5cdHRoaXMucmVtb3ZlQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNldCBpdGVtIHJlbmRlcmVyIGNsYXNzLlxuICogQG1ldGhvZCBzZXRJdGVtUmVuZGVyZXJDbGFzc1xuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLnNldEl0ZW1SZW5kZXJlckNsYXNzID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPSBcImZ1bmN0aW9uXCIpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVGhlIGl0ZW0gcmVuZGVyZXIgY2xhc3Mgc2hvdWxkIGJlIGEgZnVuY3Rpb25cIik7XG5cblx0dGhpcy5pdGVtUmVuZGVyZXJDbGFzcyA9IHZhbHVlO1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgZmFjdG9yeS5cbiAqIEBtZXRob2Qgc2V0SXRlbVJlbmRlcmVyRmFjdG9yeVxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLnNldEl0ZW1SZW5kZXJlckZhY3RvcnkgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlICE9IFwiZnVuY3Rpb25cIilcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUaGUgaXRlbSByZW5kZXJlciBmYWN0b3J5IHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuXG5cdHRoaXMuaXRlbVJlbmRlcmVyRmFjdG9yeSA9IHZhbHVlO1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogU2V0IGl0ZW0gY29udHJvbGxlciBjbGFzcy5cbiAqIEBtZXRob2Qgc2V0SXRlbVJlbmRlcmVyQ2xhc3NcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXRJdGVtQ29udHJvbGxlckNsYXNzID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPSBcImZ1bmN0aW9uXCIpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVGhlIGl0ZW0gcmVuZGVyZXIgY2xhc3Mgc2hvdWxkIGJlIGEgZnVuY3Rpb25cIik7XG5cblx0dGhpcy5pdGVtQ29udHJvbGxlckNsYXNzID0gdmFsdWU7XG5cdHRoaXMucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMoKTtcbn1cblxuLyoqXG4gKiBTZXQgaXRlbSBjb250cm9sbGVyIGZhY3RvcnkuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckZhY3RvcnlcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXRJdGVtQ29udHJvbGxlckZhY3RvcnkgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlICE9IFwiZnVuY3Rpb25cIilcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUaGUgaXRlbSByZW5kZXJlciBmYWN0b3J5IHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuXG5cdHRoaXMuaXRlbUNvbnRyb2xsZXJGYWN0b3J5ID0gdmFsdWU7XG5cdHRoaXMucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMoKTtcbn1cblxuLyoqXG4gKiBTZXQgZGF0YSBzb3VyY2UuXG4gKiBAbWV0aG9kIHNldERhdGFTb3VyY2VcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5zZXREYXRhU291cmNlID0gZnVuY3Rpb24odmFsdWUpIHtcblx0aWYgKHRoaXMuZGF0YVNvdXJjZSkge1xuXHRcdHRoaXMuZGF0YVNvdXJjZS5vZmYoXCJjaGFuZ2VcIiwgdGhpcy5vbkRhdGFTb3VyY2VDaGFuZ2UsIHRoaXMpO1xuXHR9XG5cblx0dGhpcy5kYXRhU291cmNlID0gdmFsdWU7XG5cblx0aWYgKHRoaXMuZGF0YVNvdXJjZSkge1xuXHRcdHRoaXMuZGF0YVNvdXJjZS5vbihcImNoYW5nZVwiLCB0aGlzLm9uRGF0YVNvdXJjZUNoYW5nZSwgdGhpcyk7XG5cdH1cblxuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogU29tZXRoaW5nIGluIHRoZSBkYXRhIHNvdXJjZSB3YXMgY2hhbmdlZC5cbiAqIEBtZXRob2Qgb25EYXRhU291cmNlQ2hhbmdlXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLm9uRGF0YVNvdXJjZUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBpdGVtIHJlbmRlcmVycy5cbiAqIEBtZXRob2QgcmVtb3ZlQWxsSXRlbVJlbmRlcmVyc1xuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvblZpZXdNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmVBbGxJdGVtUmVuZGVyZXJzID0gZnVuY3Rpb24oKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pdGVtUmVuZGVyZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKHRoaXMuaXRlbVJlbmRlcmVyc1tpXS5fX2NvbnRyb2xsZXIpXG5cdFx0XHR0aGlzLml0ZW1SZW5kZXJlcnNbaV0uX19jb250cm9sbGVyLnNldERhdGEobnVsbCk7XG5cblx0XHRlbHNlXG5cdFx0XHR0aGlzLml0ZW1SZW5kZXJlcnNbaV0uc2V0RGF0YShudWxsKTtcblxuXHRcdHRoaXMudGFyZ2V0LnJlbW92ZUNoaWxkKHRoaXMuaXRlbVJlbmRlcmVyc1tpXSk7XG5cdH1cblxuXHR0aGlzLml0ZW1SZW5kZXJlcnMgPSBbXTtcbn1cblxuLyoqXG4gKiBSZWZyZXNoIGFsbCBpdGVtIHJlbmRlcmVycy5cbiAqIEBtZXRob2QgcmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnNcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5yZW1vdmVBbGxJdGVtUmVuZGVyZXJzKCk7XG5cblx0aWYgKCF0aGlzLmRhdGFTb3VyY2UpXG5cdFx0cmV0dXJuO1xuXG5cdGlmICghdGhpcy5pdGVtUmVuZGVyZXJDbGFzcyAmJiAhdGhpcy5pdGVtUmVuZGVyZXJGYWN0b3J5KVxuXHRcdHJldHVybjtcblxuXHRpZiAoIXRoaXMudGFyZ2V0KVxuXHRcdHJldHVybjtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YVNvdXJjZS5nZXRMZW5ndGgoKTsgaSsrKSB7XG5cdFx0dmFyIGRhdGEgPSB0aGlzLmRhdGFTb3VyY2UuZ2V0SXRlbUF0KGkpO1xuXHRcdHZhciByZW5kZXJlciA9IHRoaXMuY3JlYXRlSXRlbVJlbmRlcmVyKCk7XG5cblx0XHRpZiAodGhpcy5pdGVtQ29udHJvbGxlckNsYXNzIHx8IHRoaXMuaXRlbUNvbnRyb2xsZXJGYWN0b3J5KSB7XG5cdFx0XHRyZW5kZXJlci5fX2NvbnRyb2xsZXIgPSB0aGlzLmNyZWF0ZUl0ZW1Db250cm9sbGVyKHJlbmRlcmVyKTtcblx0XHRcdHJlbmRlcmVyLl9fY29udHJvbGxlci5zZXREYXRhKGRhdGEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZW5kZXJlci5zZXREYXRhKGRhdGEpO1xuXHRcdH1cblxuXHRcdHRoaXMuaXRlbVJlbmRlcmVycy5wdXNoKHJlbmRlcmVyKTtcblx0XHR0aGlzLnRhcmdldC5hcHBlbmRDaGlsZChyZW5kZXJlcik7XG5cdH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgaXRlbSByZW5kZXJlci5cbiAqIEBtZXRob2QgY3JlYXRlSXRlbVJlbmRlcmVyXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlld01hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUl0ZW1SZW5kZXJlciA9IGZ1bmN0aW9uKCkge1xuXHRpZiAodGhpcy5pdGVtUmVuZGVyZXJGYWN0b3J5KVxuXHRcdHJldHVybiB0aGlzLml0ZW1SZW5kZXJlckZhY3RvcnkoKTtcblxuXHRpZiAodGhpcy5pdGVtUmVuZGVyZXJDbGFzcylcblx0XHRyZXR1cm4gbmV3IHRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MoKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjcmVhdGUgaXRlbSByZW5kZXJlciFcIik7XG59XG5cbi8qKlxuICogQ3JlYXRlIGl0ZW0gY29udHJvbGxlci5cbiAqIEBtZXRob2QgY3JlYXRlSXRlbUNvbnRyb2xsZXJcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3TWFuYWdlci5wcm90b3R5cGUuY3JlYXRlSXRlbUNvbnRyb2xsZXIgPSBmdW5jdGlvbihyZW5kZXJlcikge1xuXHRpZiAodGhpcy5pdGVtQ29udHJvbGxlckZhY3RvcnkpXG5cdFx0cmV0dXJuIHRoaXMuaXRlbUNvbnRyb2xsZXJGYWN0b3J5KHJlbmRlcmVyKTtcblxuXHRpZiAodGhpcy5pdGVtQ29udHJvbGxlckNsYXNzKVxuXHRcdHJldHVybiBuZXcgdGhpcy5pdGVtQ29udHJvbGxlckNsYXNzKHJlbmRlcmVyKTtcblxuXHR0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjcmVhdGUgaXRlbSBjb250cm9sbGVyIVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uVmlld01hbmFnZXI7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdENvbGxlY3Rpb246IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIiksXG5cdENvbGxlY3Rpb25WaWV3OiByZXF1aXJlKFwiLi9Db2xsZWN0aW9uVmlld1wiKVxufTsiLCJ2YXIgQXBwID0gcmVxdWlyZShcIi4vc3JjL2FwcC9BcHAuanNcIik7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChuZXcgQXBwKCkpO1xufSIsInZhciB4bm9kZSA9IHJlcXVpcmUoXCJ4bm9kZVwiKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcblxudmFyIEFwcE1vZGVsID0gcmVxdWlyZShcIi4uL21vZGVsL0FwcE1vZGVsXCIpO1xudmFyIEFwcFZpZXcgPSByZXF1aXJlKFwiLi4vdmlldy9BcHBWaWV3XCIpO1xudmFyIEFwcENvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi4vY29udHJvbGxlci9BcHBDb250cm9sbGVyXCIpO1xuXG5mdW5jdGlvbiBBcHAoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdHRoaXMuc3R5bGUudG9wID0gMDtcblx0dGhpcy5zdHlsZS5sZWZ0ID0gMDtcblx0dGhpcy5zdHlsZS5ib3R0b20gPSAwO1xuXHR0aGlzLnN0eWxlLnJpZ2h0ID0gMDtcblxuXHR0aGlzLmFwcE1vZGVsID0gbmV3IEFwcE1vZGVsKCk7XG5cdHRoaXMuYXBwVmlldyA9IG5ldyBBcHBWaWV3KCk7XG5cdHRoaXMuYXBwQ29udHJvbGxlciA9IG5ldyBBcHBDb250cm9sbGVyKHRoaXMuYXBwTW9kZWwsIHRoaXMuYXBwVmlldyk7XG5cblx0dGhpcy5hcHBlbmRDaGlsZCh0aGlzLmFwcFZpZXcpO1xufVxuXG5pbmhlcml0cyhBcHAsIHhub2RlLkRpdik7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwOyIsInZhciBJdGVtQ29udHJvbGxlciA9IHJlcXVpcmUoXCIuL0l0ZW1Db250cm9sbGVyXCIpO1xudmFyIEl0ZW1Nb2RlbCA9IHJlcXVpcmUoXCIuLi9tb2RlbC9JdGVtTW9kZWxcIik7XG5cbmZ1bmN0aW9uIEFwcENvbnRyb2xsZXIoYXBwTW9kZWwsIGFwcFZpZXcpIHtcblx0dGhpcy5hcHBNb2RlbCA9IGFwcE1vZGVsO1xuXHR0aGlzLmFwcFZpZXcgPSBhcHBWaWV3O1xuXG5cdHRoaXMuYXBwVmlldy5zZXRDb2xsZWN0aW9uKHRoaXMuYXBwTW9kZWwuZ2V0Q29sbGVjdGlvbigpKTtcblx0dGhpcy5hcHBWaWV3LmdldEl0ZW1Db2xsZWN0aW9uVmlldygpLnNldEl0ZW1Db250cm9sbGVyQ2xhc3MoSXRlbUNvbnRyb2xsZXIpO1xuXG5cdHRoaXMuYXBwVmlldy5vbihcImFkZENsaWNrXCIsIHRoaXMub25BcHBWaWV3QWRkQ2xpY2ssIHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcENvbnRyb2xsZXI7XG5cbkFwcENvbnRyb2xsZXIucHJvdG90eXBlLm9uQXBwVmlld0FkZENsaWNrID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuYXBwTW9kZWwuZ2V0Q29sbGVjdGlvbigpLmFkZEl0ZW0obmV3IEl0ZW1Nb2RlbChcIm5ldyBpdGVtXCIpKTtcbn0iLCJmdW5jdGlvbiBJdGVtQ29udHJvbGxlcihpdGVtVmlldykge1xuXHR0aGlzLml0ZW1WaWV3ID0gaXRlbVZpZXc7XG5cdHRoaXMuaXRlbVZpZXcub24oXCJjaGFuZ2VcIiwgdGhpcy5vbkl0ZW1WaWV3Q2hhbmdlLCB0aGlzKTtcblxuXHRjb25zb2xlLmxvZyhcIml0ZW0gY29udHJvbGxlciBjcmVhdGVkLi4uXCIpO1xufVxuXG5JdGVtQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKGl0ZW1Nb2RlbCkge1xuXHRpZiAodGhpcy5pdGVtTW9kZWwpIHtcblx0XHRcblx0fVxuXG5cdHRoaXMuaXRlbU1vZGVsID0gaXRlbU1vZGVsO1xuXG5cdGlmICh0aGlzLml0ZW1Nb2RlbCkge1xuXHRcdHRoaXMuaXRlbVZpZXcuc2V0VmFsdWUodGhpcy5pdGVtTW9kZWwuZ2V0VmFsdWUoKSk7XG5cdH1cbn1cblxuSXRlbUNvbnRyb2xsZXIucHJvdG90eXBlLm9uSXRlbVZpZXdDaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5pdGVtTW9kZWwuc2V0VmFsdWUodGhpcy5pdGVtVmlldy5nZXRWYWx1ZSgpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtQ29udHJvbGxlcjsiLCJ2YXIgSXRlbU1vZGVsID0gcmVxdWlyZShcIi4vSXRlbU1vZGVsXCIpO1xudmFyIHhub2RlYyA9IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9zcmMvaW5kZXhcIik7XG5cbmZ1bmN0aW9uIEFwcE1vZGVsKCkge1xuXHR0aGlzLmNvbGxlY3Rpb24gPSBuZXcgeG5vZGVjLkNvbGxlY3Rpb24oKTtcblx0dGhpcy5jb2xsZWN0aW9uLmFkZEl0ZW0obmV3IEl0ZW1Nb2RlbChcImhlbGxvXCIpKTtcblx0dGhpcy5jb2xsZWN0aW9uLmFkZEl0ZW0obmV3IEl0ZW1Nb2RlbChcIndvcmxkXCIpKTtcbn1cblxuQXBwTW9kZWwucHJvdG90eXBlLmdldENvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuY29sbGVjdGlvbjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBcHBNb2RlbDsiLCJmdW5jdGlvbiBJdGVtTW9kZWwodikge1xuXHR0aGlzLnZhbHVlID0gdjtcbn1cblxuSXRlbU1vZGVsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy52YWx1ZTtcbn1cblxuSXRlbU1vZGVsLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0dGhpcy52YWx1ZSA9IHY7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbU1vZGVsOyIsInZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcbnZhciB4bm9kZSA9IHJlcXVpcmUoXCJ4bm9kZVwiKTtcbnZhciB4bm9kZWMgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIEl0ZW1WaWV3ID0gcmVxdWlyZShcIi4vSXRlbVZpZXdcIik7XG52YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG5cbmZ1bmN0aW9uIEFwcFZpZXcoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdHRoaXMuc3R5bGUubGVmdCA9IFwiMFwiO1xuXHR0aGlzLnN0eWxlLnRvcCA9IFwiMFwiO1xuXHR0aGlzLnN0eWxlLnJpZ2h0ID0gXCIwXCI7XG5cdHRoaXMuc3R5bGUuYm90dG9tID0gXCIwXCI7XG5cblx0dmFyIGIgPSBuZXcgeG5vZGUuQnV0dG9uKFwidGVzdFwiKTtcblx0Yi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblx0Yi5zdHlsZS5sZWZ0ID0gXCIzMDBweFwiO1xuXHRiLnN0eWxlLnRvcCA9IFwiMTBweFwiO1xuXHR0aGlzLmFwcGVuZENoaWxkKGIpO1xuXHRiLm9uKFwiY2xpY2tcIiwgdGhpcy5vbkJ1dHRvbkNsaWNrLmJpbmQodGhpcykpO1xuXG5cdHRoaXMuY29sbGVjdGlvblZpZXcgPSBuZXcgeG5vZGVjLkNvbGxlY3Rpb25WaWV3KCk7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc3R5bGUubGVmdCA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLnRvcCA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLndpZHRoID0gXCIyMDBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmJvdHRvbSA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc2V0SXRlbVJlbmRlcmVyQ2xhc3MoSXRlbVZpZXcpO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcblx0dGhpcy5hcHBlbmRDaGlsZCh0aGlzLmNvbGxlY3Rpb25WaWV3KTtcbn1cblxuaW5oZXJpdHMoQXBwVmlldywgeG5vZGUuRGl2KTtcbkV2ZW50RGlzcGF0Y2hlci5pbml0KEFwcFZpZXcpO1xuXG5BcHBWaWV3LnByb3RvdHlwZS5zZXRDb2xsZWN0aW9uID0gZnVuY3Rpb24oY29sbGVjdGlvbikge1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnNldERhdGFTb3VyY2UoY29sbGVjdGlvbik7XG59XG5cbkFwcFZpZXcucHJvdG90eXBlLmdldEl0ZW1Db2xsZWN0aW9uVmlldyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5jb2xsZWN0aW9uVmlldztcbn1cblxuQXBwVmlldy5wcm90b3R5cGUub25CdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnRyaWdnZXIoXCJhZGRDbGlja1wiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBcHBWaWV3OyIsInZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcbnZhciB4bm9kZSA9IHJlcXVpcmUoXCJ4bm9kZVwiKTtcbnZhciBFdmVudERpc3BhdGNoZXIgPSByZXF1aXJlKFwieWFlZFwiKTtcblxuZnVuY3Rpb24gSXRlbVZpZXcoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG5cdHRoaXMuc3R5bGUuaGVpZ2h0ID0gXCI0MHB4XCI7XG5cdHRoaXMuc3R5bGUuYmFja2dyb3VuZCA9IFwiI2ZmMDAwMFwiO1xuXHR0aGlzLnN0eWxlLmJvcmRlckJvdHRvbSA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XG5cblx0dGhpcy5pbnB1dCA9IG5ldyB4bm9kZS5JbnB1dCgpO1xuXHR0aGlzLmlucHV0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLmlucHV0LnN0eWxlLmxlZnQgPSBcIjEwcHhcIjtcblx0dGhpcy5pbnB1dC5zdHlsZS50b3AgPSBcIjEwcHhcIjtcblxuXHR2YXIgc2NvcGUgPSB0aGlzO1xuXG5cdHRoaXMuaW5wdXQub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG5cdFx0c2NvcGUudHJpZ2dlcihcImNoYW5nZVwiKTtcblx0fSk7XG5cblx0dGhpcy5hcHBlbmRDaGlsZCh0aGlzLmlucHV0KTtcbn1cblxuaW5oZXJpdHMoSXRlbVZpZXcsIHhub2RlLkRpdik7XG5FdmVudERpc3BhdGNoZXIuaW5pdChJdGVtVmlldyk7XG5cbkl0ZW1WaWV3LnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMuaW5wdXQudmFsdWUgPSB2YWx1ZTtcbn1cblxuSXRlbVZpZXcucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLmlucHV0LnZhbHVlO1xufVxuXG5JdGVtVmlldy5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKGl0ZW1Nb2RlbCkge1xuXHRjb25zb2xlLmxvZyhcInRoaXMgaXMgbm90IHJlYWxseSB1c2VkIVwiKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1WaWV3OyJdfQ==
