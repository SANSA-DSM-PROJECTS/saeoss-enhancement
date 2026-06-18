<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAEOSS Portal | Organisations</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <link href="{{ asset('css/organs.css') }}" rel="stylesheet">
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    
    <!-- Open Layers -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css">
    <script src="https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js"></script>
    
    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body>

<x-app-layout>
    <section class="organs-section">
        <div class="container">
            <div class="organs-top">
                @auth
                <div class="add-action">
                    <button type="button" class="btn btn-conn btn-lg" data-bs-toggle="modal" data-bs-target="#addOrganisationModal">
                        <i class="bi bi-house-add-fill"></i> Add New Organisation
                    </button>
                </div>
                @endauth
                
                <div class="search-action">
                    <div class="input-group input-group-lg">
                        <input type="text" id="searchInput" class="form-control" placeholder="Search organisation...">
                    </div>
                </div>
            </div>
            <div class="organisations">                   
                <div id="organisationsContainer">
                    <div class="loading-spinner">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading organisations...</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    @auth
    <!-- Add New Organisation Modal -->
    <div class="modal fade" id="addOrganisationModal" tabindex="-1" aria-labelledby="addOrganisationModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content custom-modal">
                <div class="modal-header custom-modal-header">
                    <h5 class="modal-title" id="addOrganisationModalLabel">
                        <i class="bi bi-building-add"></i> Add New Organisation
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                
                <form id="addOrganisationForm">
                    @csrf
                    <div class="modal-body">
                        <div class="alert alert-info small">
                            <i class="bi bi-info-circle"></i> Identifier will be auto-generated (ORG0001, ORG0002, etc.)
                        </div>
                        
                        <div class="row g-3">
                            <div class="col-md-12">
                                <label for="organisation" class="form-label">Organisation Name <span class="text-danger">*</span></label>                                
                                <input type="text" class="form-control" id="organisation" value="{{ Auth::user()->organisation ?? '' }}" name="organisation" placeholder="Enter organisation name" {{ Auth::user()->organisation ? 'readonly' : '' }}>
                            </div>
                            
                            <div class="col-md-12">
                                <label for="alias" class="form-label">Organisation Alias </label>
                                <input type="text" class="form-control" id="alias" name="alias" placeholder="Enter organisation alias">
                            </div>
                            
                            <div class="col-md-12">
                                <label for="description" class="form-label">Description</label>
                                <textarea class="form-control" id="description" name="description" rows="3" placeholder="Brief description of the organisation..."></textarea>
                            </div>
                            
                            <div class="col-md-6">
                                <label for="director" class="form-label">Director</label>
                                <input type="text" class="form-control" id="director" name="director" placeholder="Dr. Thabo Nkosi">
                            </div>
                            
                            <div class="col-md-6">
                                <label for="type" class="form-label">Organisation Type <span class="text-danger">*</span></label>
                                <select class="form-select" id="type" name="type" required>
                                    <option value="government">Government Department</option>
                                    <option value="private">Private Sector</option>
                                    <option value="state">State Institution</option>
                                    <option value="NGO">NGO / Non-Profit</option>
                                    <option value="international">International Organisation</option>
                                </select>
                            </div>
                            
                            <div class="col-md-6">
                                <label for="contact_email" class="form-label">Contact Email</label>
                                <input type="email" class="form-control" id="contact_email" name="contact_email" placeholder="info@organisation.gov.za">
                            </div>
                            
                            <div class="col-md-6">
                                <label for="contact_phone" class="form-label">Contact Phone</label>
                                <input type="text" class="form-control" id="contact_phone" name="contact_phone" placeholder="+27 (12) 123 4567">
                            </div>
                            
                            <div class="col-md-12">
                                <label for="website" class="form-label">Website</label>
                                <input type="url" class="form-control" id="website" name="website" placeholder="https://www.example.gov.za">
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger fw-bold" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-conn" id="submitOrganisationBtn">Create Organisation</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    @endauth
    
    <footer class="footers">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>Quick Links</h4>
                <ul class="footer-links">
                    <li><a href="https://desa.sansa.org.za/" target="_blank"><i class="bi bi-grid-3x3-gap-fill"></i> Digital Earth South Africa (DESA)</a></li>
                    <li><a href="/metadata"><i class="bi bi-search"></i> Explore Metadata</a></li>
                    <li><a href="https://catalogue.sansa.org.za/" target="_blank"><i class="bi bi-database"></i> Data Catalogue</a></li>
                    <li><a href="{{ asset('DST-SAEOS-Strategy.pdf') }}" target="_blank"><i class="bi bi-file-earmark-text"></i> SAEOSS Strategy</a></li>
                    <li><a href="#"><i class="bi bi-shield-lock"></i> Privacy Policy</a></li>
                </ul>
            </div>
            
            <div class="footer-col">
                <h4>Partners</h4>
                <div class="partner-badge">
                    <span class="partner-item">
                        <a href="https://www.africageoportal.com/">
                            <i class="bi bi-globe"></i> SAGEO
                        </a>
                    </span>
                    <span class="partner-item">
                        <a href="https://www.africageoportal.com/">
                            <i class="bi bi-tree"></i> AfriGEO
                        </a>
                    </span>
                    <span class="partner-item">
                        <a href="https://www.africageoportal.com/">
                            <i class="bi bi-satellite"></i> GEO
                        </a>
                    </span>
                </div>
                <p style="font-size: 0.7rem; color:#7e8ba0; margin-top: 12px;">Collaborative Earth Observation Initiatives</p>
                <div class="contactus">
                    <h3 class="fw-bold mb-3">Contact Us</h3>
                    <div class="contact-item">
                        <i class="bi bi-envelope-fill me-2"></i>
                        <span>Email Address: <a href="mailto:saeoss@sansa.org.za">saeoss@sansa.org.za</a></span>
                    </div>
                    <div class="contact-item mt-2">
                        <i class="bi bi-telephone-fill me-2"></i>
                        <span>Contact No.: <a href="tel:+27128440433">+27(12) 844 0433</a></span>
                    </div>
                </div>
            </div>
            
            <div class="footer-col">
                <h4>Proudly brought to you by</h4>
                <div class="proudly-container">
                    <div class="dsi-logo">
                        <a href="https://www.dsti.gov.za/" target="_blank"><img src="{{ asset('images/dstlogo-white.png') }}" class="rounded" alt="DSI Logo"></a>
                    </div>
                    <div class="sansa-logo">
                        <a href="https://www.sansa.org.za" target="_blank"><img src="{{ asset('images/sansalogo.png') }}" class="rounded" alt="SANSA Logo"></a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="copyright">
                &copy; <script>document.write(new Date().getFullYear())</script> South African National Space Agency. All rights reserved.
            </div>
            <div class="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" class="x-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
            </div>
        </div>
    </footer>
</x-app-layout>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Pass Laravel asset URLs to JavaScript
    window.assetUrl = "{{ url('/') }}";
    window.defaultLogo = "{{ asset('images/default-org-logo.jpg') }}";
    
    // For debugging - log to console
    console.log('Asset URL:', window.assetUrl);
    console.log('Default Logo:', window.defaultLogo);
</script>
<script src="{{ asset('js/organisations.js') }}"></script>
</body>
</html>
