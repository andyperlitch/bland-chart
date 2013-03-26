var assert = require("assert");
var browserify = require("browserify");
var Stream = require('stream');
var fs = require('fs');

describe("the knights templar transform function for browserify", function() {
    
    it("should be a function", function() {
        assert.equal(typeof require('../'),"function");
    });
    
    it("should return a stream", function() {
        var tkr = require('../');
        assert.ok(tkr() instanceof Stream);
    });
    
    it("should be chainable with browserify.transform()", function() {
        var tkr = require('../');
        var bundle = browserify('./file1.js')
        .transform('../index')
        .bundle();
        assert.ok(bundle instanceof Stream);
    });
    
    it("should remove all calls to knights-templar", function(done) {
        var tkr = require('../');
        var bundle = browserify('./test/file1.js')
        .transform(tkr)
        .bundle(
            {
                detectGlobals: true
            }, 
            function(err, src) {
                var regex = /require\('knights-templar'\)/;
                assert(!err);
                assert(src.length > 0);
                assert(!regex.test(src));
                
                done();
            }
        );
    });
    
    
    
})