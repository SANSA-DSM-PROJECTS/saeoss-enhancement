<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeoServer {
    public static function calculate($layer, $formula, $outputName) {
        $geoserverRestUrl = 'http://localhost:8080/geoserver/rest/';
        $username = 'alamba';
        $password = 'lamba';

        $rasterDownloadUrl = "http://localhost:8080/geoserver/wcs?service=WCS&version=1.0.0"
            . "&request=GetCoverage&coverage=$layer"
            . "&format=GeoTIFF";

        $rasterPath = storage_path("app/tmp/$layer.tif");
        file_put_contents($rasterPath, file_get_contents($rasterDownloadUrl));

        $ndviPath = storage_path("app/ndvi/{$outputName}.tif");

        $band1 = 1; // You can improve this based on input
        $band2 = 2;

        $gdalCommand = "gdal_calc.py -A $rasterPath --A_band=$band1 "
            . "-B $rasterPath --B_band=$band2 "
            . "--outfile=$ndviPath --calc=\"$formula\" --NoDataValue=0";

        exec($gdalCommand, $output, $status);

        if ($status !== 0) {
            throw new \Exception("GDAL NDVI calculation failed");
        }

        // Step 3 (Optional): Publish back to GeoServer
        $workspace = 'workspace';
        $storeName = $outputName;

        $uploadResponse = Http::withBasicAuth($username, $password)
            ->attach('filedata', file_get_contents($ndviPath), "{$outputName}.tif")
            ->put("{$geoserverRestUrl}workspaces/$workspace/coveragestores/$storeName/file.geotiff");

        if (!$uploadResponse->successful()) {
            throw new \Exception("GeoServer upload failed: " . $uploadResponse->body());
        }

        return [
            'layer_name' => "$workspace:$outputName"
        ];
    }
}


