var cpu = new window.cpu();
cpu.loadModule("config");
cpu.loadModule("socket", { io: window.io });
cpu.loadModule("events");
cpu.loadModule("util", { utils: window.util });
cpu.loadModule("background");
cpu.loadModule("list");

cpu.module("events").addEventListener("ready", function(cpu){
  cpu.module("socket").on("connect_error", {
    onreceive: function() {
      cpu.module("util").log("Disconnect");
    }
  });
  cpu.module("socket").on("isPlaying", {
    onreceive: function(data) {
      $('#play')[data["playing"] ? 'addClass' : 'removeClass']('playing');
      $('#play').find(".fa")[data["playing"] ? 'addClass' : 'removeClass']('fa-pause');
      $('#play').find(".fa")[!data["playing"] ? 'addClass' : 'removeClass']('fa-play');
      setLoading("getIsPlaying", false);
    }
  });
  cpu.module("sockets").on("get_queue", {
    onreceive: function(data) {

    }
  });

});
