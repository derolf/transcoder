MEDIA TRANSCODER / MEDIA LIBRARY

This is a simple PYTHON / FLASK / FFMPEG based media library and on-the-fly transcoding server and frontend. It allows frontends to use the transcoder (probably even sitting on another machine).

INSTALL PYTHON 3.4

http://www.extellisys.com/articles/python-on-debian-wheezy

INSTALL FFMPEG

http://superuser.com/questions/286675/how-to-install-ffmpeg-on-debian

PROBLEMS WITH UTF-8

export LANG='en_US.UTF-8'
export LC_ALL='en_US.UTF-8'

RUN

* start ./library.sh
* navigate to http://localhost:8124
* have fun
