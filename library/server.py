from flask import Flask, request, Response, abort, send_file, jsonify
from awake import wol
import os, subprocess, re
import config as C
import library as L
import web
import restlibrary

app = Flask(__name__)

restlibrary.init( app )
web.init( app )

app.run( host="0.0.0.0",port=C.port, threaded=True, debug=False )
