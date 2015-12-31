from flask import jsonify, request, Response, abort
import library as L
from awake import wol
import json

try:
    FileNotFoundError
except NameError:
    FileNotFoundError = IOError



def init(app):
    L.init()

    @app.route('/wakeTranscoder')
    def wakeTranscoder():
        wol.send_magic_packet(C.transcoderMac)

    @app.route("/library/", defaults={"path": ""})
    @app.route("/library/<path:path>")
    def library(path):
        try:
            return jsonify(L.library(path)), 200, {'Access-Control-Allow-Origin': '*'}
        except IOError:
            abort(404)

    @app.route('/media/<path:path>.tc')
    def media_content_tc(path):
        start = float(request.args.get("start") or 0)
        try:
            mime = L.transcodeMime(path)
            return Response(response=L.transcode(path, start), status=200, mimetype=mime,
                            headers={'Access-Control-Allow-Origin': '*', "Content-Type": mime,
                                     "Content-Disposition": "inline", "Content-Transfer-Enconding": "binary"})
        except FileNotFoundError:
            abort(404)

    @app.route('/media/<path:path>.icon')
    def media_content_icon(path):
        try:
            return Response(response=L.icon(path), status=200, mimetype='image/jpg',
                            headers={'Access-Control-Allow-Origin': '*', "Content-Type": "image/jpg",
                                     "Content-Disposition": "inline", "Content-Transfer-Enconding": "binary"})
        except FileNotFoundError:
            abort(404)
