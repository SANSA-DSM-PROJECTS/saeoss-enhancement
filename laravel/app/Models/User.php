<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;
    use HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'organisation',    // Changed from 'organisation_id' to 'organisation' (text field)
        'role',
        'is_admin',
        'access'           // Added if you have this column
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Get the organisation that the user belongs to.
     * Since organisation is stored as a text field with the organisation name
     */
    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'organisation', 'organisation');
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin()
    {
        // Check both role and is_admin fields for compatibility
        return $this->is_admin === true || $this->role === 'admin';
    }

    /**
     * Check if the user is a member.
     */
    public function isMember()
    {
        return $this->role === 'member';
    }

    /**
     * Check if the user belongs to an organisation.
     */
    public function hasOrganisation()
    {
        return !is_null($this->organisation) && $this->organisation !== '';
    }

    /**
     * Scope a query to only include users of a specific organisation.
     */
    public function scopeOfOrganisation($query, $organisationName)
    {
        return $query->where('organisation', $organisationName);
    }

    /**
     * Scope a query to only include admins.
     */
    public function scopeAdmins($query)
    {
        return $query->where(function($q) {
            $q->where('role', 'admin')
              ->orWhere('is_admin', true);
        });
    }

    /**
     * Scope a query to only include members.
     */
    public function scopeMembers($query)
    {
        return $query->where('role', 'member');
    }

    /**
     * Scope a query to only include users not in any organisation.
     */
    public function scopeWithoutOrganisation($query)
    {
        return $query->whereNull('organisation')
                    ->orWhere('organisation', '');
    }
}
