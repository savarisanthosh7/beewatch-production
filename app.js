/**
 * BeeWatch PRODUCTION Dashboard - REAL DATA ONLY
 * NO demo data, NO simulations - only actual sensor readings
 */

const CONFIG = {
    // 🚨 UPDATE THESE WITH YOUR SUPABASE VALUES (Step 8)
    API_BASE_URL: 'https://YOUR_PROJECT_ID.supabase.co/rest/v1',
    SUPABASE_KEY: 'YOUR_ANON_KEY_HERE',
    UPDATE_INTERVAL: 30000 // 30 seconds
};

let currentSection = 'dashboard';
let updateInterval = null;
let connectionStatus = 'connecting';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🐝 BeeWatch PRODUCTION Dashboard Starting...');
    console.log('📊 REAL DATA ONLY - No demo mode');
    initializeNavigation();
    loadInitialData();
    startAutoUpdate();
    console.log('✅ Production dashboard initialized');
});

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        loadSectionData(sectionName);
    }
}

async function apiCall(endpoint, options = {}) {
    try {
        const url = CONFIG.API_BASE_URL + '/' + endpoint;
        console.log(`🌐 Production API Call: ${endpoint}`);
        
        const headers = {
            'Content-Type': 'application/json',
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            ...options.headers
        };
        
        const response = await fetch(url, {
            headers,
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        updateConnectionStatus('connected');
        return { data, total: data.length };
        
    } catch (error) {
        console.error(`❌ Production API Error (${endpoint}):`, error);
        updateConnectionStatus('error');
        
        // Return EMPTY data instead of demo data
        return { data: [], total: 0 };
    }
}

function updateConnectionStatus(status) {
    connectionStatus = status;
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');
    
    statusDot.className = 'status-dot';
    
    switch (status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Live Production';
            break;
        case 'connecting':
            statusDot.classList.add('connecting');
            statusText.textContent = 'Connecting...';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'No Connection';
            break;
    }
}

async function loadInitialData() {
    console.log('📊 Loading production data...');
    
    try {
        await loadDashboardData();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Failed to load production data:', error);
    }
}

async function loadDashboardData() {
    try {
        // Load REAL sensors only
        const sensorsResponse = await apiCall('sensors');
        const sensors = sensorsResponse.data || [];
        
        // Load REAL detections only
        const detectionsResponse = await apiCall('detections?order=timestamp.desc&limit=10');
        const detections = detectionsResponse.data || [];
        
        console.log('📊 Production data loaded:', { 
            sensors: sensors.length, 
            detections: detections.length 
        });
        
        // Calculate metrics from REAL data only
        const activeSensors = sensors.filter(s => s.status === 'active').length;
        const totalDetections = detections.length;
        
        const avgConfidence = detections.length > 0 
            ? detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / detections.length
            : 0;
            
        const avgTemp = sensors.length > 0
            ? sensors.reduce((sum, s) => sum + (s.temperature || 0), 0) / sensors.length
            : 0;
        
        const metrics = {
            total_sensors: sensors.length,
            active_sensors: activeSensors,
            total_detections: totalDetections,
            avg_confidence: avgConfidence,
            avg_temperature: avgTemp
        };
        
        // Update UI with REAL data
        updateDashboardMetrics(metrics);
        updateRecentActivity(detections);
        updateSensorsDisplay(sensors);
        
        return { metrics, detections, sensors };
    } catch (error) {
        console.error('Failed to load production dashboard data:', error);
        updateConnectionStatus('error');
        showEmptyDashboard();
    }
}

function updateDashboardMetrics(metrics) {
    document.getElementById('activeSensors').textContent = metrics.active_sensors || 0;
    document.getElementById('totalSensors').textContent = metrics.total_sensors || 0;
    document.getElementById('totalDetections').textContent = metrics.total_detections || 0;
    document.getElementById('avgConfidence').textContent = 
        metrics.avg_confidence ? `${(metrics.avg_confidence * 100).toFixed(1)}%` : '0%';
    document.getElementById('avgTemp').textContent = 
        metrics.avg_temperature ? `${metrics.avg_temperature.toFixed(1)}°C` : '0°C';
}

function updateRecentActivity(detections) {
    const container = document.getElementById('recentActivity');
    
    if (!detections || detections.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📊 No bee detections yet<br>
                <small>Deploy your sensors with ML model to start monitoring</small>
            </div>
        `;
        return;
    }
    
    // Show REAL detections when they exist
    container.innerHTML = detections.slice(0, 5).map(detection => {
        const sensorName = detection.sensors?.name || `Sensor ${detection.sensor_id}`;
        const confidence = detection.confidence * 100;
        const time = new Date(detection.timestamp).toLocaleString();
        const confidenceClass = confidence > 90 ? 'high' : confidence > 70 ? 'medium' : 'low';
        
        return `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-title">🐝 Real bee detected at ${sensorName}</div>
                    <div class="activity-details">
                        ${time} • Temp: ${detection.temperature?.toFixed(1) || 'N/A'}°C • 
                        Humidity: ${detection.humidity?.toFixed(1) || 'N/A'}%
                    </div>
                </div>
                <div class="confidence-badge confidence-${confidenceClass}">
                    ${confidence.toFixed(1)}%
                </div>
            </div>
        `;
    }).join('');
}

function updateSensorsDisplay(sensors) {
    const container = document.getElementById('sensorsGrid');
    
    if (!sensors || sensors.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📡 No sensors registered yet<br>
                <small>Deploy ESP32 sensors to start production monitoring</small>
            </div>
        `;
        return;
    }
    
    // Show REAL sensors when they exist
    container.innerHTML = sensors.map(sensor => `
        <div class="sensor-card ${sensor.status}">
            <div class="sensor-header">
                <div class="sensor-name">${sensor.name}</div>
                <div class="sensor-status ${sensor.status}">${sensor.status}</div>
            </div>
            <div class="sensor-metrics">
                <div class="sensor-metric">
                    <div class="metric-label">Battery</div>
                    <div class="metric-number">${sensor.battery_level}%</div>
                </div>
                <div class="sensor-metric">
                    <div class="metric-label">Real Detections</div>
                    <div class="metric-number">${sensor.bee_detections || 0}</div>
                </div>
                <div class="sensor-metric">
                    <div class="metric-label">Temperature</div>
                    <div class="metric-number">${sensor.temperature?.toFixed(1) || '--'}°C</div>
                </div>
                <div class="sensor-metric">
                    <div class="metric-label">Humidity</div>
                    <div class="metric-number">${sensor.humidity?.toFixed(1) || '--'}%</div>
                </div>
            </div>
        </div>
    `).join('');
}

function showEmptyDashboard() {
    // Show empty state when no connection and no data
    document.getElementById('activeSensors').textContent = 0;
    document.getElementById('totalSensors').textContent = 0;
    document.getElementById('totalDetections').textContent = 0;
    document.getElementById('avgConfidence').textContent = '0%';
    document.getElementById('avgTemp').textContent = '0°C';
    
    updateRecentActivity([]);
    updateSensorsDisplay([]);
}

async function loadSectionData(sectionName) {
    console.log(`📄 Loading production data for section: ${sectionName}`);
    
    switch (sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'sensors':
            await loadSensors();
            break;
        case 'detections':
            await loadDetections();
            break;
        case 'export':
            break;
    }
}

async function loadSensors() {
    try {
        const response = await apiCall('sensors');
        updateSensorsDisplay(response.data);
        return response;
    } catch (error) {
        console.error('Failed to load production sensors:', error);
    }
}

async function loadDetections() {
    try {
        const response = await apiCall('detections?order=timestamp.desc&limit=50');
        updateDetectionsTable(response.data);
        return response;
    } catch (error) {
        console.error('Failed to load production detections:', error);
    }
}

function updateDetectionsTable(detections) {
    const tbody = document.getElementById('detectionsBody');
    
    if (!detections || detections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No real detections yet - Deploy ML model for bee detection</td></tr>';
        return;
    }
    
    tbody.innerHTML = detections.map(detection => {
        const sensorName = detection.sensors?.name || detection.sensor_id;
        const time = new Date(detection.timestamp).toLocaleString();
        const confidence = (detection.confidence * 100).toFixed(1);
        const confidenceClass = detection.confidence > 0.9 ? 'high' : 
                              detection.confidence > 0.7 ? 'medium' : 'low';
        
        return `
            <tr>
                <td>${time}</td>
                <td>${sensorName}</td>
                <td><span class="confidence-badge confidence-${confidenceClass}">${confidence}%</span></td>
                <td>${detection.temperature?.toFixed(1) || 'N/A'}°C</td>
                <td>${detection.humidity?.toFixed(1) || 'N/A'}%</td>
            </tr>
        `;
    }).join('');
}

function startAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(async () => {
        if (connectionStatus !== 'error') {
            try {
                await loadSectionData(currentSection);
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } catch (error) {
                console.error('Auto-update failed:', error);
            }
        }
    }, CONFIG.UPDATE_INTERVAL);
    
    console.log(`🔄 Production auto-update started (${CONFIG.UPDATE_INTERVAL/1000}s interval)`);
}

async function exportData() {
    const format = document.getElementById('exportFormat').value;
    const statusDiv = document.getElementById('exportStatus');
    
    statusDiv.textContent = 'Exporting production data...';
    statusDiv.className = 'export-status';
    
    try {
        const response = await apiCall('detections');
        const data = response.data || [];
        
        if (data.length === 0) {
            statusDiv.textContent = 'No production data to export yet';
            statusDiv.className = 'export-status';
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'export-status';
            }, 3000);
            return;
        }
        
        if (format === 'csv') {
            exportCSV(data);
        } else {
            exportJSON(data);
        }
        
        statusDiv.textContent = `✅ ${data.length} real records exported successfully!`;
        statusDiv.className = 'export-status success';
    } catch (error) {
        console.error('Export failed:', error);
        statusDiv.textContent = '❌ Export failed. Please try again.';
        statusDiv.className = 'export-status error';
    }
    
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'export-status';
    }, 3000);
}

function exportCSV(data) {
    const headers = ['Timestamp', 'Sensor ID', 'Sensor Name', 'Confidence', 'Temperature', 'Humidity'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            new Date(row.timestamp).toLocaleString(),
            row.sensor_id,
            row.sensors?.name || row.sensor_id,
            (row.confidence * 100).toFixed(1) + '%',
            row.temperature?.toFixed(1) || 'N/A',
            row.humidity?.toFixed(1) || 'N/A'
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, `beewatch_production_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

function exportJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `beewatch_production_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

updateConnectionStatus('connecting');

console.log('🐝 BeeWatch Production Dashboard Script Loaded');
console.log('📊 REAL DATA ONLY - No simulations, no demo data');
