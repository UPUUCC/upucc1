(function() {
    if (window.location.pathname.includes('/dashboard/')) return;
    if (sessionStorage.getItem('cf_verified') === 'true') return;

    const generateRayId = () => {
        const chars = '0123456789abcdef';
        let id = '';
        for (let i = 0; i < 16; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    };

    const style = document.createElement('style');
    style.innerHTML = `
        #cf-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: #000000; z-index: 9999999;
            display: flex; flex-direction: column; justify-content: space-between;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #ffffff; transition: opacity 0.5s ease;
            box-sizing: border-box;
        }
        .cf-content {
            margin: auto;
            max-width: 800px;
            width: 100%;
            padding: 20px;
            padding-top: 10vh;
        }
        .cf-domain { font-size: 2.2rem; font-weight: 500; margin-bottom: 10px; }
        .cf-title { font-size: 1.5rem; font-weight: 500; margin-bottom: 20px; }
        .cf-desc { font-size: 1rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 40px; max-width: 700px; }
        
        .cf-box {
            background-color: #1c1c1c;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 320px;
        }
        
        .cf-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        /* Turnstile Spinner */
        .cf-spinner-container {
            position: relative;
            width: 24px;
            height: 24px;
        }
        .cf-dot {
            position: absolute;
            width: 4px; height: 4px;
            background-color: #22c55e; /* Green dots */
            border-radius: 50%;
            animation: cf-pulse 1.2s linear infinite;
        }
        .cf-dot:nth-child(1) { top: 0; left: 10px; animation-delay: 0s; }
        .cf-dot:nth-child(2) { top: 3px; left: 17px; animation-delay: 0.1s; }
        .cf-dot:nth-child(3) { top: 10px; left: 20px; animation-delay: 0.2s; }
        .cf-dot:nth-child(4) { top: 17px; left: 17px; animation-delay: 0.3s; }
        .cf-dot:nth-child(5) { top: 20px; left: 10px; animation-delay: 0.4s; }
        .cf-dot:nth-child(6) { top: 17px; left: 3px; animation-delay: 0.5s; }
        .cf-dot:nth-child(7) { top: 10px; left: 0; animation-delay: 0.6s; }
        .cf-dot:nth-child(8) { top: 3px; left: 3px; animation-delay: 0.7s; }
        
        @keyframes cf-pulse {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        
        .cf-verifying-text {
            font-size: 0.9rem;
            color: #e5e5e5;
        }
        
        .cf-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .cf-logo-text {
            font-size: 0.8rem;
            font-weight: bold;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .cf-logo-icon {
            color: #f68b1e; /* Cloudflare orange */
        }
        .cf-links {
            font-size: 0.7rem;
            color: #a1a1aa;
            margin-top: 2px;
        }
        
        .cf-footer-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            padding-bottom: 40px;
        }
        
        .cf-footer-line {
            height: 1px;
            background-color: #333;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .cf-footer { 
            font-size: 0.85rem; 
            color: #a1a1aa; 
            text-align: center;
            line-height: 1.6;
        }
        .cf-footer a { color: #3b82f6; text-decoration: none; }
        .cf-footer a:hover { text-decoration: underline; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'cf-overlay';
    
    const host = window.location.hostname || 'www.upucc.org';
    const rayId = generateRayId();

    overlay.innerHTML = `
        <div class="cf-content">
            <div class="cf-domain">${host}</div>
            <div class="cf-title">Performing security verification</div>
            <div class="cf-desc">This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.</div>
            
            <div class="cf-box">
                <div class="cf-left">
                    <div class="cf-spinner-container">
                        <div class="cf-dot"></div><div class="cf-dot"></div><div class="cf-dot"></div><div class="cf-dot"></div>
                        <div class="cf-dot"></div><div class="cf-dot"></div><div class="cf-dot"></div><div class="cf-dot"></div>
                    </div>
                    <div class="cf-verifying-text">Verifying...</div>
                </div>
                <div class="cf-right">
                    <div class="cf-logo-text">
                        <svg class="cf-logo-icon" width="24" height="16" viewBox="0 0 49 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M48.8 14.8c-.8-5.3-5-9.3-10.2-9.3-1.6 0-3.1.4-4.5 1.1-1.3-4.1-5-7-9.5-7-4.3 0-7.9 2.7-9.3 6.6-1.1-.9-2.5-1.5-4-1.5-3.3 0-6.1 2.5-6.6 5.8-2.6.4-4.7 2.7-4.7 5.5 0 3 2.5 5.5 5.5 5.5h38.2c2.8 0 5-2.2 5-5 0-1.5-.7-2.9-1.8-3.9l1.9 2.2z" />
                        </svg>
                        CLOUDFLARE
                    </div>
                    <div class="cf-links">Privacy &bull; Help</div>
                </div>
            </div>
        </div>
        
        <div class="cf-footer-container">
            <div class="cf-footer-line"></div>
            <div class="cf-footer">
                <div>Ray ID: ${rayId}</div>
                <div>Performance and Security by <a href="#">Cloudflare</a> | <a href="#">Privacy</a></div>
            </div>
        </div>
    `;

    document.documentElement.appendChild(overlay);
    
    const originalOverflow = document.body ? document.body.style.overflow : '';
    const styleInterval = setInterval(() => {
        if(document.body) document.body.style.overflow = 'hidden';
    }, 10);

    setTimeout(() => {
        clearInterval(styleInterval);
        if(document.body) document.body.style.overflow = originalOverflow;
        sessionStorage.setItem('cf_verified', 'true');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    }, 4500);
})();
