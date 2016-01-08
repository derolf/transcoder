'use strict';

function formatSeconds(seconds) {
    seconds = Math.floor(seconds);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);

    seconds%= 60;
    minutes%= 60;

    seconds = ((seconds < 10) ? "0" : "") + seconds;
    minutes = ((minutes < 10) ? "0" : "") + minutes;

    var s = minutes + ":" + seconds;

    if (hours > 0)
        s = hours + ":" + s;

    return s;
}

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

	flashStatus : function() {
	    var that = this;
        $("#status").finish().fadeIn(200).animate({"null":1}, {duration: 2000, done: function(p, j) {
            if (!j && !$(this)[0].always && !that.paused) $(this).fadeOut();
        }});
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

        this.flashStatus();
        this.videoTimeUpdate();
	},

	seek : function(start, delay) {
	    this.play(this.data, start, delay);
	},

	stop : function() {
	    this.play(null);
	},

	playDeferredHandle : null,

    play : function(data, start, delay) {
	    var that = this;

	    if (this.playDeferredHandle) {
	        clearTimeout(this.playDeferredHandle);
	        this.playDeferredHandle = null;
	    }

        start = start || 0;
        delay = delay || 0;

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
            $("#title").text("");
            this.videoTimeUpdate();
        } else {
            $("#title").text(data.path);
            if (!data.file) {
                this.duration = 0;
                this.start = 0;
                this.consumed = 0;
                this.unpauseTime = +new Date().getTime() / 1000;
                this.paused = false;
                this.videoEnded();
                this.videoTimeUpdate();
            } else {
                this.duration = data.duration;
                if (this.duration < 0 ) this.duration = 0;

                if (!start || start < 0)
                    start = 0;
                if (start > this.duration)
                    start = this.duration;

                this.start = start;

                var url = data.media + ".tc?start=" + start;

                this.paused = true;
                video[0].pause();
                this.consumed = 0;
                this.videoTimeUpdate();

                this.playDeferredHandle = setTimeout(function() {
                    that.playDeferredHandle = null;

                    video.attr("src", url);
                    video.load();
                    video[0].play();

                    that.unpauseTime = +new Date().getTime() / 1000;
                    that.paused = false;
                }, delay);
            }
        }
        $("#duration").text(formatSeconds(this.duration));
        $("#positionSlider").attr("max", this.duration);

        this.flashStatus();
    },

	videoEnded : function() {
	    this.pause(true);
		playlist.videoEnded();
	},

	videoTimeUpdate : function() {
        $("#playButton").html(this.paused ? "&#x23f5" : "&#x23f8");
        $("#position").text(formatSeconds(player.currentTime()));
        $("#positionSlider").val(player.currentTime());
	    if (!this.paused && this.currentTime() > this.duration + 1)
	        this.videoEnded();
	}
};

$(function() {
	setInterval(function(){player.videoTimeUpdate();}, 500);
	$("#positionSlider").on("input", function() {
	    player.seek(+$(this).val(), 500);
	});
    $("#video").on("click", function() {
        keyboard.key("t");
    });
    $("#statusPlaceholder").click(function() {
        player.flashStatus();
    });
    $("#playButton").click(function() {
        player.pause(!player.paused);
    });
    $("#rwButton").click(function() {
        player.seek(player.currentTime() - 30, 500);
    });
    $("#ffButton").click(function() {
        player.seek(player.currentTime() + 30, 500);
    });
    $("#stopButton").click(function() {
        playlist.stop();
    });
});
