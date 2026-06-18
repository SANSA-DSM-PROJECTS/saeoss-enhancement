// src/app/Http/Controllers/PortalController.php
<?php

namespace App\Http\Controllers;

use App\Models\MetadataRecord;
use App\Models\DataSource;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    public function index()
    {
        $stats = [
            'total_records' => MetadataRecord::where('status', 'active')->count(),
            'total_custodians' => MetadataRecord::distinct('custodian')->count('custodian'),
            'total_sources' => DataSource::where('is_active', true)->count(),
        ];

        $featuredDatasets = MetadataRecord::where('status', 'active')
            ->latest()
            ->limit(8)
            ->get();

        $recentMapData = MetadataRecord::where('status', 'active')
            ->whereNotNull('spatial_bounds')
            ->latest()
            ->limit(5)
            ->get();

        return view('portal.index', compact('stats', 'featuredDatasets', 'recentMapData'));
    }

    public function search(Request $request)
    {
        $query = MetadataRecord::where('status', 'active');

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'ilike', '%' . $request->search . '%')
                  ->orWhere('description', 'ilike', '%' . $request->search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('dataset_type', $request->type);
        }

        if ($request->filled('custodian')) {
            $query->where('custodian', $request->custodian);
        }

        $datasets = $query->paginate(12);
        
        $types = MetadataRecord::distinct('dataset_type')->pluck('dataset_type');
        $custodians = MetadataRecord::distinct('custodian')->pluck('custodian');

        return view('portal.search', compact('datasets', 'types', 'custodians'));
    }

    public function show($id)
    {
        $record = MetadataRecord::findOrFail($id);
        $record->increment('view_count');
        
        $related = MetadataRecord::where('dataset_type', $record->dataset_type)
            ->where('id', '!=', $id)
            ->limit(4)
            ->get();

        return view('portal.show', compact('record', 'related'));
    }
}
