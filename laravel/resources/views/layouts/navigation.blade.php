<nav x-data="{ open: false }" class="border-gray-100" style="background-color: #0a2642; height: 70px; min-height: 70px;">
    <!-- Primary Navigation Menu -->
    <div class="container-fluid px-4 h-full">
        <div class="flex justify-between items-center h-full">
            <!-- Logo on the left -->
            <div class="flex items-center h-full">
                <div class="images shrink-0 flex items-center navbar-logo">
                    <a href="/" class="flex items-center h-full">
                        <img src="{{ asset('images/saeoss-logo.png') }}" alt="saeoss Logo" style="max-height: 70px; width: auto;">
                    </a>
                </div>
            </div>

            <!-- Center Navigation Links - Vertically Centered -->
            <div class="hidden sm:flex sm:items-center sm:justify-center sm:absolute sm:left-0 sm:right-0" style="height: 70px; pointer-events: none;">
                <div class="flex space-x-8 items-center h-full" style="pointer-events: auto;">
                    <a href="{{ route('welcome') }}" 
                       class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('welcome') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                        {{ __('Home') }}
                    </a>
                    <a href="{{ route('mapping') }}" 
                       class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('mapping') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                        {{ __('Mapping') }}
                    </a>
                    <a href="{{ route('metadata') }}" 
                       class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('metadata') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                        {{ __('Metadata') }}
                    </a>
                    <a href="{{ route('organisation') }}" 
                       class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('organisation') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                        {{ __('Organisation') }}
                    </a>
                </div>
            </div>

            <!-- Right Side Of Navbar -->
            <div class="flex items-center h-full">
                @auth
                    <!-- Settings Dropdown -->
                    <div class="hidden sm:flex sm:items-center sm:ml-6 h-full">
                        <x-dropdown align="right" width="48">
                            <x-slot name="trigger">
                                <button class="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md 
                                               text-white bg-transparent hover:bg-blue-900 focus:outline-none 
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
                    <div class="hidden sm:flex sm:items-center sm:space-x-4 sm:ml-6 h-full">
                        <a href="{{ route('login') }}" 
                           class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('login') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                           style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                            {{ __('Login') }}
                        </a>
                        <a href="{{ route('register') }}" 
                           class="text-white hover:text-blue-300 font-medium transition duration-150 {{ request()->routeIs('register') ? 'text-blue-300 border-b-2 border-blue-300' : '' }}" 
                           style="color: white !important; text-decoration: none; padding: 4px 0; display: inline-flex; align-items: center; height: 100%;">
                            {{ __('Register') }}
                        </a>
                    </div>
                @endguest

                <!-- Hamburger -->
                <div class="-mr-2 flex items-center sm:hidden h-full">
                    <button @click="open = ! open"
                        class="inline-flex items-center justify-center p-2 rounded-md text-white 
                               hover:text-blue-300 hover:bg-blue-900 focus:outline-none transition">
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
            <a href="{{ route('welcome') }}" 
               class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('welcome') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
               style="color: white !important; text-decoration: none;">
                {{ __('Home') }}
            </a>
            <a href="{{ route('mapping') }}" 
               class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('mapping') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
               style="color: white !important; text-decoration: none;">
                {{ __('Mapping') }}
            </a>
            <a href="{{ route('metadata') }}" 
               class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('metadata') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
               style="color: white !important; text-decoration: none;">
                {{ __('Metadata') }}
            </a>
            <a href="{{ route('organisation') }}" 
               class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('organisation') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
               style="color: white !important; text-decoration: none;">
                {{ __('Organisation') }}
            </a>
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
                        <a href="{{ route('dashboard') }}" 
                           class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150" 
                           style="color: white !important; text-decoration: none;">
                            {{ __('Dashboard') }}
                        </a>
                    @endif
                    
                    <a href="{{ route('profile.edit') }}" 
                       class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('profile.edit') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none;">
                        {{ __('Profile') }}
                    </a>
                    
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <a href="{{ route('logout') }}" 
                           class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150" 
                           style="color: white !important; text-decoration: none;"
                           onclick="event.preventDefault(); this.closest('form').submit();">
                            {{ __('Log Out') }}
                        </a>
                    </form>
                </div>
            </div>
        @endauth

        @guest
            <!-- Guest Menu -->
            <div class="pt-4 pb-4 border-t border-gray-700">
                <div class="space-y-1">
                    <a href="{{ route('login') }}" 
                       class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('login') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none;">
                        {{ __('Login') }}
                    </a>
                    <a href="{{ route('register') }}" 
                       class="block pl-3 pr-4 py-2 text-base font-medium text-white hover:text-blue-300 hover:bg-blue-900 transition duration-150 {{ request()->routeIs('register') ? 'text-blue-300 border-l-4 border-blue-300' : '' }}" 
                       style="color: white !important; text-decoration: none;">
                        {{ __('Register') }}
                    </a>
                </div>
            </div>
        @endguest
    </div>
</nav>
