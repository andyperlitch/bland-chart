all:
	browserify ./examples/basic/start.js -o ./examples/basic/js/bundle.js
	browserify ./examples/scaling/start.js -o ./examples/scaling/js/bundle.js
	lessc ./blandchart.less ./blandchart.css
bundle:
	beefy ./examples/scaling/start.js:bundle.js 8998 -- -t ktbr --debug