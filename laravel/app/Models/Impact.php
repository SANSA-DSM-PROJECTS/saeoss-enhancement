<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Impact extends Model
{
    use HasFactory;

    protected $table = 'impact';
    
    protected $fillable = [
        'area',
        'impact',
        'date',
        'province'
    ];

    protected $casts = [
        'date' => 'date'
    ];
}
