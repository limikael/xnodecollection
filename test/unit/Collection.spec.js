var Collection = require("../../src/Collection");

describe("Collection", function() {
	it("can add items", function() {
		var c = new Collection();
		var s = "test";

		c.addItem(s);
		expect(c.getLength()).toBe(1);
	});

	it("can find an item index", function() {
		var c = new Collection();
		var s = "test";

		var addSpy = jasmine.createSpy();
		c.on("add", addSpy);

		c.addItem(s);

		expect(c.getItemIndex(s)).toBe(0);
		expect(addSpy).toHaveBeenCalled();
	});

	it("can add at a specific location", function() {
		var c = new Collection();

		c.addItem("test");
		c.addItem("test2");
		c.addItemAt(1, "test3");

		expect(c.getLength()).toBe(3);
		expect(c.items).toEqual(["test", "test3", "test2"])
	});
});