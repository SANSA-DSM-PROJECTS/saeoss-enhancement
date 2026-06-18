// src/app/Models/MetadataRecord.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MetadataRecord extends Model
{
    use HasFactory;

    protected $table = 'metadata_records';
    
    protected $fillable = [
        'title', 'dataset_type', 'custodian', 'start_date', 'end_date',
        'description', 'spatial_coverage', 'coordinate_system', 'data_format',
        'resolution', 'keywords', 'access_url', 'thumbnail_url', 'spatial_bounds',
        'status', 'download_count'
    ];

    protected $casts = [
        'keywords' => 'array',
        'spatial_bounds' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function getDateRangeAttribute()
    {
        $start = $this->start_date->format('Y');
        if ($this->end_date) {
            return $start . ' - ' . $this->end_date->format('Y');
        }
        return $start;
    }
}
