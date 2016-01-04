'use strict';

var tplPlaylist;

$.get("tpl/playlist.html").success(function(data) {
	tplPlaylist = Handlebars.compile(data);
});


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

	    if (delay < 0) delay= 0;

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
	},

	set : function(index) {
        $("#playlist").finish().fadeIn(200).animate({"null":1}, {duration: 2000, done: function(p, j) {
            if (!j && !$(this)[0].always) $(this).fadeOut();
        }});

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
                        var vitem = {index: i - 0.5, file: false, name: item.data.folder};
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
		    var index = Math.ceil(+$(this).attr("href"));
		    if (index >= 0) {
			    that.set(index);
			    that.play(0);
            }
		});

		var cur = $('#playlist [href="'+this.current+'"]');
		cur.addClass("sel");
		if (cur[0]) cur.scrollIntoView();
	}
};

$(function() {
    $("#playlistPlaceholder").click(function() {
        $("#playlist").finish().fadeIn(200).animate({"null":1}, {duration: 2000, done: function(p, j) {
            if (!j && !$(this)[0].always) $(this).fadeOut();
        }});
    });
});
