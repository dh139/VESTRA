import { useState, useEffect } from 'react';
import { ArrowUpRight, ShoppingBag, Landmark, Users, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalOrdersCount: 0, 
    lowStockCount: 0, 
    customersCount: 0,
    statusBreakdown: { pending: 0, paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0 },
    paymentBreakdown: { COD: 0, Razorpay: 0 }
  });
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('sales'); // 'sales' or 'orders'

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/dashboard-stats`);
      if (res.data.success) {
        setStats(res.data.stats);
        setTopProducts(res.data.topProducts || []);
        setChartData(res.data.chartData);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-mist/40 border border-mist rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-mist/40 border border-mist rounded-3xl" />
      </div>
    );
  }

  // Draw custom SVG Line Chart
  const drawSVGChart = () => {
    if (chartData.length === 0) return null;

    const width = 600;
    const height = 200;
    const paddingLeft = 55; // Slightly increased for longer labels
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const isSales = chartMetric === 'sales';
    const getValue = (d) => isSales ? d.sales : d.orders;
    const maxVal = Math.max(...chartData.map(d => getValue(d)), isSales ? 1000 : 5);
    const minVal = 0;

    const getX = (index) => {
      const step = (width - paddingLeft - paddingRight) / (chartData.length - 1 || 1);
      return paddingLeft + index * step;
    };

    const getY = (val) => {
      const scale = (height - paddingTop - paddingBottom) / (maxVal - minVal);
      return height - paddingBottom - (val - minVal) * scale;
    };

    // Build line path
    let linePath = '';
    let areaPath = '';

    chartData.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(getValue(d));
      if (idx === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });

    areaPath += ` L ${getX(chartData.length - 1)} ${height - paddingBottom} Z`;

    const formatYLabel = (val) => {
      if (isSales) {
        return `₹${Math.round(val).toLocaleString('en-IN')}`;
      } else {
        return `${Math.round(val)}`;
      }
    };

    return (
      <div className="relative w-full overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full min-w-[500px] h-64 font-body"
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F3D2B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1F3D2B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = minVal + (maxVal - minVal) * ratio;
            const y = getY(yVal);
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#E4E1D8" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="fill-ink/40 text-[8px] font-bold"
                >
                  {formatYLabel(yVal)}
                </text>
              </g>
            );
          })}

          {/* Y Axis line */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#E4E1D8" />
          
          {/* X Axis line */}
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#E4E1D8" />

          {/* Areas and Lines */}
          <path d={areaPath} fill="url(#chartGrad)" />
          <path d={linePath} fill="none" stroke="#1F3D2B" strokeWidth={2.5} strokeLinecap="round" />

          {/* Data Points */}
          {chartData.map((d, idx) => {
            const val = getValue(d);
            const x = getX(idx);
            const y = getY(val);
            const showLabel = idx === 0 || idx === chartData.length - 1 || idx % 5 === 0;

            return (
              <g key={idx} className="group">
                <circle 
                  cx={x} 
                  cy={y} 
                  r={3.5} 
                  className="fill-bone stroke-pine stroke-2 cursor-pointer hover:r-5 transition-all" 
                />
                {showLabel && (
                  <text 
                    x={x} 
                    y={height - paddingBottom + 12} 
                    textAnchor="middle" 
                    className="fill-ink/40 text-[7px] font-bold"
                  >
                    {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </text>
                )}
                {/* Tooltip on hover */}
                <title>{`Date: ${d.date}\n${isSales ? 'Revenue: ₹' + val : 'Orders: ' + val + ' units'}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const dashboardCards = [
    { label: 'Revenue Generated', val: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: Landmark, color: 'text-pine' },
    { label: 'Orders Received', val: stats.totalOrdersCount, icon: ShoppingBag, color: 'text-pine' },
    { label: 'Low Stock Variants', val: stats.lowStockCount, icon: ShieldAlert, color: stats.lowStockCount > 0 ? 'text-signal animate-pulse' : 'text-ink/40' },
    { label: 'Total Customers', val: stats.customersCount, icon: Users, color: 'text-pine' }
  ];

  return (
    <div className="space-y-8 animate-[slide-up_0.4s_ease-out]">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
          Performance Dashboard
        </h1>
        <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
          Live statistics from catalog and database orders.
        </p>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {dashboardCards.map((c, i) => (
          <div 
            key={i} 
            className="p-5 bg-bone border border-mist rounded-2xl flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-ink/40 block">
                {c.label}
              </span>
              <span className="font-display font-bold text-lg text-ink block">
                {c.val}
              </span>
            </div>
            <div className={`p-3 bg-mist/30 rounded-xl ${c.color}`}>
              <c.icon className="w-5 h-5 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart Panel */}
      <div className="p-6 bg-bone border border-mist rounded-3xl space-y-4">
        <div className="flex flex-wrap justify-between items-center pb-3 border-b border-mist gap-4">
          <div className="space-y-1">
            <span className="font-display font-bold text-xs tracking-widest text-ink block uppercase">
              Atelier Performance Trends
            </span>
            <span className="text-[9px] text-ink/40 font-semibold uppercase block mt-0.5">Calculated dynamically over 30 days</span>
          </div>
          
          {/* Toggles */}
          <div className="flex bg-mist/30 border border-mist p-0.5 rounded-full text-[10px] font-bold uppercase">
            <button
              onClick={() => setChartMetric('sales')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                chartMetric === 'sales' ? 'bg-pine text-bone' : 'text-ink/65 hover:text-ink'
              }`}
            >
              Revenue (INR)
            </button>
            <button
              onClick={() => setChartMetric('orders')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                chartMetric === 'orders' ? 'bg-pine text-bone' : 'text-ink/65 hover:text-ink'
              }`}
            >
              Order Volume
            </button>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-ink/40 font-semibold">
            No sales records available in this range.
          </div>
        ) : (
          drawSVGChart()
        )}
      </div>

      {/* Detailed Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Products */}
        <div className="lg:col-span-7 p-6 bg-bone border border-mist rounded-3xl space-y-5">
          <div className="pb-3 border-b border-mist">
            <span className="font-display font-bold text-xs tracking-widest text-ink block uppercase">
              Top Selling Collections
            </span>
            <span className="text-[9px] text-ink/40 font-semibold uppercase block mt-0.5">Ranked by unit sales</span>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink/40 font-semibold">
                No selling history available yet.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between p-3.5 bg-mist/10 border border-mist/40 rounded-2xl text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-pine text-sm w-4">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-mist bg-mist/20">
                      <img src={p.image} alt="" className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <span className="font-semibold text-ink block">{p.name}</span>
                      <span className="text-[9px] text-ink/40 font-bold uppercase tracking-wider block mt-0.5">{p.qtySold} units sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold text-pine">₹{p.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Pipelines and Distribution */}
        <div className="lg:col-span-5 p-6 bg-bone border border-mist rounded-3xl space-y-6">
          {/* Payment breakdown */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-mist">
              <span className="font-display font-bold text-xs tracking-widest text-ink block uppercase">
                Payment Channel Ratio
              </span>
            </div>

            {stats.totalOrdersCount === 0 ? (
              <div className="text-xs text-ink/40 font-semibold py-2">No data.</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const cod = stats.paymentBreakdown?.COD || 0;
                  const rzp = stats.paymentBreakdown?.Razorpay || 0;
                  const total = cod + rzp || 1;
                  const codPct = Math.round((cod / total) * 100);
                  const rzpPct = Math.round((rzp / total) * 100);

                  return (
                    <div className="space-y-2">
                      <div className="h-2.5 rounded-full overflow-hidden flex bg-mist">
                        <div style={{ width: `${rzpPct}%` }} className="bg-pine h-full" title={`Razorpay Prepaid: ${rzpPct}%`} />
                        <div style={{ width: `${codPct}%` }} className="bg-brass h-full" title={`COD: ${codPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider">
                        <span className="text-pine flex items-center gap-1"><span className="w-2 h-2 bg-pine rounded-full" /> Razorpay ({rzpPct}%)</span>
                        <span className="text-brass flex items-center gap-1"><span className="w-2 h-2 bg-brass rounded-full" /> COD ({codPct}%)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Fulfillment Pipeline breakdown */}
          <div className="space-y-4">
            <span className="font-display font-bold text-[10px] tracking-widest text-ink block uppercase">
              Fulfillment Pipeline
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-mist/10 border border-mist/30 rounded-2xl flex justify-between items-center">
                <span className="text-ink/65 text-[10px] uppercase">Processing</span>
                <span className="font-mono text-ink text-sm font-bold">{stats.statusBreakdown?.processing || 0}</span>
              </div>
              <div className="p-3 bg-mist/10 border border-mist/30 rounded-2xl flex justify-between items-center">
                <span className="text-ink/65 text-[10px] uppercase">Shipped</span>
                <span className="font-mono text-ink text-sm font-bold">{stats.statusBreakdown?.shipped || 0}</span>
              </div>
              <div className="p-3 bg-mist/10 border border-mist/30 rounded-2xl flex justify-between items-center col-span-2">
                <span className="text-ink/65 text-[10px] uppercase">Delivered</span>
                <span className="font-mono text-pine text-sm font-bold">{stats.statusBreakdown?.delivered || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings / Alerts block */}
      {stats.lowStockCount > 0 && (
        <div className="p-4 bg-signal/5 border border-signal/15 rounded-2xl flex gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-signal shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-signal block uppercase tracking-wide">Variant Low-Stock Warnings</span>
            <p className="text-ink/70 mt-1 leading-relaxed">
              We identified {stats.lowStockCount} variant SKUs with inventory count lower than 5. Dispatched alerts can be audited inside log metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
