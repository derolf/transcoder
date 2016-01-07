'use strict';

var tplBrowse;

var browser = {
    list: new Array(),
    current : 0,

    set : function(index) {
        $($(".tile")[this.current]).removeClass("sel");
        this.current = index;
        $($(".tile")[this.current]).addClass("sel");
        $($(".tile")[this.current]).parent().scrollIntoView();
    },

    left : function() {
        if (this.current > 0) this.set(this.current - 1);
    },

    right : function() {
        if (this.current < this.list.length - 1) this.set(this.current + 1);
    },

    up : function() {
        if (this.current > 3) this.set(this.current - 4);
    },

    down : function() {
        if (this.current < this.list.length - 4) this.set(this.current + 4);
    },


    play : function() {
        playlist.add(this.list[this.current].path, -1, true);
    },

    render : function() {
        var that = this;

        var context = {list: this.list};
        var r = tplBrowse(context);
        $('#browse').html(r);

        $("#browse .img").on("click", function() {
            that.set(+$(this).parent().attr("href"));
            if (that.list[that.current].file) that.play();
            else that.go();
        });

        $("#browse .play").on("click", function() {
            that.set(+$(this).parent().attr("href"));
            that.play();
        });

        $($(".tile")[this.current]).addClass("sel");
    },

    go : function(url) {
        if (url === undefined)
            url = this.list[this.current].path;

        var that = this;

        console.log("Browse " + url);
        localStorage.setItem("browse.url", url);
        $.getJSON(library + url).success(function(data) {
            for (var i = 0; i < data.items.length; i++)
                data.items[i].play = !data.items[i].file;

            if (url.length > 0) {
                data.items.splice(0, 0, {file: false, name: "..", path: url.substring(0, url.lastIndexOf('/'))});
            }

            for (var i = 0; i < data.items.length; i++)
                data.items[i].index = i;

            that.list = data.items;
            that.current = 0;
            that.render();
        }).fail(function() {
            that.go("");
        });
    }
}

$.get("tpl/browse.html").success(function(data) {
	tplBrowse = Handlebars.compile(data);
});

$(function() {
	browser.go(localStorage.getItem("browse.url") || "");
});
