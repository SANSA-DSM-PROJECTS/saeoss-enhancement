{{-- src/resources/views/portal/index.blade.php --}}
@extends('layouts.app')

@section('title', 'Home - SA EO Metadata Portal')

@section('content')
<div class="bg-primary text-white py-5">
    <div class="container text-center">
        <h1 class="display-4 mb-4">South Africa's Unified Earth Observation Metadata Portal</h1>
        <p class="lead mb-4">Discover, share, and analyze EO data for disaster management, planning, and research.</p>
        <div class="d-flex justify-content-center gap-3">
            <a href="{{ route('search') }}" class="btn btn-light btn-lg">Explore Metadata</a>
            <a href="#" class="btn btn-outline-light btn-lg">Learn More</a>
        </div>
    </div>
</div>

<div class="container py-5">
    <div class="row text-center g-4">
        <div class="col-md-3">
            <div class="card border-0 bg-light">
                <div class="card-body">
                    <h2 class="display-4 text-primary">{{ $stats['total_records'] }}+</h2>
                    <p class="lead mb-0">Metadata Records and growing</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 bg-light">
                <div class="card-body">
                    <h2 class="display-4 text-primary">{{ $stats['total_custodians'] }}+</h2>
                    <p class="lead mb-0">Custodians across institutions</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 bg-light">
                <div class="card-body">
                    <h2 class="display-4 text-primary">{{ $stats['total_sources'] }}+</h2>
                    <p class="lead mb-0">Data Sources integrated</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 bg-light">
                <div class="card-body">
                    <h2 class="display-4 text-primary">24/7</h2>
                    <p class="lead mb-0">Availability always accessible</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="container py-5">
    <h2 class="text-center mb-5">Featured Datasets</h2>
    <div class="row g-4">
        @foreach($featuredDatasets as $dataset)
        <div class="col-md-3">
            <div class="card h-100 shadow-sm">
                @if($dataset->thumbnail_url)
                <img src="{{ $dataset->thumbnail_url }}" class="card-img-top" alt="{{ $dataset->title }}">
                @else
                <div class="card-img-top bg-secondary text-white d-flex align-items-center justify-content-center" style="height: 150px;">
                    <i class="fas fa-map fa-3x"></i>
                </div>
                @endif
                <div class="card-body">
                    <h5 class="card-title">{{ $dataset->title }}</h5>
                    <p class="card-text text-muted">
                        <small>{{ $dataset->custodian }}</small><br>
                        <small>{{ $dataset->date_range }}</small>
                    </p>
                    <a href="{{ route('show', $dataset->id) }}" class="btn btn-sm btn-outline-primary">View Details</a>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>

<div class="bg-light py-5">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h2 class="mb-4">Recent Metadata on Map</h2>
                <div id="map" style="height: 400px; border-radius: 10px;"></div>
                <p class="text-center mt-2">South Africa</p>
            </div>
            <div class="col-md-6">
                <h2 class="mb-4">How It Works</h2>
                <div class="row g-4">
                    <div class="col-md-4 text-center">
                        <i class="fas fa-search fa-3x text-primary mb-3"></i>
                        <h5>Search</h5>
                        <p>Filter by topic, place, time and more.</p>
                    </div>
                    <div class="col-md-4 text-center">
                        <i class="fas fa-eye fa-3x text-primary mb-3"></i>
                        <h5>Discover</h5>
                        <p>View detailed ISO metadata records.</p>
                    </div>
                    <div class="col-md-4 text-center">
                        <i class="fas fa-download fa-3x text-primary mb-3"></i>
                        <h5>Download / Access</h5>
                        <p>Get data from custodian or access services.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    var map = L.map('map').setView([-28.479, 24.679], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(map);
    
    @foreach($recentMapData as $data)
        @if($data->spatial_bounds)
        L.marker([{{ $data->spatial_bounds['lat'] ?? -28.479 }}, {{ $data->spatial_bounds['lng'] ?? 24.679 }}])
            .bindPopup('<b>{{ $data->title }}</b><br>{{ $data->custodian }}')
            .addTo(map);
        @endif
    @endforeach
</script>
@endpush
@endsection
