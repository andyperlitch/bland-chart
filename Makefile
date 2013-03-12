all:
	browserify ./examples/basic/start.js -o ./examples/basic/js/bundle.js
	browserify ./examples/scaling/start.js -o ./examples/scaling/js/bundle.js
	lessc ./blandchart.less ./blandchart.css