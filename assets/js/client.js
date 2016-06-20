//This Filecontinas the main logic of the client
var cpu = new window.cpu();
cpu.loadModule("config");
cpu.loadModule("socket", { io: window.io });
cpu.loadModule("events");
cpu.loadModule("util", { utils: window.util });
cpu.loadModule("background");
cpu.loadModule("list");
cpu.loadModule("button")
cpu.loadModule("queue");

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
      cpu.module("background").set("getIsPlaying", false);
    }
  });
  cpu.module("sockets").on("get_queue", {
    onreceive: function(data) {
      $('.queue') = cpu.module("queue").genQueue(data);
      $('.queue').find('a').on('click', function() {
        var e = $(this);
        var a = e.attr('data-action');
        var i = e.closest('.item');
        var id = i.attr('data-id');
        var index = i.attr('data-index');
        if(a == "play"){
          cpu.module("sockets").emit("playtrack", {
            'id' : id
          });
        } else if (a == "info") {
          //TODO setTimeout(function() { onTrackInfo(i); }, 0);
        } else if (a == "up") {
          cpu.module("sockets").emit("chpos_of_track", {
            'id' : id,
            'newpos' : parseInt(index) - 1
          });
        } else if (a == "down") {
          cpu.module("sockets").emit("chpos_of_track", {
            'id' : id,
            'newpos' : parseInt(index) + 1
          });
        } else if (a == "remove"){
          cpu.module("sockets").emit("delete_track", {
            'id' : id
          });
        } else {
          runtime.log("What do you want from me?");
        }
      });
      cpu.module("background").set("getQueue", false);
    },
    onemit: function() {
      cpu.module("background").set("getQueue", true);
    }
  });

  cpu.module("sockets").on('poll', {
    onreceive : function() {
      cpu.module('util').log("poll");
      cpu.module("sockets").emit("isPlaying");
      cpu.module("sockets").emit("get_queue");
      cpu.module("sockets").emit("getFiles");
      cpu.module("sockets").emit("get_playlist", {
        "name" : undefined
      });
    }
  });

  cpu.module("sockets").on("getDuration", {
    onreceive : function(data) {
      $('.slider').attr('data-duration', data.duration);
      $('.slider').trigger("data-changed");
    }
  });

  cpu.module("sockets").on("get_playlist", {
    onemit : function() {
      cpu.module("background").set("getPlaylist", true);
    }

    onreceive : function(data) {
      $('.playlists') = cpu.module("playlist").genPlaylistList(data);
      $('.playlists').find('a').on('click', function() {
        var e = $(this);
        var a = e.attr('data-action');
        var i = e.closest('.item');
        var id = i.attr('data-id');
        var index = i.attr('data-index');
        if(a == "play"){
          cpu.module("sockets").emit("playPlaylist", {'name': id, 'playing': true});
        } else if (a == "info"){
          //TODO setTimeout(function() { onPlaylistInfo(id); }, 0);
        } else if (a == "save"){
          onSavePlaylist(id);
        } else if (a == "delete"){
          cpu.module("sockets").emit("delete_playlist", {'name': id});  
        } else {
          runtime.log("What do you want from me?");
        }
      });
      cpu.module("background").set("getPlaylist", false);
    }
  });

  function scrollQueueToCurrentItem() {
    current = $('.queue li.current');
    if (current.length && $('#scrolltocurrent').find('.fa').hasClass('fa-toggle-on')) {
      queuepos = $('.queue li:first-child').offset();
      currentpos = $(current[0]).offset();
      $('.queue').animate({
        scrollTop: currentpos.top - queuepos.top
      }, 500);
    }
  }

  function onSavePlaylist(name) {
    if (!name) {
      name = $('#playlistname_input').val();
    }
    if(name != ""){
      socket.emit("save_queue_to_playlist", {"playlistname": name});
      $('#playlistname_input').val("");
    } else {
      window.alert('You need to give the Playlist a name');
    }
  }
});
