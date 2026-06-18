<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found | 404</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link href="{{ asset('css/errors.css') }}?v=1.0" rel="stylesheet">
    <!-- Custom CSS -->
    <style>
        :root {
            --primary-color: #0a2642;
            --secondary-color: #4d44db;
            --dark-color: #2f2e41;
            --light-color: #f8f9fa;
            --error-color: #ff6b6b;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f8f9fa;
            color: var(--dark-color);
            height: 100vh;
            display: flex;
            align-items: center;
            overflow-x: hidden;
        }
        
        .error-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 8px 0 rgba(10, 38, 66, 0.5), 0 12px 20px 0 rgba(10, 38, 66, 0.1);
            overflow: hidden;
            animation: fadeIn 0.8s ease-out;
        }
        
        .error-content {
            padding: 3rem;
        }
        
        .error-illustration {
            position: relative;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7ff 0%, #e8ecff 100%);
        }
        
        .error-code {
            font-size: 5rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
            line-height: 1;
        }
        
        .error-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--dark-color);
        }
        
        .error-message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: #6c757d;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
            padding: 0.6rem 1.5rem;
            font-weight: 500;
            border-radius: 50px;
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            background-color: var(--secondary-color);
            border-color: var(--secondary-color);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
        }
        
        .btn-outline-primary {
            color: var(--primary-color);
            border-color: var(--primary-color);
            padding: 0.6rem 1.5rem;
            font-weight: 500;
            border-radius: 50px;
            transition: all 0.3s ease;
        }
        
        .btn-outline-primary:hover {
            background-color: var(--primary-color);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
        }
        
        .astronaut {
            width: 100%;
            max-width: 300px;
            height: auto;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .stars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
		.star {
			position: absolute;
			background-color: var(--primary-color);
			border-radius: 50%;
			animation: floatStar 8s infinite ease-in-out;
			opacity: 0.7;
		}

		@keyframes floatStar {
			0% {
				transform: translate(0, 0) scale(1);
				opacity: 0.7;
			}
			25% {
				transform: translate(-10px, -15px) scale(0.9);
			}
			50% {
				transform: translate(5px, -20px) scale(1.1);
				opacity: 1;
			}
			75% {
				transform: translate(15px, 5px) scale(0.95);
			}
			100% {
				transform: translate(0, 0) scale(1);
				opacity: 0.7;
			}
		}
        
        @keyframes twinkle {
            0% { opacity: 0.2; }
            100% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .error-container {
                flex-direction: column;
            }
            
            .error-illustration {
                order: -1;
            }
            
            .error-code {
                font-size: 4rem;
            }
            
            .error-title {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="error-container d-flex">
                    <div class="error-content col-lg-6 d-flex flex-column justify-content-center">
                        <h1 class="error-code">404</h1>
                        <h2 class="error-title">Oops! Page Not Found</h2>
                        <p class="error-message">
                            The page you are looking for might have been removed, had its name changed, 
                            or is temporarily unavailable.
                        </p>
                        <div class="d-flex gap-3">
                            <a href="/" class="btn btn-primary">
                                <i class="fas fa-home me-2"></i>Go to Homepage
                            </a>
                            <a href="#" class="btn btn-outline-primary">
                                <i class="fas fa-envelope me-2"></i>Contact Support
                            </a>
                        </div>
                    </div>
                    <div class="error-illustration col-lg-6 d-flex align-items-center justify-content-center position-relative">
                        <div class="stars" id="stars"></div>
                        <img src="https://www.htvront.com/cdn/shop/products/astronaut.png?v=1629275156" alt="Astronaut floating in space" class="astronaut">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap 5 JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
	<!-- Replace the stars generation script with this: -->
	<script>
		document.addEventListener('DOMContentLoaded', function() {
		    const starsContainer = document.getElementById('stars');
		    const starCount = 100;
		    const starColors = ['#6c63ff', '#4CAF50', '#FFEB3B', '#F44336', '#795548', '#FFFFFF'];
		    const containerRect = starsContainer.getBoundingClientRect();
		    
		    for (let i = 0; i < starCount; i++) {
		        const star = document.createElement('div');
		        star.classList.add('star');
		        
		        // Random size between 1px and 4px
		        const size = Math.random() * 5 + 1;
		        star.style.width = `${size}px`;
		        star.style.height = `${size}px`;
		        
		        // Random starting position
		        star.style.left = `${Math.random() * 100}%`;
		        star.style.top = `${Math.random() * 100}%`;
		        
		        // Random color
		        star.style.backgroundColor = starColors[Math.floor(Math.random() * starColors.length)];
		        
		        // Random animation properties
		        const duration = 5 + Math.random() * 10; // 5-15 seconds
		        const delay = Math.random() * 5; // 0-5 second delay
		        star.style.animation = `floatStar ${duration}s ${delay}s infinite ease-in-out`;
		        
		        // Random movement path by adjusting animation
		        const keyframes = `
		            @keyframes starMove-${i} {
		                0% {
		                    transform: translate(0, 0);
		                    opacity: ${0.5 + Math.random() * 0.5};
		                }
		                25% {
		                    transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
		                }
		                50% {
		                    transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
		                    opacity: ${0.7 + Math.random() * 0.3};
		                }
		                75% {
		                    transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
		                }
		                100% {
		                    transform: translate(0, 0);
		                    opacity: ${0.5 + Math.random() * 0.5};
		                }
		            }
		        `;
		        
		        // Add the dynamic keyframes to the head
		        const style = document.createElement('style');
		        style.innerHTML = keyframes;
		        document.head.appendChild(style);
		        
		        // Apply the unique animation to each star
		        star.style.animation = `starMove-${i} ${duration}s ${delay}s infinite ease-in-out`;
		        
		        starsContainer.appendChild(star);
		    }
		});
	</script>
</body>
</html>
