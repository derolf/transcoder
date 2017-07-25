"""Rest api."""
from flask import jsonify, request, Response, abort
import library as L
import json

try:
    FileNotFoundError
except NameError:
    FileNotFoundError = IOError


def init(app):
    """Init restapi."""
    L.init()

    @app.route("/library/", defaults={"path": ""})
    @app.route("/library/<path:path>")  # Returns metadata of path in json format
    def library(path):
        try:
            return jsonify(L.library(path)), 200, {'Access-Control-Allow-Origin': '*'}
        except IOError:
            abort(404)

    @app.route('/media/<path:path>.<regex("\w+"):format>')
    def media_content_tc(path, format):  # Returns media file
        start = float(request.args.get("start") or 0)
        vcodec = request.args.get("vcodec")
        acodec = request.args.get("acodec")
        try:
            mime = L.transcodeMime(format)
            return Response(response=L.transcode(path, start, format, vcodec, acodec), status=200, mimetype=mime,
                            headers={'Access-Control-Allow-Origin': '*', "Content-Type": mime,
                                     "Content-Disposition": "inline", "Content-Transfer-Enconding": "binary"})
        except FileNotFoundError:
            abort(404)

    @app.route('/icon/<path:path>.jpg')
    def media_content_icon(path):  # returns icon file
        try:
            return Response(response=L.icon(path), status=200, mimetype='image/jpg',
                            headers={'Access-Control-Allow-Origin': '*', "Content-Type": "image/jpg",
                                     "Content-Disposition": "inline", "Content-Transfer-Enconding": "binary"})
        except FileNotFoundError:
            abort(404)
