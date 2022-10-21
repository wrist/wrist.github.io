#!/bin/bash

target_dir=files/jupyterlite

if [ ! -d ${target_dir} ]
then 
        mkdir ${target_dir}
else
        rm -rv ${target_dir}
        echo "removed ${target_dir}"
        #read -p "remove ${target_dir}? (y/N): " yn
        #case "$yn" in
        #        [yY]*) rm -rv ${target_dir}; echo "removed ${target_dir}";;
        #        *) echo "${target_dir} was not removed";;
        #esac
fi

jupyter lite build \
        --lite-dir ${target_dir} \
        --output-dir ${target_dir} \
        --contents posts \
        --ignore-contents "build|work|\.gitignore|.*\.py|.*.mat|15|.ipynb_checkpoints|.*.npy|.*.png|.*.jpg|.*~"
