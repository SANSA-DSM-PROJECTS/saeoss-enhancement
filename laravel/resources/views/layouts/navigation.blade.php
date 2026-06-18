<nav x-data="{ open: false }" class="top border-gray-100" style="background-color: #0a2642;">
    <!-- Primary Navigation Menu -->
    <div class="container-fluid px-4">
        <div class="flex justify-between h-16">
            <!-- Logo on the left -->
            <div class="flex items-center">
                <div class="images shrink-0 flex items-center navbar-logo">
                    <a href="/" target="_blank" class="flex items-center">
                        <img src="{{ asset('images/saeoss-logo.png') }}" alt="saeoss Logo">
                    </a>
                </div>
            </div>

            <!-- Center Navigation Links -->
            <div class="hidden sm:flex sm:items-center sm:justify-center sm:absolute sm:left-0 sm:right-0">
                <div class="flex space-x-8">
                    <x-nav-link href="{{ route('welcome') }}" :active="request()->routeIs('welcome')" class="text-white">
                        {{ __('Home') }}
                    </x-nav-link>
                    <x-nav-link href="{{ route('mapping') }}" :active="request()->routeIs('mapping')" class="text-white">
                        {{ __('Mapping') }}
                    </x-nav-link>
                    <x-nav-link href="{{ route('metadata') }}" :active="request()->routeIs('metadata')" class="text-white">
                        {{ __('Metadata') }}
                    </x-nav-link>
                    <x-nav-link href="{{ route('organisation') }}" :active="request()->routeIs('organisation')" class="text-white">
                        {{ __('Organisation') }}
                    </x-nav-link>
                </div>
            </div>

            <!-- Right Side Of Navbar -->
            <div class="flex cust items-center">
                @auth
                    <!-- Settings Dropdown -->
                    <div class="hidden sm:flex sm:items-center sm:ml-6">
                        <x-dropdown align="right" width="48">
                            <x-slot name="trigger">
                                <button class="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md 
                                               text-white bg-transparent hover:text-gray-200 focus:outline-none 
                                               transition ease-in-out duration-150">
                                    <div class="px-4 text-left">
                                        <div class="font-medium text-base text-white">{{ Auth::user()->name }}</div>
                                        <div class="font-medium text-sm text-gray-300">{{ Auth::user()->email }}</div>
                                    </div>
                                    <div class="ms-1">
                                        <svg class="fill-current h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" 
                                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 
                                                     0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 
                                                     0 010-1.414z" 
                                                  clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                </button>
                            </x-slot>

                            <x-slot name="content">
                                @if(auth()->user()->is_admin ?? false) 
                                    <x-dropdown-link href="{{ route('dashboard') }}" class="adminpage">
                                        {{ __('Dashboard') }}
                                    </x-dropdown-link>
                                @endif
                                <x-dropdown-link href="{{ route('profile.edit') }}" class="navcont">
                                    {{ __('Profile') }}
                                </x-dropdown-link>

                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <x-dropdown-link href="{{ route('logout') }}" class="navcont"
                                        onclick="event.preventDefault(); this.closest('form').submit();">
                                        {{ __('Log Out') }}
                                    </x-dropdown-link>
                                </form>
                            </x-slot>
                        </x-dropdown>
                    </div>
                @endauth

                @guest
                    <!-- Login/Register Links -->
                    <div class="hidden sm:flex sm:items-center sm:space-x-4 sm:ml-6">
                        <x-nav-link href="{{ route('login') }}" :active="request()->routeIs('login')" class="text-white">
                            {{ __('Login') }}
                        </x-nav-link>
                        <x-nav-link href="{{ route('register') }}" :active="request()->routeIs('register')" class="text-white">
                            {{ __('Register') }}
                        </x-nav-link>
                    </div>
                @endguest

                <!-- Hamburger -->
                <div class="-mr-2 flex items-center sm:hidden">
                    <button @click="open = ! open"
                        class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                               hover:text-gray-200 hover:bg-gray-700 focus:outline-none transition">
                        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            <path :class="{'hidden': open, 'inline-flex': ! open }" 
                                  class="inline-flex" 
                                  stroke-linecap="round" 
                                  stroke-linejoin="round" 
                                  stroke-width="2" 
                                  d="M4 6h16M4 12h16M4 18h16" />
                            <path :class="{'hidden': ! open, 'inline-flex': open }" 
                                  class="hidden" 
                                  stroke-linecap="round" 
                                  stroke-linejoin="round" 
                                  stroke-width="2" 
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Responsive Navigation Menu -->
    <div :class="{'block': open, 'hidden': ! open}" class="hidden sm:hidden" style="background-color: #0a2642;">
        <div class="pt-2 pb-3 space-y-1">
            <x-responsive-nav-link href="{{ route('welcome') }}" :active="request()->routeIs('welcome')" class="text-white">
                {{ __('Home') }}
            </x-responsive-nav-link>
            <x-responsive-nav-link href="{{ route('mapping') }}" :active="request()->routeIs('mapping')" class="text-white">
                {{ __('Mapping') }}
            </x-responsive-nav-link>
            <x-responsive-nav-link href="{{ route('metadata') }}" :active="request()->routeIs('metadata')" class="text-white">
                {{ __('Metadata') }}
            </x-responsive-nav-link>
            <x-responsive-nav-link href="{{ route('organisation') }}" :active="request()->routeIs('organisation')" class="text-white">
                {{ __('Organisation') }}
            </x-responsive-nav-link>
        </div>

        @auth
            <!-- Authenticated User Menu -->
            <div class="pt-4 pb-1 border-t border-gray-700">
                <div class="px-4">
                    <div class="font-medium text-base text-white">{{ Auth::user()->name }}</div>
                    <div class="font-medium text-sm text-gray-300">{{ Auth::user()->email }}</div>
                </div>

                <div class="mt-3 space-y-1">
                    @if(auth()->user()->is_admin ?? false) 
                        <x-responsive-nav-link href="{{ route('dashboard') }}" class="text-white">
                            {{ __('Dashboard') }}
                        </x-responsive-nav-link>
                    @endif
                    
                    <x-responsive-nav-link href="{{ route('profile.edit') }}" :active="request()->routeIs('profile.edit')" class="text-white">
                        {{ __('Profile') }}
                    </x-responsive-nav-link>
                    
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <x-responsive-nav-link href="{{ route('logout') }}" class="text-white"
                            onclick="event.preventDefault(); this.closest('form').submit();">
                            {{ __('Log Out') }}
                        </x-responsive-nav-link>
                    </form>
                </div>
            </div>
        @endauth

        @guest
            <!-- Guest Menu -->
            <div class="pt-4 pb-4 border-t border-gray-700">
                <div class="space-y-1">
                    <x-responsive-nav-link href="{{ route('login') }}" :active="request()->routeIs('login')" class="text-white">
                        {{ __('Login') }}
                    </x-responsive-nav-link>
                    <x-responsive-nav-link href="{{ route('register') }}" :active="request()->routeIs('register')" class="text-white">
                        {{ __('Register') }}
                    </x-responsive-nav-link>
                </div>
            </div>
        @endguest
    </div>
</nav>
