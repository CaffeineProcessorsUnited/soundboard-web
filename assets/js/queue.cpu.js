/**
  CPU - queue
  Dependency: core, list, button
**/
(function() {
	var modulename = "list";
  var module = (function(modulename) {
    function module(options) {
      this.name = modulename;
      if (!options["cpu"]) {
        console.log("Can't load module \"" + this.name + "\"! You need to pass the cpu object.");
        return;
      }
      this.cpu = options["cpu"];
    }
    module.prototype.genQueue = function(data, options) {
      
    };
    return module;
  })(modulename);

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = module;
  } else {
    if (!window.cpumodules) {
      window.cpumodules = {};
    }
    window.cpumodules[modulename] = module;
  }
})();
