<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Carbon\Carbon;

class SessionTimeout
{
    protected $timeout = 2; // minutes

    public function handle($request, Closure $next)
    {
        // Exclude the check-session route so it doesn't refresh session
        if ($request->is('check-session')) {
            return $next($request);
        }

        if (Auth::check()) {
            $lastActivity = Session::get('lastActivityTime');
            $now = Carbon::now();

            if ($lastActivity && $now->diffInMinutes(Carbon::parse($lastActivity)) > $this->timeout) {
                Auth::logout();
                Session::flush();
                return redirect()->route('login')->with('message', 'Session expired. Please log in again.');
            }

            Session::put('lastActivityTime', $now);
        }

        return $next($request);
    }
}



