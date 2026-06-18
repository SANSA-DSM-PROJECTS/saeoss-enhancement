<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Package;
use App\Models\Metadata;
use SimpleXMLElement;
use Illuminate\Support\Str;

class MetadataUploadController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'filename' => 'required|file'
            ]);

            if (!$request->hasFile('filename')) {
                return response()->json(['message' => 'No file uploaded.'], 400);
            }

            $file = $request->file('filename');
            $ext = strtolower($file->getClientOriginalExtension());
            $content = file_get_contents($file->getRealPath());

            $hasValidEntries = false;

            if ($ext === 'json') {
                $data = json_decode($content, true);

                if (is_array($data)) {
                    foreach ($data as $item) {
                        // Check if this is a Sentinel metadata record
                        if (isset($item['platform']) && str_contains($item['platform'], 'Sentinel')) {
                            $metadata = $this->standardizeSentinel($item);
                            Metadata::create($metadata);
                            $hasValidEntries = true;
                        } 
                        // Check for standard JSON metadata
                        elseif (isset($item['name']) || isset($item['title'])) {
                            $hasName = isset($item['name']) || isset($item['title']);
                            $hasGeom = isset($item['min_lon'], $item['min_lat'], $item['max_lon'], $item['max_lat']);

                            if ($hasName && $hasGeom) {
                                $hasValidEntries = true;
                                Metadata::create([
                                    'title'       => $item['title'] ?? $item['name'] ?? 'Untitled',
                                    'descriptio'  => $item['description'] ?? null,
                                    'category'    => $item['category'] ?? null,
                                    'owner'       => $item['owner'] ?? null,
                                    'province'    => $item['province'] ?? null,
                                    'contact_em'  => $item['email'] ?? null,
                                    'contact_ph'  => $item['phone'] ?? null,
                                    'website'     => $item['website'] ?? null,
                                    'thumbnail'   => $item['thumb_url'] ?? null,
                                    'min_lon'     => $item['min_lon'],
                                    'min_lat'     => $item['min_lat'],
                                    'max_lon'     => $item['max_lon'],
                                    'max_lat'     => $item['max_lat'],
                                    'created_at'  => $item['created'] ?? now(),
                                ]);
                            }
                        }
                    }
                }
            } elseif ($ext === 'xml') {
                $standardized = $this->standardizeMetadataXml($content);

                if (isset($standardized['error'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'XML error: ' . $standardized['error']
                    ], 400);
                }

                // Check if this is a Landsat metadata record
                if (isset($standardized['landsat_product_id'])) {
                    $metadata = $this->standardizeLandsat($standardized);
                    Metadata::create($metadata);
                    $hasValidEntries = true;
                } else {
                    // Handle other XML formats
                    foreach (['min_lon', 'min_lat', 'max_lon', 'max_lat'] as $coord) {
                        if (!isset($standardized[$coord]) || $standardized[$coord] === null) {
                            return response()->json([
                                'success' => false,
                                'message' => "Missing required coordinate: {$coord}"
                            ], 400);
                        }
                    }
                    Metadata::create($standardized);
                    $hasValidEntries = true;
                }
            } else {
                return response()->json([
                    'message' => 'Unsupported file type. Only JSON or XML allowed.'
                ], 400);
            }

            if (!$hasValidEntries) {
                return response()->json([
                    'message' => 'No valid entries found. Each item must contain "name"/"title" AND min/max coordinates.'
                ], 400);
            }

            // Store file
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('metadata_uploads', $fileName);

            Package::create([
                'user_email' => Auth::user()->email,
                'file_name'  => $fileName,
                'file_path'  => $path,
                'file_type'  => $ext,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded and metadata saved.',
                'path'    => Storage::url($path),
            ]);

        } catch (\Exception $e) {
            Log::error('Metadata upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }
    
    protected function standardizeLandsat(array $data): array
    {
        return [
            'title' => $this->generateLandsatTitle($data),
            'descriptio' => $this->generateLandsatDescription($data),
            'category' => 'Satellite Imagery',
            'owner' => 'NASA/USGS',
            'province' => $this->detectProvinceFromCoordinates(
                $data['min_lat'] ?? 0,
                $data['min_lon'] ?? 0,
                $data['max_lat'] ?? 0,
                $data['max_lon'] ?? 0
            ),
            'min_lat' => $data['min_lat'] ?? 0,
            'max_lat' => $data['max_lat'] ?? 0,
            'min_lon' => $data['min_lon'] ?? 0,
            'max_lon' => $data['max_lon'] ?? 0,
            'contact_em' => 'landsat@usgs.gov',
            'website' => 'https://landsat.gsfc.nasa.gov',
            'thumbnail' => $data['thumbnail_url'] ?? null,
            'created_at' => $data['date_acquired'] ?? now(),
        ];
    }

    protected function standardizeSentinel(array $data): array
    {
        // Calculate bounding box if not provided
        if (!isset($data['min_lat']) && isset($data['footprint']['coordinates'])) {
            $coords = $data['footprint']['coordinates'][0];
            $lats = array_column($coords, 1);
            $lons = array_column($coords, 0);
            
            $data['min_lat'] = min($lats);
            $data['max_lat'] = max($lats);
            $data['min_lon'] = min($lons);
            $data['max_lon'] = max($lons);
        }

        return [
            'title' => $this->generateSentinelTitle($data),
            'descriptio' => $this->generateSentinelDescription($data),
            'category' => 'Satellite Imagery',
            'owner' => 'ESA',
            'province' => $this->detectProvinceFromCoordinates(
                $data['min_lat'] ?? 0,
                $data['min_lon'] ?? 0,
                $data['max_lat'] ?? 0,
                $data['max_lon'] ?? 0
            ),
            'min_lat' => $data['min_lat'] ?? 0,
            'max_lat' => $data['max_lat'] ?? 0,
            'min_lon' => $data['min_lon'] ?? 0,
            'max_lon' => $data['max_lon'] ?? 0,
            'contact_em' => 'sentinel@esa.int',
            'website' => 'https://sentinel.esa.int',
            'thumbnail' => $data['thumbnail'] ?? null,
            'created_at' => $data['beginPosition'] ?? now(),
        ];
    }

    protected function generateLandsatTitle(array $data): string
    {
        return sprintf('Landsat %s - Path %s Row %s - %s',
            $data['spacecraft_id'] ?? 'Unknown',
            $data['wrs_path'] ?? 'Unknown',
            $data['wrs_row'] ?? 'Unknown',
            $data['date_acquired'] ?? 'Unknown Date'
        );
    }

    protected function generateSentinelTitle(array $data): string
    {
        return sprintf('Sentinel-%s %s - %s - %s',
            $data['platform'] ?? 'Unknown',
            $data['productType'] ?? 'Unknown',
            $data['processingLevel'] ?? 'Unknown Level',
            $data['beginPosition'] ?? 'Unknown Date'
        );
    }

    protected function generateLandsatDescription(array $data): string
    {
        return sprintf(
            "Landsat %s scene. Cloud cover: %s%%. Sun elevation: %s. Sun azimuth: %s.",
            $data['spacecraft_id'] ?? 'Unknown',
            $data['cloud_cover'] ?? 'Unknown',
            $data['sun_elevation'] ?? 'Unknown',
            $data['sun_azimuth'] ?? 'Unknown'
        );
    }

    protected function generateSentinelDescription(array $data): string
    {
        return sprintf(
            "Sentinel-%s %s product. Orbit: %s. Polarisation: %s. Size: %s MB.",
            $data['platform'] ?? 'Unknown',
            $data['productType'] ?? 'Unknown',
            $data['orbitNumber'] ?? 'Unknown',
            $data['polarisationMode'] ?? 'Unknown',
            round(($data['size'] ?? 0) / (1024 * 1024), 2)
        );
    }

    protected function detectProvinceFromCoordinates(
        float $minLat,
        float $minLon,
        float $maxLat,
        float $maxLon
    ): ?string {
        // Implement your province detection logic here
        // This could be a database lookup or API call to your GeoServer
        return null;
    }

    private function standardizeMetadataXml($xmlContent)
    {
        try {
            $xml = new \SimpleXMLElement($xmlContent);

            if (isset($xml->PRODUCT_CONTENTS)) {
                $data = [
                    'landsat_product_id' => (string)($xml->PRODUCT_CONTENTS->LANDSAT_PRODUCT_ID ?? null),
                    'spacecraft_id' => (string)($xml->PRODUCT_CONTENTS->SPACECRAFT_ID ?? null),
                    'wrs_path' => (string)($xml->PRODUCT_CONTENTS->WRS_PATH ?? null),
                    'wrs_row' => (string)($xml->PRODUCT_CONTENTS->WRS_ROW ?? null),
                    'date_acquired' => (string)($xml->IMAGE_ATTRIBUTES->DATE_ACQUIRED ?? null),
                    'cloud_cover' => (float)($xml->IMAGE_ATTRIBUTES->CLOUD_COVER ?? 0),
                    'sun_elevation' => (float)($xml->IMAGE_ATTRIBUTES->SUN_ELEVATION ?? 0),
                    'sun_azimuth' => (float)($xml->IMAGE_ATTRIBUTES->SUN_AZIMUTH ?? 0),
                    'min_lat' => (float)($xml->PRODUCT_CONTENTS->CORNER_LL_LAT_PRODUCT ?? 0),
                    'min_lon' => (float)($xml->PRODUCT_CONTENTS->CORNER_LL_LON_PRODUCT ?? 0),
                    'max_lat' => (float)($xml->PRODUCT_CONTENTS->CORNER_UR_LAT_PRODUCT ?? 0),
                    'max_lon' => (float)($xml->PRODUCT_CONTENTS->CORNER_UR_LON_PRODUCT ?? 0),
                    'thumbnail_url' => null,
                ];

                return $data;
            } elseif ($xml->getName() === 'gmd:MD_Metadata') {
                $ns = $xml->getNamespaces(true);
                $gmd = $xml->children($ns['gmd']);
                $gco = $gmd->fileIdentifier->children($ns['gco']);

                return [
                    'title'       => (string)($gco->CharacterString ?? 'Untitled'),
                    'descriptio'  => 'ISO19115 metadata record',
                    'category'    => 'Geospatial',
                    'owner'       => (string)($gmd->contact
                                              ->CI_ResponsibleParty
                                              ->organisationName
                                              ->CharacterString ?? null),
                    'province'    => null,
                    'contact_em'  => (string)($gmd->contact
                                              ->CI_ResponsibleParty
                                              ->contactInfo
                                              ->CI_Contact
                                              ->address
                                              ->CI_Address
                                              ->electronicMailAddress
                                              ->CharacterString ?? null),
                    'contact_ph'  => null,
                    'website'     => null,
                    'thumbnail'   => null,
                    'min_lon'     => 0.0,
                    'min_lat'     => 0.0,
                    'max_lon'     => 0.0,
                    'max_lat'     => 0.0,
                    'created_at'  => (string)($gmd->dateStamp->Date ?? now()),
                ];
            } else {
                return ['error' => 'Unknown XML schema'];
            }
        } catch (\Exception $e) {
            \Log::error('Failed to parse XML: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}
