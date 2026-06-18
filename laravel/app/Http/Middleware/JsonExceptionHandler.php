<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JsonExceptionHandler
{
    public function handle($request, Closure $next)
	{
		$response = $next($request);
		
		if ($response->exception instanceof \ErrorException) {
		    return response()->json([
		        'message' => 'Data processing error',
		        'error' => $response->exception->getMessage()
		    ], 500);
		}
		
		return $response;
	}
}


