(function() {
    // Only run on public pages (not dashboard)
    if (window.location.pathname.includes('/dashboard/')) return;
    
    // Check if already verified in this session
    if (sessionStorage.getItem('cf_verified') === 'true') return;

    // Generate random Ray ID
    const generateRayId = () => {
        const chars = '0123456789abcdef';
        let id = '';
        for (let i = 0; i < 16; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    };

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #cf-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: #ffffff; z-index: 9999999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #404040; transition: opacity 0.5s ease;
        }
        .cf-spinner {
            width: 40px; height: 40px; border: 4px solid #f3f3f3;
            border-top: 4px solid #f68b1e; border-radius: 50%;
            animation: cf-spin 1s linear infinite; margin-bottom: 20px;
        }
        @keyframes cf-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .cf-title { font-size: 22px; font-weight: 500; margin-bottom: 10px; }
        .cf-desc { font-size: 15px; color: #595959; margin-bottom: 30px; text-align: center; max-width: 400px;}
        .cf-footer { font-size: 13px; color: #8c8c8c; position: absolute; bottom: 30px; text-align: center; }
        .cf-logo { margin-bottom: 30px; font-size: 2rem; color: #f68b1e; font-weight: bold; }
    `;
    document.head.appendChild(style);

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.id = 'cf-overlay';
    
    // Get host
    const host = window.location.hostname || 'upucc.org';
    const rayId = generateRayId();

    overlay.innerHTML = `
        <div class="cf-logo">UPU-CC</div>
        <div class="cf-spinner"></div>
        <div class="cf-title">Verifying you are human. This may take a few seconds.</div>
        <div class="cf-desc">We need to verify that you are a human and not a bot before accessing ${host}.</div>
        
        <div class="cf-footer">
            Ray ID: ${rayId} &bull; Performance &amp; security by Cloudflare
        </div>
    `;

    document.documentElement.appendChild(overlay);
    
    // Remove scroll while verifying
    const originalOverflow = document.body ? document.body.style.overflow : '';
    const styleInterval = setInterval(() => {
        if(document.body) document.body.style.overflow = 'hidden';
    }, 10);

    // Wait 3.5 seconds
    setTimeout(() => {
        clearInterval(styleInterval);
        if(document.body) document.body.style.overflow = originalOverflow;
        sessionStorage.setItem('cf_verified', 'true');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    }, 3500);
})();
