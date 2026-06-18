<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'user_email',
        'file_name',
        'file_path',
        'file_type',
    ];
}

