from flask import Flask, request, Response, abort, send_file, jsonify
import os, subprocess, re
import config

app = Flask(__name__)

@app.route('/media/<path:path>.js')
def media_content_js(path):
	d= os.path.abspath( os.path.join( config.media_folder, path ) )
	print d
	if not os.path.isfile( d ): abort(404)
	cmdline= list()
	cmdline.append( config.ffmpeg )
	cmdline.append( "-i" )
	cmdline.append( d );
	print cmdline
	duration= -1
	FNULL = open(os.devnull, 'w')
	proc= subprocess.Popen( cmdline, stderr=subprocess.PIPE, stdout=FNULL )
	try:
		for line in iter(proc.stderr.readline,''):
			line= line.rstrip()
			#Duration: 00:00:45.13, start: 0.000000, bitrate: 302 kb/s
			m = re.search('Duration: (..):(..):(..)\...', line)
			if m is not None: duration= int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + 1
	finally:
		proc.kill()
	
	return jsonify(duration=duration)

@app.route('/media/<path:path>.ogv')
def media_content_ogv(path):
	d= os.path.abspath( os.path.join( config.media_folder, path ) )
	print d
	if not os.path.isfile( d ): abort(404)
	start= request.args.get("start") or 0
	print start
	def generate():
		cmdline= list()
		cmdline.append( config.ffmpeg )
		cmdline.append( "-i" )
		cmdline.append( d );
		cmdline.append( "-ss" )
		cmdline.append( str(start) );
		cmdline.extend( config.ffmpeg_args )
		print cmdline
		FNULL = open(os.devnull, 'w')
		proc= subprocess.Popen( cmdline, stdout=subprocess.PIPE, stderr=FNULL )
		try:
			f= proc.stdout
			byte = f.read(512)
			while byte:
				yield byte
				byte = f.read(512)
		finally:
			proc.kill()
		
	return Response(response=generate(),status=200,mimetype='video/ogg',headers={'Access-Control-Allow-Origin': '*', "Content-Type":"video/ogg","Content-Disposition":"inline","Content-Transfer-Enconding":"binary"})

@app.route('/', defaults={"path":"index.html"})
@app.route('/<path:path>')
def static_content(path):
	d= os.path.abspath( os.path.join( config.static_folder, path ) )
	if not os.path.isfile( d ): abort(404)
	return send_file( d )

app.run( host="0.0.0.0",port=config.port, threaded=True, debug=True )
