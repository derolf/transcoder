"""Main file and sets up flask."""

from flask import Flask
import config as C
import web
import restlibrary
from werkzeug.routing import BaseConverter


# Initialize the Flask application
app = Flask(__name__)


class RegexConverter(BaseConverter):
    """Regex Converter for routing in Flask."""

    def __init__(self, url_map, *items):
        """Init RegexConverter."""
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app.url_map.converters['regex'] = RegexConverter


@app.after_request
def add_header(response):
    """Add header to response."""
    response.cache_control.max_age = 300
    response.cache_control.no_cache = True
    response.cache_control.must_revalidate = True
    response.cache_control.proxy_revalidate = True
    return response


restlibrary.init(app)
web.init(app)

app.run(host="0.0.0.0", port=C.port, threaded=True, debug=False)
