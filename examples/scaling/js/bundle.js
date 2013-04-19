;(function(e,t,n){function r(n,i){if(!t[n]){if(!e[n]){var s=typeof require=="function"&&require;if(!i&&s)return s(n,!0);throw new Error("Cannot find module '"+n+"'")}var o=t[n]={exports:{}};e[n][0](function(t){var i=e[n][1][t];return r(i?i:t)},o,o.exports)}return t[n].exports}for(var i=0;i<n.length;i++)r(n[i]);return r})({1:[function(require,module,exports){
// Set up the chart and datasource
var Chart = require('../../');
var chart = window.chart = new Chart({
    
    max_data: 20,
    viewport_width: 1000,
    viewport_height: 400,
    overview_height: 100,
    id: "akjdsfhalkjdldfkjasdlfkjasd"
    
});
var datasource = _.extend({}, Backbone.Events);

// Set the source
chart.setSource(datasource);

$(function() {
    
    // Set the element
    chart.to(document.getElementById("target"));
    chart.setX("time", function(value){
        return (new Date(value)).toLocaleTimeString(); 
    });
    chart.plot("point1","#0000CC","auto","auto", "Point 1");
    chart.plot("point2","#00CC00","auto","auto", "Point 2");
    
    function genRandomData() {
        var time = +new Date();
        var point1 = 5000 - Math.round(Math.random() * 5000);
        var point2 = Math.round(Math.random() * 100);
        return { time: time, point1: point1, point2: point2 }
    }
    
    // Trigger events
    var intval = setInterval(function(){
        
        var data = genRandomData();
        datasource.trigger("data", data);
        
    }, 1500);
    
    // setTimeout(function(){
    //     clearInterval(intval);
    // },1000)
    
})
},{"../../":2}],2:[function(require,module,exports){
exports = module.exports = require("./lib/models/BlandChart")
},{"./lib/models/BlandChart":3}],3:[function(require,module,exports){
(function(){var BlandChartView = require("../views/BlandChartView");
var Data = require("../collections/Data");
var Plots = require("../collections/Plots");
var BlandChart = Backbone.Model.extend({
    
    defaults: {
        
        // This is the unique ident for this chart. This is used to
        // store stateful info in localStorage, eg. the current width
        // of the viewport, etc.
        id: false,
        
        // Flag indicating if the widget should be active or not.
        // See this.sleep() and this.wakeup()
        asleep: false,
        
        // Set to true if you want the viewport to follow new data
        // as it comes in
        follow: true,
        
        // The key to map x-axis values to
        x_axis_key: undefined,
        x_axis_formatter: undefined,
        
        // Indicates if the x-axis values will be ascending from left to right.
        // See this.setX for more details.
        ascending: true,
        
        // This indicates the render mode for displaying data
        mode: "line",
        
        // Maximum number of points to render in 100px space before 
        // data starts being omitted from rendering.
        max_detail: 10,
        
        // The max number of data points to be held before oldest data gets removed
        max_data: 1000,
        
        // Render an overview of the chart
        overview: true,
        
        // Dimensions of elements
        viewport_width: 500,
        viewport_height: 300,
        overview_height: 100,
        
        // Defines the minimum amount of spacing to have between marks on the axes
        min_spacing_y: 75,
        min_spacing_x: 250,
        
        // Offset/limit of the viewport, in either percentage or x-axis units
        viewport_offset: 0,
        viewport_limit: 100,
        lock_by_units: false,
        
        // Good for stopping the render process during a hover or other user event
        no_render: false
    },
    
    initialize: function() {
        
        // Holds all the keys of data that should be plotted
        this.plots = new Plots([], {
            chart: this
        });
        
        // Holds the event emitter that emits data to plot
        this.source = undefined;
        
        // Set the data collection
        this.data = new Data([],{
            chart: this
        });
        
        // check for stored info
        this.loadStoredInfo();
    },
    
    validate: function(attrs) {
        if (attrs.viewport_width < 0 || attrs.viewport_width > 2000) return "Viewport must have a reasonable width";
    },
    
    loadStoredInfo: function() {
        var chart_id = this.get("id");
        if (!chart_id) return;
        
        // Check for viewport width
        var prevWidth = localStorage.getItem('blandChart.'+chart_id+'.viewport_width');
        if (prevWidth) this.set('viewport_width', prevWidth);
    },
    
    storeValue: function(key, value) {
        var chart_id = this.get("id");
        if (!chart_id) return;
        localStorage.setItem( 'blandChart.'+chart_id+'.'+key, value );
    },
    
    validate: function(attrs) {
        if (attrs.viewport_width < 0) return "viewport width must be 0 or more.";
    },
    
    // This sets the el for the main chart view.
    // Acceptable values for the parameter are a jQuery collection (first element is selected),
    // a DOM Element, or a jQuery selector string.
    to: function(param) {
        
        var el;
        
        if (param instanceof $) {
            el = param[0];
            if (el === undefined) 
                throw new Error("The jQuery group provided to the 'to' method did not contain any elements");
        }
        else if (param instanceof Element) {
            el = param;
        }
        else if (typeof param === "string" ) {
            el = $(param)[0];
            if (el === undefined) 
                throw new Error("The jQuery selector provided to the 'to' method did not return any elements");
        }
        else {
            throw new Error("Please provide the 'to' method with either a jQuery element, a DOM element, or a jQuery selector string.");
        }
        
        // Clean up any previous view
        if (this.view instanceof Backbone.View) {
            this.view.remove();
        }
        
        // Add bland class
        $(el).addClass("bland-chart");
        
        // Create main widget view
        this.view = new BlandChartView({
            el: el,
            model: this
        }).render();
        
    },
    
    // Sets the source to listen to for data. This should be an object with 
    // Backbone Events mixed in. This source should emit 'data' events with 
    // either an object or an array of objects to plot.
    setSource: function(source) {
        
        if (this.source) {
            this.stopListening(this.source);
        }
        
        this.source = source;
        this.listen();
    },
    
    listen: function() {
        if (!this.source) return;
        if (this.get("asleep")) return;
        
        this.listenTo( this.source, "data", function(data) {
            if (this.data.length >= this.get("max_data")) {
                var removeCount = 1;
                if (data instanceof Array) removeCount = data.length;
                while (removeCount > 0) {
                    this.data.shift();
                    removeCount--;
                }
            }
            
            this.data.add(data);
        })
    },
    
    ignore: function() {
        if (!this.source) return;
        this.stopListening();
    },
    
    // Sets the x-axis of the data being plotted.
    // The key parameter indicates the key to look to for x values.
    // The ascending parameter is a boolean value: true for ordering the 
    // x axis values ascending from left to right... false for vise versa
    setX: function(key, formatter, ascending) {
        
        this.set("x_axis_key", key);
        this.set("x_axis_formatter", formatter);
        if (ascending !== undefined) this.set("ascending", !! ascending  );
        
    },
    
    // Tells the chart to plot the key on the data objects.
    // The lowerY and upperY params can either be the string
    // "auto" or numeric values. 
    // The max detail option can be set to override the chart detail value
    // for this specific key. If only two arguments are present,
    // the second is assummed to be this.
    plot: function(key, color, lowerY, upperY, label, max_detail) {
        lowerY = lowerY === undefined ? "auto" : lowerY ;
        upperY = upperY === undefined ? "auto" : upperY ;
        max_detail = max_detail === undefined ? this.get('max_detail') : max_detail ;
        this.plots.add({
            key: key,
            color: color,
            lowerY: lowerY, 
            upperY: upperY,
            max_detail: max_detail,
            label: label || key
        }, {merge: true} );
    },
    
    // Removes plot key from the plots hash.
    unplot: function(key) {
        var model = this.plots.get(key);
        if (model) {
            this.plots.remove(model);
        }
    },
    
    // Completely clears the chart.
    clear: function() {
        this.data.reset([]);
        this.view.render();
    },
    
    // Stops the chart from making any actions. Useful for when the widget is 
    // not currently visible
    sleep: function() {
        this.ignore();
        this.set("asleep",true);
    },
    
    wakeup: function() {
        this.set("asleep",false);
        this.listen();
    },
    
    export: function() {
        
    },
    
    getViewportXExtrema: function() {
        // Get the full range of x values from data collection
        var extrema = this.getFullXExtrema();
        if (extrema === false) return false;
        var full_range = extrema.max - extrema.min;
        // Get the amount to go on the viewport x axis
        var percent_limit = this.get('viewport_limit');
        var x_limit = percent_limit != 0 ? (percent_limit/100)*full_range : full_range ;
        // Get starting point from offset
        var percent_offset = this.get('viewport_offset');
        var x_offset = percent_offset != 0 ? (percent_offset/100)*full_range + extrema.min : extrema.min ;
        return {
            min: x_offset,
            max: x_offset + x_limit
        }
    },
    
    getFullXExtrema: function() {
        if (this.data.length === 0) return false;
        var self = this;
        return _.reduce(this.data, function(memo, value, i, data){
            // console.log("args",arguments);
            var point = data.at(i);
            var x = point.get(self.get('x_axis_key'));
            memo.min = memo.min === undefined ? x : Math.min(memo.min, x) ;
            memo.max = memo.max === undefined ? x : Math.max(memo.max, x) ;
            return memo;
        }, {}, this);
    },
    
    toViewportX: function(real_offset) {
        var extrema = this.getViewportXExtrema();
        var real_range = extrema.max - extrema.min;
        var pixel_range = this.get('viewport_width');
        var x_ratio = real_range === 0 ? 0 : pixel_range/real_range;
        var pixel_offset = (real_offset - extrema.min) * x_ratio;
        return pixel_offset;
    },
    
    scheduleFunction: function(key, fn, delay) {
        this.schedule = this.schedule || {};
        if (this.schedule[key] !== undefined) clearTimeout(this.schedule[key]);
        this.schedule[key] = setTimeout(fn,delay);
    },
    
    unscheduleFunction: function(key) {
        if (this.schedule === undefined) return;
        clearTimeout(this.schedule[key]);
        delete this.schedule[key];
    }
});

exports = module.exports = BlandChart
})()
},{"../views/BlandChartView":4,"../collections/Data":5,"../collections/Plots":6}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
(function(process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

})(require("__browserify_process"))
},{"__browserify_process":7}],5:[function(require,module,exports){
var DataPoint = require("../models/DataPoint");
var ChartData = Backbone.Collection.extend({
    
    model: DataPoint,
    
    initialize: function(models, options) {
        
    },
    
    getYExtrema: function(key) {
        var extrema = {}
        this.each(function(model) {
            var value = model.get(key);
            extrema.min = extrema.min === undefined ? value : Math.min(extrema.min, value) ;
            extrema.max = extrema.max === undefined ? value : Math.max(extrema.max, value) ;
        });
        if (extrema.min === undefined) {
            extrema.min = 0;
            extrema.max = 0;
        }
        return extrema;
    }
    
    
});

exports = module.exports = ChartData
},{"../models/DataPoint":9}],6:[function(require,module,exports){
var Plot = require('../models/Plot');
var Plots = Backbone.Collection.extend({
    
    model: Plot,
    
    initialize: function(models, options) {
        
        this.chart = options.chart;
        this.on("add",function(model){
            model.chart = this.chart;
            model.listenToDataChange(model.chart.data);
            model.setUp();
        });
        this.on("change",function(model){
            model.setUp();
        })
        
    }
    
});
exports = module.exports = Plots
},{"../models/Plot":10}],4:[function(require,module,exports){
var path = require('path');
var BaseView = require('./BaseView');
var Overview = require('./Overview');
var Viewport = require('./Viewport');
var Yaxes = require('./Yaxes');
var Xaxis = require('./Xaxis');
var Resizer = require('./Resizer');


var BlandChartView = BaseView.extend({

    initialize: function() {
        
        // Initialize all subviews
        this.overview = new Overview({ model: this.model, collection: this.model.data });
        this.viewport = new Viewport({ model: this.model, collection: this.model.data });
        this.yaxes = new Yaxes({ model: this.model, collection: this.model.data });
        this.xaxis = new Xaxis({ model: this.model, collection: this.model.data });
        this.resizer = new Resizer({ model: this.model });
        
        // Re-render the entire chart when plots are added or removed,
        // and when the key to the x values has changed.
        this.listenTo(this.model.plots, "add remove", this.render );
        this.listenTo(this.model, "change:x_axis_key change:viewport_width", this.render);
    },
    
    template: Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"chart-yaxes\"></div>\n\n<div class=\"chart-overviewport\">\n\n    <div class=\"chart-resizer\">\n        <div class=\"resizer-grip\"></div>\n        <div class=\"resizer-grip\"></div>\n        <div class=\"resizer-grip\"></div>\n    </div>\n    \n    <div class=\"chart-viewport\"></div>\n    <div class=\"chart-xaxis\"></div>\n    <div class=\"chart-overview\"></div>\n    \n</div>";
  }),
    
    render: function() {
        
        if (this.model.get('no_render')) return;
        
        // Set the base html
        this.$el.html(this.template({})).css({ height: (this.model.get("overview_height") + this.model.get("viewport_height"))+"px"})
        
        // Create all necessary views (with elements)
        if (this.model.get("overview")) this.assign('.chart-overview', this.overview);
        this.assign({
            '.chart-viewport': this.viewport,
            '.chart-yaxes': this.yaxes,
            '.chart-yaxes': this.yaxes,
            '.chart-resizer': this.resizer
        });
        
        // Allow chaining
        return this;
    }
    
});

exports = module.exports = BlandChartView
},{"path":8,"./Overview":11,"./BaseView":12,"./Viewport":13,"./Yaxes":14,"./Xaxis":15,"./Resizer":16}],9:[function(require,module,exports){
var DataPoint = Backbone.Model.extend({

    idAttribute: "__id" // To ensure that data points with the same "id" field do not override each other
    
});

exports = module.exports = DataPoint
},{}],12:[function(require,module,exports){
var BaseView = Backbone.View.extend({
    
    // Assigns a subview to a jquery selector in this view's el
    assign : function (selector, view) {
        var selectors;
        if (_.isObject(selector)) {
            selectors = selector;
        }
        else {
            selectors = {};
            selectors[selector] = view;
        }
        if (!selectors) return;
        _.each(selectors, function (view, selector) {
            view.setElement(this.$(selector)).render();
        }, this);
    }
    
});

exports = module.exports = BaseView
},{}],15:[function(require,module,exports){
var Xaxis = Backbone.View.extend({
    
    initialize: function() {
        this.listenTo(this.model.data, "add", this.render );
    },
    
    render: function() {
        
        if (this.model.get('no_render')) return;
        
        this.$el.empty();
        
        // Get the extrema for the x axis
        var extrema = this.model.getViewportXExtrema();
        if (extrema === false) {
            // TODO: render in a way to show that we are waiting for data.
            return;
        }
        
        // Create the axis
        var $axis = $('<ul></ul>');
        
        // Get the range
        var range = extrema.max - extrema.min;
        
        // Get number of markers to show
        var max_markers = Math.floor( this.model.get("viewport_width") / this.model.get("min_spacing_x"));
        var pixel_increments = this.model.get("viewport_width") / max_markers;
        var value_increments = range / max_markers;

        // Create labels for the axis
        for ( var i = 0; i <= max_markers; i++ ) {
            var value = Math.round(extrema.min + i*value_increments);
            var formatter = this.model.get('x_axis_formatter');
            var display_value = ("function" === typeof formatter) ? formatter(value) : value ;
            
            var $marker = $('<li class="mark">'+display_value+'</li>')
            
            if (i === max_markers) {
                $marker.css("right", "0px").addClass('right')
            } else {
                if (i === 0) {
                    $marker.addClass('bottom');
                }
                var newLeft = i * pixel_increments;
                $marker.css('left', newLeft+"px");
            }
            $marker.appendTo($axis)
        }
        
        // Set height and append to the element
        $axis.appendTo(this.$el);
    }
    
});
exports = module.exports = Xaxis
},{}],16:[function(require,module,exports){
var Resizer = Backbone.View.extend({
    
    events: {
        "mousedown": "grabResizer"
    },
    
    render: function() {
        return this;
    },
    
    grabResizer: function(evt) {
        evt.preventDefault();
        evt.originalEvent.preventDefault();
        
        var self = this;
        var initialX = evt.clientX;
        var initialWidth = this.model.get("viewport_width");
        
        function resize(evt) {
            evt.preventDefault();
            evt.originalEvent.preventDefault();
            var delta = evt.clientX - initialX;
            var newWidth = initialWidth*1 + delta*1;
            self.model.set({"viewport_width":newWidth});
            self.model.storeValue('viewport_width', newWidth);
        }
        
        function release(evt) {
            $(window).off("mousemove", resize);
        }
        
        $(window).one("mouseup", release);
        $(window).on("mousemove", resize);
    }
    
});

exports = module.exports = Resizer
},{}],10:[function(require,module,exports){
var Markers = require('../collections/Markers');
// A Plot is an object that represents a logical grouping of data, i.e.
// data from the same key on incoming json objects. It is used to set the 
// y-axis scale, and convert data values to pixel y-values on the canvas.
var Plot = Backbone.Model.extend({
    
    
    defaults: {

        // Bounds of the Y axis. A string of "auto" means that the 
        // Y axis for this plot should scale with the data
        lowerY: "auto",
        upperY: "auto",
        
        // Maximum number of points to render in 100px space before 
        // data starts being omitted from rendering.
        max_detail: 5,
        
        // Color of the line/bar/etc that will be drawn.
        color: "#000000",
        
        // The label for the plot (will be displayed
        // on the y-axis and on pointinfo boxes)
        label: ""
        
    },
    
    idAttribute: "key",
    
    initialize: function() {
        this.actualLower = this.get("lowerY");
        this.actualUpper = this.get("upperY");
    },
    
    listenToDataChange: function(data) {
        var self = this;
        this.listenTo(data, "add", function() {
            if (self.get('lowerY') === "auto" || self.get('upperY') === "auto") self.setUp();
            else self.trigger("update");
        });
    },
    
    setUp: function() {
        
        // Stores the markers for the y-axis of this plot. 
        this.markers = new Markers([], {
            plot: this
        })
        
        // The markers are generated based on the size of the viewport and the upper
        // and lower bounds of plot y-axis. This will need to be dynamically computed
        // if the values of lowerY and upperY are set to "auto" and not static numbers.
        var lower = this.get('lowerY');
        var upper = this.get('upperY');
        // Object that holds the minimum and maximum values from the dataset
        var extrema;
        var ten_percent;
        if ( lower === "auto" ) {
            extrema = this.chart.data.getYExtrema(this.get("key"));
            // debugger; 
            // 10% on either side of the extremas
            ten_percent = (extrema.max - extrema.min)*0.1;
            if (ten_percent === 0) {
                if (extrema.max !== 0) ten_percent = Math.abs(extrema.max) * 0.1;
                else ten_percent = 1;
            }
            lower = extrema.min - ten_percent;
        }
        if ( upper === "auto" ) {
            extrema = extrema || this.chart.data.getYExtrema(this.get("key"));
            ten_percent = ten_percent || (extrema.max - extrema.min)*0.1 ;
            upper = extrema.max + ten_percent;
        }
        
        // Set the actual bounds
        this.actualLower = lower;
        this.actualUpper = upper;
        
        // Get the range
        var range = upper - lower;
        // Get number of markers to show
        var max_markers = Math.floor( this.chart.get("viewport_height") / this.chart.get("min_spacing_y"));
        var pixel_increments = this.chart.get("viewport_height") / max_markers;
        var value_increments = range / max_markers;
        // Create labels for the axis
        for ( var i = 0; i <= max_markers; i++ ) {
            // Create marker object
            var marker = { 
                top: "auto",
                bottom: i < max_markers ? (i * pixel_increments)+"px" : "auto", 
                label: this.createAxisLabel(i,value_increments, lower, range),
                mark_class: ""
            }
            if (i === max_markers) {
                marker.top = "0";
                marker.mark_class = "top";
            } else if (i === 0) {
                marker.mark_class = "bottom";
            }
            this.markers.add(marker, {merge: true});
        }
        this.trigger("update");
    },
    
    createAxisLabel: function(i, increment, lower, range) {
        
        // TODO: smarter algorithm for rounding labels to their significant digits
        var next = i*increment+lower;
        
        if (increment < 1) return Math.round(next*10)/10;
        else if (increment > 1000000000) return (Math.round(next/10000000)/100)+"B";
        else if (increment > 1000000) return (Math.round(next/10000)/100)+"M";
        else if (increment > 100) return (Math.round(next/100)/10)+"K";
        return Math.round(i*increment);
    },
    
    toViewportY: function(y) {
        // point = { x: [X], y: [Y] }
        // debugger;
        var real_yrange = this.actualUpper - this.actualLower;
        var pixel_yrange = this.chart.get("viewport_height");
        var y_ratio = pixel_yrange / real_yrange;
        var y_pixels = (y-this.actualLower) * y_ratio ;
        // flip to adjust for downward-facing y axis
        var y1 = pixel_yrange - y_pixels ;
        return y1;
    },
    
    serialize: function() {
        var retval = this.toJSON();
        retval.markers = this.markers.toJSON();
        return retval;
    }
});

exports = module.exports = Plot
},{"../collections/Markers":17}],14:[function(require,module,exports){

var Yaxes = Backbone.View.extend({
    
    initialize: function() {
        this.listenTo(this.model.plots, "change update", this.render);
    },
    
    render: function() {
        
        if (this.model.get('no_render')) return;
        
        this.$el.empty();
        this.model.plots.each(this.renderAxis, this);
        
        // Set height and margin-bottom
        this.$el.css( { 
            height: this.model.get("viewport_height")+"px",
            marginBottom: this.model.get("overview_height")+"px" 
        });
        
    },
    
    axis_template: Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n        \n            <li class=\"chart-yaxis-marker "
    + escapeExpression(((stack1 = depth0.mark_class),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" style=\"top: "
    + escapeExpression(((stack1 = depth0.top),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "; bottom:"
    + escapeExpression(((stack1 = depth0.bottom),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ";\">\n                <span class=\"label\">"
    + escapeExpression(((stack1 = depth0.label),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                <span class=\"mark\" style=\"background-color:";
  if (stack2 = helpers.color) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.color; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\"></span>\n            </li>\n    \n        ";
  return buffer;
  }

  buffer += "<div class=\"chart-yaxis\" style=\"color:";
  if (stack1 = helpers.color) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.color; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n    <h3 class=\"yaxis-label\">";
  if (stack1 = helpers.label) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.label; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n    <ul class=\"";
  if (stack1 = helpers.key) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.key; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "-yaxis\">\n    \n        ";
  stack1 = helpers.each.call(depth0, depth0.markers, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    \n    </ul>\n</div>";
  return buffer;
  }),
    
    renderAxis: function(plot) {
        
        // Get height of y axis
        var axis_height = this.model.get("viewport_height");
        
        // Create axis element
        var markup = this.axis_template(plot.serialize());
        markup = markup.trim();
        var $axis = $(markup).appendTo(this.$el);
        
        // Determine the width the ul should be
        var axis_width = 0;
        $(".chart-yaxis-marker",$axis).each(function(i, el){
            var $marker = $(el);
            axis_width = Math.max( axis_width , $marker.width() );
        });
        $axis.find("ul").css("width", axis_width+"px");
        
        // get width of sideways text to size the axis container
        var $label = $(".yaxis-label", $axis);
        var label_width = $label.width()
        $label.css({'right':(axis_width + 10 - label_width/2 + 13)+"px"});
    }
    
});

exports = module.exports = Yaxes
},{}],13:[function(require,module,exports){
var util = require('../util');
var PathPoint = require('./PathPoint');
// The focused viewing area of the chart: 
//    +------------------------------+
//    |                              | 
//    |                              | 
//    |          Viewport            | 
//    |                              | 
//    |                              | 
//    |                              | 
//    +------------------------------+
//    | \__/---\/-\_____/---\/-\/--- |
//    +------------------------------+ 
// 
var Viewport = Backbone.View.extend({
    
    // Re-renders whenever the charting mode is changed and when the plots object gets updated.
    initialize: function() {
        
        this.listenTo(this.model, "change:mode",this.render);
        this.listenTo(this.model.plots, "update", this.render);
        
    },
    
    render: function() {
        if (this.model.get('no_render') ) return;
        var self = this;
        // Get dimensions
        var height = this.model.get("viewport_height");
        var width = this.model.get("viewport_width");
        
        // Create svg canvas, removing any previous
        if ( this.canvas && typeof this.canvas.remove === "function" ) {
            this.canvas.remove();
            delete this.canvas;
        }
        this.canvas = Raphael(
            this.$el.empty().css({width: width+"px", height: height+"px"})[0], 
            width, 
            height
        );
        this.drawGrid(this.model.plots);
        this.drawData(this.collection);
        return this;
    },
    
    drawGrid: function(plots) {
        if (!plots.length) return;
        // Use markers of first plot to create lines
        var plot = plots.at(0);
        plot.markers.each(function(marker){
            if (marker.get("mark_class") === "") {
                var y_value = this.model.get("viewport_height") - parseInt(marker.get("bottom")) - 1;
                var path = ["M","0",y_value, "L", this.model.get("viewport_width"), y_value].join(",");
                var gridline = this.canvas.path(path);
                util.addClass(gridline, "gridline");
                gridline.removeData();
            }
        }, this);
        
    },
    
    drawData: function(data) {
        if (!data.length){
            // TODO: display "waiting for data"
            var rtext = this.canvas.text(this.model.get("viewport_width")/2,10,"Waiting for Data...");
            util.addClass(rtext, "waiting-text");
            // this.model.set('no_render',true);
            return;
        }
        var x_axis_key = this.model.get('x_axis_key');
        var extrema = this.model.getViewportXExtrema();
        var plotPoints = [];
        data.each(function(point){
            var x_value = point.get(x_axis_key);
            if ( x_value >= extrema.min && x_value <= extrema.max ) {
                plotPoints.push(point);
            }
        });
        switch(this.model.get("mode")){
            default:
                this.drawLineGraph(plotPoints, x_axis_key, this.canvas);
            break;
        }
    },
    
    drawLineGraph: function(plotPoints, x_axis_key, canvas) {
        // this._drawLineGraph(plotPoints, x_axis_key, canvas);
        // Cache instance and the x-coordinate conversion function
        var self = this;
        var toX = self.model.toViewportX;
        
        // For each piece of data, there has to be an invisible rectangle 
        // that acts as the interactive (helper) surface. For these we need to create
        // a set.
        var helpers = canvas.set();
        
        // We also need to aggregate info about the individual plots,
        // which we will store here.
        var plot_info = {}
        
        for (var i=0; i < plotPoints.length; i++) {
            var point = plotPoints[i];
            var x_coord = toX.call( self.model,  point.get(x_axis_key) );
            // Start the rect half way between the previous point 
            // and the current point (by averaging the x values)
            var x_start = i === 0 
                ? 0 
                : ( toX.call( self.model,plotPoints[i-1].get(x_axis_key) ) + x_coord ) / 2;
            // End halfway between current and next point
            var x_end = i === (plotPoints.length - 1) 
                ? self.model.get('viewport_width') 
                : (toX.call( self.model,  plotPoints[i+1].get(x_axis_key) ) + x_coord ) / 2;
            // Create the helper object and delegate events
            var helper = canvas.rect(x_start, 0, x_end - x_start, self.model.get('viewport_height') );
            util.addClass( helper, "plot-helper");
            helpers.push( helper );
            
            // Add to each plot set
            this.model.plots.each(function(plot){
                var key = plot.get("key");
                // Check that it has been initialized
                if (plot_info[key] === undefined) {
                    plot_info[key] = { 
                        path: ["M"], 
                        points: canvas.set(),
                        color:plot.get('color')
                    }
                }
                // Get the y coordinate
                var y_coord = plot.toViewportY(point.get(key));
                // Append to the path
                plot_info[key].path.push(x_coord+","+y_coord,"L");
                // Create the point element
                var pathpoint = canvas.circle(x_coord, y_coord, 5);
                util.addClass(pathpoint, "plotpoint").removeData();
                // Add to the set
                plot_info[key].points.push( pathpoint );
                // delegate events
                self.delegatePointEvents.call(self, pathpoint, point, x_axis_key, key, plot);
            });
            
        };
        
        for(var y_key in plot_info) {
            var info = plot_info[y_key];
            var path = info.path;
            var color = info.color;
            var points = info.points;
            
            if (plotPoints.length > 1) {
                var line = canvas.path(path.join(""));
                util.addClass(line, "plotline")
                line.removeData();
                var line_ds = window.line_ds = line.clone();
                util.addClass(line_ds, "plotline_ds").transform("T1,1");
                line.attr("stroke", color);
                line.toFront();
                
            }
            points.attr("stroke", color).toFront();
        }
    },
    
    delegatePointEvents: function(point, model, x_axis_key, y_axis_key, plot) {
        var self = this;
        var $popup = [];
        point
            .mouseover(function(evt){
                self.model.unscheduleFunction("point_mouseout");
                point.animate({"r":10},300, "elastic");
                self.model.set('no_render', true);
                var template = _.template($("#blandchart-tpl-pointinfo").html());
                var x_formatter = self.model.get('x_axis_formatter');
                var json = {
                    label: plot.get("label"),
                    x_key: x_axis_key,
                    x_value: typeof x_formatter === "function" ? x_formatter(model.get(x_axis_key)) : model.get(x_axis_key) ,
                    y_key: y_axis_key,
                    y_value: model.get(y_axis_key),
                    top: evt.clientY - self.$el.offset().top + 10 + window.scrollY,
                    right: self.model.get('viewport_width') - (evt.clientX - self.$el.offset().left) - 50 + + window.scrollX,
                    color: plot.get("color")
                }
                var markup = template(json);
                $popup = $(markup.trim()).appendTo(self.$el);
            })
            .mouseout(function(){
                if ($popup.length) $popup.empty().remove();
                point.animate({"r":5},300, "elastic");
                
                self.model.scheduleFunction("point_mouseout",function(){
                    self.model.set('no_render', false);
                    self.model.view.render();
                }, 1000);
                
            })
        ;
        
    }
});

exports = module.exports = Viewport
},{"../util":18,"./PathPoint":19}],11:[function(require,module,exports){
var BaseView = require('./BaseView');

var Slider = require('./Slider');

var Overview = BaseView.extend({

    template: Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"overview-slider\"></div>\n<div class=\"overview-canvas\"></div>";
  }),

    initialize: function() {
        
        
        
    },
    
    render: function() {
        
        var self = this;
        
        // Get dimensions
        var height = this.model.get("overview_height");
        var width = this.model.get("viewport_width");
        
        // Fill markup
        this.$el.html(this.template({}));

        // Create svg canvas, removing any previous canvas
        if ( this.canvas && typeof this.canvas.remove === "function" ) {
            this.canvas.remove();
            delete this.canvas;
        }
        this.canvas = Raphael(
            this.$(".overview-canvas").css({width: width+"px", height: height+"px"})[0], 
            width, 
            height,
            function() {
                self.insertView("slider")
            }
        );
        
        // Create the scrolling element
        this.setView("slider", new Slider({ model: this.model, el: this.$(".overview-slider")[0] }) );
        
        // clear canvas and make sure width and height are updated
        this.$el.css({"width":width+"px", "height":height+"px"});
        
        return this;
    }
    
});

exports = module.exports = Overview
},{"./BaseView":12,"./Slider":20}],18:[function(require,module,exports){
exports.addClass = function(element, classname) {
    element.node.className ? element.node.className.baseVal = classname : element.node.setAttribute('class',  classname);
    return element;
}
},{}],19:[function(require,module,exports){
// Wrapper for a Raphael circle elements
var PathPoint = Backbone.View.extend({
    
    initialize: function(options) {
        this.canvas = options.canvas;
        this.chart = options.chart;
        this.points = this.canvas.set();
        this.on("hover", this.onhover );
        this.on("mouseout", this.onmouseout );
        this.r = 5;
        this.r_hover = 10;
    },
    
    // Adds a Raphael circle to this view's internal hash
    addPoint:function(circle) {
        circle.attr({"r":this.r});
        this.points.push(circle);
    },
    
    onhover: function() {
        this.allpointviews.forEach(function(view){view.onmouseout()});
        this.points.animate({"r":this.r_hover}, 500, "elastic");
    },
    
    onmouseout: function() {
        this.points.attr({"r":this.r});
    }
    
});
exports = module.exports = PathPoint
},{}],17:[function(require,module,exports){
var Marker = require('../models/Marker');
var Markers = Backbone.Collection.extend({
    
    model: Marker
    
});

exports = module.exports = Markers
},{"../models/Marker":21}],20:[function(require,module,exports){

var Slider = Backbone.View.extend({

    initialize: function() {
        
    },
    
    template: Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"slider-lefthandle\"></div>\n<div class=\"slider-righthandle\"></div>";
  }),
    
    render: function() {
        return this;
    }
    
});

exports = module.exports = Slider
},{}],21:[function(require,module,exports){
var Marker = Backbone.Model.extend({
    
    defaults: {
        // Set to "top" if the mark should be at the top of the number rather than the bottom
        mark_class: "",
        top: "auto",
        bottom: "auto",
        label: ""
    },
    
    initialize: function() {
        
    },
    
    serialize: function() {
        // var obj = {
        //     top: this.get("top"),
        //     bottom: this.get("bottom"),
        //     label: this.get("label"),
        //     mark_class: this.get("mark_class")
        // }
        return this.toJSON();
    }
    
});
exports = module.exports = Marker
},{}]},{},[1])
;