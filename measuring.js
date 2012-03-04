// Copyright 2011-2012 Kevin Reid under the terms of the MIT License as detailed
// in the accompanying file README.md or <http://opensource.org/licenses/MIT>.

var measuring = (function () {
  "use strict";
  var measuring = {};
  
  function ViewGroup(label, elements) {
    this.label = label;
    this.elements = elements;
  }
  ViewGroup.prototype.createDisplay = function (document) {
    var container = document.createElement("div");
    if (this.label) {
      var heading = document.createElement("strong"); // TODO block elem
      heading.appendChild(document.createTextNode(this.label));
      container.appendChild(heading);
    }
    var list = document.createElement("ul");
    container.appendChild(list);
    var updaters = [];
    this.elements.forEach(function (thing) {
      var elem = document.createElement("li");
      list.appendChild(elem);
      var subdisplay = thing.createDisplay(document);
      elem.appendChild(subdisplay.element);
      updaters.push(subdisplay.update);
    });
    return {
      element: container,
      update: function () {
        updaters.forEach(function (f) { f(); });
      }
    }
  }
  ViewGroup.prototype.start = function () {
    this.elements.forEach(function (e) { e.start(); });
  };
  ViewGroup.prototype.end = function () {
    this.elements.forEach(function (e) { e.end(); });
  };
  
  function Quantity(label) {
    this.label = label;
  }
  Quantity.prototype.createDisplay = function (document) {
    var container = document.createElement("pre");
    var valueText = document.createTextNode("");
    container.appendChild(document.createTextNode(this.label + ": "));
    container.appendChild(valueText);
    return {
      element: container,
      update: function () {
        valueText.data = String(this.get());
      }.bind(this)
    };
  }
  
  function Timer(label) {
    Quantity.call(this, label);
    
    var t0 = null, value = null;
    this.start = function () {
      t0 = Date.now();
    };
    this.end = function () {
      var t1 = Date.now();
      value = t1 - t0;
    };
    this.get = function () {
      return value;
    };
  }
  Timer.prototype = Object.create(Quantity.prototype);
  
  function Counter(label) {
    Quantity.call(this, label);
    
    var counter = 0, value = null;
    this.inc = function (amount) {
      if (amount === undefined) amount = 1;
      counter += amount;
    };
    this.start = function () {
      counter = 0;
    };
    this.end = function () {
      value = counter;
    };
    this.get = function () {
      return value;
    };
  }
  Counter.prototype = Object.create(Quantity.prototype);
  
  function TaskGroup(label, elements) {
    var timer = new Timer("Time");
    ViewGroup.call(this, label, [timer].concat(elements));
    
    this.start = function () {
      timer.start();
      Object.getPrototypeOf(this).start.call(this);
    };
    this.end = function () {
      timer.end();
      Object.getPrototypeOf(this).end.call(this);
    };
  }
  TaskGroup.prototype = Object.create(ViewGroup.prototype);
  
  measuring.all = new ViewGroup(null, [
    measuring.sim = new TaskGroup("Simulation", []),
    measuring.chunk = new TaskGroup("Chunk calc", []),
    measuring.frame = new TaskGroup("Frame", [
      measuring.vertices = new Counter("Vertices")
    ])
  ]);
  
  return measuring;
}());