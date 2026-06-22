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

    /**
     * Relationship with metadata - using 'owner' field
     */
    public function metadata()
    {
        return $this->hasMany(Metadata::class, 'owner', 'organisation');
    }

    /**
     * Get metadata count attribute
     */
    public function getMetadataCountAttribute()
    {
        return $this->metadata()->count();
    }

    /**
     * Find organisation by name or alias
     */
    public static function findByOrganisationName($name)
    {
        if (empty($name) || $name === 'Unknown Organization') {
            return null;
        }

        return self::where('organisation', $name)
            ->orWhere('alias', $name)
            ->first();
    }

    /**
     * Find organisation from metadata (tries both 'owner' and 'organization' fields)
     */
    public static function findFromMetadata($metadata)
    {
        $orgName = $metadata['owner'] ?? $metadata['organization'] ?? null;
        
        if (empty($orgName) || $orgName === 'Unknown Organization') {
            return null;
        }

        return self::findByOrganisationName($orgName);
    }

    /**
     * Get organisation details for display
     */
    public function getDisplayDetails()
    {
        return [
            'name' => $this->organisation,
            'alias' => $this->alias,
            'description' => $this->description,
            'director' => $this->director,
            'type' => $this->type,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'website' => $this->getFormattedWebsite(),
            'logo' => $this->logo,
        ];
    }

    /**
     * Get formatted website URL
     */
    public function getFormattedWebsite()
    {
        if (empty($this->website)) {
            return null;
        }

        $website = $this->website;
        
        // Remove any localhost or base URL prefixes
        $website = preg_replace('#^https?://localhost(/[^/]*/)?#', '', $website);
        $website = preg_replace('#^https?://[^/]+/metadata/#', '', $website);
        
        // Add https:// if no protocol is present
        if (!preg_match('#^https?://#', $website)) {
            $website = 'https://' . $website;
        }
        
        return $website;
    }

    /**
     * Get clean domain name for display
     */
    public function getDisplayWebsite()
    {
        if (empty($this->website)) {
            return null;
        }

        $website = $this->website;
        
        // Remove any localhost or base URL prefixes
        $website = preg_replace('#^https?://localhost(/[^/]*/)?#', '', $website);
        $website = preg_replace('#^https?://[^/]+/metadata/#', '', $website);
        
        // Remove protocol for display
        $website = preg_replace('#^https?://#', '', $website);
        
        return $website;
    }

    /**
     * Scope to search organisations by name
     */
    public function scopeSearchByName($query, $name)
    {
        if (empty($name)) {
            return $query;
        }

        return $query->where('organisation', 'LIKE', "%{$name}%")
            ->orWhere('alias', 'LIKE', "%{$name}%");
    }

    /**
     * Get organisations with their metadata count
     */
    public static function getOrganisationsWithCount()
    {
        return self::withCount('metadata')->get();
    }
}
