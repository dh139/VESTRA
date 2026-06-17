import { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, Eye, Terminal, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState('');

  useEffect(() => {
    fetchAuditLogs(currentPage);
  }, [currentPage, actionFilter, entityFilter]);

  const fetchAuditLogs = async (pageToFetch) => {
    setLoading(true);
    try {
      const params = {
        page: pageToFetch,
        limit: 15,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined
      };

      const res = await axios.get(`${API_URL}/admin/audit-logs`, { params });
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDiffJson = (prev, next) => {
    if (!prev && !next) return <span className="text-ink/40 italic">No value modifications.</span>;
    
    const prevString = prev ? JSON.stringify(prev, null, 2) : 'N/A (Created)';
    const nextString = next ? JSON.stringify(next, null, 2) : 'N/A (Deleted)';

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed bg-ink text-bone p-4 rounded-xl border border-mist overflow-x-auto max-h-[300px]">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-signal font-bold block border-b border-bone/10 pb-1 mb-2">Previous State</span>
          <pre className="whitespace-pre-wrap">{prevString}</pre>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-pine font-bold block border-b border-bone/10 pb-1 mb-2">Updated State</span>
          <pre className="whitespace-pre-wrap">{nextString}</pre>
        </div>
      </div>
    );
  };

  const getActionColor = (action) => {
    if (action.startsWith('CREATE')) return 'text-pine font-bold';
    if (action.startsWith('DELETE') || action.startsWith('REMOVE')) return 'text-signal font-bold';
    return 'text-brass font-bold';
  };

  return (
    <div className="space-y-6 animate-[slide-up_0.4s_ease-out]">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
          System Audit Trail logs
        </h1>
        <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
          Track administrative updates, inventory adjustments, and CMS block shifts.
        </p>
      </div>

      {/* Filter Options */}
      <div className="flex gap-4 items-center bg-mist/20 p-4 border border-mist/50 rounded-2xl text-xs flex-wrap">
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-ink/50 block">Filter Action</label>
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="bg-bone border border-mist rounded-full py-1.5 px-4 focus:outline-none font-bold"
          >
            <option value="">All Actions</option>
            <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
            <option value="UPDATE_PRODUCT">UPDATE_PRODUCT</option>
            <option value="DELETE_PRODUCT">DELETE_PRODUCT</option>
            <option value="CREATE_VARIANT">CREATE_VARIANT</option>
            <option value="UPDATE_VARIANT">UPDATE_VARIANT</option>
            <option value="DELETE_VARIANT">DELETE_VARIANT</option>
            <option value="UPDATE_ORDER_STATUS">UPDATE_ORDER_STATUS</option>
            <option value="RESOLVE_RETURN">RESOLVE_RETURN</option>
            <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
            <option value="IMPORT_PINCODES">IMPORT_PINCODES</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-ink/50 block">Filter Entity</label>
          <select 
            value={entityFilter} 
            onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
            className="bg-bone border border-mist rounded-full py-1.5 px-4 focus:outline-none font-bold"
          >
            <option value="">All Entities</option>
            <option value="Product">Product</option>
            <option value="Variant">Variant</option>
            <option value="Order">Order</option>
            <option value="Settings">Settings</option>
            <option value="ServiceablePincode">ServiceablePincode</option>
            <option value="HomepageSection">HomepageSection</option>
          </select>
        </div>
      </div>

      {/* Audit Logs List Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-mist/30 border border-mist rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 bg-bone border border-mist rounded-3xl text-center text-xs text-ink/50 font-semibold">
          No audit log matches found in database.
        </div>
      ) : (
        <div className="border border-mist rounded-3xl overflow-hidden bg-bone shadow-soft text-xs divide-y divide-mist">
          {/* Header Row */}
          <div className="grid grid-cols-5 p-4 font-bold text-ink/50 bg-mist/15 uppercase text-[9px] tracking-wider text-center">
            <span>Admin</span>
            <span>Action</span>
            <span>Entity Type</span>
            <span>IP Address</span>
            <span>Timestamp</span>
          </div>

          {/* Logs Rows */}
          {logs.map((log) => {
            const isExpanded = expandedLogId === log._id;
            return (
              <div key={log._id} className="transition-colors hover:bg-mist/5">
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? '' : log._id)}
                  className="grid grid-cols-5 p-4 items-center text-center font-medium cursor-pointer"
                >
                  <div className="text-left pl-4">
                    <span className="font-bold text-ink block truncate">{log.adminId?.name || 'N/A'}</span>
                    <span className="text-[9px] text-ink/40 block truncate">{log.adminId?.email || 'System'}</span>
                  </div>
                  <span className={getActionColor(log.action)}>{log.action}</span>
                  <span className="text-ink/65 font-bold">{log.entityType}</span>
                  <span className="font-mono text-ink/50">{log.ipAddress || '127.0.0.1'}</span>
                  <span className="text-ink/60 flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-ink/40" />
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Expand JSON Diffs */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-mist/10 border-t border-mist/40 animate-[slide-down_0.2s_ease-out] space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-ink/50 pb-2 border-b border-mist/30">
                      <Terminal className="w-4 h-4 text-pine" />
                      <span>Before / After State comparison details (Database logs)</span>
                    </div>
                    {formatDiffJson(log.previousValue, log.newValue)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="py-2 px-4 border border-mist bg-bone rounded-full text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="py-2 px-4 border border-mist bg-bone rounded-full text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
