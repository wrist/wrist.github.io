#!/usr/bin/env python
# vim:fileencoding=utf-8

"""extract base64 encoded image and pcm and save them into specified directories.
   [usage] $ python ./ipynb_convert.py ipynb_file img_dir wav_dir
"""

import os
import sys
import json
import base64
import copy
from pprint import pprint as pp

import bs4


def main(argv):
    ipynb_file = argv[1]
    img_out_dir = argv[2]
    wav_out_dir = argv[3]

    if not os.path.exists(img_out_dir):
        os.makedirs(img_out_dir)

    if not os.path.exists(wav_out_dir):
        os.makedirs(wav_out_dir)

    # ipynb_json = json.loads("".join(open(ipynb_file, "r").readlines()))
    with open(ipynb_file, "r") as fp:
        ipynb_json = json.load(fp)
        pp(ipynb_json.keys())

        # pp(ipynb_json["metadata"])
        # pp(ipynb_json["nbformat"])
        # pp(ipynb_json["nbformat_minor"])

        new_json = copy.deepcopy(ipynb_json)

        png_count = 0
        wav_count = 0
        # ==================================================
        # start loop
        # ==================================================
        for i, cell in enumerate(ipynb_json["cells"]):
            if cell["cell_type"] == "code":
                new_cell = copy.deepcopy(cell)

                for j, output in enumerate(cell["outputs"]):
                    if "data" in output and "image/png" in output["data"]:
                        png_b64 = output["data"]["image/png"]
                        png_bin = base64.b64decode(png_b64)
                        png_fname = "{0}/{1}.png".format(img_out_dir, png_count)
                        with open(png_fname, "wb") as wfp:
                            wfp.write(png_bin)
                            png_count += 1

                        # remove "image/png" entry and add "text/html" entry to add img tag
                        del new_cell["outputs"][j]["data"]["image/png"]
                        html = output["data"].get("text/html", [])
                        img_tag = '<img src=\"/{0}\" />'.format(png_fname)
                        html.append(img_tag)
                        new_cell["outputs"][j]["data"]["text/html"] = html

                    if "data" in output and "text/html" in output["data"]:
                        html = "".join(output["data"]["text/html"])
                        soup = bs4.BeautifulSoup(html, features="lxml")
                        audio_tag = soup.find("audio")
                        if audio_tag:
                            src_tag = audio_tag.find("source")
                            wav_b64 = src_tag.get("src").split(",")[-1]
                            wav_bin = base64.b64decode(wav_b64)
                            wav_fname = "{0}/{1}.wav".format(wav_out_dir, wav_count)
                            with open(wav_fname, "wb") as wfp:
                                wfp.write(wav_bin)
                                wav_count += 1
                            # update content in "text/html" with new audio tag
                            new_tag = '<audio controls preload=\"none\"><source src=\"{0}\" type=\"audio/wav\" /></audio>'.format(wav_fname.replace("files", ""))
                            # new_tag = '<audio controls src=\"{0}\"></audio>'.format(wav_fname.replace("files", ""))
                            new_cell["outputs"][j]["data"]["text/html"] = new_tag
                            #del new_cell["outputs"][j]["data"]["text/html"]
                        else:
                            print("no audio tag")

                new_json["cells"][i] = new_cell
            else:
                new_json["cells"][i] = cell
        # ==================================================
        # end loop
        # ==================================================

        with open(ipynb_file + ".bak.ipynb", "w") as wfp:
            # json.dump(new_json, wfp, ensure_ascii=False, indent=4, sort_keys=True, separators=('',': '))
            json.dump(new_json, wfp, ensure_ascii=False, indent=4, sort_keys=True)


if __name__ == '__main__':
    main(sys.argv)
