var qsub = require("qsub");
var async = require("async");
var fs = require("fs");

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.registerTask("browserify", function() {
		var done = this.async();

		async.series([

			function(next) {
				var job = new qsub("./node_modules/.bin/browserify");
				job.arg("--debug", "-o", "test/view/collectionviewtest.bundle.js", "test/view/collectionviewtest.js");
				job.show().expect(0);

				job.run().then(next, grunt.fail.fatal);
			},

			function(next) {
				var job = new qsub("./node_modules/.bin/browserify");
				job.arg("--debug", "-o", "test/mvctest/mvctest.bundle.js", "test/mvctest/mvctest.js");
				job.show().expect(0);

				job.run().then(next, grunt.fail.fatal);
			},

			function() {
				done();
			}
		]);
	});

	grunt.registerTask("test", function() {
		var done = this.async();

		async.series([

			function(next) {
				var job = new qsub("./node_modules/.bin/jasmine-node");
				job.arg("--captureExceptions", "--verbose", "test/unit");

				if (grunt.option("match"))
					job.arg("--match", grunt.option("match"));

				job.show().expect(0);

				job.run().then(next, grunt.fail.fatal);
			},

			function() {
				done();
			}
		]);
	});

	grunt.registerTask("default", function() {
		console.log("Available tasks:");
		console.log("");
		console.log("  test          - Run tests on model.");
		console.log("  browserify    - Compile javascript for testing.");
	});
};