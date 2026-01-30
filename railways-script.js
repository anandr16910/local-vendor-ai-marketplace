// Indian Railways Dashboard - Interactive Charts and Analytics

// Railway infrastructure and performance data (2019-2024)
const railwayData = {
    '5y': {
        labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
        trackKm: [67368, 67956, 68103, 68426, 68584, 68584],
        electrifiedKm: [41548, 46831, 52247, 57919, 64482, 68584],
        passengers: [8.4, 2.8, 4.2, 6.1, 8.2, 8.4], // in billions annually
        revenue: [1.86, 1.59, 1.78, 2.01, 2.23, 2.40] // in lakh crores
    },
    '3y': {
        labels: ['2022', '2023', '2024'],
        trackKm: [68426, 68584, 68584],
        electrifiedKm: [57919, 64482, 68584],
        passengers: [6.1, 8.2, 8.4],
        revenue: [2.01, 2.23, 2.40]
    },
    '1y': {
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        trackKm: [68584, 68584, 68584, 68584],
        electrifiedKm: [66000, 67200, 68000, 68584],
        passengers: [2.0, 2.1, 2.2, 2.1],
        revenue: [0.58, 0.61, 0.62, 0.59]
    }
};

const revenueBreakdown = {
    labels: ['Passenger Services', 'Freight Services', 'Other Services'],
    data: [45, 52, 3],
    colors: ['#ff6b35', '#00d4ff', '#4ecdc4']
};

const trainTypes = {
    labels: ['Express/Mail', 'Passenger', 'Suburban', 'Goods', 'Others'],
    data: [35, 25, 20, 15, 5],
    colors: ['#ff6b35', '#f7931e', '#ffcc02', '#00d4ff', '#4ecdc4']
};

let infrastructureChart, revenueChart, trainTypesChart;

// Initialize all charts
function initCharts() {
    // Infrastructure Growth Chart
    const infraCtx = document.getElementById('infrastructureChart').getContext('2d');
    infrastructureChart = new Chart(infraCtx, {
        type: 'line',
        data: {
            labels: railwayData['5y'].labels,
            datasets: [{
                label: 'Total Track (km)',
                data: railwayData['5y'].trackKm,
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff6b35',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Electrified Track (km)',
                data: railwayData['5y'].electrifiedKm,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Annual Passengers (Billions)',
                data: railwayData['5y'].passengers,
                borderColor: '#f7931e',
                backgroundColor: 'rgba(247, 147, 30, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#f7931e',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        color: '#ff6b35',
                        callback: function(value) {
                            return (value/1000).toFixed(0) + 'K km';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 107, 53, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#f7931e',
                        callback: function(value) {
                            return value.toFixed(1) + 'B';
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(247, 147, 30, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    // Revenue Breakdown Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'doughnut',
        data: {
            labels: revenueBreakdown.labels,
            datasets: [{
                data: revenueBreakdown.data,
                backgroundColor: revenueBreakdown.colors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        padding: 15,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Train Types Chart
    const trainCtx = document.getElementById('trainTypesChart').getContext('2d');
    trainTypesChart = new Chart(trainCtx, {
        type: 'polarArea',
        data: {
            labels: trainTypes.labels,
            datasets: [{
                data: trainTypes.data,
                backgroundColor: trainTypes.colors.map(color => color + '80'),
                borderColor: trainTypes.colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        padding: 10,
                        font: {
                            size: 9
                        }
                    }
                }
            },
            scales: {
                r: {
                    ticks: {
                        color: '#b0b0b0',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Update charts based on selected period
function updateCharts(period) {
    const data = railwayData[period];
    
    // Update infrastructure chart
    infrastructureChart.data.labels = data.labels;
    infrastructureChart.data.datasets[0].data = data.trackKm;
    infrastructureChart.data.datasets[1].data = data.electrifiedKm;
    infrastructureChart.data.datasets[2].data = data.passengers;
    infrastructureChart.update('active');
    
    // Update statistics
    updateStats(period);
}

// Update statistics cards with animation
function updateStats(period) {
    const data = railwayData[period];
    const latestIndex = data.labels.length - 1;
    
    const trackKm = data.trackKm[latestIndex];
    const electrifiedKm = data.electrifiedKm[latestIndex];
    const electrificationPercent = Math.round((electrifiedKm / trackKm) * 100);
    const revenue = data.revenue[latestIndex];
    const dailyPassengers = (data.passengers[latestIndex] * 1000 / 365).toFixed(1); // Convert to daily millions
    
    // Animate the values
    animateValue('totalTrackKm', 0, trackKm, 1500, '', '');
    animateValue('electrificationPercent', 0, electrificationPercent, 1500, '', '%');
    animateValue('revenue', 0, revenue, 1500, '₹', 'L Cr');
    animateValue('dailyPassengers', 0, parseFloat(dailyPassengers), 1500, '', 'M');
}

// Animate number counting with custom formatting
function animateValue(elementId, start, end, duration, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * easeOutCubic(progress);
        
        let displayValue;
        switch(elementId) {
            case 'totalTrackKm':
                displayValue = Math.round(current).toLocaleString();
                break;
            case 'electrificationPercent':
                displayValue = Math.round(current);
                break;
            case 'revenue':
                displayValue = current.toFixed(1);
                break;
            case 'dailyPassengers':
                displayValue = current.toFixed(1);
                break;
            default:
                displayValue = Math.round(current);
        }
        
        element.textContent = prefix + displayValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Easing function for smooth animations
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    
    // Interactive controls
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            controlButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update charts with selected period
            const period = this.getAttribute('data-period');
            updateCharts(period);
        });
    });
    
    // Enhanced hover effects for stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.05)';
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.zIndex = '1';
        });
    });
    
    // Initiative cards hover effects
    const initiativeCards = document.querySelectorAll('.initiative-card');
    initiativeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.03)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Create animated background elements
function createRailwayElements() {
    const container = document.querySelector('.dashboard-container');
    
    // Create floating railway track elements
    for (let i = 0; i < 3; i++) {
        const track = document.createElement('div');
        track.style.position = 'absolute';
        track.style.width = '200px';
        track.style.height = '4px';
        track.style.background = 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.3), transparent)';
        track.style.left = Math.random() * 100 + '%';
        track.style.top = Math.random() * 100 + '%';
        track.style.animation = `trackMove ${Math.random() * 15 + 10}s linear infinite`;
        track.style.zIndex = '-1';
        track.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
        container.appendChild(track);
    }
    
    // Create signal light elements
    for (let i = 0; i < 4; i++) {
        const signal = document.createElement('div');
        signal.style.position = 'absolute';
        signal.style.width = '8px';
        signal.style.height = '8px';
        signal.style.background = i % 2 === 0 ? '#ff6b35' : '#00d4ff';
        signal.style.borderRadius = '50%';
        signal.style.left = Math.random() * 100 + '%';
        signal.style.top = Math.random() * 100 + '%';
        signal.style.animation = `signalBlink ${Math.random() * 3 + 2}s ease-in-out infinite`;
        signal.style.zIndex = '-1';
        signal.style.boxShadow = `0 0 20px ${i % 2 === 0 ? '#ff6b35' : '#00d4ff'}`;
        container.appendChild(signal);
    }
}

// Add CSS animations for background elements
const style = document.createElement('style');
style.textContent = `
    @keyframes trackMove {
        0% { transform: translateX(-100px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100px) rotate(360deg); opacity: 0; }
    }
    
    @keyframes signalBlink {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
    }
`;
document.head.appendChild(style);

// Initialize background elements
document.addEventListener('DOMContentLoaded', createRailwayElements);