<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Metadata extends Model
{
	use HasFactory;

	protected $table = 'metadatas';

	protected $fillable = [
		'identifier',
		'title',
		'descriptio',
		'category',
		'owner',
		'province',
		'contact_em',
		'contact_ph',
		'website',
		'thumbnail',
		'geom',
		'created_at',
		'updated_at',
		'min_lon',     
		'min_lon',       
		'min_lat',
		'max_lon',
		'max_lat',
	];

	public $timestamps = false;

	protected $casts = [
		'created_at' => 'datetime',
	];
}

