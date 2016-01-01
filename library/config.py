port= 			8124

# library config

media_folder= 	"media"
root_items=		[ { "name": "Children", "target": "Children" }, { "name": "Parents", "target": "Parents" }, { "name": "Music", "target": "/home/daniel/Music" } ]

media_folder= 	"/mnt/stuff/Public/"
root_items=		[ { "name": "Eltern", "target": "Shared Videos/Videos/Eltern" }, { "name": "Kinder", "target": "Shared Videos/Videos/Kinder" }, { "name": "Music", "target": "Shared Music" }, {"name": "Test Music", "target": "/home/daniel/Music"} ]

#media_folder= 	"/mnt/Public/"
#root_items=		[ { "name": "Eltern", "target": "Shared Videos/Videos/Eltern" }, { "name": "Kinder", "target": "Shared Videos/Videos/Kinder" }, { "name": "Music", "target": "Shared Music" } ]


#transcoder=	"http://192.168.178.52:8123/media/"
#transcoder=	"http://192.168.178.51:8123/media/"
#transcoder=		"http://192.168.178.63:8124/media/"
transcoder=		"/media/"
transcoderMac=	"abc"

# transcoder config

ffmpeg= 		"ffmpeg"

types = {
    "mp3": "audio",
    "jpg": "image",
    "mp4": "video"}


transcode_mime = { 
    "*" : "video/mp4",
    "mp3": "audio/mp3",
    "jpg": "image/jpg"}


ffmpeg_transcode_args = {
    "*" : [ "-f", "mp4", "-strict", "experimental", "-preset", "ultrafast", "-movflags", "frag_keyframe+empty_moov+faststart", "pipe:1" ],
    "mp3": [ "-f", "mp3", "-codec", "copy", "pipe:1" ] }

ffmpeg_poster_args = [ "-f", "mjpeg", "-vf", "scale=512x512", "pipe:1" ]
# "-noaccurate_seek"
