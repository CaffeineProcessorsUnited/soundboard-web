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
cpu.loadModule("playlist");
cpu.loadModule("extra");

cpu.module("events").addEventListener("ready", function(cpu){
  //Definiton off all the socket events
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
  cpu.module("socket").on("get_queue", {
    onreceive: function(cpu, data) {
      console.log(data);
      cpu.module("queue").genQueue(data, { container: $('.queue') });
      $('.queue').find('a').on('click', function() {
        var e = $(this);
        var a = e.attr('data-action');
        var i = e.closest('.item');
        var id = i.attr('data-id');
        var index = i.attr('data-index');
        if(a == "play"){
          emitPlaySelectedTrack(id);
        } else if (a == "info") {
          setTimeout(function() { onTrackInfo(i); }, 0);
        } else if (a == "up") {
          emitMoveTrack(id, parseInt(index) - 1);
        } else if (a == "down") {
          emitMoveTrack(id, parseInt(index) + 1);
        } else if (a == "remove"){
          emitRemoveTrack(id);
        } else {
          cpu.module("util").log("What do you want from me?");
        }
      });
      cpu.module("background").set("getQueue", false);
      scrollQueueToCurrentItem();
    },
    onemit: function() {
      cpu.module("background").set("getQueue", true);
    }
  });
  cpu.module("socket").on('poll', {
    onreceive : function() {
      cpu.module('util').log("poll");
      cpu.module("socket").emit("isPlaying");
      cpu.module("socket").emit("get_queue");
      cpu.module("socket").emit("getFiles");
      cpu.module("socket").emit("get_playlist", {
        "name" : undefined
      });
    }
  });
  cpu.module("socket").on("getDuration", {
    onreceive : function(cpu, data) {
      $('.slider').attr('data-duration', data.duration);
      console.log("trigger trigger");
      $('.slider').trigger("data-changed");
    }
  });
  cpu.module("socket").on("durationChanged", {
    onreceive : function() {
      cpu.socket("socket").emit("getDuration")
    }
  });
  cpu.module("socket").on("getPlaybackTime", {
    onreceive: function(cpu, data) {
      if ($('.slider').attr('data-dragging') !== "1") {
        $('.slider').attr('data-time', data.time);
        $('.slider').trigger("data-changed");
      }
    }
  });
  cpu.module("socket").on("playbackTimeChanged", {
    onreceive: function() {
      cpu.module("socket").emit("getPlaybackTime");
    }
  });
  cpu.module("socket").on("get_playlist", {
    onemit : function() {
      cpu.module("background").set("getPlaylist", true);
    },
    onreceive : function(cpu, data) {
      cpu.module("playlist").genPlaylistList(data, { container: $('.playlists') });
      $('.playlists').find('a').on('click', function() {
        var e = $(this);
        var a = e.attr('data-action');
        var i = e.closest('.item');
        var id = i.attr('data-id');
        var index = i.attr('data-index');
        if(a == "play"){
          emitLoadPlaylist(id);
        } else if (a == "info"){
          setTimeout(function() { emitPlaylistInfo(id); }, 0);
        } else if (a == "save"){
          emitSavePlaylist(id);
        } else if (a == "delete"){
          emitDeletePlaylist(id);
        } else {
          runtime.log("What do you want from me?");
        }
      });
      cpu.module("background").set("getPlaylist", false);
    }
  });
  cpu.module("socket").on("getFiles", {
    onemit : function() {
      cpu.module("background").set("getFiles", true);
    },

    onreceive : function(cpu, data) {
      generate_filelist($($('.files li')[0]), data["files"]);
      $($('.files li')[0]).find("ul").each(function() {
        $(this).children().last().addClass("lastChild");
      });
      $('#filesystem .fm .files .collapse').each(function() {
        CollapsibleLists.applyTo(this);
      });
      $('.files li').find('a').on('click', function() {
        var e = $(this);
        var path = e.attr('data-path');
        $('#filesystem-path').val(path);
      });
      cpu.module("background").set("getFiles", false);
    }
  });
  cpu.module("socket").on("get_playlist_tracks", {
    onreceive: function(cpu, data) {
      if (!!data["tracks"]) {
        tracks = data["tracks"];
        list = $('<ul></ul>');
        tracks.forEach(function (track, i) {
          //cpu.module("util").log(track);
          var row = $('<li></li>');
          var elem = $('<a href="#"></a>');
          elem.attr('data-service', track["service"]);
          elem.attr('data-path', track["path"]);
          elem.addClass('track');
          elem.addClass('item');
          if (cpu.module("config").get("services", track["service"], "icon")) {
            var icon = $('<i>&nbsp;</i>');
            icon.addClass("fa");
            icon.addClass("fa-" + cpu.module("config").get("services", track["service"], "icon"));
            elem.append(icon);
          }
          var path = $('<span></span>');
          path.addClass("extra");
          elem.append(path);
          row.append(elem);
          list.append(row);
        });
        list.find('a').on('click', function() {
          var e = $(this);
          setTimeout(function() { onTrackInfo(e); }, 0);
        });
        $('#playlistinfo .content').empty();
        $('#playlistinfo .content').append(list);
        $('#playlistinfo .title').text(data["playlist"]);
        updateExtras();
        $('#playlistinfo').addClass("show");
        $('#page').addClass("modal-open");
      }
    }
  });
  cpu.module("socket").on("get_config", {
    onreceive: function(cpu, remoteconfig) {
      cpu.module("config").load(remoteconfig);
      emitUpdate();
    }
  });

  //Definitons of all functions that do stuff only the client needs
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
  function clearInput() {
    $('#serviceSelector .tab').each(function() {
      service = $(this).attr("data-service");
      if (!!service) {
        $('#' + service + '-path').val("");
      }
    });
  }
  function generate_filelist(parent, data, title) {
    ulclass = "";
    if (title === undefined) {
      title = "Files";
      ulclass = "collapse";
    }
    //runtime.log(title);
    parent.empty();
    if (typeof data === "object") {
      parent.append($('<i>' + title + '</i>'));
      if (!isEmpty(data)) {
        var ul = $('<ul></ul>');
        if (ulclass != "") {
          ul.addClass(ulclass);
        }
        for (var k in data) {
          if (data.hasOwnProperty(k)) {
              var childs = $('<li></li>');
              generate_filelist(childs, data[k], k);
              ul.append(childs);
          }
        }
        parent.append(ul);
      }
    } else {
      //runtime.log(title + " => " + data);
      $('<a></a>').attr('data-path', data).attr('href', "#").text(title).appendTo(parent);
      //parent.append($('<a data-path="' + data + '" href="#">' + title + '</a>'));
    }
  }
  function onTrackInfo(item) {
    id = item.attr('data-id');
    service = item.attr('data-service');
    path = item.attr('data-path');
    extra = cpu.module("extra").getExtra(service, path);
    extra = (extra === "") ? path : extra;
    var elem = $('<div></div>');
    elem.attr('data-service', service);
    elem.attr('data-path', path);
    elem.addClass('track');
    var servicetitle = $('<h4></h4>');
    servicetitle.text("Service:");
    elem.append(servicetitle);
    if (cpu.module("config").get("services", service, "name") && cpu.module("config").get("services", service, "icon")){
      var servicewrapper = $('<div></div>');
      var icon = $('<i>&nbsp;</i>');
      icon.addClass("fa");
      icon.addClass("fa-" + cpu.module("config").get("services", service, "icon"));
      servicewrapper.append(icon);
      var servicename = $('<font></font>');
      servicename.text(cpu.module("config").get("services", service, "name"));
      servicewrapper.append(servicename);
      elem.append(servicewrapper);
    }
    var pathtitle = $('<h4></h4>');
    pathtitle.text("Path:");
    elem.append(pathtitle);
    var pathwrapper = $('<div></div>');
    pathwrapper.text(path);
    elem.append(pathwrapper);
    $('#trackinfo .content').empty();
    $('#trackinfo .content').append(elem);
    $('#trackinfo .title').text(extra);
    updateExtras();
    $('#trackinfo').addClass("show");
    $('#page').addClass("modal-open");
  }

  //Definitons of functions for emiting Data to server
  function emitPlayPause() {
    if ($('#play').hasClass('playing')) {
      emitPause();
    } else {
      emitPlay();
    }
  }
  function emitPause() {
    cpu.module("socket").emit('pause');
    cpu.module("socket").emit('isPlaying');
  }
  function emitPlay() {
    cpu.module("socket").emit('play');
    cpu.module("socket").emit('isPlaying');
  }
  function emitNext(){
    cpu.module("socket").emit('next', { "force": true });
  }
  function emitPrev() {
    cpu.module("socket").emit('prev', { "force": true });
  }
  function emitPlayTitle(){
    //runtime.log("send track");
    service = $('#serviceSelector').attr("data-service");
    path = $('#' + service + '-path').val();
    cpu.module("socket").emit("add_track", {"service": service, "path": path,'next': true});
    clearInput();
  }
  function emitAddToQueue() {
    service = $('#serviceSelector').attr("data-service");
    path = $('#' + service + '-path').val();
    cpu.module("socket").emit("add_track", {"service": service, "path": path + "",'next': false});
    clearInput();
  }
  function emitClearQueue() {
    cpu.module("socket").emit("clear_queue");
  }
  function emitStop() {
    cpu.module("socket").emit("stop");
  }
  function emitLoadPlaylist(name) {
    cpu.module("socket").emit("playPlaylist", {'name': name, 'playing': true});
  }
  function emitPlaylistInfo(name) {
    cpu.module("socket").emit("get_playlist", {"name": name});
  }
  function emitSavePlaylist(name) {
    if (!name) {
      name = $('#playlistname_input').val();
    }
    if(name != ""){
        cpu.module("socket").emit("save_queue_to_playlist", {"playlistname": name});
        $('#playlistname_input').val("");
    } else {
      window.alert('You need to give the Playlist a name');
    }
  }
  function emitDeletePlaylist(name) {
    cpu.module("socket").emit("delete_playlist", {'name': name});
  }
  function emitToggleShuffle() {
    cpu.module("socket").emit('toggleShuffle');
    cpu.module("socket").emit('get_queue');
  };
  function emitToggleRepeat() {
    cpu.module("socket").emit('toggleRepeat');
    cpu.module("socket").emit('get_queue');
  }
  function emitPlaySelectedTrack(id) {
    cpu.module("socket").emit('playtrack',{'id':id});
  }
  function emitSavePlaylist(name) {
    if (!name) {
      name = $('#playlistname_input').val();
    }
    if(name != ""){
      cpu.module("socket").emit("save_queue_to_playlist", {"playlistname": name});
      $('#playlistname_input').val("");
    } else {
      window.alert('You need to give the Playlist a name');
    }
  }
  function emitUpdate() {
    cpu.module("socket").emit("update");
  }
  function emitRemoveTrack(id) {
    cpu.module("socket").emit("delete_track", {'id': id});
    cpu.module("socket").emit("get_queue");
  }
  function emitMoveTrack(id, newpos) {
    socket.emit("chpos_of_track",{'id':id,'newpos':newpos});
    socket.emit("get_queue");
  }
  function updateExtras() {
    $('.extra').each(function(i) {
      e = $(this);
      data = e.closest('.track');
      service = data.attr('data-service');
      path = data.attr('data-path');
      extra = cpu.module("extra").getExtra(service, path);
      //console.log(service + "//" + path + "='" + extra + "'");
      e.text((extra === "") ? path : extra);
    });
  }
  function isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;
    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  }

  //Adding clicklistener to Buttons
  $('#refresh').on('click', emitUpdate);
  $('#prev').on('click', emitPrev);
  $('#next').on('click', emitNext);
  $('#play').on('click', emitPlayPause);
  $('#play_track').on('click', emitPlayTitle);
  $('#add_to_queue').on('click', emitAddToQueue);
  $('#clear_queue').on('click', emitClearQueue);
  $('#stop').on('click', emitStop);
  $('#save_queue_to_playlist').on('click', emitSavePlaylist);
  $('#repeat').on('click', emitToggleRepeat);
  $('#shuffle').on('click', emitToggleShuffle);
  $('#scrolltocurrent').on('click', function() {
    var e = $(this);
    var fa = e.find('.fa');
    if (fa.hasClass("fa-toggle-on")) {
      fa.addClass("fa-toggle-off");
      fa.removeClass("fa-toggle-on");
    } else {
      fa.addClass("fa-toggle-on");
      fa.removeClass("fa-toggle-off");
    }
    scrollQueueToCurrentItem();
  });
  $('.modal .controls a').on('click', function() {
    $(this).closest('.modal').removeClass("show");
    if ($('.modal.show').length == 0) {
      $('#page').removeClass("modal-open");
    }
  });


  $('.tabcontrol').each(function() {
    tabcontrol = $(this);
    tabcontrol.bind('redraw', function() {
      if (!!$(this).attr("data-tab")) {
        $(this).find(".tab").removeClass("active");
        $(this).find(".tab#" + $(this).attr("data-tab")).addClass("active");
      } else {
        tabs = $(this).find(".tab");
        if (tabs.length) {
          $(this).trigger("setTab", [ $(tabs[0]).attr("id") ]);
        }
      }
    });
    tabcontrol.bind('setTab', function(event, id) {
      tab = $(this).find(".tab#" + id);
      $(this).find('.wrapper .nav a').removeClass("active");
      $(this).find('.wrapper .nav a[data-id="' + id + '"]').addClass("active");
      if (tab.length) {
        $(this).attr("data-tab", id);
        $(this).attr("data-service", tab.attr("data-service"));
        $(this).trigger("redraw");
      }
    });
    var nav = tabcontrol.find(".wrapper .nav");
    if (nav.length) {
      nav = $(nav[0]);
      tabcontrol.find(".tab").each(function() {
        tab = $(this);
        id = tab.attr("id");
        link = $('<a href="#" data-id="' + id + '"></a>');
        link.html(tab.find(".title").html());
        link.bind("click", { tabcontrol: tabcontrol }, function(event) {
          event.data.tabcontrol.trigger("setTab", [ $(this).attr("data-id") ]);
        });
        item = $('<li></li>');
        item.append(link);
        nav.append(item);
      });
      tabcontrol.trigger("setTab", [ (!!tabcontrol.attr("data-tab")) ? tabcontrol.attr("data-tab") : $(tabcontrol.find(".tab")[0]).attr("id") ]);
    }
  });
  $('.modal .overlay').on("click", function() {
    $(this).closest('.modal').removeClass("show");
    if ($('.modal.show').length == 0) {
      $('#page').removeClass("modal-open");
    }
  });
  $('.bubble').mousedown(function() {
    $(this).parent().attr('data-dragging', "1");
  });
  interact('.bubble').draggable({
    onmove: function(event) {
      var max = event.target.parentNode.getAttribute('data-duration');
      if (max === undefined) {
        return;
      }
      var target = event.target;
      var parent = target.parentNode;

      var x = (parseFloat(parent.getAttribute('data-x')) || 0) + event.dx;
      var sliderStyle = window.getComputedStyle(parent, null);
      var sliderWidth = parseInt(sliderStyle.getPropertyValue("width"));
      var borderLeft = parseInt(sliderStyle.getPropertyValue('border-left-width'));
      var borderRight = parseInt(sliderStyle.getPropertyValue('border-right-width'));
      var borderWidth = borderLeft + borderRight;
      var targetStyle = window.getComputedStyle(target, null);
      var targetWidth = parseInt(targetStyle.getPropertyValue("width"));
      var width = sliderWidth - targetWidth - borderWidth;

      if (x < 0) {
        x = 0;
      }
      if (x > width) {
        x = width;
      }
      time = max * (x / width);
      parent.setAttribute('data-time', time);
      $(parent).trigger("data-changed");
    },
    onend: function (event) {
      var target = event.target;
      target.parentNode.setAttribute('data-dragging', "0");
      console.log({ 'position': event.target.parentNode.getAttribute('data-time') || -1 });
      socket.emit("seek", { 'position': event.target.parentNode.getAttribute('data-time') || -1 });
    }
  });
  $('.slider').on('data-changed', function() {
    function s2time(time) {
      // leading zero
      function l0(n) {
        if (n < 10) {
          return "0" + n;
        }
        return n;
      }
      var h = Math.floor(time / 3600);
      var m = Math.floor((time - (h * 3600)) / 60);
      var s = Math.floor(time - (h * 3600) - (m * 60));
      return h + ":" + l0(m) + ":" + l0(s);
    }

    var parent = $(this);
    var target = parent.find('.bubble');

    var max = parseInt(parent.attr('data-duration'));
    var time = parseInt(parent.attr('data-time'));

    var sliderStyle = window.getComputedStyle(parent[0], null);
    var sliderWidth = parseInt(sliderStyle.getPropertyValue("width"));
    var borderLeft = parseInt(sliderStyle.getPropertyValue('border-left-width'));
    var borderRight = parseInt(sliderStyle.getPropertyValue('border-right-width'));
    var borderWidth = borderLeft + borderRight;
    var targetStyle = window.getComputedStyle(target[0], null);
    var targetWidth = parseInt(targetStyle.getPropertyValue("width"));
    var width = sliderWidth - targetWidth - borderWidth;

    if (time < 0) {
      time = 0;
    }
    if (time > max) {
      time = max;
    }

    var x = width * (time / max);

    parent.attr('data-x', x);
    target.css('left', x);
    parent.attr('data-time', time.toFixed());
    parent.attr('data-progress', s2time(time) + " / " + s2time(max));

  });
  $('.slider').trigger("data-changed");

  cpu.module("socket").emit("get_config");

  $(window).bind('beforeunload', function(){
    return 'Leaving the page will wipe the cached data.\nIf you want to reload use the reload button on the page.\n\nDo u want to leave the page?';
  });
});
