// src/database/seeders/MetadataSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MetadataRecord;
use App\Models\DataSource;

class MetadataSeeder extends Seeder
{
    public function run()
    {
        // Sample data sources
        $sources = [
            ['name' => 'Sentinel-2', 'organization' => 'ESA', 'type' => 'satellite'],
            ['name' => 'Landsat-8', 'organization' => 'NASA/USGS', 'type' => 'satellite'],
            ['name' => 'MODIS', 'organization' => 'NASA', 'type' => 'satellite'],
            ['name' => 'SPOT', 'organization' => 'Airbus', 'type' => 'satellite'],
        ];

        foreach ($sources as $source) {
            DataSource::create($source);
        }

        // Sample metadata records
        $records = [
            [
                'title' => 'Vegetation Cover Map 2023',
                'dataset_type' => 'Vegetation',
                'custodian' => 'SAIDI',
                'start_date' => '2022-01-01',
                'end_date' => '2023-12-31',
                'description' => 'High-resolution vegetation cover map of South Africa showing NDVI values',
                'data_format' => 'GeoTIFF',
                'resolution' => '30m',
                'keywords' => json_encode(['vegetation', 'ndvi', 'landcover']),
            ],
            [
                'title' => 'Flood Event Map (Jan 2024)',
                'dataset_type' => 'Flood Risk',
                'custodian' => 'SAIDI',
                'start_date' => '2024-01-01',
                'end_date' => '2024-12-31',
                'description' => 'Flood extent mapping for January 2024 flood events',
                'data_format' => 'GeoJSON',
                'resolution' => '10m',
                'keywords' => json_encode(['flood', 'disaster', 'water']),
            ],
            [
                'title' => 'Land Cover 2022',
                'dataset_type' => 'Land Cover',
                'custodian' => 'SANSA',
                'start_date' => '2022-01-01',
                'end_date' => '2023-12-31',
                'description' => 'National land cover classification for 2022',
                'data_format' => 'GeoTIFF',
                'resolution' => '20m',
                'keywords' => json_encode(['landcover', 'classification', 'mapping']),
            ],
            [
                'title' => 'Road Network (National)',
                'dataset_type' => 'Infrastructure',
                'custodian' => 'SANRAL',
                'start_date' => '2021-01-01',
                'end_date' => '2023-12-31',
                'description' => 'Complete national road network infrastructure data',
                'data_format' => 'Shapefile',
                'resolution' => '1:50,000',
                'keywords' => json_encode(['roads', 'infrastructure', 'transport']),
            ],
        ];

        foreach ($records as $record) {
            MetadataRecord::create(array_merge($record, ['status' => 'active', 'download_count' => 0]));
        }
    }
}
