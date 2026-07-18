// Admin Dashboard Statistics Manager
// Handles chart initialization, data processing, and export functionality

const StatsManager = {
  // Process monthly data from JSON string
  processMonthlyData: (monthlyDataJson) => {
    try {
      const monthlyData = JSON.parse(monthlyDataJson);
      return this.generateMonthlyStats(monthlyData);
    } catch (error) {
      console.error('Error processing monthly data:', error);
      return this.getDefaultMonthlyData();
    }
  },

  // Generate comprehensive statistics from raw data
  generateMonthlyStats: (monthlyData) => {
    const processedData = monthlyData.map((item, index) => {
      const trend = index > 0 ? ((item.orders - monthlyData[index - 1].orders) / monthlyData[index - 1].orders * 100) : 0;
      const avgOrderValue = item.orders > 0 ? item.revenue / item.orders : 0;
      const trendDirection = this.getTrendDirection(trend);
      const isPeak = item.orders === Math.max(...monthlyData.map(d => d.orders));
      const isLowest = item.orders === Math.min(...monthlyData.map(d => d.orders));

      return {
        ...item,
        trend: parseFloat(trend.toFixed(2)),
        trendDirection,
        avgOrderValue,
        trendClass: trendDirection.class,
        icon: trendDirection.icon,
        isPeak,
        isLowest,
        displayMonth: this.formatMonth(item.label)
      };
    });

    // Calculate overall trends
    const totalOrders = processedData.reduce((sum, item) => sum + item.orders, 0);
    const totalRevenue = processedData.reduce((sum, item) => sum + item.revenue, 0);
    const avgMonthlyOrders = totalOrders / processedData.length;
    const avgMonthlyRevenue = totalRevenue / processedData.length;
    const bestMonth = processedData.reduce((best, current) => current.orders > best.orders ? current : best);
    const worstMonth = processedData.reduce((worst, current) => current.orders < worst.orders ? current : worst);
    const overallTrend = this.calculateOverallTrend(processedData);

    return {
      processedData,
      summary: {
        totalOrders,
        totalRevenue,
        avgMonthlyOrders,
        avgMonthlyRevenue,
        bestMonth,
        worstMonth,
        overallTrend,
        peakCount: processedData.filter(d => d.isPeak).length,
        lowCount: processedData.filter(d => d.isLowest).length
      }
    };
  },

  // Get trend styling information
  getTrendDirection: (trend) => {
    if (trend > 10) return { direction: 'up', class: 'trend-positive', icon: '📈' };
    if (trend < -10) return { direction: 'down', class: 'trend-negative', icon: '📉' };
    return { direction: 'stable', class: 'trend-stable', icon: '➡️' };
  },

  // Format month display
  formatMonth: (dateStr) => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const [year, month] = dateStr.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  },

  // Calculate overall trend percentage
  calculateOverallTrend: (data) => {
    if (data.length < 2) return { percentage: 0, direction: 'stable' };
    const first = data[0].orders;
    const last = data[data.length - 1].orders;
    const percentage = ((last - first) / first * 100);
    return {
      percentage: parseFloat(percentage.toFixed(2)),
      direction: percentage > 10 ? 'up' : percentage < -10 ? 'down' : 'stable',
      icon: percentage > 10 ? '📈' : percentage < -10 ? '📉' : '➡️'
    };
  },

  // Initialize Chart.js with comprehensive configuration
  initMonthlyChart: (monthlyData, chartCanvasId = 'monthlyChart') => {
    const stats = this.processMonthlyData(monthlyData);

    const ctx = document.getElementById(chartCanvasId);
    if (!ctx) {
      console.error('Chart canvas element not found:', chartCanvasId);
      return null;
    }

    // Update summary statistics
    this.updateSummaryDisplay(stats.summary);

    // Chart configuration
    const config = {
      type: 'bar',
      data: {
        labels: stats.processedData.map(item => item.displayMonth),
        datasets: [
          {
            label: 'Số lượng đơn hàng',
            data: stats.processedData.map(item => item.orders),
            backgroundColor: stats.processedData.map(item => this.getBarColor(item)),
            borderColor: stats.processedData.map(item => this.getBarBorderColor(item)),
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.8,
            categoryPercentage: 0.9
          },
          {
            label: 'Doanh thu',
            data: stats.processedData.map(item => item.revenue),
            type: 'line',
            borderColor: 'var(--co-secondary)',
            backgroundColor: 'rgba(200,149,108,0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointBackgroundColor: 'var(--co-secondary)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'var(--co-bg-card)',
            borderColor: 'var(--co-border)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 16,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                const item = stats.processedData[dataIndex];
                return `${item.label} ${item.displayMonth}`;
              },
              label: (context) => {
                const dataIndex = context.dataIndex;
                const item = stats.processedData[dataIndex];

                if (context.dataset.label === 'Số lượng đơn hàng') {
                  return `📦 ${item.orders} đơn hàng`;
                }

                return `💰 ${item.revenue.toLocaleString('vi-VN')}đ`;
              },
              afterBody: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                const item = stats.processedData[dataIndex];

                return [
                  `📊 TB đơn hàng: ${item.avgOrderValue.toLocaleString('vi-VN')}đ`,
                  `📈 Tăng trưởng: ${item.trend}% ${item.trendDirection.icon}`,
                  `🏆 Hạng: ${item.isPeak ? 'Cao nhất' : item.isLowest ? 'Thấp nhất' : 'Trung bình'}`
                ];
              }
            }
          },
          customAnnotation: {
            display: true,
            content: stats.summary.peakCount + ' tháng đỉnh cao'
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            border: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'var(--co-border)',
              lineWidth: 0.5,
              drawBorder: false
            },
            border: {
              display: false
            },
            ticks: {
              callback: function(value) {
                return value.toLocaleString('vi-VN');
              },
              font: {
                size: 11
              }
            }
          }
        },
        hover: {
          mode: 'index',
          intersect: false
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        }
      }
    };

    // Initialize chart
    const chart = new Chart(ctx, config);

    // Store chart reference globally
    window.monthlyChartInstance = chart;

    // Return statistics for external use
    return { stats, chart };
  },

  // Get bar color based on data
  getBarColor: (item) => {
    if (item.isPeak) return 'var(--co-success)';
    if (item.isLowest) return 'var(--co-danger)';
    if (item.trend > 10) return 'var(--co-success)';
    if (item.trend < -10) return 'var(--co-danger)';
    return 'var(--co-secondary)';
  },

  // Get bar border color
  getBarBorderColor: (item) => {
    if (item.isPeak) return 'var(--co-success)';
    if (item.isLowest) return 'var(--co-danger)';
    return 'var(--co-secondary)';
  },

  // Update summary statistics display
  updateSummaryDisplay: (stats) => {
    document.getElementById('chartTotalOrders').textContent = stats.totalOrders.toLocaleString('vi-VN');
    document.getElementById('chartBestMonth').textContent = stats.bestMonth.displayMonth;
    document.getElementById('chartAvgOrders').textContent = Math.round(stats.avgMonthlyOrders).toLocaleString('vi-VN');
    document.getElementById('chartWorstMonth').textContent = stats.worstMonth.displayMonth;

    // Update progress bar
    const maxOrders = Math.max(...stats.processedData.map(item => item.orders));
    const progressPercentage = Math.min(100, Math.round((stats.avgMonthlyOrders / maxOrders) * 100));

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = progressPercentage + '%';

      // Change color based on performance
      if (progressPercentage >= 80) {
        progressBar.className = 'progress-bar bg-success';
      } else if (progressPercentage >= 60) {
        progressBar.className = 'progress-bar bg-warning';
      } else {
        progressBar.className = 'progress-bar bg-secondary';
      }
    }

    // Update trend indicators
    this.updateTrendIndicators(stats);
  },

  // Update trend indicators
  updateTrendIndicators: (stats) => {
    const trendElement = document.getElementById('monthlyTrend');
    if (trendElement) {
      const { percentage, direction, icon } = stats.overallTrend;

      trendElement.innerHTML = `
        <span class="trend-indicator ${direction}">
          <span class="trend-icon">${icon}</span>
          <span>${percentage > 0 ? '+' : ''}${percentage}%</span>
          <span class="trend-text">so với tháng trước</span>
        </span>
      `;
    }
  },

  // Export chart data as CSV
  exportChartData: (stats, chart) => {
    const csvHeaders = [
      'Tháng', 'Đơn hàng', 'Doanh thu', 'TB đơn hàng', 'Tăng trưởng (%)', 'Trend', 'Hạng'
    ];

    const csvRows = stats.processedData.map(item => [
      item.displayMonth,
      item.orders,
      item.revenue,
      item.avgOrderValue,
      item.trend,
      `${item.trendDirection.icon} ${item.trendDirection.direction === 'up' ? 'Tăng' : item.trendDirection.direction === 'down' ? 'Giảm' : 'Ổn định'} ${Math.abs(item.trend)}%`,
      item.isPeak ? '🏆 Cao nhất' : item.isLowest ? '📉 Thấp nhất' : 'Trung bình'
    ]);

    // Add summary row
    const summaryRow = [
      'TÓM TẮT',
      stats.totalOrders,
      stats.totalRevenue,
      stats.avgMonthlyRevenue,
      stats.overallTrend.percentage,
      stats.overallTrend.icon + ' ' + stats.overallTrend.direction,
      `${stats.peakCount} đỉnh cao / ${stats.lowCount} đáy thấp`
    ];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
      summaryRow.join(',')
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_monthly_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();

    URL.revokeObjectURL(url);
  },

  // Toggle chart type between bar and line
  toggleChartType: (chart) => {
    const currentType = chart.data.datasets[0].type === 'bar' ? 'bar' : 'line';
    const newType = currentType === 'bar' ? 'line' : 'bar';

    chart.data.datasets.forEach(dataset => {
      dataset.type = newType;
    });

    chart.update();

    // Update button icon and title
    const toggleButton = document.getElementById('toggleChartType');
    if (toggleButton) {
      const icon = newType === 'bar' ? 'bi-bar-chart' : 'bi-graph-up-arrow';
      const title = newType === 'bar' ? 'Hiển thị biểu đồ cột' : 'Hiển thị biểu đồ đường';

      toggleButton.innerHTML = `<i class="bi bi-${icon} me-1"></i> ${title}`;
    }
  },

  // Initialize all dashboard statistics
  init: () => {
    // Get monthly data from script tag
    const monthlyDataJson = document.querySelector('script[data-monthly-stats]')?.textContent;

    if (!monthlyDataJson) {
      console.warn('No monthly statistics data found');
      return;
    }

    // Initialize chart
    const result = this.initMonthlyChart(monthlyDataJson);

    // Setup event listeners
    this.setupEventListeners(result);

    // Return initialized manager
    return result;
  },

  // Setup event listeners for dashboard controls
  setupEventListeners: (result) => {
    if (!result) return;

    const { chart } = result;

    // Toggle chart type button
    document.getElementById('toggleChartType')?.addEventListener('click', () => {
      this.toggleChartType(chart);
    });

    // Export CSV button
    document.getElementById('exportCSV')?.addEventListener('click', () => {
      this.exportChartData(result.stats, chart);
    });

    // Add resize handler for chart responsiveness
    window.addEventListener('resize', () => {
      if (chart) {
        chart.resize();
      }
    });
  },

  // Get default monthly data structure
  getDefaultMonthlyData: () => {
    const defaultData = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i);
      defaultData.push({
        label: month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
        orders: 0,
        revenue: 0,
        avgOrderValue: 0,
        trend: 0,
        trendDirection: { direction: 'stable', class: 'trend-stable', icon: '→' },
        displayMonth: `T${i + 1}/${month.getFullYear()}`
      });
    }

    return defaultData;
  }
};

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    StatsManager.init();
  });
} else {
  // DOM already loaded
  StatsManager.init();
}

// Export for global access
window.StatsManager = StatsManager;