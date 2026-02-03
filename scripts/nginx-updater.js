const fs = require('fs');
const path = require('path');

/**
 * Updates Nginx proxy mapping configuration
 * @param {Object} websites - Array of website objects with {subdomain, port}
 */
function updateProxyMap(websites) {
    const mapFilePath = path.join(__dirname, '../nginx-proxy/proxy_map.conf');

    let content = `# Auto-generated proxy mapping
# This file is managed by the generator script - DO NOT EDIT MANUALLY
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
    console.log('[ProxyUpdater] Nginx proxy map updated');
}

/**
 * Reload Nginx configuration
 * Returns command to run (for dry-run compatibility)
 */
function getNginxReloadCommand() {
    return 'sudo systemctl reload nginx';
}

module.exports = {
    updateProxyMap,
    getNginxReloadCommand
};
