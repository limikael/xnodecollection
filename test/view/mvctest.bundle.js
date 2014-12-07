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
},{"inherits":1,"xnode":2,"yaed":3}],6:[function(require,module,exports){
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
},{"../../src/Collection":4,"../../src/CollectionView":5,"inherits":1,"xnode":2,"yaed":3}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94bm9kZS9zcmMveG5vZGUuanMiLCJub2RlX21vZHVsZXMveWFlZC9zcmMvRXZlbnREaXNwYXRjaGVyLmpzIiwic3JjL0NvbGxlY3Rpb24uanMiLCJzcmMvQ29sbGVjdGlvblZpZXcuanMiLCJ0ZXN0L3ZpZXcvbXZjdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiKGZ1bmN0aW9uKCkge1xuXHQvKipcblx0ICogVGhlIGJhc2ljIHhub2RlIGNsYXNzLlxuXHQgKiBJdCBzZXRzIHRoZSB1bmRlcmx5aW5nIG5vZGUgZWxlbWVudCBieSBjYWxsaW5nXG5cdCAqIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnRcblx0ICovXG5cdGZ1bmN0aW9uIFhOb2RlKHR5cGUsIGNvbnRlbnQpIHtcblx0XHR0aGlzLm5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpO1xuXG5cdFx0aWYgKGNvbnRlbnQgIT09IHVuZGVmaW5lZClcblx0XHRcdHRoaXMubm9kZS5pbm5lckhUTUwgPSBjb250ZW50O1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYW4gZXh0ZW5kZWQgY2xhc3MgdXNpbmdcblx0ICogdGhlIFhOb2RlIGNsYXNzIGRlZmluZWQgYWJvdmUuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChlbGVtZW50VHlwZSwgY29udGVudCkge1xuXHRcdHZhciBmID0gZnVuY3Rpb24oY29udGVudCkge1xuXHRcdFx0WE5vZGUuY2FsbCh0aGlzLCBlbGVtZW50VHlwZSwgY29udGVudCk7XG5cdFx0fTtcblxuXHRcdGYucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShYTm9kZS5wcm90b3R5cGUpO1xuXHRcdGYucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZjtcblxuXHRcdHJldHVybiBmO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJlYWQgb25seSBwcm9wZXJ0eSB0aGF0IHJldHVybnMgdGhlXG5cdCAqIHZhbHVlIG9mIHRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5IG9mIHRoZVxuXHQgKiB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlWE5vZGVSZWFkT25seVByb3BlcnR5KHByb3BlcnR5TmFtZSkge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShYTm9kZS5wcm90b3R5cGUsIHByb3BlcnR5TmFtZSwge1xuXHRcdFx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubm9kZVtwcm9wZXJ0eU5hbWVdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIHJlYWQgd3JpdGUgcHJvcGVydHkgdGhhdCBvcGVyYXRlcyBvblxuXHQgKiB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBvZiB0aGUgdW5kZXJseWluZ1xuXHQgKiBub2RlIG9iamVjdC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkocHJvcGVydHlOYW1lKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFhOb2RlLnByb3RvdHlwZSwgcHJvcGVydHlOYW1lLCB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5ub2RlW3Byb3BlcnR5TmFtZV07XG5cdFx0XHR9LFxuXG5cdFx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHRoaXMubm9kZVtwcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgbWV0aG9kIHRoYXQgcm91dGVzIHRoZSBjYWxsIHRocm91Z2gsIGRvd25cblx0ICogdG8gdGhlIHNhbWUgbWV0aG9kIG9uIHRoZSB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlWE5vZGVNZXRob2QobWV0aG9kTmFtZSkge1xuXHRcdFhOb2RlLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMubm9kZVttZXRob2ROYW1lXS5hcHBseSh0aGlzLm5vZGUsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIE1vZGlmeSB0aGUgTm9kZS5wcm9wZXJ0eSBmdW5jdGlvbiwgc28gdGhhdCBpdCBhY2NlcHRzXG5cdCAqIFhOb2RlIG9iamVjdHMuIEFsbCBYTm9kZSBvYmplY3RzIHdpbGwgYmUgY2hhbmdlZCB0b1xuXHQgKiB0aGUgdW5kZXJseWluZyBub2RlIG9iamVjdHMsIGFuZCB0aGUgY29ycmVzcG9uZGluZ1xuXHQgKiBtZXRob2Qgd2lsbCBiZSBjYWxsZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVOb2RlVG9YTm9kZU1ldGhvZFdyYXBwZXIobWV0aG9kTmFtZSkge1xuXHRcdHZhciBvcmlnaW5hbEZ1bmN0aW9uID0gTm9kZS5wcm90b3R5cGVbbWV0aG9kTmFtZV07XG5cblx0XHROb2RlLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Zm9yICh2YXIgYSBpbiBhcmd1bWVudHMpIHtcblx0XHRcdFx0aWYgKGFyZ3VtZW50c1thXSBpbnN0YW5jZW9mIFhOb2RlKVxuXHRcdFx0XHRcdGFyZ3VtZW50c1thXSA9IGFyZ3VtZW50c1thXS5ub2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gb3JpZ2luYWxGdW5jdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBTZXQgdXAgcmVhZCBvbmx5IHByb3BlcnRpZXMuXG5cdCAqL1xuXHRjcmVhdGVYTm9kZVJlYWRPbmx5UHJvcGVydHkoXCJzdHlsZVwiKTtcblxuXHQvKipcblx0ICogU2V0IHVwIHJlYWQvd3JpdGUgcHJvcGVydGllcy5cblx0ICovXG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJpbm5lckhUTUxcIik7XG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJocmVmXCIpO1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwiaWRcIik7XG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJ2YWx1ZVwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcInR5cGVcIik7XG5cblx0LyoqXG5cdCAqIFNldCB1cCBtZXRob2RzIHRvIGJlIHJvdXRlZCB0byB0aGUgdW5kZXJseWluZyBub2RlIG9iamVjdC5cblx0ICovXG5cdGNyZWF0ZVhOb2RlTWV0aG9kKFwiYXBwZW5kQ2hpbGRcIik7XG5cdGNyZWF0ZVhOb2RlTWV0aG9kKFwicmVtb3ZlQ2hpbGRcIik7XG5cdGNyZWF0ZVhOb2RlTWV0aG9kKFwiYWRkRXZlbnRMaXN0ZW5lclwiKTtcblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJyZW1vdmVFdmVudExpc3RlbmVyXCIpO1xuXG5cdC8qKlxuXHQgKiBTZXQgdXAgbWV0aG9kcyBvbiBOb2RlLnByb3BlcnR5LlxuXHQgKi9cblx0Y3JlYXRlTm9kZVRvWE5vZGVNZXRob2RXcmFwcGVyKFwiYXBwZW5kQ2hpbGRcIik7XG5cdGNyZWF0ZU5vZGVUb1hOb2RlTWV0aG9kV3JhcHBlcihcInJlbW92ZUNoaWxkXCIpO1xuXG5cdC8qKlxuXHQgKiBDcmVhdGUgZXZlbnQgbGlzdGVuZXIgYWxpYXNlcy5cblx0ICovXG5cdFhOb2RlLnByb3RvdHlwZS5vbiA9IFhOb2RlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXHRYTm9kZS5wcm90b3R5cGUub2ZmID0gWE5vZGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cblx0LyoqXG5cdCAqIFdvcmsgYm90aCBhcyBhIG5wbSBtb2R1bGUgYW5kIHN0YW5kYWxvbmUuXG5cdCAqL1xuXHR2YXIgdGFyZ2V0O1xuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSB0YXJnZXQ7XG5cdH0gZWxzZSB7XG5cdFx0eG5vZGUgPSB7fTtcblx0XHR0YXJnZXQgPSB4bm9kZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgZXh0ZW5kZWQgY2xhc3Nlcy5cblx0ICovXG5cdHRhcmdldC5EaXYgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcImRpdlwiKTtcblx0dGFyZ2V0LkJ1dHRvbiA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXHR0YXJnZXQuVWwgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcInVsXCIpO1xuXHR0YXJnZXQuTGkgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcImxpXCIpO1xuXHR0YXJnZXQuQSA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwiYVwiKTtcblx0dGFyZ2V0LklucHV0ID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJpbnB1dFwiKTtcbn0pKCk7IiwiLyoqXG4gKiBBUzMvanF1ZXJ5IHN0eWxlIGV2ZW50IGRpc3BhdGNoZXIuIFNsaWdodGx5IG1vZGlmaWVkLiBUaGVcbiAqIGpxdWVyeSBzdHlsZSBvbi9vZmYvdHJpZ2dlciBzdHlsZSBvZiBhZGRpbmcgbGlzdGVuZXJzIGlzXG4gKiBjdXJyZW50bHkgdGhlIHByZWZlcnJlZCBvbmUuXG4gKlxuICogVGhlIG9uIG1ldGhvZCBmb3IgYWRkaW5nIGxpc3RlbmVycyB0YWtlcyBhbiBleHRyYSBwYXJhbWV0ZXIgd2hpY2ggaXMgdGhlXG4gKiBzY29wZSBpbiB3aGljaCBsaXN0ZW5lcnMgc2hvdWxkIGJlIGNhbGxlZC4gU28gdGhpczpcbiAqXG4gKiAgICAgb2JqZWN0Lm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIsIHRoaXMpO1xuICpcbiAqIEhhcyB0aGUgc2FtZSBmdW5jdGlvbiB3aGVuIGFkZGluZyBldmVudHMgYXM6XG4gKlxuICogICAgIG9iamVjdC5vbihcImV2ZW50XCIsIGxpc3RlbmVyLmJpbmQodGhpcykpO1xuICpcbiAqIEhvd2V2ZXIsIHRoZSBkaWZmZXJlbmNlIGlzIHRoYXQgaWYgd2UgdXNlIHRoZSBzZWNvbmQgbWV0aG9kIGl0XG4gKiB3aWxsIG5vdCBiZSBwb3NzaWJsZSB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBsYXRlciwgdW5sZXNzXG4gKiB0aGUgY2xvc3VyZSBjcmVhdGVkIGJ5IGJpbmQgaXMgc3RvcmVkIHNvbWV3aGVyZS4gSWYgdGhlXG4gKiBmaXJzdCBtZXRob2QgaXMgdXNlZCwgd2UgY2FuIHJlbW92ZSB0aGUgbGlzdGVuZXIgd2l0aDpcbiAqXG4gKiAgICAgb2JqZWN0Lm9mZihcImV2ZW50XCIsIGxpc3RlbmVyLCB0aGlzKTtcbiAqXG4gKiBAY2xhc3MgRXZlbnREaXNwYXRjaGVyXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RGlzcGF0Y2hlcigpIHtcblx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xufVxuXG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lci5cbiAqIEBtZXRob2QgYWRkRXZlbnRMaXN0ZW5lclxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudFR5cGUsIGxpc3RlbmVyLCBzY29wZSkge1xuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXApXG5cdFx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG5cdGlmICghZXZlbnRUeXBlKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIkV2ZW50IHR5cGUgcmVxdWlyZWQgZm9yIGV2ZW50IGRpc3BhdGNoZXJcIik7XG5cblx0aWYgKCFsaXN0ZW5lcilcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJMaXN0ZW5lciByZXF1aXJlZCBmb3IgZXZlbnQgZGlzcGF0Y2hlclwiKTtcblxuXHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lciwgc2NvcGUpO1xuXG5cdGlmICghdGhpcy5saXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKVxuXHRcdHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuXG5cdHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcblx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0c2NvcGU6IHNjb3BlXG5cdH0pO1xufVxuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lci5cbiAqIEBtZXRob2QgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudFR5cGUsIGxpc3RlbmVyLCBzY29wZSkge1xuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXApXG5cdFx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG5cdGlmICghdGhpcy5saXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKVxuXHRcdHJldHVybjtcblxuXHR2YXIgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGxpc3RlbmVyT2JqID0gbGlzdGVuZXJzW2ldO1xuXG5cdFx0aWYgKGxpc3RlbmVyID09IGxpc3RlbmVyT2JqLmxpc3RlbmVyICYmIHNjb3BlID09IGxpc3RlbmVyT2JqLnNjb3BlKSB7XG5cdFx0XHRsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0aS0tO1xuXHRcdH1cblx0fVxuXG5cdGlmICghbGlzdGVuZXJzLmxlbmd0aClcblx0XHRkZWxldGUgdGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdO1xufVxuXG4vKipcbiAqIERpc3BhdGNoIGV2ZW50LlxuICogQG1ldGhvZCBkaXNwYXRjaEV2ZW50XG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50IC8qIC4uLiAqLyApIHtcblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwKVxuXHRcdHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcblxuXHR2YXIgZXZlbnRUeXBlO1xuXHR2YXIgbGlzdGVuZXJQYXJhbXM7XG5cblx0aWYgKHR5cGVvZiBldmVudCA9PSBcInN0cmluZ1wiKSB7XG5cdFx0ZXZlbnRUeXBlID0gZXZlbnQ7XG5cdFx0bGlzdGVuZXJQYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHR9IGVsc2Uge1xuXHRcdGV2ZW50VHlwZSA9IGV2ZW50LnR5cGU7XG5cdFx0ZXZlbnQudGFyZ2V0ID0gdGhpcztcblx0XHRsaXN0ZW5lclBhcmFtcyA9IFtldmVudF07XG5cdH1cblxuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSlcblx0XHRyZXR1cm47XG5cblx0Zm9yICh2YXIgaSBpbiB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV0pIHtcblx0XHR2YXIgbGlzdGVuZXJPYmogPSB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV1baV07XG5cdFx0bGlzdGVuZXJPYmoubGlzdGVuZXIuYXBwbHkobGlzdGVuZXJPYmouc2NvcGUsIGxpc3RlbmVyUGFyYW1zKTtcblx0fVxufVxuXG4vKipcbiAqIEpxdWVyeSBzdHlsZSBhbGlhcyBmb3IgYWRkRXZlbnRMaXN0ZW5lclxuICogQG1ldGhvZCBvblxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9uID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXG4vKipcbiAqIEpxdWVyeSBzdHlsZSBhbGlhcyBmb3IgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICogQG1ldGhvZCBvZmZcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cbi8qKlxuICogSnF1ZXJ5IHN0eWxlIGFsaWFzIGZvciBkaXNwYXRjaEV2ZW50XG4gKiBAbWV0aG9kIHRyaWdnZXJcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuXG4vKipcbiAqIE1ha2Ugc29tZXRoaW5nIGFuIGV2ZW50IGRpc3BhdGNoZXIuIENhbiBiZSB1c2VkIGZvciBtdWx0aXBsZSBpbmhlcml0YW5jZS5cbiAqIEBtZXRob2QgaW5pdFxuICogQHN0YXRpY1xuICovXG5FdmVudERpc3BhdGNoZXIuaW5pdCA9IGZ1bmN0aW9uKGNscykge1xuXHRjbHMucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdGNscy5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0Y2xzLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuXHRjbHMucHJvdG90eXBlLm9uID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbjtcblx0Y2xzLnByb3RvdHlwZS5vZmYgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9mZjtcblx0Y2xzLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS50cmlnZ2VyO1xufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudERpc3BhdGNoZXI7XG59XG4iLCJ2YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG52YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG5cbi8qKlxuICogQ29sbGVjdGlvbi5cbiAqIEBjbGFzcyBDb2xsZWN0aW9uXG4gKi9cbmZ1bmN0aW9uIENvbGxlY3Rpb24oKSB7XG5cdHRoaXMuaXRlbXMgPSBbXTtcbn1cblxuaW5oZXJpdHMoQ29sbGVjdGlvbiwgRXZlbnREaXNwYXRjaGVyKTtcblxuLyoqXG4gKiBBZGQgaXRlbSBhdCBlbmQuXG4gKiBAbWV0aG9kIGFkZEl0ZW1cbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuYWRkSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0dGhpcy5pdGVtcy5wdXNoKGl0ZW0pO1xuXG5cdHRoaXMudHJpZ2dlckNoYW5nZShcImFkZFwiLCBpdGVtLCB0aGlzLml0ZW1zLmxlbmd0aCAtIDEpO1xufVxuXG4vKipcbiAqIEFkZCBpdGVtIGF0IGluZGV4LlxuICogQG1ldGhvZCBhZGRJdGVtXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmFkZEl0ZW1BdCA9IGZ1bmN0aW9uKGluZGV4LCBpdGVtKSB7XG5cdGlmIChpbmRleCA8IDApXG5cdFx0aW5kZXggPSAwO1xuXG5cdGlmIChpbmRleCA+IHRoaXMuaXRlbXMubGVuZ3RoKVxuXHRcdGluZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG5cblx0dmFyIGFmdGVyID0gdGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgpO1xuXHR0aGlzLml0ZW1zLnB1c2goaXRlbSk7XG5cdHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmNvbmNhdChhZnRlcik7XG5cblx0dGhpcy50cmlnZ2VyQ2hhbmdlKFwiYWRkXCIsIGl0ZW0sIGluZGV4KTtcbn1cblxuLyoqXG4gKiBHZXQgbGVuZ3RoLlxuICogQG1ldGhvZCBnZXRMZW5ndGhcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLml0ZW1zLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBHZXQgaXRlbSBhdCBpbmRleC5cbiAqIEBtZXRob2QgZ2V0SXRlbUF0XG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmdldEl0ZW1BdCA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cdHJldHVybiB0aGlzLml0ZW1zW2luZGV4XTtcbn1cblxuLyoqXG4gKiBGaW5kIGl0ZW0gaW5kZXguXG4gKiBAbWV0aG9kIGdldEl0ZW1JbmRleFxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXRJdGVtSW5kZXggPSBmdW5jdGlvbihpdGVtKSB7XG5cdHJldHVybiB0aGlzLml0ZW1zLmluZGV4T2YoaXRlbSk7XG59XG5cbi8qKlxuICogUmVtb3ZlIGl0ZW0gYXQuXG4gKiBAbWV0aG9kIHJlbW92ZUl0ZW1BdFxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5yZW1vdmVJdGVtQXQgPSBmdW5jdGlvbihpbmRleCkge1xuXHRpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuaXRlbXMubGVuZ3RoKVxuXHRcdHJldHVybjtcblxuXHR2YXIgaXRlbSA9IHRoaXMuZ2V0SXRlbUF0KGluZGV4KTtcblxuXHR0aGlzLml0ZW1zLnNwbGljZShpbmRleCwgMSk7XG5cdHRoaXMudHJpZ2dlckNoYW5nZShcInJlbW92ZVwiLCBpdGVtLCBpbmRleCk7XG59XG5cbi8qKlxuICogUmVtb3ZlIGl0ZW0uXG4gKiBAbWV0aG9kIHJlbW92ZUl0ZW1cbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0dmFyIGluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgoaXRlbSk7XG5cblx0dGhpcy5yZW1vdmVJdGVtQXQoaW5kZXgpO1xufVxuXG4vKipcbiAqIFRyaWdnZXIgY2hhbmdlIGV2ZW50LlxuICogQG1ldGhvZCB0cmlnZ2VyQ2hhbmdlXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS50cmlnZ2VyQ2hhbmdlID0gZnVuY3Rpb24oZXZlbnRLaW5kLCBpdGVtLCBpbmRleCkge1xuXHR0aGlzLnRyaWdnZXIoe1xuXHRcdHR5cGU6IGV2ZW50S2luZCxcblx0XHRpdGVtOiBpdGVtLFxuXHRcdGluZGV4OiBpbmRleFxuXHR9KTtcblxuXHR0aGlzLnRyaWdnZXIoe1xuXHRcdHR5cGU6IFwiY2hhbmdlXCIsXG5cdFx0a2luZDogZXZlbnRLaW5kLFxuXHRcdGl0ZW06IGl0ZW0sXG5cdFx0aW5kZXg6IGluZGV4XG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3Rpb247IiwidmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoXCJ5YWVkXCIpO1xudmFyIHhub2RlID0gcmVxdWlyZShcInhub2RlXCIpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZShcImluaGVyaXRzXCIpO1xuXG4vKipcbiAqIENvbGxlY3Rpb25WaWV3LlxuICogQGNsYXNzIENvbGxlY3Rpb25WaWV3XG4gKi9cbmZ1bmN0aW9uIENvbGxlY3Rpb25WaWV3KCkge1xuXHR4bm9kZS5EaXYuY2FsbCh0aGlzKTtcblxuXHR0aGlzLml0ZW1SZW5kZXJlcnMgPSBbXTtcblx0dGhpcy5pdGVtUmVuZGVyZXJDbGFzcyA9IG51bGw7XG5cdHRoaXMuZGF0YVNvdXJjZSA9IG51bGw7XG59XG5cbmluaGVyaXRzKENvbGxlY3Rpb25WaWV3LCB4bm9kZS5EaXYpO1xuXG4vKipcbiAqIFNldCBpdGVtIHJlbmRlcmVyIGNsYXNzLlxuICogQG1ldGhvZCBzZXRJdGVtUmVuZGVyZXJDbGFzc1xuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0SXRlbVJlbmRlcmVyQ2xhc3MgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHR0aGlzLml0ZW1SZW5kZXJlckNsYXNzID0gdmFsdWU7XG5cdHRoaXMucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMoKTtcbn1cblxuLyoqXG4gKiBTZXQgZGF0YSBzb3VyY2UuXG4gKiBAbWV0aG9kIHNldERhdGFTb3VyY2VcbiAqL1xuQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLnNldERhdGFTb3VyY2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRpZiAodGhpcy5kYXRhU291cmNlKSB7XG5cdFx0dGhpcy5kYXRhU291cmNlLm9mZihcImNoYW5nZVwiLCB0aGlzLm9uRGF0YVNvdXJjZUNoYW5nZSwgdGhpcyk7XG5cdH1cblxuXHR0aGlzLmRhdGFTb3VyY2UgPSB2YWx1ZTtcblxuXHRpZiAodGhpcy5kYXRhU291cmNlKSB7XG5cdFx0dGhpcy5kYXRhU291cmNlLm9uKFwiY2hhbmdlXCIsIHRoaXMub25EYXRhU291cmNlQ2hhbmdlLCB0aGlzKTtcblx0fVxuXG5cdHRoaXMucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMoKTtcbn1cblxuLyoqXG4gKiBTb21ldGhpbmcgaW4gdGhlIGRhdGEgc291cmNlIHdhcyBjaGFuZ2VkLlxuICogQG1ldGhvZCBvbkRhdGFTb3VyY2VDaGFuZ2VcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZS5vbkRhdGFTb3VyY2VDaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFJlZnJlc2ggYWxsIGl0ZW0gcmVuZGVyZXJzLlxuICogQG1ldGhvZCByZWZyZXNoQWxsSXRlbVJlbmRlcmVyc1xuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzID0gZnVuY3Rpb24oKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pdGVtUmVuZGVyZXJzLmxlbmd0aDsgaSsrKVxuXHRcdHRoaXMucmVtb3ZlQ2hpbGQodGhpcy5pdGVtUmVuZGVyZXJzW2ldKTtcblxuXHR0aGlzLml0ZW1SZW5kZXJlcnMgPSBbXTtcblxuXHQvL2NvbnNvbGUubG9nKFwicmVmcmVzaC4uXCIpO1xuXG5cdGlmICghdGhpcy5kYXRhU291cmNlKVxuXHRcdHJldHVybjtcblxuXHRpZiAoIXRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MpXG5cdFx0cmV0dXJuO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhU291cmNlLmdldExlbmd0aCgpOyBpKyspIHtcblx0XHR2YXIgZGF0YSA9IHRoaXMuZGF0YVNvdXJjZS5nZXRJdGVtQXQoaSk7XG5cdFx0dmFyIHJlbmRlcmVyID0gdGhpcy5jcmVhdGVJdGVtUmVuZGVyZXJGb3JEYXRhKGRhdGEpO1xuXHRcdHJlbmRlcmVyLnNldERhdGEoZGF0YSk7XG5cblx0XHR0aGlzLml0ZW1SZW5kZXJlcnMucHVzaChyZW5kZXJlcik7XG5cdFx0dGhpcy5hcHBlbmRDaGlsZChyZW5kZXJlcik7XG5cdH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgaXRlbSByZW5kZXJlciBzdWl0YWJsZSBmb3IgcmVuZGVyaW5nIHNwZWNpZmllZCBkYXRhLlxuICogQG1ldGhvZCBjcmVhdGVJdGVtUmVuZGVyZXJGb3JEYXRhXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuY3JlYXRlSXRlbVJlbmRlcmVyRm9yRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0cmV0dXJuIG5ldyB0aGlzLml0ZW1SZW5kZXJlckNsYXNzKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvblZpZXc7IiwidmFyIENvbGxlY3Rpb24gPSByZXF1aXJlKFwiLi4vLi4vc3JjL0NvbGxlY3Rpb25cIik7XG52YXIgQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKFwiLi4vLi4vc3JjL0NvbGxlY3Rpb25WaWV3XCIpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZShcImluaGVyaXRzXCIpO1xudmFyIHhub2RlID0gcmVxdWlyZShcInhub2RlXCIpO1xudmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoXCJ5YWVkXCIpO1xuXG5mdW5jdGlvbiBJdGVtUmVuZGVyZXIoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG5cdHRoaXMuc3R5bGUuaGVpZ2h0ID0gXCI0MHB4XCI7XG5cdHRoaXMuc3R5bGUuYmFja2dyb3VuZCA9IFwiI2ZmMDAwMFwiO1xuXHR0aGlzLnN0eWxlLmJvcmRlckJvdHRvbSA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XG5cblx0dGhpcy5pbnB1dCA9IG5ldyB4bm9kZS5JbnB1dCgpO1xuXHR0aGlzLmlucHV0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLmlucHV0LnN0eWxlLmxlZnQgPSBcIjEwcHhcIjtcblx0dGhpcy5pbnB1dC5zdHlsZS50b3AgPSBcIjEwcHhcIjtcblxuXHR2YXIgc2NvcGUgPSB0aGlzO1xuXG5cdHRoaXMuaW5wdXQub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG5cdFx0c2NvcGUudHJpZ2dlcihcImhlbGxvXCIpO1xuXG5cdFx0Y29uc29sZS5sb2coXCJjaGFuZ2U6IFwiICsgc2NvcGUuaW5wdXQudmFsdWUgKyBcIiBtOiBcIiArIHNjb3BlLml0ZW1Nb2RlbCk7XG5cdFx0aWYgKHNjb3BlLml0ZW1Nb2RlbClcblx0XHRcdHNjb3BlLml0ZW1Nb2RlbC5zZXRWYWx1ZShzY29wZS5pbnB1dC52YWx1ZSk7XG5cdH0pO1xuXG5cdHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5pbnB1dCk7XG5cdC8vXHR0aGlzLmlubmVySFRNTCA9IFwiaGVsbG9cIjtcbn1cblxuaW5oZXJpdHMoSXRlbVJlbmRlcmVyLCB4bm9kZS5EaXYpO1xuRXZlbnREaXNwYXRjaGVyLmluaXQoSXRlbVJlbmRlcmVyKTtcblxuSXRlbVJlbmRlcmVyLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24oaXRlbU1vZGVsKSB7XG5cdHRoaXMuaXRlbU1vZGVsID0gaXRlbU1vZGVsO1xuXHRjb25zb2xlLmxvZyhcInNldHRpbmcgZGF0YVwiKTtcblx0dGhpcy5pbnB1dC52YWx1ZSA9IGl0ZW1Nb2RlbC5nZXRWYWx1ZSgpO1xufVxuXG5mdW5jdGlvbiBJdGVtTW9kZWwodikge1xuXHR0aGlzLnZhbHVlID0gdjtcbn1cblxuSXRlbU1vZGVsLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy52YWx1ZTtcbn1cblxuSXRlbU1vZGVsLnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHYpIHtcblx0dGhpcy52YWx1ZSA9IHY7XG59XG5cbmZ1bmN0aW9uIEFwcCgpIHtcblx0eG5vZGUuRGl2LmNhbGwodGhpcyk7XG5cblx0dGhpcy5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblx0dGhpcy5zdHlsZS5sZWZ0ID0gXCIwXCI7XG5cdHRoaXMuc3R5bGUudG9wID0gXCIwXCI7XG5cdHRoaXMuc3R5bGUucmlnaHQgPSBcIjBcIjtcblx0dGhpcy5zdHlsZS5ib3R0b20gPSBcIjBcIjtcblxuXHR2YXIgYiA9IG5ldyB4bm9kZS5CdXR0b24oXCJ0ZXN0XCIpO1xuXHRiLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHRiLnN0eWxlLmxlZnQgPSBcIjMwMHB4XCI7XG5cdGIuc3R5bGUudG9wID0gXCIxMHB4XCI7XG5cdHRoaXMuYXBwZW5kQ2hpbGQoYik7XG5cdGIub24oXCJjbGlja1wiLCB0aGlzLm9uQnV0dG9uQ2xpY2suYmluZCh0aGlzKSk7XG5cblx0dGhpcy5jb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24oKTtcblx0dGhpcy5jb2xsZWN0aW9uLmFkZEl0ZW0obmV3IEl0ZW1Nb2RlbChcImhlbGxvXCIpKTtcblx0dGhpcy5jb2xsZWN0aW9uLmFkZEl0ZW0obmV3IEl0ZW1Nb2RlbChcIndvcmxkXCIpKTtcblxuXHR0aGlzLmNvbGxlY3Rpb25WaWV3ID0gbmV3IENvbGxlY3Rpb25WaWV3KCk7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc3R5bGUubGVmdCA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLnRvcCA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLndpZHRoID0gXCIyMDBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmJvdHRvbSA9IFwiMTBweFwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc2V0RGF0YVNvdXJjZSh0aGlzLmNvbGxlY3Rpb24pO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnNldEl0ZW1SZW5kZXJlckNsYXNzKEl0ZW1SZW5kZXJlcik7XG5cdHRoaXMuY29sbGVjdGlvblZpZXcuc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xuXHR0aGlzLmFwcGVuZENoaWxkKHRoaXMuY29sbGVjdGlvblZpZXcpO1xuXG5cdGNvbnNvbGUubG9nKFwiY3JlYXRpbmcgYXBwLi4uXCIpO1xufVxuXG5pbmhlcml0cyhBcHAsIHhub2RlLkRpdik7XG5cbkFwcC5wcm90b3R5cGUub25CdXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLmNvbGxlY3Rpb24uYWRkSXRlbShuZXcgSXRlbU1vZGVsKFwidGVzdFwiKSk7XG59XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coXCJ3aW5kb3cgb24gbG9hZCwgY3JlYXRpbmcgYXBwLi5cIik7XG5cblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChuZXcgQXBwKCkpO1xufSJdfQ==
