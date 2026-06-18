<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organisation extends Model
{
    use HasFactory;

    protected $table = 'organisation';
    protected $primaryKey = 'identifier';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'identifier',
        'organisation',
        'alias', 
        'description',
        'director',
        'type',
        'contact_email',
        'contact_phone',
        'website',
        'logo'
    ];

    public $timestamps = false;

    public function metadata()
    {
        return $this->hasMany(Metadata::class, 'owner', 'organisation');
    }

    public function getMetadataCountAttribute()
    {
        return $this->metadata()->count();
    }
}
