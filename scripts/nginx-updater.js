const fs = require('fs');
const path = require('path');

/**
 * Updates Nginx proxy mapping configuration
 * @param {Object} websites - Array of website objects with {subdomain, port}
 */
function updateProxyMap(websites) {
    // Path should be relative to the script location, ensuring it's always found
    const mapFilePath = path.join(__dirname, '../nginx-proxy/proxy_map.conf');
    const nginxProxyDir = path.dirname(mapFilePath);

    if (!fs.existsSync(nginxProxyDir)) {
        try {
            fs.mkdirSync(nginxProxyDir, { recursive: true });
        } catch (e) {
            console.error('[ProxyUpdater] Failed to create nginx-proxy directory:', e.message);
        }
    }

    let content = `# Auto-generated proxy mapping
# Last updated: ${new Date().toISOString()}

map $subdomain $target_port {
    default 0;
`;

    // Add each website mapping
    websites.forEach(site => {
        content += `    ${site.subdomain} ${site.port};\n`;
    });

    content += '}\n';

    fs.writeFileSync(mapFilePath, content);
    console.log('[ProxyUpdater] Nginx proxy map updated at:', mapFilePath);
}

/**
 * Reload Nginx configuration
 */
function getNginxReloadCommand() {
    // Sudo is required on Fedora for systemctl reload
    return 'sudo systemctl reload nginx';
}

module.exports = {
    updateProxyMap,
    getNginxReloadCommand
};
