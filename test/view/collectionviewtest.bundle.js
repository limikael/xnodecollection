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

function ItemRenderer() {
	xnode.Div.call(this);

	this.style.height = "20px";
	this.style.background = "#ff0000";
	//this.style.width = "50%";
	this.innerHTML = "hello";
}

inherits(ItemRenderer, xnode.Div);

ItemRenderer.prototype.setData = function(data) {
	console.log("setting data...");
	this.innerHTML = data+"...";
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
},{"../../src/Collection":4,"../../src/CollectionView":5,"inherits":1,"xnode":2}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy94bm9kZS9zcmMveG5vZGUuanMiLCJub2RlX21vZHVsZXMveWFlZC9zcmMvRXZlbnREaXNwYXRjaGVyLmpzIiwic3JjL0NvbGxlY3Rpb24uanMiLCJzcmMvQ29sbGVjdGlvblZpZXcuanMiLCJ0ZXN0L3ZpZXcvY29sbGVjdGlvbnZpZXd0ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIoZnVuY3Rpb24oKSB7XG5cdC8qKlxuXHQgKiBUaGUgYmFzaWMgeG5vZGUgY2xhc3MuXG5cdCAqIEl0IHNldHMgdGhlIHVuZGVybHlpbmcgbm9kZSBlbGVtZW50IGJ5IGNhbGxpbmdcblx0ICogZG9jdW1lbnQuY3JlYXRlRWxlbWVudFxuXHQgKi9cblx0ZnVuY3Rpb24gWE5vZGUodHlwZSwgY29udGVudCkge1xuXHRcdHRoaXMubm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG5cblx0XHRpZiAoY29udGVudCAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0dGhpcy5ub2RlLmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cdH1cblxuXHQvKipcblx0ICogVGhpcyBtZXRob2QgY3JlYXRlcyBhbiBleHRlbmRlZCBjbGFzcyB1c2luZ1xuXHQgKiB0aGUgWE5vZGUgY2xhc3MgZGVmaW5lZCBhYm92ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KGVsZW1lbnRUeXBlLCBjb250ZW50KSB7XG5cdFx0dmFyIGYgPSBmdW5jdGlvbihjb250ZW50KSB7XG5cdFx0XHRYTm9kZS5jYWxsKHRoaXMsIGVsZW1lbnRUeXBlLCBjb250ZW50KTtcblx0XHR9O1xuXG5cdFx0Zi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFhOb2RlLnByb3RvdHlwZSk7XG5cdFx0Zi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBmO1xuXG5cdFx0cmV0dXJuIGY7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmVhZCBvbmx5IHByb3BlcnR5IHRoYXQgcmV0dXJucyB0aGVcblx0ICogdmFsdWUgb2YgdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgb2YgdGhlXG5cdCAqIHVuZGVybHlpbmcgbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVYTm9kZVJlYWRPbmx5UHJvcGVydHkocHJvcGVydHlOYW1lKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFhOb2RlLnByb3RvdHlwZSwgcHJvcGVydHlOYW1lLCB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5ub2RlW3Byb3BlcnR5TmFtZV07XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlIGEgcmVhZCB3cml0ZSBwcm9wZXJ0eSB0aGF0IG9wZXJhdGVzIG9uXG5cdCAqIHRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnR5IG9mIHRoZSB1bmRlcmx5aW5nXG5cdCAqIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoWE5vZGUucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIHtcblx0XHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm5vZGVbcHJvcGVydHlOYW1lXTtcblx0XHRcdH0sXG5cblx0XHRcdHNldDogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0dGhpcy5ub2RlW3Byb3BlcnR5TmFtZV0gPSB2YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSBtZXRob2QgdGhhdCByb3V0ZXMgdGhlIGNhbGwgdGhyb3VnaCwgZG93blxuXHQgKiB0byB0aGUgc2FtZSBtZXRob2Qgb24gdGhlIHVuZGVybHlpbmcgbm9kZSBvYmplY3QuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVYTm9kZU1ldGhvZChtZXRob2ROYW1lKSB7XG5cdFx0WE5vZGUucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5ub2RlW21ldGhvZE5hbWVdLmFwcGx5KHRoaXMubm9kZSwgYXJndW1lbnRzKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogTW9kaWZ5IHRoZSBOb2RlLnByb3BlcnR5IGZ1bmN0aW9uLCBzbyB0aGF0IGl0IGFjY2VwdHNcblx0ICogWE5vZGUgb2JqZWN0cy4gQWxsIFhOb2RlIG9iamVjdHMgd2lsbCBiZSBjaGFuZ2VkIHRvXG5cdCAqIHRoZSB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0cywgYW5kIHRoZSBjb3JyZXNwb25kaW5nXG5cdCAqIG1ldGhvZCB3aWxsIGJlIGNhbGxlZC5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZU5vZGVUb1hOb2RlTWV0aG9kV3JhcHBlcihtZXRob2ROYW1lKSB7XG5cdFx0dmFyIG9yaWdpbmFsRnVuY3Rpb24gPSBOb2RlLnByb3RvdHlwZVttZXRob2ROYW1lXTtcblxuXHRcdE5vZGUucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRmb3IgKHZhciBhIGluIGFyZ3VtZW50cykge1xuXHRcdFx0XHRpZiAoYXJndW1lbnRzW2FdIGluc3RhbmNlb2YgWE5vZGUpXG5cdFx0XHRcdFx0YXJndW1lbnRzW2FdID0gYXJndW1lbnRzW2FdLm5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBvcmlnaW5hbEZ1bmN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFNldCB1cCByZWFkIG9ubHkgcHJvcGVydGllcy5cblx0ICovXG5cdGNyZWF0ZVhOb2RlUmVhZE9ubHlQcm9wZXJ0eShcInN0eWxlXCIpO1xuXG5cdC8qKlxuXHQgKiBTZXQgdXAgcmVhZC93cml0ZSBwcm9wZXJ0aWVzLlxuXHQgKi9cblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcImlubmVySFRNTFwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcImhyZWZcIik7XG5cdGNyZWF0ZVhOb2RlUmVhZFdyaXRlUHJvcGVydHkoXCJpZFwiKTtcblx0Y3JlYXRlWE5vZGVSZWFkV3JpdGVQcm9wZXJ0eShcInZhbHVlXCIpO1xuXHRjcmVhdGVYTm9kZVJlYWRXcml0ZVByb3BlcnR5KFwidHlwZVwiKTtcblxuXHQvKipcblx0ICogU2V0IHVwIG1ldGhvZHMgdG8gYmUgcm91dGVkIHRvIHRoZSB1bmRlcmx5aW5nIG5vZGUgb2JqZWN0LlxuXHQgKi9cblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJhcHBlbmRDaGlsZFwiKTtcblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJyZW1vdmVDaGlsZFwiKTtcblx0Y3JlYXRlWE5vZGVNZXRob2QoXCJhZGRFdmVudExpc3RlbmVyXCIpO1xuXHRjcmVhdGVYTm9kZU1ldGhvZChcInJlbW92ZUV2ZW50TGlzdGVuZXJcIik7XG5cblx0LyoqXG5cdCAqIFNldCB1cCBtZXRob2RzIG9uIE5vZGUucHJvcGVydHkuXG5cdCAqL1xuXHRjcmVhdGVOb2RlVG9YTm9kZU1ldGhvZFdyYXBwZXIoXCJhcHBlbmRDaGlsZFwiKTtcblx0Y3JlYXRlTm9kZVRvWE5vZGVNZXRob2RXcmFwcGVyKFwicmVtb3ZlQ2hpbGRcIik7XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBldmVudCBsaXN0ZW5lciBhbGlhc2VzLlxuXHQgKi9cblx0WE5vZGUucHJvdG90eXBlLm9uID0gWE5vZGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdFhOb2RlLnByb3RvdHlwZS5vZmYgPSBYTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblxuXHQvKipcblx0ICogV29yayBib3RoIGFzIGEgbnBtIG1vZHVsZSBhbmQgc3RhbmRhbG9uZS5cblx0ICovXG5cdHZhciB0YXJnZXQ7XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IHRhcmdldDtcblx0fSBlbHNlIHtcblx0XHR4bm9kZSA9IHt9O1xuXHRcdHRhcmdldCA9IHhub2RlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBleHRlbmRlZCBjbGFzc2VzLlxuXHQgKi9cblx0dGFyZ2V0LkRpdiA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwiZGl2XCIpO1xuXHR0YXJnZXQuQnV0dG9uID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJidXR0b25cIik7XG5cdHRhcmdldC5VbCA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwidWxcIik7XG5cdHRhcmdldC5MaSA9IGNyZWF0ZUV4dGVuZGVkWE5vZGVFbGVtZW50KFwibGlcIik7XG5cdHRhcmdldC5BID0gY3JlYXRlRXh0ZW5kZWRYTm9kZUVsZW1lbnQoXCJhXCIpO1xuXHR0YXJnZXQuSW5wdXQgPSBjcmVhdGVFeHRlbmRlZFhOb2RlRWxlbWVudChcImlucHV0XCIpO1xufSkoKTsiLCIvKipcbiAqIEFTMy9qcXVlcnkgc3R5bGUgZXZlbnQgZGlzcGF0Y2hlci4gU2xpZ2h0bHkgbW9kaWZpZWQuIFRoZVxuICoganF1ZXJ5IHN0eWxlIG9uL29mZi90cmlnZ2VyIHN0eWxlIG9mIGFkZGluZyBsaXN0ZW5lcnMgaXNcbiAqIGN1cnJlbnRseSB0aGUgcHJlZmVycmVkIG9uZS5cbiAqXG4gKiBUaGUgb24gbWV0aG9kIGZvciBhZGRpbmcgbGlzdGVuZXJzIHRha2VzIGFuIGV4dHJhIHBhcmFtZXRlciB3aGljaCBpcyB0aGVcbiAqIHNjb3BlIGluIHdoaWNoIGxpc3RlbmVycyBzaG91bGQgYmUgY2FsbGVkLiBTbyB0aGlzOlxuICpcbiAqICAgICBvYmplY3Qub24oXCJldmVudFwiLCBsaXN0ZW5lciwgdGhpcyk7XG4gKlxuICogSGFzIHRoZSBzYW1lIGZ1bmN0aW9uIHdoZW4gYWRkaW5nIGV2ZW50cyBhczpcbiAqXG4gKiAgICAgb2JqZWN0Lm9uKFwiZXZlbnRcIiwgbGlzdGVuZXIuYmluZCh0aGlzKSk7XG4gKlxuICogSG93ZXZlciwgdGhlIGRpZmZlcmVuY2UgaXMgdGhhdCBpZiB3ZSB1c2UgdGhlIHNlY29uZCBtZXRob2QgaXRcbiAqIHdpbGwgbm90IGJlIHBvc3NpYmxlIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGxhdGVyLCB1bmxlc3NcbiAqIHRoZSBjbG9zdXJlIGNyZWF0ZWQgYnkgYmluZCBpcyBzdG9yZWQgc29tZXdoZXJlLiBJZiB0aGVcbiAqIGZpcnN0IG1ldGhvZCBpcyB1c2VkLCB3ZSBjYW4gcmVtb3ZlIHRoZSBsaXN0ZW5lciB3aXRoOlxuICpcbiAqICAgICBvYmplY3Qub2ZmKFwiZXZlbnRcIiwgbGlzdGVuZXIsIHRoaXMpO1xuICpcbiAqIEBjbGFzcyBFdmVudERpc3BhdGNoZXJcbiAqL1xuZnVuY3Rpb24gRXZlbnREaXNwYXRjaGVyKCkge1xuXHR0aGlzLmxpc3RlbmVyTWFwID0ge307XG59XG5cbi8qKlxuICogQWRkIGV2ZW50IGxpc3RlbmVyLlxuICogQG1ldGhvZCBhZGRFdmVudExpc3RlbmVyXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHNjb3BlKSB7XG5cdGlmICghdGhpcy5saXN0ZW5lck1hcClcblx0XHR0aGlzLmxpc3RlbmVyTWFwID0ge307XG5cblx0aWYgKCFldmVudFR5cGUpXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRXZlbnQgdHlwZSByZXF1aXJlZCBmb3IgZXZlbnQgZGlzcGF0Y2hlclwiKTtcblxuXHRpZiAoIWxpc3RlbmVyKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIkxpc3RlbmVyIHJlcXVpcmVkIGZvciBldmVudCBkaXNwYXRjaGVyXCIpO1xuXG5cdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGxpc3RlbmVyLCBzY29wZSk7XG5cblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpXG5cdFx0dGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdID0gW107XG5cblx0dGhpcy5saXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuXHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRzY29wZTogc2NvcGVcblx0fSk7XG59XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVyLlxuICogQG1ldGhvZCByZW1vdmVFdmVudExpc3RlbmVyXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgbGlzdGVuZXIsIHNjb3BlKSB7XG5cdGlmICghdGhpcy5saXN0ZW5lck1hcClcblx0XHR0aGlzLmxpc3RlbmVyTWFwID0ge307XG5cblx0aWYgKCF0aGlzLmxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpXG5cdFx0cmV0dXJuO1xuXG5cdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbGlzdGVuZXJPYmogPSBsaXN0ZW5lcnNbaV07XG5cblx0XHRpZiAobGlzdGVuZXIgPT0gbGlzdGVuZXJPYmoubGlzdGVuZXIgJiYgc2NvcGUgPT0gbGlzdGVuZXJPYmouc2NvcGUpIHtcblx0XHRcdGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRpLS07XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFsaXN0ZW5lcnMubGVuZ3RoKVxuXHRcdGRlbGV0ZSB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG59XG5cbi8qKlxuICogRGlzcGF0Y2ggZXZlbnQuXG4gKiBAbWV0aG9kIGRpc3BhdGNoRXZlbnRcbiAqL1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24oZXZlbnQgLyogLi4uICovICkge1xuXHRpZiAoIXRoaXMubGlzdGVuZXJNYXApXG5cdFx0dGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG5cdHZhciBldmVudFR5cGU7XG5cdHZhciBsaXN0ZW5lclBhcmFtcztcblxuXHRpZiAodHlwZW9mIGV2ZW50ID09IFwic3RyaW5nXCIpIHtcblx0XHRldmVudFR5cGUgPSBldmVudDtcblx0XHRsaXN0ZW5lclBhcmFtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdH0gZWxzZSB7XG5cdFx0ZXZlbnRUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50YXJnZXQgPSB0aGlzO1xuXHRcdGxpc3RlbmVyUGFyYW1zID0gW2V2ZW50XTtcblx0fVxuXG5cdGlmICghdGhpcy5saXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKVxuXHRcdHJldHVybjtcblxuXHRmb3IgKHZhciBpIGluIHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuXHRcdHZhciBsaXN0ZW5lck9iaiA9IHRoaXMubGlzdGVuZXJNYXBbZXZlbnRUeXBlXVtpXTtcblx0XHRsaXN0ZW5lck9iai5saXN0ZW5lci5hcHBseShsaXN0ZW5lck9iai5zY29wZSwgbGlzdGVuZXJQYXJhbXMpO1xuXHR9XG59XG5cbi8qKlxuICogSnF1ZXJ5IHN0eWxlIGFsaWFzIGZvciBhZGRFdmVudExpc3RlbmVyXG4gKiBAbWV0aG9kIG9uXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub24gPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cbi8qKlxuICogSnF1ZXJ5IHN0eWxlIGFsaWFzIGZvciByZW1vdmVFdmVudExpc3RlbmVyXG4gKiBAbWV0aG9kIG9mZlxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblxuLyoqXG4gKiBKcXVlcnkgc3R5bGUgYWxpYXMgZm9yIGRpc3BhdGNoRXZlbnRcbiAqIEBtZXRob2QgdHJpZ2dlclxuICovXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQ7XG5cbi8qKlxuICogTWFrZSBzb21ldGhpbmcgYW4gZXZlbnQgZGlzcGF0Y2hlci4gQ2FuIGJlIHVzZWQgZm9yIG11bHRpcGxlIGluaGVyaXRhbmNlLlxuICogQG1ldGhvZCBpbml0XG4gKiBAc3RhdGljXG4gKi9cbkV2ZW50RGlzcGF0Y2hlci5pbml0ID0gZnVuY3Rpb24oY2xzKSB7XG5cdGNscy5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0Y2xzLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXHRjbHMucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQ7XG5cdGNscy5wcm90b3R5cGUub24gPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9uO1xuXHRjbHMucHJvdG90eXBlLm9mZiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub2ZmO1xuXHRjbHMucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnRyaWdnZXI7XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RGlzcGF0Y2hlcjtcbn1cbiIsInZhciBpbmhlcml0cyA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcbnZhciBFdmVudERpc3BhdGNoZXIgPSByZXF1aXJlKFwieWFlZFwiKTtcblxuLyoqXG4gKiBDb2xsZWN0aW9uLlxuICogQGNsYXNzIENvbGxlY3Rpb25cbiAqL1xuZnVuY3Rpb24gQ29sbGVjdGlvbigpIHtcblx0dGhpcy5pdGVtcyA9IFtdO1xufVxuXG5pbmhlcml0cyhDb2xsZWN0aW9uLCBFdmVudERpc3BhdGNoZXIpO1xuXG4vKipcbiAqIEFkZCBpdGVtIGF0IGVuZC5cbiAqIEBtZXRob2QgYWRkSXRlbVxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5hZGRJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXHR0aGlzLml0ZW1zLnB1c2goaXRlbSk7XG5cblx0dGhpcy50cmlnZ2VyQ2hhbmdlKFwiYWRkXCIsIGl0ZW0sIHRoaXMuaXRlbXMubGVuZ3RoIC0gMSk7XG59XG5cbi8qKlxuICogQWRkIGl0ZW0gYXQgaW5kZXguXG4gKiBAbWV0aG9kIGFkZEl0ZW1cbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuYWRkSXRlbUF0ID0gZnVuY3Rpb24oaW5kZXgsIGl0ZW0pIHtcblx0aWYgKGluZGV4IDwgMClcblx0XHRpbmRleCA9IDA7XG5cblx0aWYgKGluZGV4ID4gdGhpcy5pdGVtcy5sZW5ndGgpXG5cdFx0aW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcblxuXHR2YXIgYWZ0ZXIgPSB0aGlzLml0ZW1zLnNwbGljZShpbmRleCk7XG5cdHRoaXMuaXRlbXMucHVzaChpdGVtKTtcblx0dGhpcy5pdGVtcyA9IHRoaXMuaXRlbXMuY29uY2F0KGFmdGVyKTtcblxuXHR0aGlzLnRyaWdnZXJDaGFuZ2UoXCJhZGRcIiwgaXRlbSwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEdldCBsZW5ndGguXG4gKiBAbWV0aG9kIGdldExlbmd0aFxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuaXRlbXMubGVuZ3RoO1xufVxuXG4vKipcbiAqIEdldCBpdGVtIGF0IGluZGV4LlxuICogQG1ldGhvZCBnZXRJdGVtQXRcbiAqL1xuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0SXRlbUF0ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0cmV0dXJuIHRoaXMuaXRlbXNbaW5kZXhdO1xufVxuXG4vKipcbiAqIEZpbmQgaXRlbSBpbmRleC5cbiAqIEBtZXRob2QgZ2V0SXRlbUluZGV4XG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLmdldEl0ZW1JbmRleCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0cmV0dXJuIHRoaXMuaXRlbXMuaW5kZXhPZihpdGVtKTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgaXRlbSBhdC5cbiAqIEBtZXRob2QgcmVtb3ZlSXRlbUF0XG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLnJlbW92ZUl0ZW1BdCA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cdGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5pdGVtcy5sZW5ndGgpXG5cdFx0cmV0dXJuO1xuXG5cdHZhciBpdGVtID0gdGhpcy5nZXRJdGVtQXQoaW5kZXgpO1xuXG5cdHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcblx0dGhpcy50cmlnZ2VyQ2hhbmdlKFwicmVtb3ZlXCIsIGl0ZW0sIGluZGV4KTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgaXRlbS5cbiAqIEBtZXRob2QgcmVtb3ZlSXRlbVxuICovXG5Db2xsZWN0aW9uLnByb3RvdHlwZS5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXHR2YXIgaW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleChpdGVtKTtcblxuXHR0aGlzLnJlbW92ZUl0ZW1BdChpbmRleCk7XG59XG5cbi8qKlxuICogVHJpZ2dlciBjaGFuZ2UgZXZlbnQuXG4gKiBAbWV0aG9kIHRyaWdnZXJDaGFuZ2VcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb24ucHJvdG90eXBlLnRyaWdnZXJDaGFuZ2UgPSBmdW5jdGlvbihldmVudEtpbmQsIGl0ZW0sIGluZGV4KSB7XG5cdHRoaXMudHJpZ2dlcih7XG5cdFx0dHlwZTogZXZlbnRLaW5kLFxuXHRcdGl0ZW06IGl0ZW0sXG5cdFx0aW5kZXg6IGluZGV4XG5cdH0pO1xuXG5cdHRoaXMudHJpZ2dlcih7XG5cdFx0dHlwZTogXCJjaGFuZ2VcIixcblx0XHRraW5kOiBldmVudEtpbmQsXG5cdFx0aXRlbTogaXRlbSxcblx0XHRpbmRleDogaW5kZXhcblx0fSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvbjsiLCJ2YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZShcInlhZWRcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG5cbi8qKlxuICogQ29sbGVjdGlvblZpZXcuXG4gKiBAY2xhc3MgQ29sbGVjdGlvblZpZXdcbiAqL1xuZnVuY3Rpb24gQ29sbGVjdGlvblZpZXcoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuaXRlbVJlbmRlcmVycyA9IFtdO1xuXHR0aGlzLml0ZW1SZW5kZXJlckNsYXNzID0gbnVsbDtcblx0dGhpcy5kYXRhU291cmNlID0gbnVsbDtcbn1cblxuaW5oZXJpdHMoQ29sbGVjdGlvblZpZXcsIHhub2RlLkRpdik7XG5cbi8qKlxuICogU2V0IGl0ZW0gcmVuZGVyZXIgY2xhc3MuXG4gKiBAbWV0aG9kIHNldEl0ZW1SZW5kZXJlckNsYXNzXG4gKi9cbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZS5zZXRJdGVtUmVuZGVyZXJDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MgPSB2YWx1ZTtcblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNldCBkYXRhIHNvdXJjZS5cbiAqIEBtZXRob2Qgc2V0RGF0YVNvdXJjZVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUuc2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh0aGlzLmRhdGFTb3VyY2UpIHtcblx0XHR0aGlzLmRhdGFTb3VyY2Uub2ZmKFwiY2hhbmdlXCIsIHRoaXMub25EYXRhU291cmNlQ2hhbmdlLCB0aGlzKTtcblx0fVxuXG5cdHRoaXMuZGF0YVNvdXJjZSA9IHZhbHVlO1xuXG5cdGlmICh0aGlzLmRhdGFTb3VyY2UpIHtcblx0XHR0aGlzLmRhdGFTb3VyY2Uub24oXCJjaGFuZ2VcIiwgdGhpcy5vbkRhdGFTb3VyY2VDaGFuZ2UsIHRoaXMpO1xuXHR9XG5cblx0dGhpcy5yZWZyZXNoQWxsSXRlbVJlbmRlcmVycygpO1xufVxuXG4vKipcbiAqIFNvbWV0aGluZyBpbiB0aGUgZGF0YSBzb3VyY2Ugd2FzIGNoYW5nZWQuXG4gKiBAbWV0aG9kIG9uRGF0YVNvdXJjZUNoYW5nZVxuICogQHByaXZhdGVcbiAqL1xuQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLm9uRGF0YVNvdXJjZUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzKCk7XG59XG5cbi8qKlxuICogUmVmcmVzaCBhbGwgaXRlbSByZW5kZXJlcnMuXG4gKiBAbWV0aG9kIHJlZnJlc2hBbGxJdGVtUmVuZGVyZXJzXG4gKiBAcHJpdmF0ZVxuICovXG5Db2xsZWN0aW9uVmlldy5wcm90b3R5cGUucmVmcmVzaEFsbEl0ZW1SZW5kZXJlcnMgPSBmdW5jdGlvbigpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLml0ZW1SZW5kZXJlcnMubGVuZ3RoOyBpKyspXG5cdFx0dGhpcy5yZW1vdmVDaGlsZCh0aGlzLml0ZW1SZW5kZXJlcnNbaV0pO1xuXG5cdHRoaXMuaXRlbVJlbmRlcmVycyA9IFtdO1xuXG5cdC8vY29uc29sZS5sb2coXCJyZWZyZXNoLi5cIik7XG5cblx0aWYgKCF0aGlzLmRhdGFTb3VyY2UpXG5cdFx0cmV0dXJuO1xuXG5cdGlmICghdGhpcy5pdGVtUmVuZGVyZXJDbGFzcylcblx0XHRyZXR1cm47XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGFTb3VyY2UuZ2V0TGVuZ3RoKCk7IGkrKykge1xuXHRcdHZhciBkYXRhID0gdGhpcy5kYXRhU291cmNlLmdldEl0ZW1BdChpKTtcblx0XHR2YXIgcmVuZGVyZXIgPSB0aGlzLmNyZWF0ZUl0ZW1SZW5kZXJlckZvckRhdGEoZGF0YSk7XG5cdFx0cmVuZGVyZXIuc2V0RGF0YShkYXRhKTtcblxuXHRcdHRoaXMuaXRlbVJlbmRlcmVycy5wdXNoKHJlbmRlcmVyKTtcblx0XHR0aGlzLmFwcGVuZENoaWxkKHJlbmRlcmVyKTtcblx0fVxufVxuXG4vKipcbiAqIENyZWF0ZSBpdGVtIHJlbmRlcmVyIHN1aXRhYmxlIGZvciByZW5kZXJpbmcgc3BlY2lmaWVkIGRhdGEuXG4gKiBAbWV0aG9kIGNyZWF0ZUl0ZW1SZW5kZXJlckZvckRhdGFcbiAqIEBwcml2YXRlXG4gKi9cbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZS5jcmVhdGVJdGVtUmVuZGVyZXJGb3JEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuXHRyZXR1cm4gbmV3IHRoaXMuaXRlbVJlbmRlcmVyQ2xhc3MoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uVmlldzsiLCJ2YXIgQ29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuLi8uLi9zcmMvQ29sbGVjdGlvblwiKTtcbnZhciBDb2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoXCIuLi8uLi9zcmMvQ29sbGVjdGlvblZpZXdcIik7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKFwiaW5oZXJpdHNcIik7XG52YXIgeG5vZGUgPSByZXF1aXJlKFwieG5vZGVcIik7XG5cbmZ1bmN0aW9uIEl0ZW1SZW5kZXJlcigpIHtcblx0eG5vZGUuRGl2LmNhbGwodGhpcyk7XG5cblx0dGhpcy5zdHlsZS5oZWlnaHQgPSBcIjIwcHhcIjtcblx0dGhpcy5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjZmYwMDAwXCI7XG5cdC8vdGhpcy5zdHlsZS53aWR0aCA9IFwiNTAlXCI7XG5cdHRoaXMuaW5uZXJIVE1MID0gXCJoZWxsb1wiO1xufVxuXG5pbmhlcml0cyhJdGVtUmVuZGVyZXIsIHhub2RlLkRpdik7XG5cbkl0ZW1SZW5kZXJlci5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0Y29uc29sZS5sb2coXCJzZXR0aW5nIGRhdGEuLi5cIik7XG5cdHRoaXMuaW5uZXJIVE1MID0gZGF0YStcIi4uLlwiO1xufVxuXG5mdW5jdGlvbiBBcHAoKSB7XG5cdHhub2RlLkRpdi5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG5cdHRoaXMuc3R5bGUubGVmdCA9IFwiMFwiO1xuXHR0aGlzLnN0eWxlLnRvcCA9IFwiMFwiO1xuXHR0aGlzLnN0eWxlLnJpZ2h0ID0gXCIwXCI7XG5cdHRoaXMuc3R5bGUuYm90dG9tID0gXCIwXCI7XG5cblx0dmFyIGIgPSBuZXcgeG5vZGUuQnV0dG9uKFwidGVzdFwiKTtcblx0Yi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcblx0Yi5zdHlsZS5sZWZ0ID0gXCIzMDBweFwiO1xuXHRiLnN0eWxlLnRvcCA9IFwiMTBweFwiO1xuXHR0aGlzLmFwcGVuZENoaWxkKGIpO1xuXHRiLm9uKFwiY2xpY2tcIiwgdGhpcy5vbkJ1dHRvbkNsaWNrLmJpbmQodGhpcykpO1xuXG5cdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKCk7XG5cdHRoaXMuY29sbGVjdGlvbi5hZGRJdGVtKFwiaGVsbG9cIik7XG5cdHRoaXMuY29sbGVjdGlvbi5hZGRJdGVtKFwid29ybGRcIik7XG5cblx0dGhpcy5jb2xsZWN0aW9uVmlldyA9IG5ldyBDb2xsZWN0aW9uVmlldygpO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLmxlZnQgPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS50b3AgPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS53aWR0aCA9IFwiMjAwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS5ib3R0b20gPSBcIjEwcHhcIjtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnNldERhdGFTb3VyY2UodGhpcy5jb2xsZWN0aW9uKTtcblx0dGhpcy5jb2xsZWN0aW9uVmlldy5zZXRJdGVtUmVuZGVyZXJDbGFzcyhJdGVtUmVuZGVyZXIpO1xuXHR0aGlzLmNvbGxlY3Rpb25WaWV3LnN0eWxlLm92ZXJmbG93ID0gXCJzY3JvbGxcIjtcblx0dGhpcy5hcHBlbmRDaGlsZCh0aGlzLmNvbGxlY3Rpb25WaWV3KTtcblxuXHRjb25zb2xlLmxvZyhcImNyZWF0aW5nIGFwcC4uLlwiKTtcbn1cblxuaW5oZXJpdHMoQXBwLCB4bm9kZS5EaXYpO1xuXG5BcHAucHJvdG90eXBlLm9uQnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5jb2xsZWN0aW9uLmFkZEl0ZW0oXCJ0ZXN0XCIpO1xufVxuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKFwid2luZG93IG9uIGxvYWQsIGNyZWF0aW5nIGFwcC4uXCIpO1xuXG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobmV3IEFwcCgpKTtcbn0iXX0=
