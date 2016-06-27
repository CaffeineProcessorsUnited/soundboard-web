/**
  CPU - extra
  Dependency: core
**/
(function() {
	var modulename = "extra";
  var module = (function(modulename) {
    function module(options) {
      this.name = modulename;
      if (!options["cpu"]) {
        console.log("Can't load module \"" + this.name + "\"! You need to pass the cpu object.");
        return;
      }
      this.cpu = options["cpu"];
      this.extra = {};
    }
    module.prototype.getExtra = function(service, path) {
      if (!this.extra[service]) {
        this.extra[service] = {};
      }
      if (!this.extra[service][path]) {
        this.extra[service][path] = this.loadExtra(service, path);
      }
      return this.extra[service][path];
    };
    module.prototype.loadExtra = function(service, path) {
      extra = "";
      switch (service) {
        case "youtube":
          if (!cpu.module("config").get("services", service, "apikey")) {
            cpu.module("util").log("No api key for youtube configured");
            break;
          }
          $.ajax({
            async: false,
            method: "GET",
            url: "https://www.googleapis.com/youtube/v3/videos?part=snippet&key=" + cpu.module("config").get("services", service, "apikey") + "&id=" + path
          }).done(function(data) {
            if (!!data["items"] && data["items"].length > 0 && !!data["items"][0]["snippet"] && !!data["items"][0]["snippet"]["title"]) {
              extra = data["items"][0]["snippet"]["title"];
            }
          });
          break;
        case "filesystem":
          split = path.split("/");
          extra = split[split.length - 1];
          break;
      }
      return extra;
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
