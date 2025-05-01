'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [filterTable, setFilterTable] = useState('');
  const [tables, setTables] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await supabase.from('tables').select('*').order('number');
      setTables(data || []);
    };
    
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('start_time', { ascending: false });
      setEvents(data || []);
      if (data && data.length > 0) setSelectedEvent(data[0].id);
    };
    
    fetchTables();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        table:table_id(*),
        items:order_items(*, product:product_id(*))
      `)
      .neq('status', 'pending')
      .eq('event_id', selectedEvent)
      .order('created_at', { ascending: false });
    
    if (filterTable) {
      query = query.eq('table_id', filterTable);
    }
    
    const fetchOrders = async () => {
      const { data } = await query;
      setOrders(data || []);
    };
    
    fetchOrders();
  }, [filterTable, selectedEvent]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Order History</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-1">Filter by Table</label>
          <select 
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value || '')}
            className="bg-gray-700 p-2 rounded"
          >
            <option value="">All Tables</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>Table {table.number}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-1">Select Event</label>
          <select 
            value={selectedEvent || ''}
            onChange={(e) => setSelectedEvent(e.target.value || null)}
            className="bg-gray-700 p-2 rounded"
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({new Date(event.start_time).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className={`p-4 rounded-lg ${
            order.status === 'accepted' ? 'bg-gray-800' : 'bg-gray-900'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Table {order.table.number}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {new Date(order.created_at).toLocaleString()}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  order.status === 'accepted' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between py-1 border-b border-gray-700">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>€{(item.quantity * item.discounted_price_at_order).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">
                €{order.items.reduce((sum, item) => sum + (item.quantity * item.discounted_price_at_order), 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <p>No orders found for the selected filters.</p>
        )}
      </div>
    </div>
  );
}