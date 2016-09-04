port= 			8124

# library config

media_folder= 	"/mnt/stuff/Public/"
root_items=		[ { "name": "Eltern", "target": "Shared Videos/Videos/Eltern" }, { "name": "Kinder", "target": "Shared Videos/Videos/Kinder" }, { "name": "Music", "target": "Shared Music" }, {"name": "Test Music", "target": "/home/daniel/Music"}, {"name": "Test Video", "target": "/home/daniel/TEST"} ]

#media_folder= 	"/mnt/Public/"
#root_items=		[ { "name": "Eltern", "target": "Shared Videos/Videos/Eltern" }, { "name": "Kinder", "target": "Shared Videos/Videos/Kinder" }, { "name": "Music", "target": "Shared Music" } ]


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
