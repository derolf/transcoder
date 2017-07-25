"""Deals with metadata and icons."""

import threading
import os
import subprocess
import re
import config
import mediaconf
import hashlib
import pickle
import urllib
import time
from threading import Lock

cacheVersion = 4
uniqueLock = Lock()
counter = 0


def utf8(s):
    """Convert to UTF-8."""
    return s.encode("UTF-8")


def unique():
    """Return unique identification number."""
    global uniqueLock
    global counter
    with uniqueLock:
        counter = counter + 1
        return counter


def mapPath(path):
    """Map web path to file path."""
    # extract root folder
    path = os.path.normpath(path)
    path = path.split("/")
    root = path.pop(0)
    path = os.path.join(*path) if len(path) > 0 else ""

    # map root folder
    base = None
    for item in mediaconf.root_items:
        if item["name"] == root:
            base = item["target"]
            break
    if base is None:
        raise FileNotFoundError()

    return os.path.join(mediaconf.media_folder, base + "/" + path if path != "" else base)


def indexFile(path):
    """Index File and creat metadata file."""
    d = mapPath(path)
    key = "cache/" + hashlib.md5(utf8(path)).hexdigest() + ".meta"

    t = os.path.getmtime(d)

    try:
        with open(key, 'rb') as infile:
            meta = pickle.load(infile)

        if meta["path"] == path and meta["time"] == t and meta["cacheVersion"] == cacheVersion:
            return meta
    except:
        pass

    duration = getDuration(path)

    meta = {"duration": duration, "path": path, "time": t, "cacheVersion": cacheVersion}
    tkey = key + ".$" + str(unique())
    with open(tkey, 'wb') as outfile:
        pickle.dump(meta, outfile)

    os.rename(tkey, key)

    return meta


def extractFrameAsJPG(d, start):
    """Return frame of video as jpeg."""
    cmdline = list()
    cmdline.append(config.ffmpeg)
    cmdline.append("-ss")
    cmdline.append(str(start))
    cmdline.append("-i")
    cmdline.append(d)
    cmdline.append("-vframes")
    cmdline.append("1")
    cmdline.extend(config.ffmpeg_poster_args)
    FNULL = open(os.devnull, 'w')
    proc = subprocess.Popen(cmdline, stdout=subprocess.PIPE, stderr=FNULL)
    try:
        f = proc.stdout
        byte = f.read(65536)
        while byte:
            yield byte
            byte = f.read(65536)
    finally:
        proc.kill()

    return


def icon(path):
    """Read and yield chunks of icon file."""
    infile = iconFile(path)
    try:
        byte = infile.read(65536)
        while byte:
            yield byte
            byte = infile.read(65536)
    finally:
        infile.close()


def iconFile(path):
    """Read and create icon file."""
    key = "cache/" + hashlib.md5(utf8(path)).hexdigest() + ".icon"

    d = mapPath(path)
    t = os.path.getmtime(d)

    while True:
        try:
            infile = open(key, 'rb')
            meta = pickle.load(infile)
            if meta["path"] == path and meta["time"] == t and meta["cacheVersion"] == cacheVersion:
                return infile
        except:
            pass

        if not os.path.isfile(d):
            # find any jpg in this folder, but prefer folger.jpg
            jpg = None

            for f in os.listdir(d):
                if os.path.isfile(f):
                    fup = f.lower()
                    if fup == "folder.jpg":
                        jpg = f
                        break
                    if fup.endswith(".jpg"):
                        jpg = f
            if jpg:
                d = os.path.join(d, jpg)
            else:
                # couldn't find any jpg, try the folders
                for f in os.listdir(d):
                    if not os.path.isfile(f):
                        sub = iconFile(path + "/" + f)
                        if len(sub.peek(1)) > 0:
                            return sub

        meta = {"path": path, "time": t, "cacheVersion": cacheVersion}
        tkey = key + ".$" + str(unique())
        with open(tkey, 'wb') as outfile:
            pickle.dump(meta, outfile)
            print("Creating icon for " + path)
            for byte in extractFrameAsJPG(d, 0.1 * getDuration(path)):
                outfile.write(byte)

        os.rename(tkey, key)


def libraryMeta(path, details):
    """Provide meatadata for given path."""
    meta = dict()

    # handle root
    if path == "":
        meta["file"] = False
    else:
        d = mapPath(path)
        file = os.path.isfile(d)

        meta["file"] = file

        if file:
            meta.update({"media": "/media/" + urllib.parse.quote(utf8(path)), "file": True})
            if details:
                meta.update(indexFile(path))

    meta["icon"] = "/icon/" + urllib.parse.quote(utf8(path)) + ".jpg"
    meta["path"] = path

    rslash = path.rsplit("/", 1)
    if len(rslash) < 2:
        meta["folder"] = ""
        meta["name"] = path
    else:
        meta["folder"] = rslash[0]
        meta["name"] = rslash[1]

    return meta


def library(path):
    """Wrapp for libraryMeta."""
    meta = libraryMeta(path, True)

    # handle root
    if path == "":
        items = []
        for item in mediaconf.root_items:
            child = libraryMeta(item["name"], False)
            items.append(child)
        meta["items"] = items
    else:
        d = mapPath(path)
        file = os.path.isfile(d)

        if not file:
            items = []
            for f in os.listdir(d):
                child = libraryMeta(path + "/" + f, False)
                items.append(child)
            items = sorted(items, key=lambda item: item["name"])
            meta["items"] = items

    return meta


def getDuration(path):
    """Figure out duration of a media file using FFmpeg."""
    d = mapPath(path)
    cmdline = list()
    cmdline.append(config.ffmpeg)
    cmdline.append("-i")
    cmdline.append(d)
    duration = -1
    FNULL = open(os.devnull, 'w')
    proc = subprocess.Popen(cmdline, stderr=subprocess.PIPE, stdout=FNULL)
    try:
        for line in proc.stderr:
            line = str(line)
            line = line.rstrip()
            # Duration: 00:00:45.13, start: 0.000000, bitrate: 302 kb/s
            m = re.search('Duration: (..):(..):(..)\...', line)
            if m is not None:
                duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + 1
    finally:
        proc.kill()
    return duration


def transcodeMime(format):
    """Translate file format to Mime type."""
    return config.transcode_mime.get(format) or config.transcode_mime["*"]


def transcode(path, start, format, vcodec, acodec):
    """Transcode in ffmpeg subprocess."""
    d = mapPath(path)
    _, ext = os.path.splitext(d)
    ext = ext[1:]
    # args = config.ffmpeg_transcode_args.get(ext) or
    args = config.ffmpeg_transcode_args["*"]

    cmdline = config.ffmpeg + args.format(str(start), d, format, vcodec, acodec)

    # TODO:
    # make cmdline dynamic
    # add -vn
    # make acodec optional

    """if vcodec:
        if vcodec == "none":
            cmdline.append("-vn")
        else:
            cmdline.append("-vcodec")
            cmdline.append(vcodec)
    if acodec:
        cmdline.append("-acodec")
        cmdline.append(acodec)
    """

    print(cmdline)

    # FNULL = open(os.devnull, 'w')
    proc = subprocess.Popen(cmdline.split(), stdout=subprocess.PIPE)  # , stderr=FNULL)
    try:
        f = proc.stdout
        byte = f.read(65536)
        while byte:
            yield byte
            byte = f.read(65536)
    finally:
        proc.kill()


def refreshLoop():
    """Refresh library every hour."""
    def refresh(path):
        """Refresh path (file and directories)."""
        iconFile(path).close()
        entry = library(path)

        if not entry["file"]:
            # Recrusive indexing
            for child in entry["items"]:
                refresh(child["path"])

    while True:
        print("Refreshing")
        for item in mediaconf.root_items:
            refresh(item["name"])
        print("Refresh done")

        time.sleep(3600)


def init():
    """Start library loading in new thread."""
    t = threading.Thread(target=refreshLoop)
    t.daemon = True  # stop if the program exits
    t.start()
