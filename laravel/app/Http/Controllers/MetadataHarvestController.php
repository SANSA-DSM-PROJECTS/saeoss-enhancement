<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use App\Models\Metadata;
use Exception;
use SimpleXMLElement;
use Illuminate\Support\Str;

class MetadataHarvestController extends Controller
{
    public function harvestCSW(Request $request)
    {
        $url = $request->query('url');
        $format = $request->query('format', 'xml');

        if (!$url) {
            return response()->json(['error' => 'Missing ?url parameter'], 400);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        try {
            $params = [
                'service' => 'CSW',
                'version' => '2.0.2',
                'request' => 'GetRecords',
                'typeNames' => 'csw:Record',
                'elementSetName' => 'summary',
                'resultType' => 'results',
                'maxRecords' => 10,
            ];

            if ($format === 'json') {
                $params['outputFormat'] = 'application/json';
            }

            $response = Http::get($url, $params);

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to fetch: ' . $response->status()], 500);
            }

            $body = $response->body();

            return $format === 'json'
                ? $this->handleJsonResponse($body, $user)
                : $this->handleXmlResponse($body, $user);

        } catch (Exception $e) {
            return response()->json(['error' => 'Exception: ' . $e->getMessage()], 500);
        }
    }

    protected function handleJsonResponse($body, $user)
    {
        $json = json_decode($body, true);

        if (!isset($json['records']) || !is_array($json['records'])) {
            return response()->json(['error' => 'Invalid JSON: missing "records"'], 422);
        }

        $count = 0;
        foreach ($json['records'] as $record) {
            if ($this->storeMetadata($record, $user)['status'] === 'success') {
                $count++;
            }
        }

        return response()->json([
            'message' => "Successfully processed {$count} metadata records",
        ]);
    }

    protected function handleXmlResponse($body, $user)
    {
        try {
            $xml = new SimpleXMLElement($body);
            $xml->registerXPathNamespace('csw', 'http://www.opengis.net/cat/csw/2.0.2');
            $xml->registerXPathNamespace('dc', 'http://purl.org/dc/elements/1.1/');
            $xml->registerXPathNamespace('dct', 'http://purl.org/dc/terms/');
            $xml->registerXPathNamespace('ows', 'http://www.opengis.net/ows');

            $records = $xml->xpath('//csw:SummaryRecord');

            $results = ['new' => 0, 'existing' => 0, 'errors' => 0];

            foreach ($records as $record) {
                $identifier = (string)($record->xpath('dc:identifier')[0] ?? '');
                if (empty($identifier)) {
                    $results['errors']++;
                    continue;
                }

                $metadata = [
                    'identifier' => $identifier,
                    'title' => (string)($record->xpath('dc:title')[0] ?? 'Untitled'),
                    'category' => implode(', ', array_map('strval', $record->xpath('dc:subject'))),
                    'descriptio' => (string)($record->xpath('dct:abstract')[0] ?? null),
                    'created_at' => (string)($record->xpath('dct:modified')[0] ?? now()),
                ];

                $bbox = $record->xpath('ows:BoundingBox[@crs="urn:x-ogc:def:crs:EPSG:6.11:4326"]');
                if ($bbox) {
                    $lowerCorner = explode(' ', (string)$bbox[0]->xpath('ows:LowerCorner')[0] ?? '');
                    $upperCorner = explode(' ', (string)$bbox[0]->xpath('ows:UpperCorner')[0] ?? '');

                    $metadata['min_lat'] = $lowerCorner[0] ?? null;
                    $metadata['min_lon'] = $lowerCorner[1] ?? null;
                    $metadata['max_lat'] = $upperCorner[0] ?? null;
                    $metadata['max_lon'] = $upperCorner[1] ?? null;
                }

                $result = $this->storeMetadata($metadata, $user);

                match ($result['status']) {
                    'success' => $results['new']++,
                    'skipped' => $results['existing']++,
                    default => $results['errors']++
                };
            }

            return response()->json([
                'message' => "Processed: {$results['new']} new, skipped {$results['existing']} to avoid duplicates, {$results['errors']} errors",
                'total' => count($records),
                'preview' => Str::limit($body, 300)
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'XML parsing failed: ' . $e->getMessage(),
                'preview' => Str::limit($body, 300)
            ], 422);
        }
    }

    protected function storeMetadata($data, $user)
    {
        if (empty($data['identifier'])) {
            return ['status' => 'skipped', 'reason' => 'no_identifier'];
        }

        if (Metadata::where('identifier', $data['identifier'])->exists()) {
            return ['status' => 'skipped', 'reason' => 'duplicate'];
        }

        try {
            Metadata::create([
                'identifier' => $data['identifier'],
                'title' => $data['title'] ?? 'Untitled',
                'descriptio' => $data['descriptio'] ?? null,
                'category' => Str::limit($data['category'] ?? '', 1000),
                'owner' => $user->organisation ?? 'unknown',
                'province' => $data['province'] ?? null,
                'min_lon' => $data['min_lon'] ?? null,
                'min_lat' => $data['min_lat'] ?? null,
                'max_lon' => $data['max_lon'] ?? null,
                'max_lat' => $data['max_lat'] ?? null,
                'created_at' => $data['created_at'] ?? now(),
            ]);

            return ['status' => 'success'];
        } catch (Exception $e) {
            \Log::error('Failed to save metadata: ' . $e->getMessage());
            return ['status' => 'error'];
        }
    }
}

