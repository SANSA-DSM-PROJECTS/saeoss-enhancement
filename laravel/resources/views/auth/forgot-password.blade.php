<html>
<head>
    <link rel="stylesheet" href="{{ asset('css/Style.css') }}">
    <meta charset="utf-8">
    <title> Forgot Password </title>

    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="{{ asset('css/footer.css') }}">
</head>
<body>
	<x-app-layout>
	    <div class = "fpassget">
		    <x-guest-layout>
			    <div class="text-sm text-gray-600">
				    {{ __('Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.') }}
			    </div>

			    <!-- Session Status -->
			    <x-auth-session-status class="mb-4" :status="session('status')" />

			    <form method="POST" action="{{ route('password.email') }}">
				    @csrf

				    <!-- Email Address -->
				    <div>
				        <x-input-label for="email" :value="__('Email')" />
				        <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus />
				        <x-input-error :messages="$errors->get('email')" class="mt-2" />
				    </div>

				    <div class="flex items-center justify-end mt-4">
				        <x-primary-button>
				            {{ __('Email Password Reset Link') }}
				        </x-primary-button>
				    </div>
			    </form>
		    </x-guest-layout>
	    </div>
		<div class="footer">
	  		<div class="footer-content">
				<div class="copyright">
			  		&copy; <script>document.write(new Date().getFullYear())</script> South African National Space Agency. All rights reserved.
				</div>
				<div class="social-icons">
			  		<a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
				  			<path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
						</svg>
			  		</a>
			  		<a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" class="x-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
				  			<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
						</svg>
			  		</a>
			  		<a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
				  			<path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
						</svg>
			  		</a>
			  		<a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
				  			<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
						</svg>
			  		</a>
				</div>
	  		</div>
		</div>
    	</x-app-layout>
</body>
</html>
    
