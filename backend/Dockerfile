# syntax = docker/dockerfile:experimental

FROM nvidia/cuda:11.1.1-devel-ubuntu20.04

ENV PATH /opt/conda/bin:$PATH

RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates curl git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-py38_4.11.0-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc

RUN conda install pytorch torchvision torchaudio cudatoolkit=11.3 -c pytorch

ENV LD_LIBRARY_PATH /usr/local/cuda-11.1/lib64:/usr/local/cuda-11.1/extras/CUPTI/lib64:$LD_LIBRARY_PATH

ENV TRANSFORMERS_CACHE /diffusion/cache/transformers

WORKDIR /diffusion

COPY vendor/ vendor/
COPY requirements.txt requirements.txt

#   File "/opt/conda/lib/python3.8/site-packages/cv2/__init__.py", line 153, in bootstrap
#     native_module = importlib.import_module("cv2")
#   File "/opt/conda/lib/python3.8/importlib/__init__.py", line 127, in import_module
#     return _bootstrap._gcd_import(name[level:], package, level)
#   ImportError: libGL.so.1: cannot open shared object file: No such file or directory

# https://stackoverflow.com/questions/55313610/importerror-libgl-so-1-cannot-open-shared-object-file-no-such-file-or-directo
# pip install opencv-python-headless rather than installing all the missing opencv libs since they are 1gb
RUN --mount=type=cache,mode=0755,target=/root/.cache/pip pip install -e ./vendor/imaginAIry && pip install opencv-python-headless && pip install -r requirements.txt
COPY bootstrap/ bootstrap/
COPY cache/ cache/

ENV IMAGINAIRY_SAFETY_MODE=classify

RUN --mount=type=cache,mode=0755,target=/diffusion/cache/transformers python -u bootstrap/bootstrap.py

COPY src/ src/


CMD python -u ./src/main.py