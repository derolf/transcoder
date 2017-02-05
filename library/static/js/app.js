'use strict';

$(function() {
    app.init();
});

function loadObject(id, clsid) {
    var obj = document.createElement("object");
    obj.id = id;
    obj.setAttribute("classid", clsid);
    $("body").append(obj);
    return obj;
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

// var library = "http://10.223.49.237:8124/library/";
//var library = "http://localhost:8124/library/";
var library = "/library/";

var keyboard = {
    videoMode : false,
    statusFadeOutHandle : null,

    setVideoMode : function(videoMode) {
        if (this.statusFadeOutHandle != null) {
            clearTimeout(this.statusFadeOutHandle);
            this.statusFadeOutHandle = null;
        }
        this.videoMode = videoMode;
        if (videoMode) {
            delete $("#status")[0].always;
            delete $("#playlist")[0].always;

            $("#browse").finish().fadeOut();
            $("#playlist").finish().fadeOut();
            $("#status").finish().fadeOut();
            $("#videoBox").removeClass("videoBoxSmall");
        } else {
            $("#status")[0].always = true;
            $("#playlist")[0].always = true;

            $("#browse").finish().fadeIn();
            $("#playlist").finish().fadeIn();
            $("#status").finish().fadeIn();
            $("#videoBox").addClass("videoBoxSmall");
        }
    },

	key : function(key) {
		console.log("Key pressed:" + key);

		switch (key) {
		case "t":
		    this.setVideoMode(!this.videoMode);
		    break;
		case "ArrowLeft":
		    if ($("#browse").is(":visible"))
			    browser.left();
			break;
		case "ArrowRight":
			if ($("#browse").is(":visible"))
			    browser.right();
			break;
		case "ArrowUp":
			if ($("#browse").is(":visible"))
			    browser.up();
			break;
		case "ArrowDown":
			if ($("#browse").is(":visible"))
			    browser.down();
			break;
		case "Enter":
			if ($("#browse").is(":visible")) {
                if (browser.list[browser.current].file) browser.play();
                else browser.go();
            }
			break;
		case "p":
    		if ($("#browse").is(":visible"))
	    		browser.play();
			break;
        case "r":
			player.seek(player.currentTime() - 30, 500);
			break;
		case "f":
		    player.seek(player.currentTime() + 30, 500);
			break;
		case "+":
            playlist.playPrev(1000);
			break;
		case "-":
            playlist.playNext(1000);
			break;
		case "i":
			player.stop();
			history.go(0);
			break;
		case "s":
			playlist.stop();
			break;
		case " ":
			player.pause(!player.paused);
			break;
		default:
		    console.log("unhandled");
			return false;
		}
		return true;
	}
};

function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

var app = {
    keyMap : {},

    init : function() {
        var that = this;

        keyboard.setVideoMode(false);
        $("#browsePlaceholder").on("click", function() {
            keyboard.setVideoMode(false);
        });

        $(document).keydown(function(event) {
            var keyCode = event.key || event.keyCode;
            console.log("Key pressed: " + keyCode);
            var key = that.keyMap[keyCode] || keyCode;
            if (keyboard.key(key))
                event.preventDefault();
        });

        this.initSamsungTVDevice();
    },

    initSamsungTVDevice : function() {
        var that = this;

        console.log("Init Samsung");

        var NNavi = loadObject('pluginObjectNNavi', 'clsid:SAMSUNG-INFOLINK-NNAVI');
        var TVMW = loadObject('pluginObjectTVMW', 'clsid:SAMSUNG-INFOLINK-TVMW');

        NNavi.SetBannerState(2);

        $.getScript("$MANAGER_WIDGET/Common/API/TVKeyValue.js", function() {
            console.log("$MANAGER_WIDGET/Common/API/TVKeyValue.js loaded");

            var tvKey = new Common.API.TVKeyValue();

            var keyMap = that.keyMap;

            keyMap[tvKey.KEY_LEFT] = "ArrowLeft";
            keyMap[tvKey.KEY_RIGHT] = "ArrowRight";
            keyMap[tvKey.KEY_UP] = "ArrowUp";
            keyMap[tvKey.KEY_DOWN] = "ArrowDown";
            keyMap[tvKey.KEY_ENTER] = "Enter";
            keyMap[tvKey.KEY_PANEL_ENTER] = "Enter";
            keyMap[tvKey.KEY_RW] = "r";
            keyMap[tvKey.KEY_FF] = "f";
            keyMap[tvKey.KEY_CH_UP] = "+";
            keyMap[tvKey.KEY_CH_DOWN] = "-";
            keyMap[tvKey.KEY_INFO] = "i";
            keyMap[tvKey.KEY_PLAY] = "p";
            keyMap[tvKey.KEY_STOP] = "s";
            keyMap[tvKey.KEY_PAUSE] = " ";
            keyMap[tvKey.KEY_GUIDE] = "t";
            keyMap[tvKey.KEY_TTX_MIX] = "t";
            keyMap[35] = "t";

            keyMap[tvKey.KEY_VOL_UP] = "VolumeUp";
            keyMap[tvKey.KEY_PANEL_VOL_UP] = "VolumeUp";
            keyMap[tvKey.KEY_VOL_DOWN] = "VolumeDown";
            keyMap[tvKey.KEY_PANEL_VOL_DOWN] = "VolumeDown";

            $.getScript("$MANAGER_WIDGET/Common/API/Plugin.js", function() {
                console.log("$MANAGER_WIDGET/Common/API/Plugin.js loaded");

                var plugin = new Common.API.Plugin();

                plugin.unregistKey(tvKey.KEY_VOL_UP);
                plugin.unregistKey(tvKey.KEY_VOL_DOWN);
                plugin.unregistKey(tvKey.KEY_MUTE);
            });

        });

        $.getScript("$MANAGER_WIDGET/Common/API/Widget.js", function() {
            console.log("$MANAGER_WIDGET/Common/API/Widget.js loaded");

            var widgetAPI = new Common.API.Widget();
            widgetAPI.sendReadyEvent();
        });
    }
}



