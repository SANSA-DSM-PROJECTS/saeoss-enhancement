@component('mail::message')
# Request Status Updated

Your request **#{{ $gid }}** has been updated.

- **New Status:** {{ $status }}
- **Notes:** {{ $notes }}

@component('mail::button', ['url' => config('app.url')])
View Request
@endcomponent

Thanks,  
{{ config('app.name') }}
@endcomponent

