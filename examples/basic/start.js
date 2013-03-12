// Set up the chart and datasource
var Chart = require('../../');
var chart = window.chart = new Chart({
    
    max_data: 20,
    viewport_width: 1000,
    viewport_height: 400,
    overview_height: 100
    
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
    chart.plot("point1","#0000CC",0,500, "Point 1");
    chart.plot("point2","#00CC00",0,100, "Point 2");
    
    function genRandomData() {
        var time = +new Date();
        var point1 = Math.round(Math.random() * 500);
        var point2 = Math.round(Math.random() * 100);
        return { time: time, point1: point1, point2: point2 }
    }
    
    // Trigger events
    var intval = setInterval(function(){
        
        var data = genRandomData();
        datasource.trigger("data", data);
        
    }, 2000);
    
    // setTimeout(function(){
    //     clearInterval(intval);
    // },1000)
    
})