'use strict';

// var library = "http://10.223.49.237:8124/library/";
//var library = "http://localhost:8124/library/";
var library = "/library/";

var player = {
    duration: 0,
	start: 0,
	consumed: 0,
	paused: true,
	unpauseTime: null,
	data: null,

	currentTime : function() {
	    var total = this.start + this.consumed;
	    if (!this.paused) total += (+new Date().getTime() / 1000) - this.unpauseTime;
		return total;
	},

	pause : function(paused) {
	    if (paused == this.paused || this.data == null)
	        return;

	    this.paused = paused;

	    var video = $("#video");

	    if (paused) {
	        video[0].pause();

            this.consumed += (+new Date().getTime() / 1000) - this.unpauseTime;
	        this.unpauseTime = null;
	    } else {
	        video[0].play();

	        this.unpauseTime = +new Date().getTime() / 1000;
	    }
	},

	seek : function(start) {
	    this.play(this.data, start);
	},

	stop : function() {
	    this.play(null);
	},

    play : function(data, start) {
        this.data = data;

		console.log("play " + data+ " @ " + start);

        var video = $("#video");

        if (data == null) {
            video.attr("src", "");
            video.load();
            this.duration = 0;
            this.start = 0;
            this.consumed = 0;
            this.paused = true;
        } else {
            if (!data.file) {
                this.duration = 0;
                this.start = 0;
                this.consumed = 0;
                this.unpauseTime = +new Date().getTime() / 1000;
                this.paused = false;
                this.videoEnded();
            } else {
                this.duration = data.duration;
                if (this.duration < 0 ) this.duration = 0;

                if (!start || start < 0)
                    start = 0;
                if (start > this.duration)
                    start = this.duration;

                this.start = start;

                var url = data.media + ".tc?start=" + start;
                video.attr("src", url);
                video.load();
                video[0].play();

                this.consumed = 0;
                this.unpauseTime = +new Date().getTime() / 1000;
                this.paused = false;
            }
        }
    },

	videoEnded : function() {
	    this.pause(true);
		playlist.videoEnded();
	},

	videoTimeUpdate : function() {
	    updateStatus();
	    if (!this.paused && this.currentTime() > this.duration + 1)
	        this.videoEnded();
	}
};

$(function() {
	setInterval(function(){player.videoTimeUpdate();}, 500);
});

function formatSeconds(seconds) {
    seconds = Math.floor(seconds);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 24);

    seconds%= 60;
    minutes%= 60;

    seconds = ((seconds < 10) ? "0" : "") + seconds;
    minutes = ((minutes < 10) ? "0" : "") + minutes;

    var s = minutes + ":" + seconds;

    if (hours > 0)
        s = hours + ":" + s;

    return s;
}

function updateStatus() {
    var context = {}
    context.playing = player.data != null;
    if (context.playing) {
        context.title = player.data.path;
        context.position = formatSeconds(player.currentTime());
        context.duration = formatSeconds(player.duration);
    }
    var next = playlist.current + (playlist.playDeferredHandle ? 0 : 1);
    next = next < playlist.list.length ? playlist.list[next] : null;
    next = next ? next.data : null;
    if (next) {
        context.next = next.path;
    }


    var r = tplStatus(context);
    $('#status').html(r);
}

var playlist = {
	list: new Array(),
	current: 0,
	playPending: false,

	clear : function() {
		this.list.length = 0;
		this.set(0);
		this.play(0);
	},

	currentItem : function() {
		return this.current > this.list.length ? null : this.list[this.current];
	},

	isLast : function() {
		return this.current == this.list.length - 1;
	},

	add: function(url, index, play) {
		var that = this;

		if (index < 0)
			index = this.list.length;
		var item = {
			url : url,
			data : null,
			current : function() {
				return this == that.currentItem();
			},
			index : function() {
				return that.list.indexOf(this);
			},
			expanded : false,
			parent : null
		};
		this.list.splice(index, 0, item);
		this.render();
		if (play) {
		    this.set(index);
		    this.play(0);
		}
		$.getJSON(library + encodeURIComponent(url)).success(function(data) {
			item.data = data;
			item.name = data.path;
			item.folder = data.path;
			if (item.current() && that.playPending) {
				that.play(0);
			}
			that.render();
		});
		return item;
	},

	playDeferredHandle : null,

	play : function(delay) {
	    var that = this;

	    if (this.playDeferredHandle) {
	        clearTimeout(this.playDeferredHandle);
	        this.playDeferredHandle = null;
	    }

	    this.playPending = false;

	    if (delay >= 0) {
	        var index = this.current;
            var item = index >= this.list.length || index < 0 ? null : this.list[index];

            this.playDeferredHandle = setTimeout(function() {
                that.playDeferredHandle = null;

                if (item != null && item.data == null) {
                    // no data yet for this item
                    that.playPending = true;
                }
                else {
                    if (item == null) {
                        player.stop();
                    } else {
                        var index = item.index();
                        var data = item.data;
                        if (!data.file) {
                            for (var i= 0; i < data.items.length; i++) {
                                var child = that.add(data.items[i].path, index + i + 1, false);
                                child.parent = item;
                            }
                            item.expanded = true;
                        }
                        player.play(data, 0);
                    }
                }
            }, delay);
	    }
	},

	set : function(index) {
	    var newItem = this.list[index] || null;
	    if (newItem)
            for (var p = newItem.parent; p != null; p = p.parent) p.keep = true;
        for (var i = this.list.length - 1; i >= 0; i--) {
            var item = this.list[i];
            if (item.parent != null && !item.parent.keep)
                this.list.splice(i, 1);
            if (!item.keep)
                item.expanded = false;
        }
        if (newItem)
            for (var p = newItem; p != null; p = p.parent) delete p.keep;
		this.current = newItem != null ? newItem.index() : null;
		this.render();
    },

	playNext : function(delayed) {
		if (this.current + 1 < this.list.length) {
			this.set(this.current + 1);
			this.play(delayed);
		}
	},

	playPrev : function(delayed) {
		if (this.current - 1 >= 0) {
			this.set(this.current - 1);
			this.play(delayed);
        }
	},

	playFF : function() {
		player.seek(player.currentTime() + 30);
	},

	playRW : function() {
		player.seek(player.currentTime() - 30);
	},

	pauseToggle : function() {
	    player.pause(!player.paused);
	},

	stop : function() {
		this.clear();
	},

	videoEnded : function() {
	    if (this.playDeferredHandle) this.play(0);
	    else this.playNext(0);
	},

	render : function() {
	    var that = this;
	    var context = {list: new Array()};
	    var prevItem = null;
	    for (var i= 0; i < this.list.length; i++) {
	        var item = this.list[i];
	        if (item.data != null) {
	            if (!item.data.file) {
        	        var vitem = {index: i, file: false, name: item.data.path + (item.expanded ? "" : " (...)")};
                    context.list.push(vitem);
	            } else {
                    if (prevItem != null && prevItem.data != null && ((prevItem.data.file && item.data.folder == prevItem.data.folder) || item.data.folder == prevItem.data.path)) {
                    } else {
                        var vitem = {index: -1, file: false, name: item.data.folder};
                        context.list.push(vitem);
                    }
        	        var vitem = {index: i, file: true, name: item.data.name};
                    context.list.push(vitem);
                }
	        } else {
	            var vitem = {index: i, file: true, name: "..."};
	            context.list.push(vitem);
	        }
	        prevItem = item;
	    }
		var r = tplPlaylist(context);
		$('#playlist').html(r);
		$('.playlistItem').on("click", function() {
		    var index = $(this).attr("href");
		    if (index >= 0) {
			    that.set(index);
			    that.play(false);
            }
		});
		var cur = $('#playlist [href="'+this.current+'"]');
		cur.addClass("sel");
		if (cur[0]) cur.scrollIntoView();
	}
};

var tplBrowse, tplPlaylist, tplStatus;

function browse(url) {
	console.log("Browse " + url);
	localStorage.setItem("browse.url", url);
	$('#browse').html("Loading...");
	$.getJSON(library + url).success(function(data) {
		data.hasParent = url.length > 0;
		if (data.hasParent)
			data.parent = url.substring(0, url.lastIndexOf('/'));
		var r = tplBrowse(data);
		$('#browse').html(r);
        $("#browse .item .img").on("click", function() {
            playlist.add($(this).parent().attr("href"), -1, true);
        });
        $("#browse .folder .img").on("click", function() {
            browse($(this).parent().attr("href"));
        });
        $("#browse .folder .play").on("click", function() {
            playlist.add($(this).parent().attr("href"), -1, true);
        });

		$(".tile:first").addClass("sel");
	}).fail(function() {
		browse("");
	});
}

$.get("tpl/browse.html").success(function(data) {
	tplBrowse = Handlebars.compile(data);
});

$.get("tpl/playlist.html").success(function(data) {
	tplPlaylist = Handlebars.compile(data);
});

$.get("tpl/status.html").success(function(data) {
	tplStatus = Handlebars.compile(data);
});

$(function() {
	browse(localStorage.getItem("browse.url") || "");
    $("#status,#video").on("click", function() {
        $("#browse").fadeToggle(200);
        $("#playlist").fadeToggle(200);
        $("#status").fadeToggle(200);
    });
});

var keyboard = {
	keyDown : function(keyCode) {
		console.log("Key pressed:" + keyCode);

		switch (keyCode) {
		case 27:
			console.log("ESC");
			break;
		case 84:
		    console.log("TEXT");
		    $("#browse").fadeToggle(200);
		    $("#playlist").fadeToggle(200);
		    $("#status").fadeToggle(200);
		    break;
		case 37:
			console.log("LEFT");
			var cur = $("#browse .sel");
			var prev = cur.prev();
			if (prev.length) {
				cur.removeClass("sel");
				prev.addClass("sel");
				prev.scrollIntoView();
			}
			break;
		case 39:
			console.log("RIGHT");
			var cur = $("#browse .sel");
			var next = cur.next();
			if (next.length) {
				cur.removeClass("sel");
				next.addClass("sel");
				next.scrollIntoView();
			}
			break;
		case 38:
			console.log("UP");
			var cur = $("#browse .sel");
			var prev = cur.prev().prev().prev().prev().prev();
			if (prev.length) {
				cur.removeClass("sel");
				prev.addClass("sel");
				prev.scrollIntoView();
			}
			break;
		case 40:
			console.log("DOWN");
			var cur = $("#browse .sel");
			var next = cur.next().next().next().next().next();
			if (next.length) {
				cur.removeClass("sel");
				next.addClass("sel");
				next.scrollIntoView();
			}
			break;
		case 13:
			console.log("ENTER");
			$("#browse .sel.item").each(function() {
				playlist.add($(this).attr("href"), -1, true);
			});			
			$("#browse .sel.folder").each(function() {
				browse($(this).attr("href"));
			});
			break;
		case 80:
			console.log("PLAY");
			$("#browse .sel.item").each(function() {
				playlist.add($(this).attr("href"), -1, true);
			});			
			$("#browse .sel.folder").each(function() {
				playlist.add($(this).attr("href"), -1, true);
			});
			break;
			
		case 82:
			playlist.playRW();
			break;
		case 70:
			playlist.playFF();
			break;
		case 187:
			console.log("CH_UP");
			playlist.playPrev(1000);
			break;
		case 189:
			console.log("CH_DN");
			playlist.playNext(1000);
			break;
		case 73:
			playlist.stop();
			history.go(0);
			break;
		case 83:
			console.log("STOP");
			playlist.stop();
			break;
		case 32:
			console.log("PAUSE");
			playlist.pauseToggle();
			break;
		default:
			console.log("Unhandled key");
			break;
		}
	}
};

if (false) {
	var widgetAPI = new Common.API.Widget();
	var tvKey = new Common.API.TVKeyValue();

	var main = {
		onLoad : function() {
		},

		onUnload : function() {
		},

		keyDown : function() {
			var keyCode = window.event.keyCode;
			console.log("Key pressed: " + keyCode);

			switch (keyCode) {
			case tvKey.KEY_RETURN:
			case tvKey.KEY_PANEL_RETURN:
				keyboard.keyDown(27);
				break;
			case tvKey.KEY_LEFT:
				keyboard.keyDown(37);
				break;
			case tvKey.KEY_RIGHT:
				keyboard.keyDown(39);
				break;
			case tvKey.KEY_UP:
				keyboard.keyDown(38);
				break;
			case tvKey.KEY_DOWN:
				keyboard.keyDown(40);
				break;
			case tvKey.KEY_ENTER:
			case tvKey.KEY_PANEL_ENTER:
				keyboard.keyDown(13);
				break;
			case tvKey.KEY_RW:
				keyboard.keyDown(82);
				break;
			case tvKey.KEY_FF:
				keyboard.keyDown(70);
				break;
			case tvKey.KEY_CH_UP:
				keyboard.keyDown(187);
				break;
			case tvKey.KEY_CH_DOWN:
				keyboard.keyDown(189);
				break;
			case tvKey.KEY_INFO:
				keyboard.keyDown(73);
				break;
			case tvKey.KEY_STOP:
				keyboard.keyDown(83);
				break;
			case tvKey.KEY_PAUSE:
				keyboard.keyDown(32);
				break;
			default:
				console.log("Unhandled key");
				break;
			}
		}
	};
} else {
	var main = {
		onLoad : function() {
		},

		onUnload : function() {

		},

		keyDown : function() {
			keyboard.keyDown(window.event.keyCode);
		}
	};
}
