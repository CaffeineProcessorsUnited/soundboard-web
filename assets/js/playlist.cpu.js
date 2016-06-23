/**
  CPU - playlist
  Dependency: core, list, button
**/
(function() {
	var modulename = "playlist";
  var module = (function(modulename) {
    function module(options) {
      this.name = modulename;
      if (!options["cpu"]) {
        console.log("Can't load module \"" + this.name + "\"! You need to pass the cpu object.");
        return;
      }
      this.cpu = options["cpu"];
    }
    module.prototype.genPlaylistList = function(data, options) {
			data = data || {};
			options = options || {};
			self = this;
			return cpu.module("list").genList(cpu.extend(options, {
        list : data['playlists'],
        genRow : function(index, item, options) {
          var elem = $('<li></li>');
          elem.addClass('item');
          elem.attr('data-index', index);
          elem.attr('data-id', item);
          var title = $('<div></div>');
          title.addClass('title');
          title.text(item);
          elem.append(title);
          elem.append(self.genControls());
          elem.append($('<div class="clearfix"></div>'));
          return elem;
        }
      }));
      return playlistlist;
    };
    module.prototype.genControls = function() {
      var controls = $('<div></div>');
      controls.addClass('pbc');
      controls.append(cpu.module("button").genButton({
        'icon' : 'play',
        'attrs' : {'data-action' : 'play'}
      }));
      controls.append(cpu.module("button").genButton({
        'icon' : 'info',
        'attrs' : {'data-action' : 'info'}
      }));
      controls.append(cpu.module("button").genButton({
        'icon' : 'download',
        'attrs' : {'data-action' : 'save'}
      }));
      controls.append(cpu.module("button").genButton({
        'icon' : 'trash',
        'attrs' : {'data-action' : 'delete'}
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
