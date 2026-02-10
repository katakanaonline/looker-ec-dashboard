/**
 * EC Platform Dashboard - Looker Studio Custom Visualization
 *
 * 4チャート統合ダッシュボード:
 * 1. スコアカード（総売上）
 * 2. Platform比較縦棒グラフ（Rakuten vs Amazon vs Yahoo）★重要
 * 3. Platformテーブル
 * 4. 折れ線グラフ（日別売上推移）
 */

// dscc（Looker Studio Component Library）をインポート
const dscc = window.dscc;

// Chart.js インスタンス
let platformChart = null;
let timeseriesChart = null;

/**
 * 初期HTMLを描画
 */
function drawInitial() {
  const container = document.getElementById('dashboard-container');
  if (!container) {
    document.body.innerHTML = `
      <div id="dashboard-container">
        <div id="scorecard">
          <div id="scorecard-label">総売上</div>
          <div id="scorecard-value">¥0</div>
        </div>
        <div id="platform-chart">
          <h3>モール別売上比較</h3>
          <canvas id="platform-canvas"></canvas>
        </div>
        <div id="platform-table">
          <h3>モール別詳細</h3>
          <table id="table-content">
            <thead>
              <tr>
                <th>モール</th>
                <th>売上</th>
              </tr>
            </thead>
            <tbody id="table-body"></tbody>
          </table>
        </div>
        <div id="timeseries-chart">
          <h3>日別売上推移</h3>
          <canvas id="timeseries-canvas"></canvas>
        </div>
      </div>
    `;
  }
}

/**
 * データを受け取って描画
 */
function drawViz(data) {
  console.log('Received data:', data);

  // データがない場合は初期状態
  if (!data || !data.tables || !data.tables.DEFAULT) {
    console.warn('No data received');
    return;
  }

  const tableData = data.tables.DEFAULT;
  const rows = tableData.rows || [];

  if (rows.length === 0) {
    console.warn('No rows in data');
    return;
  }

  // Platform別データを集計
  const platformData = {};
  let totalAmount = 0;

  rows.forEach(row => {
    const platform = row.dimensions && row.dimensions[0] ? row.dimensions[0] : 'Unknown';
    const amount = row.metrics && row.metrics[0] ? parseFloat(row.metrics[0]) : 0;

    if (!platformData[platform]) {
      platformData[platform] = 0;
    }
    platformData[platform] += amount;
    totalAmount += amount;
  });

  // 1. スコアカード更新
  updateScorecard(totalAmount);

  // 2. Platform比較縦棒グラフ更新（★重要）
  updatePlatformChart(platformData);

  // 3. Platformテーブル更新
  updatePlatformTable(platformData);

  // 4. 折れ線グラフ更新（日別推移）
  updateTimeseriesChart(rows);
}

/**
 * 1. スコアカード更新
 */
function updateScorecard(totalAmount) {
  const valueElement = document.getElementById('scorecard-value');
  if (valueElement) {
    valueElement.textContent = '¥' + totalAmount.toLocaleString('ja-JP');
  }
}

/**
 * 2. Platform比較縦棒グラフ更新（★クロスチャネル価値）
 */
function updatePlatformChart(platformData) {
  const ctx = document.getElementById('platform-canvas');
  if (!ctx) return;

  const platforms = Object.keys(platformData).sort();
  const amounts = platforms.map(p => platformData[p]);

  // 色設定（Rakuten=赤、Yahoo=紫、Amazon=オレンジ）
  const colors = platforms.map(p => {
    if (p === 'Rakuten') return '#BF0000';
    if (p === 'Yahoo') return '#5F00BA';
    if (p === 'Amazon') return '#FF9900';
    return '#4285F4';
  });

  // 既存チャートを破棄
  if (platformChart) {
    platformChart.destroy();
  }

  // Chart.js縦棒グラフ作成
  platformChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: platforms,
      datasets: [{
        label: '売上（¥）',
        data: amounts,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '¥' + context.parsed.y.toLocaleString('ja-JP');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '¥' + (value / 10000).toFixed(0) + '万';
            }
          },
          grid: {
            color: '#f0f0f0'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * 3. Platformテーブル更新
 */
function updatePlatformTable(platformData) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  // 売上順にソート
  const sorted = Object.entries(platformData).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([platform, amount]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${platform}</td>
      <td>¥${amount.toLocaleString('ja-JP')}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * 4. 折れ線グラフ更新（日別売上推移）
 */
function updateTimeseriesChart(rows) {
  const ctx = document.getElementById('timeseries-canvas');
  if (!ctx) return;

  // 日付別・Platform別にデータ集計
  const dateMap = {};

  rows.forEach(row => {
    const date = row.dimensions && row.dimensions.length > 1 ? row.dimensions[1] : row.dimensions[0];
    const platform = row.dimensions && row.dimensions.length > 1 ? row.dimensions[0] : 'Total';
    const amount = row.metrics && row.metrics[0] ? parseFloat(row.metrics[0]) : 0;

    if (!dateMap[date]) {
      dateMap[date] = {};
    }
    if (!dateMap[date][platform]) {
      dateMap[date][platform] = 0;
    }
    dateMap[date][platform] += amount;
  });

  // 日付順にソート
  const dates = Object.keys(dateMap).sort();
  const platforms = [...new Set(rows.flatMap(r => r.dimensions || []))].filter(d => d && !d.includes('/'));

  // 既存チャートを破棄
  if (timeseriesChart) {
    timeseriesChart.destroy();
  }

  // Platform別データセット作成
  const datasets = platforms.map(platform => {
    const color = platform === 'Rakuten' ? '#BF0000' :
                  platform === 'Yahoo' ? '#5F00BA' :
                  platform === 'Amazon' ? '#FF9900' : '#4285F4';

    return {
      label: platform,
      data: dates.map(date => dateMap[date][platform] || 0),
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 2,
      tension: 0.3,
      fill: false
    };
  });

  // Chart.js折れ線グラフ作成
  timeseriesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => {
        // YYYYMMDD → MM/DD
        const year = d.substring(0, 4);
        const month = d.substring(4, 6);
        const day = d.substring(6, 8);
        return `${month}/${day}`;
      }),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ¥' + context.parsed.y.toLocaleString('ja-JP');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '¥' + (value / 10000).toFixed(0) + '万';
            }
          },
          grid: {
            color: '#f0f0f0'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

/**
 * 初期化
 */
drawInitial();

// Looker StudioのデータをサブスクライブdsccがあればLooker Studioモード、なければダミーデータモード）
if (typeof dscc !== 'undefined' && dscc.subscribeToData) {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}
