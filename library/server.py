from flask import Flask, request, Response, abort, send_file, jsonify
from awake import wol
import os, subprocess, re
import config as C
import library as L
import web
import restlibrary
from werkzeug.routing import BaseConverter

app = Flask(__name__)


# Initialize the Flask application
app = Flask(__name__)


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app.url_map.converters['regex'] = RegexConverter


@app.after_request
def add_header(response):
    response.cache_control.max_age = 300
    response.cache_control.no_cache = True
    response.cache_control.must_revalidate = True
    response.cache_control.proxy_revalidate = True
    return response

restlibrary.init(app)
web.init(app)

app.run(host="0.0.0.0",port=C.port, threaded=True, debug=False)
