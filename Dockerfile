FROM jupyter/scipy-notebook:latest

USER root

RUN apt-get update && \
    apt-get install -y gdal-bin libgdal-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch to notebook user
USER $NB_UID

# Install GDAL and other Python packages inside the Conda environment
RUN conda install -c conda-forge \
    gdal \
    rasterio \
    geopandas \
    numpy && \
    conda clean -afy

