/**
 * Pollination Monitor PRODUCTION Dashboard - FIXED VERSION
 * REAL DATA ONLY with improved error handling
 */

const CONFIG = {
    // 🚨 UPDATE THESE WITH YOUR EXACT VALUES
    API_BASE_URL: 'https://glhrqyzodmuddjigwyyq.supabase.co/rest/v1',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsaHJxeXpvZG11ZGRqaWd3eXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzgwMjcsImV4cCI6MjA3NTE1NDAyN30.UnCcfvU0d_9yqa0Ef8M29K4fXEYffe3ggTUrBt73zTc',
    UPDATE_INTERVAL: 30000
};

let currentSection = 'dashboard';
let updateInterval = null;
let connectionStatus = 'connecting';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌸 Pollination Monitor PRODUCTION - FIXED VERSION');
    console.log('🔧 Testing API connection...');
    
    // Test connection immediately
    testAPIConnection();
    
    // Initialize navigation
    initializeNavigation();
    
    // Load initial data
    setTimeout(() => {
        loadInitialData();
        startAutoUpdate();
    }, 2000);
    
    console.log('✅ Dashboard initialized with connection test');
});

async function testAPIConnection() {
    console.log('🔍 Testing API connection...');
    console.log('📡 API URL:', CONFIG.API_BASE_URL);
    console.log('🔑 API Key length:', CONFIG.SUPABASE_KEY.length);
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + '/sensors', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
            }
        });
        
        console.log('📊 Response status:', response.status);
        
        if (response.ok) {
            console.log('✅ API connection successful!');
            updateConnectionStatus('connected');
        } else {
            console.log('❌ API response error:', response.status, response.statusText);
            updateConnectionStatus('error');
        }
    } catch (error) {
        console.log('❌ API connection failed:', error.message);
        updateConnectionStatus('error');
    }
}

function initializeNavigation() {
    console.log('🔧 Initializing navigation...');
    
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('📋 Found navigation links:', navLinks.length);
    
    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            console.log(`🔗 Navigation clicked: ${section}`);
            showSection(section);
        });
        console.log(`✅ Navigation ${index + 1} initialized`);
    });
}

function showSection(sectionName) {
    console.log(`📄 Switching to section: ${sectionName}`);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        console.log(`✅ Section ${sectionName} now active`);
        
        // Load section-specific data
        loadSectionData(sectionName);
    } else {
        console.log(`❌ Section ${sectionName} not found`);
    }
}

async function apiCall(endpoint, options = {}) {
    try {
        const url = CONFIG.API_BASE_URL + '/' + endpoint;
        console.log(`🌐 API Call: ${endpoint}`);
        
        const headers = {
            'Content-Type': 'application/json',
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            ...options.headers
        };
        
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        console.log(`📊 API Response (${endpoint}):`, response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        updateConnectionStatus('connected');
        console.log(`✅ API Success (${endpoint}):`, data.length || 'N/A', 'records');
        return { data, total: data.length };
        
    } catch (error) {
        console.error(`❌ API Error (${endpoint}):`, error.message);
        updateConnectionStatus('error');
        return { data: [], total: 0 };
    }
}

function updateConnectionStatus(status) {
    connectionStatus = status;
    const statusElement = document.getElementById('connectionStatus');
    
    if (!statusElement) {
        console.log('❌ Connection status element not found');
        return;
    }
    
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');
    
    if (!statusDot || !statusText) {
        console.log('❌ Connection status elements not found');
        return;
    }
    
    statusDot.className = 'status-dot';
    
    switch (status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Live Production';
            console.log('✅ Connection status: CONNECTED');
            break;
        case 'connecting':
            statusDot.classList.add('connecting');
            statusText.textContent = 'Connecting...';
            console.log('⏳ Connection status: CONNECTING');
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'No Connection';
            console.log('❌ Connection status: ERROR');
            break;
    }
}

async function loadInitialData() {
    console.log('📊 Loading initial production data...');
    
    try {
        await loadDashboardData();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        console.log('✅ Initial data loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        showEmptyDashboard();
    }
}

async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    try {
        // Load sensors
        const sensorsResponse = await apiCall('sensors');
        const sensors = sensorsResponse.data || [];
        
        // Load detections
        const detectionsResponse = await apiCall('detections?order=timestamp.desc&limit=10');
        const detections = detectionsResponse.data || [];
        
        console.log('📈 Data summary:', {
            sensors: sensors.length,
            detections: detections.length
        });
        
        // Calculate metrics
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
        
        // Update UI
        updateDashboardMetrics(metrics);
        updateRecentActivity(detections);
        updateSensorsDisplay(sensors);
        
        console.log('✅ Dashboard data updated successfully');
        
    } catch (error) {
        console.error('❌ Dashboard data loading failed:', error);
        showEmptyDashboard();
    }
}

function updateDashboardMetrics(metrics) {
    console.log('📊 Updating dashboard metrics:', metrics);
    
    try {
        document.getElementById('activeSensors').textContent = metrics.active_sensors || 0;
        document.getElementById('totalSensors').textContent = metrics.total_sensors || 0;
        document.getElementById('totalDetections').textContent = metrics.total_detections || 0;
        document.getElementById('avgConfidence').textContent = 
            metrics.avg_confidence ? `${(metrics.avg_confidence * 100).toFixed(1)}%` : '0%';
        document.getElementById('avgTemp').textContent = 
            metrics.avg_temperature ? `${metrics.avg_temperature.toFixed(1)}°C` : '0°C';
        
        console.log('✅ Metrics updated successfully');
    } catch (error) {
        console.error('❌ Failed to update metrics:', error);
    }
}

function updateRecentActivity(detections) {
    const container = document.getElementById('recentActivity');
    if (!container) {
        console.log('❌ Recent activity container not found');
        return;
    }
    
    if (!detections || detections.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📊 No pollinator detections yet<br>
                <small>Deploy your sensors with ML model to start monitoring</small>
            </div>
        `;
        console.log('📊 Showing empty activity state');
        return;
    }
    
    // Show real detections
    container.innerHTML = detections.slice(0, 5).map(detection => {
        const sensorName = detection.sensors?.name || `Sensor ${detection.sensor_id}`;
        const confidence = detection.confidence * 100;
        const time = new Date(detection.timestamp).toLocaleString();
        const confidenceClass = confidence > 90 ? 'high' : confidence > 70 ? 'medium' : 'low';
        
        return `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-title">🐝 Pollinator detected at ${sensorName}</div>
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
    
    console.log(`✅ Updated activity with ${detections.length} detections`);
}

function updateSensorsDisplay(sensors) {
    const container = document.getElementById('sensorsGrid');
    if (!container) {
        console.log('❌ Sensors container not found');
        return;
    }
    
    if (!sensors || sensors.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📡 No sensors registered yet<br>
                <small>Deploy ESP32 sensors to start production monitoring</small>
            </div>
        `;
        console.log('📊 Showing empty sensors state');
        return;
    }
    
    // Show real sensors
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
                    <div class="metric-label">Detections</div>
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
    
    console.log(`✅ Updated sensors display with ${sensors.length} sensors`);
}

function showEmptyDashboard() {
    console.log('📊 Showing empty dashboard state');
    
    document.getElementById('activeSensors').textContent = 0;
    document.getElementById('totalSensors').textContent = 0;
    document.getElementById('totalDetections').textContent = 0;
    document.getElementById('avgConfidence').textContent = '0%';
    document.getElementById('avgTemp').textContent = '0°C';
    
    updateRecentActivity([]);
    updateSensorsDisplay([]);
}

async function loadSectionData(sectionName) {
    console.log(`📄 Loading section data: ${sectionName}`);
    
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
            console.log('📥 Export section - no data loading needed');
            break;
        default:
            console.log(`❓ Unknown section: ${sectionName}`);
    }
}

async function loadSensors() {
    console.log('📡 Loading sensors...');
    try {
        const response = await apiCall('sensors');
        updateSensorsDisplay(response.data);
        return response;
    } catch (error) {
        console.error('❌ Failed to load sensors:', error);
    }
}

async function loadDetections() {
    console.log('🐝 Loading detections...');
    try {
        const response = await apiCall('detections?order=timestamp.desc&limit=50');
        updateDetectionsTable(response.data);
        return response;
    } catch (error) {
        console.error('❌ Failed to load detections:', error);
    }
}

function updateDetectionsTable(detections) {
    const tbody = document.getElementById('detectionsBody');
    if (!tbody) {
        console.log('❌ Detections table body not found');
        return;
    }
    
    if (!detections || detections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No real detections yet - Deploy ML model for pollinator detection</td></tr>';
        console.log('📊 Showing empty detections table');
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
    
    console.log(`✅ Updated detections table with ${detections.length} records`);
}

function startAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(async () => {
        if (connectionStatus !== 'error') {
            try {
                await loadSectionData(currentSection);
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            } catch (error) {
                console.error('❌ Auto-update failed:', error);
            }
        }
    }, CONFIG.UPDATE_INTERVAL);
    
    console.log(`🔄 Auto-update started (${CONFIG.UPDATE_INTERVAL/1000}s interval)`);
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
    
    downloadFile(csvContent, `pollination_monitor_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

function exportJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `pollination_monitor_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
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

// Initialize connection status
updateConnectionStatus('connecting');

console.log('🌸 Pollination Monitor Production Dashboard - FIXED VERSION Loaded');
console.log('🔧 Enhanced error handling and debugging enabled');
