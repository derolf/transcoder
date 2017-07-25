from flask import Flask, request, Response, abort, send_file
import os

staticfolder = os.path.join(os.path.dirname(__file__), "static")


def parentPath(path):
    path = path.split("/")
    path.pop()
    path = os.path.join(*path) if len(path) > 0 else ""
    print(path)
    return path


def init(app):
    """Init web client page."""
    @app.route("/", defaults={"path": "index.html"})
    @app.route("/<path:path>")
    def staticcontent(path):
        d = os.path.abspath(os.path.join(staticfolder, path))
        if not os.path.isfile(d):
            abort(404)
        return send_file(d)
