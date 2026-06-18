<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Home</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
    <div class="min-h-screen bg-gray-100">
        <!-- Navigation Bar -->
        <nav class="bg-white border-b border-gray-200">
            <div class="container mx-auto px-4 py-3 flex justify-between items-center">
                <a href="/" class="text-lg font-semibold text-gray-800">Home</a>
                <a href="/about" class="text-lg text-gray-600 hover:text-gray-800">About</a>
                <a href="/contact" class="text-lg text-gray-600 hover:text-gray-800">Contact</a>
            </div>
        </nav>

        <!-- Page Content -->
        <main>
            {{ $slot }}
        </main>
    </div>
</body>
</html>

