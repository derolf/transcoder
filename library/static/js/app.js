'use strict';

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

	keyDown : function(keyCode) {
		console.log("Key pressed:" + keyCode);

		switch (keyCode) {
		case 27:
			console.log("ESC");
			break;
		case 84:
		    console.log("TEXT");
		    this.setVideoMode(!this.videoMode);
		    break;
		case 37:
			console.log("LEFT");
		    if ($("#browse").is(":visible"))
			    browser.left();
			break;
		case 39:
			console.log("RIGHT");
			if ($("#browse").is(":visible"))
			    browser.right();
			break;
		case 38:
			console.log("UP");
			if ($("#browse").is(":visible"))
			    browser.up();
			break;
		case 40:
			console.log("DOWN");
			if ($("#browse").is(":visible"))
			    browser.down();
			break;
		case 13:
			console.log("ENTER");
			if ($("#browse").is(":visible")) {
                if (browser.list[browser.current].file) browser.play();
                else browser.go();
            }
			break;
		case 80:
			console.log("PLAY");
    		if ($("#browse").is(":visible"))
	    		browser.play();
			break;
        case 82:
            console.log("RW");
			player.seek(player.currentTime() - 30, 500);
			break;
		case 70:
		    console.log("FF");
		    player.seek(player.currentTime() + 30, 500);
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
			player.stop();
			history.go(0);
			break;
		case 83:
			console.log("STOP");
			playlist.stop();
			break;
		case 32:
			console.log("PAUSE");
			player.pause(!player.paused);
			break;
		default:
			console.log("Unhandled key");
			break;
		}
	}
};

$(function() {
    keyboard.setVideoMode(false);
    $("#browsePlaceholder").on("click", function() {
        console.log("click");
        keyboard.setVideoMode(false);
    });
});

function Samsung() {
	var widgetAPI = new Common.API.Widget();
	var tvKey = new Common.API.TVKeyValue();
    return {
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
	}
};

function Default() {
    return {
		onLoad : function() {
		},

		onUnload : function() {

		},

		keyDown : function() {
			keyboard.keyDown(window.event.keyCode);
		}
	};
};

var main = Default();