/**
  CPU - queue
  Dependency: core, list, button
**/
(function() {
	var modulename = "queue";
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
			data = data || {};
			options = options || {};
			self = this;
			return cpu.module("list").genList(cpu.extend(options, {
				list: data['queue'],
				currentTrack: data['currentTrack'],
				container: options['container'],
				genRow: function(index, item, options) {
					var elem = $('<li></li>');
					elem.addClass('item');
   				elem[(!!options.currentTrack && !!options.currentTrack["id"] && item["id"] == options.currentTrack["id"]) ? 'addClass' : 'removeClass']('current');
					elem.attr('data-index', index);
					elem.attr('data-id', item["id"]);
					elem.attr('data-service', item["service"]);
					elem.attr('data-path', item["path"]);
					elem.addClass('track');
					var title = $('<div></div>');
					title.addClass("title");
					if (cpu.module("config").get("services", item["service"], "icon")) {
						var icon = $('<i>&nbsp;</i>');
						icon.addClass("fa");
						icon.addClass("fa-" + cpu.module("config").get("services", item["service"], "icon"));
						title.append(icon);
					}
				  titleelem = $('<font></font>');
          titleelem.addClass("extra");
          titleelem.text(item["path"]).appendTo(title);
          elem.append(title);
					elem.append(self.genControls());
          elem.append($('<div class="clearfix"></div>'));
					return elem;
				}
			}));
	  };
		module.prototype.genControls = function() {
			var controls = $('<div></div>');
			controls.addClass('pbc');
			controls.append(cpu.module("button").genButton({
				icon: "play",
				attrs: {"data-action": "play"}
			}));
			controls.append(cpu.module("button").genButton({
				icon: "info",
				attrs: {"data-action": "info"}
			}));
			controls.append(cpu.module("button").genButton({
				icon: "download",
				attrs: {"data-action": "save"}
			}));
			controls.append(cpu.module("button").genButton({
				icon: "trash",
				attrs: {"data-action": "remove"}
			}));
			return controls;
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
